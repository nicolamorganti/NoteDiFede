import { NextRequest, NextResponse } from "next/server";
import { BIBLE_BOOKS, BibleBook } from "@/lib/bibbia-books";

export const dynamic = "force-dynamic";

export interface BibleVerse {
  num: number;
  text: string;
}

export interface BibleApiResponse {
  bookId: string;
  bookName: string;
  shortName: string;
  chapter: number;
  testament: "at" | "nt";
  category: string;
  version: "CEI 2008";
  totalChapters: number;
  verses: BibleVerse[];
  error?: string;
}

function cleanHtmlText(raw: string): string {
  return raw
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<button[^>]*>[\s\S]*?<\/button>/gi, "")
    .replace(/<sup>[\s\S]*?<\/sup>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&ndash;/gi, "-")
    .replace(/&mdash;/gi, "—")
    .replace(/&agrave;/gi, "à")
    .replace(/&egrave;/gi, "è")
    .replace(/&eacute;/gi, "é")
    .replace(/&igrave;/gi, "ì")
    .replace(/&ograve;/gi, "ò")
    .replace(/&ugrave;/gi, "ù")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, "&")
    .trim();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookIdParam = searchParams.get("book") || "Gv";
  const chapterParam = parseInt(searchParams.get("chapter") || "1", 10);

  // Trova il libro nel canone CEI 2008
  const book =
    BIBLE_BOOKS.find(
      (b) =>
        b.id.toLowerCase() === bookIdParam.toLowerCase() ||
        b.shortName.toLowerCase() === bookIdParam.toLowerCase()
    ) || BIBLE_BOOKS.find((b) => b.id === "Gv")!;

  const chapter = Math.max(1, Math.min(book.chaptersCount, isNaN(chapterParam) ? 1 : chapterParam));

  try {
    const url = `https://www.bibbiaedu.it/CEI2008/${book.testament}/${book.id}/${chapter}/`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      next: { revalidate: 86400 }, // Cache per 24 ore
    });

    if (!res.ok) {
      throw new Error(`Risposta non valida da bibbiaedu.it: HTTP ${res.status}`);
    }

    const html = await res.text();

    // Regex per estrarre ciascun blocco versetto
    const verseBlockRegex =
      /<span\s+data-verses-id="(\d+)"[^>]*class="verse(?:\s+with_note)?"[^>]*id="verse_\d+"[^>]*>([\s\S]*?)<\/span>\s*<div class="collapse notes"/gi;

    const verses: BibleVerse[] = [];
    let match: RegExpExecArray | null;
    let currentNum = 1;

    while ((match = verseBlockRegex.exec(html)) !== null) {
      const rawBlock = match[2];

      const numMatch =
        rawBlock.match(/<button[^>]*>(\d+)<\/button>/i) ||
        rawBlock.match(/class="verse_number">(\d+)<\/span>/i) ||
        rawBlock.match(/<sup>(\d+)<\/sup>/i);

      const verseNum = numMatch ? parseInt(numMatch[1], 10) : currentNum;
      currentNum = verseNum + 1;

      const cleanText = cleanHtmlText(rawBlock);

      if (cleanText) {
        verses.push({
          num: verseNum,
          text: cleanText,
        });
      }
    }

    // Se per qualche motivo la regex non ha trovato nulla (es. layout insolito), facciamo fallback su estrazione righe
    if (verses.length === 0) {
      const fallbackRegex = /<span\s+class="text-to-speech">([\s\S]*?)<\/span>/gi;
      let fbMatch;
      let fbNum = 1;
      while ((fbMatch = fallbackRegex.exec(html)) !== null) {
        const clean = cleanHtmlText(fbMatch[1]);
        if (clean) {
          verses.push({
            num: fbNum++,
            text: clean,
          });
        }
      }
    }

    const responseData: BibleApiResponse = {
      bookId: book.id,
      bookName: book.name,
      shortName: book.shortName,
      chapter,
      testament: book.testament,
      category: book.category,
      version: "CEI 2008",
      totalChapters: book.chaptersCount,
      verses,
    };

    return NextResponse.json(responseData, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error: any) {
    console.error("Errore fetch capitolo bibbia:", error);
    return NextResponse.json(
      {
        error: "Impossibile recuperare il capitolo dalla Bibbia CEI 2008.",
        bookId: book.id,
        bookName: book.name,
        shortName: book.shortName,
        chapter,
        testament: book.testament,
        category: book.category,
        version: "CEI 2008",
        totalChapters: book.chaptersCount,
        verses: [],
      },
      { status: 500 }
    );
  }
}
