import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<a[^>]*href=["'](?:http:\/\/www\.ibreviary\.com\/new\/donazione\.html|HTTP:\/\/www\.ibreviary\.com\/new\/newsletter\.html|#menu)["'][^>]*>.*?<\/a>/gi, "")
    .replace(/<p>\s*<a[^>]*href=["'](?:HTTP:\/\/www\.ibreviary\.com|http:\/\/www\.ibreviary\.com)[^"']*["'][^>]*>.*?<\/a>\s*<\/p>/gi, "")
    .replace(/<p>\s*\*{4,}\s*<\/p>/gi, "")
    .replace(/<hr\s*\/?>/gi, "<hr class='my-4 border-[#e2d5c4]' />")
    .replace(/(?:<br\s*\/?>\s*){3,}/gi, "<br /><br />")
    .replace(/<p>\s*(?:&nbsp;|\s)*<\/p>/gi, "");
}

function cleanInfoText(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Recupera le Letture della Santa Messa Ambrosiana direttamente dalla REST API ufficiale di chiesadimilano.it
 */
async function fetchAmbrosianoMessaFromChiesaDiMilano(dateStr: string) {
  // Categorie WordPress associate all'Almanacco Letture Rito Ambrosiano (Anno A, B, C)
  const catIds = "4041,4044,4047,4045,7357,22737,4051,4049,5414,20537,4042,4048,6462,21704,10047,8463,9385";
  const after = `${dateStr}T00:00:00`;
  const before = `${dateStr}T23:59:59`;
  const url = `https://www.chiesadimilano.it/wp-json/wp/v2/posts?categories=${catIds}&after=${after}&before=${before}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede/1.8.8",
      Accept: "application/json",
    },
    next: { revalidate: 1800 },
  });

  if (!res.ok) {
    throw new Error(`Errore HTTP ${res.status} da chiesadimilano.it per la Messa Ambrosiana`);
  }

  const items = await res.json();
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Nessuna lettura della Messa ambrosiana trovata su chiesadimilano.it per questa data");
  }

  const post = items[0];
  const title = cleanInfoText(post.title?.rendered || "");
  const summary = cleanInfoText(post.acf?.summary || "");
  const overtitle = cleanInfoText(post.acf?.overtitle || "");

  let liturgicalInfo = "Santa Messa - Rito Ambrosiano";
  if (title) {
    liturgicalInfo = `${title}${summary ? ` · ${summary}` : ""}${overtitle ? ` (${overtitle})` : ""} - Messa Rito Ambrosiano`;
  }

  const contentHtml = post.content?.rendered || "";
  if (!contentHtml) {
    throw new Error("Contenuto delle letture della Messa vuoto su chiesadimilano.it");
  }

  return {
    liturgicalInfo,
    contentHtml: sanitizeHtml(contentHtml),
  };
}

/**
 * Fallback per la Messa Ambrosiana via iBreviary
 */
async function fetchAmbrosianoMessaFromIbreviary() {
  const url = "https://www.ibreviary.com/m2/messale.php?r=AMB";
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede/1.8.8",
      "Accept-Language": "it-IT,it;q=0.9",
    },
    next: { revalidate: 1800 },
  });

  if (!res.ok) {
    throw new Error(`Errore fallback iBreviary Messa Ambrosiana (${res.status})`);
  }

  const html = await res.text();
  let content = html;
  const match =
    html.match(/<div class="inner">([\s\S]*?)<\/div>\s*<\/div>\s*<\/body>/i) ||
    html.match(/<div id="contenuto">([\s\S]*?)<\/div>\s*<\/body>/i);

  if (match && match[1]) {
    content = match[1];
  }

  return {
    liturgicalInfo: "Santa Messa - Rito Ambrosiano (iBreviary)",
    contentHtml: sanitizeHtml(content),
  };
}

/**
 * Recupera la Liturgia delle Ore Ambrosiana direttamente dalla REST API ufficiale di chiesadimilano.it
 */
async function fetchAmbrosianoFromChiesaDiMilano(dateStr: string, moment: string) {
  const after = `${dateStr}T00:00:00`;
  const before = `${dateStr}T23:59:59`;
  const url = `https://www.chiesadimilano.it/wp-json/wp/v2/giorno_liturgia_ore?after=${after}&before=${before}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede/1.8.8",
      Accept: "application/json",
    },
    next: { revalidate: 1800 },
  });

  if (!res.ok) {
    throw new Error(`Errore HTTP ${res.status} da chiesadimilano.it`);
  }

  const items = await res.json();
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Nessun post liturgico trovato su chiesadimilano.it per la data richiesta");
  }

  const post = items[0];
  const title = cleanInfoText(post.title?.rendered || "");
  const summary = cleanInfoText(post.acf?.summary || "");
  const overtitle = cleanInfoText(post.acf?.overtitle || "");

  let liturgicalInfo = "Rito Ambrosiano (Diocesi di Milano)";
  if (title) {
    liturgicalInfo = `${title}${summary ? ` · ${summary}` : ""}${overtitle ? ` (${overtitle})` : ""} - Rito Ambrosiano`;
  }

  let contentHtml = "";
  if (moment === "ufficio") contentHtml = post.acf?.udl || "";
  else if (moment === "lodi") contentHtml = post.acf?.lm || "";
  else if (moment === "ora_media") contentHtml = post.acf?.om || "";
  else if (moment === "vespri") contentHtml = post.acf?.vespri || "";
  else if (moment === "compieta") contentHtml = post.acf?.compieta || "";

  if (!contentHtml) {
    throw new Error(`Momento ${moment} non disponibile nei dati di chiesadimilano.it`);
  }

  return {
    liturgicalInfo,
    contentHtml: sanitizeHtml(contentHtml),
  };
}

/**
 * Fallback via Google Apps Script Feed (per la Liturgia delle Ore Ambrosiana)
 */
async function fetchAmbrosianoFromGas(formattedDateItalian: string, moment: string) {
  let scelta = "LODI";
  if (moment === "ufficio") scelta = "UFFICIO";
  else if (moment === "lodi") scelta = "LODI";
  else if (moment === "ora_media") scelta = "ORA MEDIA";
  else if (moment === "vespri") scelta = "VESPRI";
  else if (moment === "compieta") scelta = "COMPIETA";

  const gasUrl = `https://script.google.com/macros/s/AKfycbzNphScBgkoBHVTaW7oFbEPDpFFZCnv4BB_rVLB1ozRUDeu0Us7UfJtDwJxlKPTmmawRA/exec?scelta=${encodeURIComponent(scelta)}&data=${formattedDateItalian}`;
  const infoUrl = `https://script.google.com/macros/s/AKfycbzNphScBgkoBHVTaW7oFbEPDpFFZCnv4BB_rVLB1ozRUDeu0Us7UfJtDwJxlKPTmmawRA/exec?scelta=INFO&data=${formattedDateItalian}`;

  const [textRes, infoRes] = await Promise.all([
    fetch(gasUrl, { next: { revalidate: 1800 } }),
    fetch(infoUrl, { next: { revalidate: 1800 } }).catch(() => null),
  ]);

  if (!textRes.ok) {
    throw new Error(`Errore dal server ambrosiano (${textRes.status})`);
  }

  const rawHtml = await textRes.text();
  let infoText = "Rito Ambrosiano - Diocesi di Milano";
  if (infoRes && infoRes.ok) {
    const rawInfo = await infoRes.text();
    const cleaned = cleanInfoText(rawInfo);
    if (cleaned) {
      infoText = `${cleaned} (Rito Ambrosiano)`;
    }
  }

  return {
    liturgicalInfo: infoText,
    contentHtml: sanitizeHtml(rawHtml),
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rite = searchParams.get("rite") || "ambrosiano";
  const moment = searchParams.get("moment") || "lodi";
  const dateStr = searchParams.get("date");

  let targetDate = new Date();
  if (dateStr) {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      targetDate = parsed;
    }
  }

  const day = String(targetDate.getDate()).padStart(2, "0");
  const month = String(targetDate.getMonth() + 1).padStart(2, "0");
  const year = targetDate.getFullYear();
  const isoDate = `${year}-${month}-${day}`;
  const formattedDateItalian = `${day}/${month}/${year}`;

  try {
    if (rite === "ambrosiano") {
      // 1. GESTIONE SANTA MESSA AMBROSIANA
      if (moment === "messa") {
        try {
          const cdmMessa = await fetchAmbrosianoMessaFromChiesaDiMilano(isoDate);
          return NextResponse.json({
            rite: "ambrosiano",
            moment: "messa",
            date: isoDate,
            liturgicalInfo: cdmMessa.liturgicalInfo,
            contentHtml: cdmMessa.contentHtml,
            source: "chiesadimilano.it (Ufficiale Letture Messa)",
          }, {
            headers: {
              "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
            },
          });
        } catch (cdmErr) {
          console.warn("Fallback su iBreviary per Messa Ambrosiana:", cdmErr);
          const ibMessa = await fetchAmbrosianoMessaFromIbreviary();
          return NextResponse.json({
            rite: "ambrosiano",
            moment: "messa",
            date: isoDate,
            liturgicalInfo: ibMessa.liturgicalInfo,
            contentHtml: ibMessa.contentHtml,
            source: "ibreviary-ambrosiano",
          }, {
            headers: {
              "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
            },
          });
        }
      }

      // 2. GESTIONE LITURGIA DELLE ORE AMBROSIANA (Ufficio, Lodi, Ora Media, Vespri, Compieta)
      try {
        const cdmData = await fetchAmbrosianoFromChiesaDiMilano(isoDate, moment);
        return NextResponse.json({
          rite: "ambrosiano",
          moment,
          date: isoDate,
          liturgicalInfo: cdmData.liturgicalInfo,
          contentHtml: cdmData.contentHtml,
          source: "chiesadimilano.it (Ufficiale)",
        }, {
          headers: {
            "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
          },
        });
      } catch (cdmErr) {
        console.warn("Fallback su Google Apps Script per Liturgia Ore Ambrosiana:", cdmErr);
        const gasData = await fetchAmbrosianoFromGas(formattedDateItalian, moment);
        return NextResponse.json({
          rite: "ambrosiano",
          moment,
          date: isoDate,
          liturgicalInfo: gasData.liturgicalInfo,
          contentHtml: gasData.contentHtml,
          source: "gas-fallback",
        }, {
          headers: {
            "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
          },
        });
      }
    } else {
      // 3. RITO ROMANO via iBreviary
      let url = "";
      if (moment === "messa") {
        url = "https://www.ibreviary.com/m2/letture.php?s=letture&lang=it";
      } else {
        let s = "lodi";
        if (moment === "ufficio") s = "ufficio_delle_letture";
        else if (moment === "lodi") s = "lodi";
        else if (moment === "ora_media") s = "ora_media";
        else if (moment === "vespri") s = "vespri";
        else if (moment === "compieta") s = "compieta";

        url = `https://www.ibreviary.com/m2/breviario.php?lang=it&s=${s}`;
      }

      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept-Language": "it-IT,it;q=0.9",
        },
        next: { revalidate: 1800 },
      });

      if (!res.ok) {
        throw new Error(`Errore recupero rito romano (${res.status})`);
      }

      const html = await res.text();

      let content = html;
      const match =
        html.match(/<div class="inner">([\s\S]*?)<\/div>\s*<\/div>\s*<\/body>/i) ||
        html.match(/<div id="contenuto">([\s\S]*?)<\/div>\s*<\/body>/i);

      if (match && match[1]) {
        content = match[1];
      }

      const sanitized = sanitizeHtml(content);

      return NextResponse.json({
        rite: "romano",
        moment,
        date: isoDate,
        liturgicalInfo: "Rito Romano Ufficiale (CEI)",
        contentHtml: sanitized,
      }, {
        headers: {
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
        },
      });
    }
  } catch (err: any) {
    console.error("Errore recupero liturgia:", err);
    return NextResponse.json(
      { error: err.message || "Impossibile recuperare i testi liturgici." },
      { status: 500 }
    );
  }
}
