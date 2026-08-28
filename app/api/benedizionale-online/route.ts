import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Cache in memoria per velocizzare le richieste ripetute
const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 ore

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const lang = searchParams.get("lang") || "it";

  const cacheKey = `${lang}_benedizionale_${id || "list"}`;
  const cached = cache[cacheKey];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    let url = `https://www.ibreviary.com/m2/preghiere.php?tipo=Rito&lang=${lang}`;
    if (id) {
      url += `&id=${id}`;
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede/1.9.28",
        Cookie: `language=${lang};`,
      },
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      throw new Error(`Errore HTTP ${res.status} da iBreviary`);
    }

    const html = await res.text();

    if (id) {
      // Estrai il contenuto del rito/benedizione
      const match = html.match(/<div id="contenuto">([\s\S]*?)<\/div>\s*<\/div>/i);
      let contentHtml = match ? match[1] : "";

      // Pulizia e normalizzazione
      contentHtml = contentHtml
        .replace(/<p[^>]*>\s*<a[^>]*>\s*-\s*Menu\s*-\s*<\/a>\s*<\/p>/gi, "")
        .replace(/<p[^>]*>\s*-\s*Menu\s*-\s*<\/p>/gi, "")
        .replace(/<a[^>]*>\s*-\s*Menu\s*-\s*<\/a>/gi, "")
        .replace(/-\s*Menu\s*-/gi, "")
        .replace(/<img[^>]*>/gi, "")
        .replace(/href="[^"]*"/gi, "")
        .replace(/<p>\s*(?:<br\s*\/?>|\s|&nbsp;)*<\/p>/gi, "")
        .replace(/(?:<br\s*\/?>\s*){3,}/gi, "<br /><br />")
        .replace(/class="rubrica\s+body_1"|class="body_1\s+rubrica"/gi, 'class="benedizionale-rubrica"')
        .replace(/class="rubrica"/gi, 'class="benedizionale-rubrica"')
        .replace(/class="titolo"/gi, 'class="benedizionale-titolo"')
        .replace(/class="sezione"/gi, 'class="benedizionale-sezione"')
        .replace(/class="body_1"/gi, 'class="benedizionale-testo"')
        .replace(/class="body_2"/gi, 'class="benedizionale-testo"')
        .replace(/class="body_3"/gi, 'class="benedizionale-testo"');


      const data = { html: contentHtml };
      cache[cacheKey] = { data, timestamp: Date.now() };
      return NextResponse.json(data);
    } else {
      // Estrai la lista dei riti e benedizioni
      const links = [...html.matchAll(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi)]
        .map((m) => {
          const href = m[1].replace(/&amp;/g, "&");
          const idMatch = href.match(/id=(\d+)/);
          const itemId = idMatch ? idMatch[1] : null;
          return {
            id: itemId,
            title: m[2].replace(/<[^>]*>/g, "").trim(),
          };
        })
        .filter((l) => l.id !== null && l.title !== "- Menu -");

      const data = { items: links };
      cache[cacheKey] = { data, timestamp: Date.now() };
      return NextResponse.json(data);
    }
  } catch (error: any) {
    console.error("Errore API Benedizionale Online Multilingua:", error);
    return NextResponse.json(
      { error: error?.message || "Impossibile recuperare i riti del Benedizionale" },
      { status: 500 }
    );
  }
}
