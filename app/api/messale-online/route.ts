import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Cache in memoria per velocizzare le richieste ripetute
const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 ore

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "ordinario";
  const id = searchParams.get("id");

  const cacheKey = `${category}_${id || "list"}`;
  const cached = cache[cacheKey];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    let url = `https://www.ibreviary.com/m2/messale.php?s=${category}&lang=it`;
    if (id) {
      url += `&id=${id}`;
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede/1.9.23",
        Cookie: "language=it;",
      },
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      throw new Error(`Errore HTTP ${res.status} da iBreviary`);
    }

    const html = await res.text();

    if (id) {
      // Estrai il contenuto del testo
      const match = html.match(/<div id="contenuto">([\s\S]*?)<\/div>\s*<\/div>/i);
      let contentHtml = match ? match[1] : "";

      // Pulizia e formattazione per lo stile Note di Fede
      contentHtml = contentHtml
        .replace(/<p[^>]*>\s*<a[^>]*>\s*-\s*Menu\s*-\s*<\/a>\s*<\/p>/gi, "")
        .replace(/<p[^>]*>\s*-\s*Menu\s*-\s*<\/p>/gi, "")
        .replace(/<a[^>]*>\s*-\s*Menu\s*-\s*<\/a>/gi, "")
        .replace(/-\s*Menu\s*-/gi, "")
        .replace(/<img[^>]*>/gi, "")
        .replace(/href="[^"]*"/gi, "")
        .replace(/class="rubrica"/gi, 'class="text-red-700 font-semibold text-xs uppercase tracking-wider block my-2"')
        .replace(/class="titolo"/gi, 'class="font-serif text-xl font-bold text-[#5c4a37] block my-3"')
        .replace(/class="sezione"/gi, 'class="text-xs font-bold uppercase tracking-widest text-[#aa9576] block mb-1"')
        .replace(/class="body_1"/gi, 'class="text-red-700 font-bold mr-1"')
        .replace(/class="body_2"/gi, 'class="text-[#3f3933] font-serif"')
        .replace(/class="body_3"/gi, 'class="text-[#3f3933] font-serif"');

      const data = { html: contentHtml };

      cache[cacheKey] = { data, timestamp: Date.now() };
      return NextResponse.json(data);
    } else {
      // Estrai la lista dei link/formulari
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
    console.error("Errore API Messale Online:", error);
    return NextResponse.json(
      { error: error?.message || "Impossibile recuperare i testi del Messale Online" },
      { status: 500 }
    );
  }
}
