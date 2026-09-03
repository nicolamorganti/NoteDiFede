import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function decodeHtmlEntities(str: string): string {
  if (!str) return "";
  return str
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&rsquo;|&lsquo;|&#8217;|&#8216;/g, "'")
    .replace(/&rdquo;|&ldquo;|&#8220;|&#8221;/g, '"')
    .replace(/&laquo;/g, "«")
    .replace(/&raquo;/g, "»")
    .replace(/&ndash;|&#8211;/g, "–")
    .replace(/&mdash;|&#8212;/g, "—")
    .replace(/&agrave;/g, "à")
    .replace(/&aacute;/g, "á")
    .replace(/&egrave;/g, "è")
    .replace(/&eacute;/g, "é")
    .replace(/&igrave;/g, "ì")
    .replace(/&iacute;/g, "í")
    .replace(/&ograve;/g, "ò")
    .replace(/&oacute;/g, "ó")
    .replace(/&ugrave;/g, "ù")
    .replace(/&uacute;/g, "ú")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");

    const d = dateParam ? new Date(dateParam) : new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const isoDate = `${year}-${month}-${day}`;
    const cleanDate = `${year}${month}${day}`;

    const url = `https://www.chiesacattolica.it/santo-del-giorno/?data-liturgia=${cleanDate}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede/2.0",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      throw new Error(`Errore HTTP ${res.status} recuperando Santo del Giorno da ChiesaCattolica.it`);
    }

    const html = await res.text();

    // 1. Titolo del Santo Principale
    const titleMatch =
      html.match(/<h1[^>]*class=["'][^"']*santo_del_giorno_h[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i) ||
      html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const title = titleMatch ? decodeHtmlEntities(titleMatch[1].replace(/<[^>]+>/g, "")) : "";

    // 2. Data estesa (es. "03 Settembre")
    const dateLabelMatch = html.match(/<span class="cci-data-estesa-liturgia">([\s\S]*?)<\/span>/i);
    const dateLabel = dateLabelMatch ? decodeHtmlEntities(dateLabelMatch[1].trim()) : "";

    // 3. Immagine ad alta risoluzione del Santo Principale
    const imgMatch = html.match(/<div class="santo-del-giorno-image">[\s\S]*?<img[^>]+src=["']([^"']+)["']/i);
    let imgUrl = imgMatch ? imgMatch[1] : null;
    if (imgUrl && imgUrl.includes("logo_cci_contatti")) {
      imgUrl = null;
    }

    // 4. Grado della celebrazione (es. "Memoria", "Festa", "Solennità")
    const infoMatch = html.match(/<div class="cci-santo-del-giorno-provenienza">([\s\S]*?)<\/div>/i);
    const grado = infoMatch ? decodeHtmlEntities(infoMatch[1].replace(/<[^>]+>/g, "")) : "";

    // 5. Testo dal Martirologio Romano (Santo Principale)
    const martirologioMatch = html.match(/<div class="cci-santo-del-giorno-fonte-container"[^>]*>([\s\S]*?)<\/div>/i);
    const martirologio = martirologioMatch
      ? decodeHtmlEntities(
          martirologioMatch[1]
            .replace(/<br\s*\/?>/gi, "\n\n")
            .replace(/<[^>]+>/g, "")
        )
      : "";

    // 6. Altri Santi e Beati del giorno (Accordion)
    const altriSanti: { nome: string; imgUrl: string | null; martirologio: string }[] = [];
    const parts = html.split('class="panel panel-default altri-santi"');

    for (let i = 1; i < parts.length; i++) {
      const block = parts[i];
      const nomeMatch = block.match(/<h3[^>]*class=["'][^"']*accordion-nome[^"']*["'][^>]*>([\s\S]*?)<\/h3>/i);
      if (!nomeMatch) continue;

      const nome = decodeHtmlEntities(nomeMatch[1].replace(/<[^>]+>/g, ""));

      const otherImgMatch = block.match(/<div class="panel-image">[\s\S]*?<img[^>]+src=["']([^"']+)["']/i);
      let otherImg = otherImgMatch ? otherImgMatch[1] : null;
      if (otherImg && (otherImg.includes("logo_cci_contatti") || !otherImg.includes("wp-content/uploads"))) {
        otherImg = null;
      }


      const otherMartiroMatch = block.match(/<div class="panel-body">\s*<p>([\s\S]*?)<\/p>/i);
      const otherMartiro = otherMartiroMatch
        ? decodeHtmlEntities(
            otherMartiroMatch[1]
              .replace(/<br\s*\/?>/gi, "\n\n")
              .replace(/<[^>]+>/g, "")
          )
        : "";

      altriSanti.push({
        nome,
        imgUrl: otherImg,
        martirologio: otherMartiro,
      });
    }

    return NextResponse.json(
      {
        date: isoDate,
        dateLabel,
        title,
        grado,
        imgUrl,
        martirologio,
        altriSanti,
        source: "ChiesaCattolica.it (Ufficiale CEI)",
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800",
        },
      }
    );
  } catch (err: any) {
    console.error("Errore API Santo del Giorno:", err);
    return NextResponse.json(
      { error: err.message || "Impossibile recuperare i dati del Santo del Giorno." },
      { status: 500 }
    );
  }
}
