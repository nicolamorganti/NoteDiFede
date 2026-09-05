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
    .replace(/&acirc;/g, "â")
    .replace(/&egrave;/g, "è")
    .replace(/&eacute;/g, "é")
    .replace(/&ecirc;/g, "ê")
    .replace(/&igrave;/g, "ì")
    .replace(/&iacute;/g, "í")
    .replace(/&icirc;/g, "î")
    .replace(/&ograve;/g, "ò")
    .replace(/&oacute;/g, "ó")
    .replace(/&ocirc;/g, "ô")
    .replace(/&ugrave;/g, "ù")
    .replace(/&uacute;/g, "ú")
    .replace(/&ucirc;/g, "û")
    .replace(/&ccedil;/g, "ç")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Analizza il contenuto HTML da Chiesa di Milano estraendo il martirologio principale
 * ed eventuali altri santi e beati commemorati nello stesso giorno (es. "Oggi si ricorda San Lorenzo Giustiniani")
 */
function parseAmbrosianoContent(contentHtml: string): {
  martirologio: string;
  altriSanti: { nome: string; imgUrl: string | null; martirologio: string }[];
} {
  const cleanHtml = contentHtml
    .replace(/<span class="postimageinsidecontent">[\s\S]*?<\/span>/i, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  const pMatches: string[] = [];
  let match;
  while ((match = pRegex.exec(cleanHtml)) !== null) {
    pMatches.push(match[1]);
  }

  if (pMatches.length === 0) {
    const splitPs = cleanHtml.split(/<\/?p>/).map((p) => p.trim()).filter(Boolean);
    pMatches.push(...splitPs);
  }

  // Riconosce le frasi introduttive di ulteriori santi commemorati
  const secondaryMarkerRegex = /^(?:Oggi\s+(?:si\s+ricorda(?:no)?(?:\s+anche)?|la\s+(?:Chiesa|liturgia)\s+ricorda(?:no)?(?:\s+anche)?|si\s+fa\s+memoria(?:\s+anche)?\s+di|si\s+celebra(?:no)?(?:\s+anche)?)|(?:Si\s+ricorda(?:no)?(?:\s+anche)?|La\s+(?:Chiesa|liturgia)\s+ricorda(?:\s+anche)?|Si\s+fa\s+memoria(?:\s+anche)?\s+di|Commemorazione\s+di|Memoria\s+di))\s*:?\s*/i;

  const mainParagraphs: string[] = [];
  const altriSanti: { nome: string; imgUrl: string | null; martirologio: string }[] = [];
  let currentOtherSaint: { nome: string; imgUrl: string | null; paragraphs: string[] } | null = null;

  for (const rawP of pMatches) {
    const subParts = rawP.split(/<br\s*\/?>\s*(?:<br\s*\/?>)?/i);

    for (const subPart of subParts) {
      const textOnly = decodeHtmlEntities(subPart.replace(/<[^>]+>/g, " ")).trim();
      if (textOnly.length < 5) continue;

      if (secondaryMarkerRegex.test(textOnly)) {
        let saintName = textOnly.replace(secondaryMarkerRegex, "").trim();
        saintName = saintName.replace(/^[\s:–—-]+|[\s:–—.-]+$/g, "").trim();

        if (currentOtherSaint && currentOtherSaint.paragraphs.length > 0) {
          altriSanti.push({
            nome: currentOtherSaint.nome,
            imgUrl: currentOtherSaint.imgUrl,
            martirologio: currentOtherSaint.paragraphs.join("\n\n"),
          });
        }

        const imgM = subPart.match(/<img[^>]+src=["']([^"']+)["']/i);
        currentOtherSaint = {
          nome: saintName || "Altro Santo",
          imgUrl: imgM && !imgM[1].includes("logo") ? imgM[1] : null,
          paragraphs: [],
        };
      } else if (currentOtherSaint) {
        const imgM = subPart.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgM && !currentOtherSaint.imgUrl && !imgM[1].includes("logo")) {
          currentOtherSaint.imgUrl = imgM[1];
        }
        currentOtherSaint.paragraphs.push(textOnly);
      } else {
        mainParagraphs.push(textOnly);
      }
    }
  }

  if (currentOtherSaint && currentOtherSaint.paragraphs.length > 0) {
    altriSanti.push({
      nome: currentOtherSaint.nome,
      imgUrl: currentOtherSaint.imgUrl,
      martirologio: currentOtherSaint.paragraphs.join("\n\n"),
    });
  }

  return {
    martirologio: mainParagraphs.join("\n\n"),
    altriSanti,
  };
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

        const parsed = parseAmbrosianoContent(contentHtml);

        if (parsed.martirologio.length > 20 || parsed.altriSanti.length > 0) {
          return {
            title,
            grado: "Rito Ambrosiano",
            imgUrl,
            martirologio: parsed.martirologio,
            altriSanti: parsed.altriSanti,
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

          const parsed = parseAmbrosianoContent(contentMatch ? contentMatch[1] : "");

          return {
            title,
            grado: "Rito Ambrosiano",
            imgUrl,
            martirologio: parsed.martirologio,
            altriSanti: parsed.altriSanti,
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
  const mainImgMatch =
    html.match(/<div[^>]*class=["'][^"']*santo-del-giorno-image[^"']*["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i) ||
    html.match(/<img[^>]+id=["']img-click-zoom["'][^>]+src=["']([^"']+)["']/i) ||
    html.match(/<img[^>]+class=["'][^"']*img-responsive[^"']*["'][^>]+src=["']([^"']+)["']/i);
  if (mainImgMatch && !mainImgMatch[1].includes("logo_cci") && !mainImgMatch[1].includes("default")) {
    imgUrl = mainImgMatch[1];
  }

  // 4. Testo del Martirologio del Santo Principale
  let martirologio = "";
  const martirologioMatch =
    html.match(/<div[^>]*class=["'][^"']*cci-santo-del-giorno-fonte-container[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>/i) ||
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

  // 5. Altri Santi e Beati del giorno con sotto-immagini (Santi Minori)
  const altriSanti: { nome: string; imgUrl: string | null; martirologio: string }[] = [];
  const panelParts = html.split(/<div[^>]*class=["'][^"']*panel panel-default altri-santi[^"']*["'][^>]*>/i);

  for (let i = 1; i < panelParts.length; i++) {
    const panel = panelParts[i];
    const nomeM =
      panel.match(/<h3[^>]*class=["'][^"']*cci-santo-del-giorno-accordion-nome[^"']*["'][^>]*>([\s\S]*?)<\/h3>/i) ||
      panel.match(/<h4[^>]*class=["'][^"']*panel-title[^"']*["'][^>]*>([\s\S]*?)<\/h4>/i);

    const bodyM =
      panel.match(/<div[^>]*class=["'][^"']*panel-body[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ||
      panel.match(/<div[^>]*class=["'][^"']*collapse[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);

    const imgM =
      panel.match(/<div[^>]*class=["'][^"']*panel-image[^"']*["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i) ||
      panel.match(/<img[^>]+class=["'][^"']*img-accordion[^"']*["'][^>]+src=["']([^"']+)["']/i);

    if (nomeM && bodyM) {
      const nome = decodeHtmlEntities(nomeM[1].replace(/<[^>]+>/g, "").trim());
      const testo = decodeHtmlEntities(bodyM[1].replace(/<[^>]+>/g, "").trim());
      const rawImg = imgM ? imgM[1] : null;
      const saintImg = rawImg && !rawImg.includes("logo_cci") && !rawImg.includes("default") ? rawImg : null;

      if (nome.length > 1 && testo.length > 3) {
        altriSanti.push({
          nome,
          imgUrl: saintImg,
          martirologio: testo,
        });
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
    const rite = (searchParams.get("rite") || "romano").toLowerCase();

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
