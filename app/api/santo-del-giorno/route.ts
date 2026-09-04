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

/**
 * Recupera il Santo del Giorno per il Rito Ambrosiano da Chiesa di Milano
 */
async function fetchAmbrosianoSanto(isoDate: string) {
  const catIds = "3933,3943,3939,3934,7353,22739,3936,3937,5417,20540,3940,3942,6466,21707,10051,9388,8466";
  const d = new Date(isoDate);
  const prev = new Date(d);
  prev.setDate(prev.getDate() - 1);
  const next = new Date(d);
  next.setDate(next.getDate() + 1);

  const after = `${prev.toISOString().split("T")[0]}T20:00:00`;
  const before = `${next.toISOString().split("T")[0]}T04:00:00`;

  // 1. Prova WP REST API ufficiale con _embed=true per recuperare immagine e testo in un colpo solo
  try {
    const apiUrl = `https://www.chiesadimilano.it/wp-json/wp/v2/posts?categories=${catIds}&after=${after}&before=${before}&per_page=5&_embed=true`;
    const res = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede/2.4",
        Accept: "application/json",
      },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(15000),
    });

    if (res.ok) {
      const posts = await res.json();
      if (Array.isArray(posts) && posts.length > 0) {
        const post = posts.find((p: any) => p.date?.startsWith(isoDate)) || posts[0];
        const title = post.title?.rendered ? decodeHtmlEntities(post.title.rendered.replace(/<[^>]+>/g, "")) : "Santo del Giorno";
        
        let imgUrl = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || null;
        const contentHtml = post.content?.rendered || "";

        // Se l'immagine non è in featuredmedia, cercala nel corpo del post
        if (!imgUrl) {
          const imgMatch = contentHtml.match(/<img[^>]+src=["']([^"']*wp-content\/uploads\/[^"']+)["']/i);
          if (imgMatch) imgUrl = imgMatch[1];
        }

        const paragraphs = contentHtml
          .replace(/<span class="postimageinsidecontent">[\s\S]*?<\/span>/i, "")
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .split(/<\/?p>/)
          .map((p: string) => decodeHtmlEntities(p.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ")).trim())
          .filter((p: string) => p.length > 10);

        const martirologio = paragraphs.join("\n\n");

        if (martirologio.length > 20) {
          return {
            title,
            grado: "Rito Ambrosiano",
            imgUrl,
            martirologio,
            altriSanti: [],
            source: "Chiesa di Milano (Arcidiocesi di Milano)",
          };
        }
      }
    }
  } catch (e: any) {
    console.warn("REST API Chiesa di Milano non ha risposto, fallback su scraping:", e.message);
  }

  // 2. Fallback resiliente: scraping diretto da https://www.chiesadimilano.it/santo-del-giorno
  try {
    const mainUrl = "https://www.chiesadimilano.it/santo-del-giorno";
    const res = await fetch(mainUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede/2.4",
      },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(15000),
    });

    if (res.ok) {
      const html = await res.text();
      const teaserMatch = html.match(
        /href=["'](https:\/\/www\.chiesadimilano\.it\/almanacco\/santo-del-giorno\/[^"']+)["']/i
      );
      if (teaserMatch) {
        const articleUrl = teaserMatch[1];
        const artRes = await fetch(articleUrl, {
          headers: { "User-Agent": "Mozilla/5.0 NoteDiFede/2.4" },
          signal: AbortSignal.timeout(15000),
        });
        if (artRes.ok) {
          const artHtml = await artRes.text();
          const titleMatch = artHtml.match(/<h1[^>]*class=['"][^'"]*entry-title[^'"]*['"][^>]*>([\s\S]*?)<\/h1>/i);
          const imgMatch =
            artHtml.match(/<span class="postimageinsidecontent">\s*<img[^>]+src=["']([^"']+)["']/i) ||
            artHtml.match(/<img[^>]+class=["'][^"']*wp-post-image[^"']*["'][^>]+src=["']([^"']+)["']/i) ||
            artHtml.match(/<img[^>]+src=["']([^"']*wp-content\/uploads\/[^"']+)["']/i);
          const contentMatch = artHtml.match(/<div class=['"]entry-content['"]>([\s\S]*?)<\/div>/i);
          const title = titleMatch ? decodeHtmlEntities(titleMatch[1].replace(/<[^>]+>/g, "")) : "Santo del Giorno";
          const imgUrl = imgMatch ? imgMatch[1] : null;

          let martirologio = "";
          if (contentMatch) {
            martirologio = contentMatch[1]
              .replace(/<span class="postimageinsidecontent">[\s\S]*?<\/span>/i, "")
              .split(/<\/?p>/)
              .map((p: string) => decodeHtmlEntities(p.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ")).trim())
              .filter((p: string) => p.length > 10)
              .join("\n\n");
          }

          return {
            title,
            grado: "Rito Ambrosiano",
            imgUrl,
            martirologio,
            altriSanti: [],
            source: "Chiesa di Milano (Arcidiocesi di Milano)",
          };
        }
      }
    }
  } catch (err: any) {
    console.error("Errore fallback scraping Chiesa di Milano:", err);
  }

  return null;
}

/**
 * Recupera il Santo del Giorno per il Rito Romano da ChiesaCattolica.it (Martirologio CEI)
 */
async function fetchRomanoSanto(cleanDate: string) {
  const url = `https://www.chiesacattolica.it/santo-del-giorno/?data-liturgia=${cleanDate}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede/2.4",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    next: { revalidate: 86400 },
    signal: AbortSignal.timeout(15000), // 15 secondi di timeout
  });

  if (!res.ok) {
    throw new Error(`Errore HTTP ${res.status} recuperando Santo del Giorno da ChiesaCattolica.it`);
  }

  const html = await res.text();

  // 1. Titolo del Santo Principale
  const titleMatch =
    html.match(/<h1[^>]*class=["'][^"']*santo_del_giorno_h[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i) ||
    html.match(/<div[^>]*class=["'][^"']*santo_del_giorno_h[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ||
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const rawTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "Santo del Giorno";
  const title = decodeHtmlEntities(rawTitle);

  // 2. Grado Liturgico
  const gradoMatch = html.match(/<span[^>]*class=["'][^"']*grado_santo[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
  const grado = gradoMatch ? decodeHtmlEntities(gradoMatch[1].replace(/<[^>]+>/g, "").trim()) : "Memoria";

  // 3. Immagine ad alta risoluzione del Santo Principale
  let imgUrl: string | null = null;
  const imgTagMatch = html.match(/<img[^>]+class=["'][^"']*img-fluid[^"']*wp-post-image[^"']*["'][^>]*>/i);
  if (imgTagMatch) {
    const srcMatch = imgTagMatch[0].match(/src=["']([^"']+)["']/i);
    if (srcMatch) {
      imgUrl = srcMatch[1];
    }
  }
  if (!imgUrl) {
    const fallbackImgMatch = html.match(/<div class="santo-del-giorno-image[^"]*"[^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i);
    if (fallbackImgMatch) {
      imgUrl = fallbackImgMatch[1];
    }
  }

  // 4. Testo del Martirologio del Santo Principale
  let martirologio = "";
  const martirologioMatch =
    html.match(/<div[^>]*class=["'][^"']*martirologio[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ||
    html.match(/<div[^>]*class=["'][^"']*santo_del_giorno_content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);

  if (martirologioMatch) {
    const rawContent = martirologioMatch[1]
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "");
    martirologio = decodeHtmlEntities(rawContent)
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join("\n\n");
  }

  // 5. Altri Santi e Beati del giorno
  const altriSanti: { nome: string; imgUrl: string | null; martirologio: string }[] = [];
  const otherAccordionMatch = html.match(/<div[^>]*class=["'][^"']*collapse-others[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/i) ||
    html.match(/<div[^>]*id=["']altri_santi["'][^>]*>([\s\S]*?)<\/div>/i);

  if (otherAccordionMatch) {
    const panelBlocks = otherAccordionMatch[1].split(/<div[^>]*class=["'][^"']*panel[^"']*["'][^>]*>/i);
    for (const block of panelBlocks) {
      if (!block.trim()) continue;

      const titleM =
        block.match(/<h4[^>]*class=["'][^"']*panel-title[^"']*["'][^>]*>([\s\S]*?)<\/h4>/i) ||
        block.match(/<a[^>]*data-toggle=["']collapse["'][^>]*>([\s\S]*?)<\/a>/i);

      const contentM =
        block.match(/<div[^>]*class=["'][^"']*panel-body[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ||
        block.match(/<div[^>]*class=["'][^"']*collapse[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);

      const panelImgM = block.match(/<div[^>]*class=["'][^"']*panel-image[^"']*["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i) ||
        block.match(/<img[^>]+class=["'][^"']*img-responsive[^"']*["'][^>]+src=["']([^"']+)["']/i);

      if (titleM && contentM) {
        const nome = decodeHtmlEntities(titleM[1].replace(/<[^>]+>/g, "").trim());
        const testo = decodeHtmlEntities(contentM[1].replace(/<[^>]+>/g, "").trim());
        const saintImg = panelImgM ? panelImgM[1] : null;

        if (nome.length > 2 && testo.length > 5) {
          altriSanti.push({
            nome,
            imgUrl: saintImg,
            martirologio: testo,
          });
        }
      }
    }
  }

  return {
    title,
    grado,
    imgUrl,
    martirologio,
    altriSanti,
    source: "ChiesaCattolica.it (Ufficiale CEI)",
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const rite = (searchParams.get("rite") || "ambrosiano").toLowerCase();

    const d = dateParam ? new Date(dateParam) : new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const isoDate = `${year}-${month}-${day}`;
    const cleanDate = `${year}${month}${day}`;

    const dateLabel = d.toLocaleDateString("it-IT", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let result: any = null;

    if (rite === "ambrosiano") {
      result = await fetchAmbrosianoSanto(isoDate);
      // Se non trovato su Chiesa di Milano, effettua fallback su Chiesa Cattolica
      if (!result) {
        console.warn(`Santo Ambrosiano non trovato per ${isoDate}, fallback su CEI`);
        result = await fetchRomanoSanto(cleanDate);
      }
    } else {
      result = await fetchRomanoSanto(cleanDate);
    }

    return NextResponse.json(
      {
        date: isoDate,
        dateLabel,
        title: result.title,
        grado: result.grado,
        imgUrl: result.imgUrl,
        martirologio: result.martirologio,
        altriSanti: result.altriSanti || [],
        source: result.source,
        rite,
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
