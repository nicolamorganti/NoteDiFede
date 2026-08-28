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
 * Calcola una finestra temporale ampia (-1 giorno 20:00 / +1 giorno 04:00)
 * per evitare disallineamenti di fuso orario UTC vs CEST (Milano UTC+2) a mezzanotte.
 */
function getDateWindow(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00Z");
  const prev = new Date(d);
  prev.setDate(prev.getDate() - 1);
  const next = new Date(d);
  next.setDate(next.getDate() + 1);

  const prevStr = prev.toISOString().split("T")[0];
  const nextStr = next.toISOString().split("T")[0];

  return {
    after: `${prevStr}T20:00:00`,
    before: `${nextStr}T04:00:00`,
  };
}

// Cache in memoria delle mappe del calendario di Chiesa di Milano (aggiornata ogni ora)
let cachedMessaCalendar: Record<string, string> | null = null;
let cachedOreCalendar: Record<string, string> | null = null;
let lastCalendarFetch = 0;

async function getAmbrosianoCalendarMap(): Promise<{
  messaMap: Record<string, string>;
  oreMap: Record<string, string>;
}> {
  const now = Date.now();
  if (cachedMessaCalendar && cachedOreCalendar && now - lastCalendarFetch < 3600000) {
    return { messaMap: cachedMessaCalendar, oreMap: cachedOreCalendar };
  }

  try {
    const [resMessa, resOre] = await Promise.all([
      fetch("https://www.chiesadimilano.it/letture-rito-ambrosiano", {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede/1.9.6" },
        next: { revalidate: 3600 },
      }),
      fetch("https://www.chiesadimilano.it/liturgia-delle-ore", {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede/1.9.6" },
        next: { revalidate: 3600 },
      }),
    ]);

    const htmlMessa = await resMessa.text();
    const htmlOre = await resOre.text();

    const messaMap: Record<string, string> = {};
    const messaMatches = [
      ...htmlMessa.matchAll(/<a[^>]*href="([^"]+)"[^>]*data-date="(\d{4})-(\d{1,2})-(\d{1,2})"[^>]*>/gi),
    ];
    for (const m of messaMatches) {
      const url = m[1];
      const year = m[2];
      const month = m[3].padStart(2, "0");
      const day = m[4].padStart(2, "0");
      messaMap[`${year}-${month}-${day}`] = url;
    }

    const oreMap: Record<string, string> = {};
    const oreMatches = [
      ...htmlOre.matchAll(/<a[^>]*href="([^"]+)"[^>]*data-date="(\d{4})-(\d{1,2})-(\d{1,2})"[^>]*>/gi),
    ];
    for (const m of oreMatches) {
      const url = m[1];
      const year = m[2];
      const month = m[3].padStart(2, "0");
      const day = m[4].padStart(2, "0");
      oreMap[`${year}-${month}-${day}`] = url;
    }

    cachedMessaCalendar = messaMap;
    cachedOreCalendar = oreMap;
    lastCalendarFetch = now;

    return { messaMap, oreMap };
  } catch (e) {
    console.error("Errore recupero mappa calendario chiesadimilano:", e);
    return {
      messaMap: cachedMessaCalendar || {},
      oreMap: cachedOreCalendar || {},
    };
  }
}

function extractMessaFromHtml(html: string) {
  const titleMatch =
    html.match(/<h1[^>]*class=["']entry-title["'][^>]*>([\s\S]*?)<\/h1>/i) ||
    html.match(/<title>([^<]+)<\/title>/i);
  const title = titleMatch
    ? titleMatch[1].replace(/<[^>]+>/g, "").replace(/ - Chiesa di Milano.*/i, "").trim()
    : "Santa Messa - Rito Ambrosiano";

  const riassuntoMatch = html.match(/<div class=['"]riassunto['"]>([\s\S]*?)<\/div>/i);
  const riassunto = riassuntoMatch ? cleanInfoText(riassuntoMatch[1]) : "";

  const contentMatch =
    html.match(/<div[^>]*class=['"][^'"]*entry-content[^'"]*['"][^>]*>([\s\S]*?)<\/div>\s*<!-- \.entry-content -->/i) ||
    html.match(/<div[^>]*class=['"][^'"]*entry-content[^'"]*['"][^>]*>([\s\S]*?)<\/div>/i);

  const contentHtml = contentMatch ? contentMatch[1].trim() : "";
  return {
    liturgicalInfo: `${title}${riassunto ? ` (${riassunto})` : ""} - Messa Rito Ambrosiano`,
    contentHtml,
  };
}

function extractOreFromHtml(html: string, moment: string) {
  const titleMatch =
    html.match(/<h1[^>]*class=["']entry-title["'][^>]*>([\s\S]*?)<\/h1>/i) ||
    html.match(/<title>([^<]+)<\/title>/i);
  const title = titleMatch
    ? titleMatch[1].replace(/<[^>]+>/g, "").replace(/ - Chiesa di Milano.*/i, "").trim()
    : "Liturgia delle Ore - Rito Ambrosiano";

  let tabId = "LODI";
  if (moment === "ufficio") tabId = "UDL";
  else if (moment === "lodi") tabId = "LODI";
  else if (moment === "ora_media") tabId = "OM";
  else if (moment === "vespri") tabId = "VESPRI";
  else if (moment === "compieta") tabId = "COMPIETA";

  const regex = new RegExp(
    `<div[^>]*id="${tabId}"[^>]*>([\\s\\S]*?)<\\/div>\\s*(?=<div[^>]*id="(?:UDL|LODI|OM|VESPRI|COMPIETA)"|<\\/div>\\s*<\\/div>|$)`,
    "i"
  );
  const match = html.match(regex);
  const contentHtml = match ? match[1].trim() : "";

  return {
    liturgicalInfo: `${title} - Rito Ambrosiano`,
    contentHtml,
  };
}

/**
 * Recupera le Letture della Santa Messa Ambrosiana (da REST API o da calendario per date future)
 */
async function fetchAmbrosianoMessaFromChiesaDiMilano(dateStr: string) {
  // 1. Prova prima tramite la REST API
  const catIds = "4041,4044,4047,4045,7357,22737,4051,4049,5414,20537,4042,4048,6462,21704,10047,8463,9385";
  const { after, before } = getDateWindow(dateStr);
  const url = `https://www.chiesadimilano.it/wp-json/wp/v2/posts?categories=${catIds}&after=${after}&before=${before}&per_page=15`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede/1.9.6",
        Accept: "application/json",
      },
      next: { revalidate: 1800 },
    });

    if (res.ok) {
      const items = await res.json();
      if (Array.isArray(items) && items.length > 0) {
        const matchedPost = items.find((p: any) => p.date?.startsWith(dateStr)) || items[0];
        const title = cleanInfoText(matchedPost.title?.rendered || "");
        const summary = cleanInfoText(matchedPost.acf?.summary || "");
        const overtitle = cleanInfoText(matchedPost.acf?.overtitle || "");

        let liturgicalInfo = "Santa Messa - Rito Ambrosiano";
        if (title) {
          liturgicalInfo = `${title}${summary ? ` · ${summary}` : ""}${overtitle ? ` (${overtitle})` : ""} - Messa Rito Ambrosiano`;
        }

        const contentHtml = matchedPost.content?.rendered || "";
        if (contentHtml && contentHtml.length > 50) {
          return {
            liturgicalInfo,
            contentHtml: sanitizeHtml(contentHtml),
          };
        }
      }
    }
  } catch (err) {
    console.warn("REST API Messa non disponibile per data, passo a calendario HTML:", err);
  }

  // 2. Se non presente in REST API (es. date future o schedulate), recupera tramite il calendario completo di chiesadimilano.it
  const { messaMap } = await getAmbrosianoCalendarMap();
  const directUrl = messaMap[dateStr];

  if (directUrl) {
    const directRes = await fetch(directUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede/1.9.6",
        Accept: "text/html,application/xhtml+xml",
      },
      next: { revalidate: 3600 },
    });

    if (directRes.ok) {
      const directHtml = await directRes.text();
      const extracted = extractMessaFromHtml(directHtml);
      if (extracted.contentHtml && extracted.contentHtml.length > 50) {
        return {
          liturgicalInfo: extracted.liturgicalInfo,
          contentHtml: sanitizeHtml(extracted.contentHtml),
        };
      }
    }
  }

  throw new Error("Nessuna lettura della Messa ambrosiana trovata su chiesadimilano.it per questa data");
}

/**
 * Fallback per la Messa Ambrosiana via iBreviary
 */
async function fetchAmbrosianoMessaFromIbreviary() {
  const url = "https://www.ibreviary.com/m2/messale.php?r=AMB";
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede/1.9.6",
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
 * Recupera la Liturgia delle Ore Ambrosiana (da REST API o da calendario per date future)
 */
async function fetchAmbrosianoFromChiesaDiMilano(dateStr: string, moment: string) {
  // 1. Prova prima tramite la REST API
  const { after, before } = getDateWindow(dateStr);
  const url = `https://www.chiesadimilano.it/wp-json/wp/v2/giorno_liturgia_ore?after=${after}&before=${before}&per_page=15`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede/1.9.6",
        Accept: "application/json",
      },
      next: { revalidate: 1800 },
    });

    if (res.ok) {
      const items = await res.json();
      if (Array.isArray(items) && items.length > 0) {
        const matchedPost = items.find((p: any) => p.date?.startsWith(dateStr)) || items[0];
        const title = cleanInfoText(matchedPost.title?.rendered || "");
        const summary = cleanInfoText(matchedPost.acf?.summary || "");
        const overtitle = cleanInfoText(matchedPost.acf?.overtitle || "");

        let liturgicalInfo = "Rito Ambrosiano (Diocesi di Milano)";
        if (title) {
          liturgicalInfo = `${title}${summary ? ` · ${summary}` : ""}${overtitle ? ` (${overtitle})` : ""} - Rito Ambrosiano`;
        }

        let contentHtml = "";
        if (moment === "ufficio") contentHtml = matchedPost.acf?.udl || "";
        else if (moment === "lodi") contentHtml = matchedPost.acf?.lm || "";
        else if (moment === "ora_media") contentHtml = matchedPost.acf?.om || "";
        else if (moment === "vespri") contentHtml = matchedPost.acf?.vespri || "";
        else if (moment === "compieta") contentHtml = matchedPost.acf?.compieta || "";

        if (contentHtml && contentHtml.length > 50) {
          return {
            liturgicalInfo,
            contentHtml: sanitizeHtml(contentHtml),
          };
        }
      }
    }
  } catch (err) {
    console.warn("REST API Liturgia Ore non disponibile per data, passo a calendario HTML:", err);
  }

  // 2. Se non presente in REST API (es. date future), recupera tramite il calendario completo di chiesadimilano.it
  const { oreMap } = await getAmbrosianoCalendarMap();
  const directUrl = oreMap[dateStr];

  if (directUrl) {
    const directRes = await fetch(directUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede/1.9.6",
        Accept: "text/html,application/xhtml+xml",
      },
      next: { revalidate: 3600 },
    });

    if (directRes.ok) {
      const directHtml = await directRes.text();
      const extracted = extractOreFromHtml(directHtml, moment);
      if (extracted.contentHtml && extracted.contentHtml.length > 50) {
        return {
          liturgicalInfo: extracted.liturgicalInfo,
          contentHtml: sanitizeHtml(extracted.contentHtml),
        };
      }
    }
  }

  throw new Error("Nessun post liturgico trovato su chiesadimilano.it per la data richiesta");
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

  let rawHtml = await textRes.text();
  let liturgicalInfo = "Rito Ambrosiano";
  if (infoRes && infoRes.ok) {
    const rawInfo = await infoRes.text();
    const cleanInfo = cleanInfoText(rawInfo);
    if (cleanInfo && !cleanInfo.includes("Errore")) {
      liturgicalInfo = cleanInfo;
    }
  }

  return {
    liturgicalInfo,
    contentHtml: sanitizeHtml(rawHtml),
  };
}

/**
 * Parser per le letture della Messa in Rito Romano da LaChiesa.it per QUALSIASI data (passata, oggi, futura)
 */
function parseLaChiesaHtml(rawHtml: string) {
  const titleMatch = rawHtml.match(/<title>([^<]+)<\/title>/i);
  let liturgicalInfo = titleMatch
    ? titleMatch[1].replace(/^LaChiesa:\s*/i, "").trim()
    : "Liturgia del Giorno - Rito Romano";

  const sectionMatches = [
    ...rawHtml.matchAll(
      /<div class="section">([\s\S]*?)<\/div>\s*(?=<div class="section"|<div id="footer"|<footer|$)/gi
    ),
  ];

  let formattedSections: string[] = [];

  for (const m of sectionMatches) {
    const sHtml = m[1];
    const tMatch = sHtml.match(/<div class="section-title">([\s\S]*?)<\/div>/i);
    const title = tMatch ? tMatch[1].replace(/<[^>]+>/g, "").trim() : "";
    if (title === "Omelie") continue; // salta i link alle omelie

    const cMatch = sHtml.match(/<div class="section-content">([\s\S]*?)<\/div>\s*$/i) || [null, sHtml];
    let content = cMatch[1] || "";

    content = content
      .replace(/<div class="section-title">[\s\S]*?<\/div>/gi, "")
      .replace(
        /<div class="section-content-mini">([\s\S]*?)<\/div>/gi,
        '<p class="rubrica" style="color:#b91c1c; font-style:italic; font-size:0.9em; margin-bottom:0.4em;">$1</p>'
      )
      .replace(/<div class="section-content-testo">/gi, "")
      .replace(/<\/div>/gi, "")
      .replace(/<a[^>]*href="[^"]*bibbia\.php[^"]*"[^>]*>([\s\S]*?)<\/a>/gi, "<strong>$1</strong>")
      .trim();

    if (title) {
      formattedSections.push(`<p><strong>${title.toUpperCase()}</strong></p>\n${content}`);
    } else if (content) {
      formattedSections.push(content);
    }
  }

  return {
    liturgicalInfo,
    contentHtml: sanitizeHtml(
      formattedSections.join("\n<hr class='my-4 border-[#e2d5c4]' />\n")
    ),
  };
}

/**
 * Recupera la Santa Messa in Rito Romano per una data specifica da LaChiesa.it
 */
async function fetchRomanoMessaFromLaChiesa(isoDate: string) {
  const cleanDate = isoDate.replace(/-/g, "");
  const url = `https://www.lachiesa.it/calendario/Detailed/${cleanDate}.shtml`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede/1.9.6",
      Accept: "text/html,application/xhtml+xml,application/xml",
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Errore HTTP ${res.status} da LaChiesa.it per la Messa in Rito Romano`);
  }

  const html = await res.text();
  const parsed = parseLaChiesaHtml(html);

  if (!parsed.contentHtml || parsed.contentHtml.length < 50) {
    throw new Error("Contenuto delle letture non trovato su LaChiesa.it");
  }

  return parsed;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rite = searchParams.get("rite") || "ambrosiano";
    const moment = searchParams.get("moment") || "lodi";
    const dateParam = searchParams.get("date");

    const today = new Date();
    let isoDate = today.toISOString().split("T")[0];
    let formattedDateItalian = "";

    if (dateParam) {
      const parts = dateParam.split("-");
      if (parts.length === 3) {
        isoDate = dateParam;
        formattedDateItalian = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }

    if (!formattedDateItalian) {
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const yyyy = today.getFullYear();
      formattedDateItalian = `${dd}/${mm}/${yyyy}`;
    }

    if (rite === "ambrosiano") {
      // 1. GESTIONE SANTA MESSA AMBROSIANA (passato, oggi e giorni futuri)
      if (moment === "messa") {
        try {
          const cdmMessaData = await fetchAmbrosianoMessaFromChiesaDiMilano(isoDate);
          return NextResponse.json(
            {
              rite: "ambrosiano",
              moment: "messa",
              date: isoDate,
              liturgicalInfo: cdmMessaData.liturgicalInfo,
              contentHtml: cdmMessaData.contentHtml,
              source: "chiesadimilano.it (Almanacco Letture Ufficiale)",
            },
            {
              headers: {
                "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
              },
            }
          );
        } catch (cdmErr) {
          console.warn("Fallback su iBreviary per Messa Ambrosiana:", cdmErr);
          const ibData = await fetchAmbrosianoMessaFromIbreviary();
          return NextResponse.json(
            {
              rite: "ambrosiano",
              moment: "messa",
              date: isoDate,
              liturgicalInfo: ibData.liturgicalInfo,
              contentHtml: ibData.contentHtml,
              source: "ibreviary-fallback",
            },
            {
              headers: {
                "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
              },
            }
          );
        }
      }

      // 2. GESTIONE LITURGIA DELLE ORE AMBROSIANA (Ufficio, Lodi, Ora Media, Vespri, Compieta - passato, oggi e futuro)
      try {
        const cdmData = await fetchAmbrosianoFromChiesaDiMilano(isoDate, moment);
        return NextResponse.json(
          {
            rite: "ambrosiano",
            moment,
            date: isoDate,
            liturgicalInfo: cdmData.liturgicalInfo,
            contentHtml: cdmData.contentHtml,
            source: "chiesadimilano.it (Ufficiale)",
          },
          {
            headers: {
              "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
            },
          }
        );
      } catch (cdmErr) {
        console.warn("Fallback su Google Apps Script per Liturgia Ore Ambrosiana:", cdmErr);
        const gasData = await fetchAmbrosianoFromGas(formattedDateItalian, moment);
        return NextResponse.json(
          {
            rite: "ambrosiano",
            moment,
            date: isoDate,
            liturgicalInfo: gasData.liturgicalInfo,
            contentHtml: gasData.contentHtml,
            source: "gas-fallback",
          },
          {
            headers: {
              "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
            },
          }
        );
      }
    } else {
      // 3. RITO ROMANO
      // Per la Santa Messa in Rito Romano: usa LaChiesa.it che supporta qualsiasi data specifica (passata, oggi, futura)
      if (moment === "messa") {
        try {
          const lachiesaData = await fetchRomanoMessaFromLaChiesa(isoDate);
          return NextResponse.json(
            {
              rite: "romano",
              moment: "messa",
              date: isoDate,
              liturgicalInfo: lachiesaData.liturgicalInfo,
              contentHtml: lachiesaData.contentHtml,
              source: "LaChiesa.it (Ufficiale CEI per qualsiasi data)",
            },
            {
              headers: {
                "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
              },
            }
          );
        } catch (lachiesaErr) {
          console.warn("Fallback su iBreviary per Messa in Rito Romano:", lachiesaErr);
        }
      }

      // Liturgia delle Ore o Fallback Rito Romano via iBreviary
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

      return NextResponse.json(
        {
          rite: "romano",
          moment,
          date: isoDate,
          liturgicalInfo: "Rito Romano Ufficiale (CEI)",
          contentHtml: sanitized,
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
          },
        }
      );
    }
  } catch (err: any) {
    console.error("Errore recupero liturgia:", err);
    return NextResponse.json(
      { error: err.message || "Impossibile recuperare i testi liturgici." },
      { status: 500 }
    );
  }
}
