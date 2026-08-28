import { NextRequest, NextResponse } from "next/server";
import { BIBLE_BOOKS, BibleBook } from "@/lib/bibbia-books";

export const dynamic = "force-dynamic";

export interface BibleCrossRef {
  label: string;
  href?: string;
  bookId?: number;
  bookCode?: string;
  bookName?: string;
  chapter?: number;
  verseFrom?: number;
  verseTo?: number;
}

export interface BibleVerse {
  num: number;
  text: string;
  crossRefs?: BibleCrossRef[];
}

export interface BibleFootnote {
  reference: string;
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
  audioEmbedUrl?: string | null;
  verses: BibleVerse[];
  footnotes?: BibleFootnote[];
  error?: string;
}

function cleanVerseText(raw: string): string {
  return raw
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<sup[^>]*>.*?<\/sup>/gi, "")
    .replace(/<button[^>]*>[\s\S]*?<\/button>/gi, "")
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
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Recupera il capitolo da Scrutatio.it con versetti, link incrociati, audio embed e note in calce
 */
async function fetchFromScrutatio(book: BibleBook, chapter: number): Promise<BibleApiResponse> {
  const bookIndex = BIBLE_BOOKS.findIndex((b) => b.id === book.id);
  const bookNumber = bookIndex >= 0 ? bookIndex + 1 : 1;

  const url = `https://www.scrutatio.it/bibbia/lettura/it/cei2008/${bookNumber}/${chapter}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede/1.9.10",
      Accept: "text/html,application/xhtml+xml",
    },
    next: { revalidate: 86400 }, // Cache 24 ore
  });

  if (!res.ok) {
    throw new Error(`Risposta HTTP ${res.status} da Scrutatio`);
  }

  const html = await res.text();

  // 1. Estrazione Audio Embed
  const iframeMatch = html.match(/<iframe[^>]*src="([^"]+)"[^>]*>/i);
  const audioEmbedUrl = iframeMatch ? iframeMatch[1] : null;

  // 2. Estrazione Versetti e Passi Paralleli (Cross References)
  const verseRegex = /<span[^>]*class="versetto"[^>]*>([\s\S]*?)<\/span>/gi;
  const verses: BibleVerse[] = [];
  let match: RegExpExecArray | null;

  while ((match = verseRegex.exec(html)) !== null) {
    const vHtml = match[1];
    const numMatch = vHtml.match(/<sup[^>]*class="idvers"[^>]*>(\d+)<\/sup>/i);
    const verseNum = numMatch ? parseInt(numMatch[1], 10) : verses.length + 1;

    const btnMatch =
      vHtml.match(/data-bs-content='([\s\S]*?)'/i) ||
      vHtml.match(/data-bs-content="([\s\S]*?)"/i);

    const crossRefs: BibleCrossRef[] = [];
    if (btnMatch) {
      const rawContent = btnMatch[1];
      const linkRegex = /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
      let lMatch: RegExpExecArray | null;

      while ((lMatch = linkRegex.exec(rawContent)) !== null) {
        const href = lMatch[1];
        const label = lMatch[2].replace(/<[^>]+>/g, "").trim();
        const partsMatch = href.match(/cei2008\/(\d+)\/(\d+)(?:\/(\d+))?(?:\/(\d+))?/i);
        const refBookNumber = partsMatch ? parseInt(partsMatch[1], 10) : undefined;
        const refBook =
          refBookNumber && refBookNumber >= 1 && refBookNumber <= BIBLE_BOOKS.length
            ? BIBLE_BOOKS[refBookNumber - 1]
            : undefined;

        crossRefs.push({
          label,
          href,
          bookId: refBookNumber,
          bookCode: refBook?.id,
          bookName: refBook?.name,
          chapter: partsMatch ? parseInt(partsMatch[2], 10) : undefined,
          verseFrom: partsMatch && partsMatch[3] ? parseInt(partsMatch[3], 10) : undefined,
          verseTo: partsMatch && partsMatch[4] ? parseInt(partsMatch[4], 10) : undefined,
        });
      }
    }

    const cleanText = cleanVerseText(vHtml);
    if (cleanText) {
      verses.push({
        num: verseNum,
        text: cleanText,
        crossRefs: crossRefs.length > 0 ? crossRefs : undefined,
      });
    }
  }

  // 3. Estrazione Note in Calce (Esegesi Bibbia di Gerusalemme / CEI)
  const noteDivMatch = html.match(/<div[^>]*id=["']note["'][^>]*>([\s\S]*?)<\/div>/i);
  const footnotes: BibleFootnote[] = [];
  if (noteDivMatch) {
    const pRegex = /<p[^>]*id=["']n\d+["'][^>]*>([\s\S]*?)<\/p>/gi;
    let pMatch: RegExpExecArray | null;
    while ((pMatch = pRegex.exec(noteDivMatch[1])) !== null) {
      const rawP = pMatch[1];
      const strongMatch = rawP.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i);
      const reference = strongMatch ? strongMatch[1].replace(/:$/, "").trim() : "";
      const text = cleanVerseText(rawP.replace(/<strong[^>]*>[\s\S]*?<\/strong>/i, ""));
      if (text) {
        footnotes.push({ reference, text });
      }
    }
  }

  if (verses.length === 0) {
    throw new Error("Nessun versetto estratto da Scrutatio");
  }

  return {
    bookId: book.id,
    bookName: book.name,
    shortName: book.shortName,
    chapter,
    testament: book.testament,
    category: book.category,
    version: "CEI 2008",
    totalChapters: book.chaptersCount,
    audioEmbedUrl,
    verses,
    footnotes: footnotes.length > 0 ? footnotes : undefined,
  };
}

/**
 * Fallback via BibbiaEdu.it se Scrutatio dovesse non rispondere
 */
async function fetchFromBibbiaEdu(book: BibleBook, chapter: number): Promise<BibleApiResponse> {
  const url = `https://www.bibbiaedu.it/CEI2008/${book.testament}/${book.id}/${chapter}/`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede/1.9.10",
      Accept: "text/html,application/xhtml+xml",
    },
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    throw new Error(`Risposta non valida da bibbiaedu.it: HTTP ${res.status}`);
  }

  const html = await res.text();
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

    const cleanText = cleanVerseText(rawBlock);
    if (cleanText) {
      verses.push({
        num: verseNum,
        text: cleanText,
      });
    }
  }

  return {
    bookId: book.id,
    bookName: book.name,
    shortName: book.shortName,
    chapter,
    testament: book.testament,
    category: book.category,
    version: "CEI 2008",
    totalChapters: book.chaptersCount,
    audioEmbedUrl: null,
    verses,
  };
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
    // 1. Prova prima Scrutatio (ricco di passi paralleli, audio e note in calce)
    try {
      const scrutatioData = await fetchFromScrutatio(book, chapter);
      return NextResponse.json(scrutatioData, {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      });
    } catch (scrutatioErr) {
      console.warn("Scrutatio non disponibile, fallback su bibbiaedu.it:", scrutatioErr);
      const bibbiaEduData = await fetchFromBibbiaEdu(book, chapter);
      return NextResponse.json(bibbiaEduData, {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      });
    }
  } catch (error: any) {
    console.error("Errore fetch capitolo bibbia:", error);
    return NextResponse.json(
      {
        error: "Impossibile recuperare il capitolo della Sacra Bibbia.",
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
