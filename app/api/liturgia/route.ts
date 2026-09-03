import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml) return "";

  // 1. Estrai il contenuto effettivo dal container inner
  const innerMatch =
    rawHtml.match(/<div id="contenuto">[\s\S]*?<div class="inner">([\s\S]*?)<\/div>\s*<script/i) ||
    rawHtml.match(/<div class="inner">([\s\S]*?)<\/div>\s*(?:<div id="footer"|<\/div>\s*<\/body>|<script)/i) ||
    rawHtml.match(/<div class="inner">([\s\S]*?)<\/div>/i) ||
    rawHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

  let content = innerMatch ? innerMatch[1] : rawHtml;

  // 2. Pulizia di script, sponsor e banner di donazione
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<a[^>]*href=["'][^"']*(?:donazione|newsletter|#menu|ibreviary\.com)[^"']*["'][^>]*>[\s\S]*?<\/a>/gi, "")
    .replace(/<p[^>]*>(?:(?!<\/p>)[\s\S])*?(?:per sostenere lo sviluppo di|alla nostra Newsletter|ibreviary|donazione|-\s*Menu\s*-|\*{3,})(?:(?!<\/p>)[\s\S])*?<\/p>/gi, "")
    .replace(/per sostenere lo sviluppo di\s*iBreviary/gi, "")
    .replace(/(?:ISCRIVITI\s*)?alla nostra Newsletter/gi, "")
    .replace(/<p>\s*\*{3,}\s*<\/p>/gi, "")
    .replace(/<hr\s*\/?>/gi, "<hr class='my-4 border-[#e2d5c4]' />")
    .replace(/(?:<br\s*\/?>\s*){3,}/gi, "<br /><br />")
    .replace(/<p>\s*(?:&nbsp;|\s)*<\/p>/gi, "")
    .trim();
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
    const messaLinks = [...htmlMessa.matchAll(/<a\s+[^>]*>/gi)];
    for (const tag of messaLinks) {
      const hrefMatch = tag[0].match(/href=["']([^"']+)["']/i);
      const dateMatch = tag[0].match(/data-date=["'](\d{4})-(\d{1,2})-(\d{1,2})["']/i);
      if (hrefMatch && dateMatch) {
        const y = dateMatch[1];
        const m = dateMatch[2].padStart(2, "0");
        const d = dateMatch[3].padStart(2, "0");
        messaMap[`${y}-${m}-${d}`] = hrefMatch[1];
      }
    }

    const oreMap: Record<string, string> = {};
    const oreLinks = [...htmlOre.matchAll(/<a\s+[^>]*>/gi)];
    for (const tag of oreLinks) {
      const hrefMatch = tag[0].match(/href=["']([^"']+)["']/i);
      const dateMatch = tag[0].match(/data-date=["'](\d{4})-(\d{1,2})-(\d{1,2})["']/i);
      if (hrefMatch && dateMatch) {
        const y = dateMatch[1];
        const m = dateMatch[2].padStart(2, "0");
        const d = dateMatch[3].padStart(2, "0");
        oreMap[`${y}-${m}-${d}`] = hrefMatch[1];
      }
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
  const colore = getAmbrosianColor(title, riassunto, title);
  const liturgicalInfo = `${title}${riassunto ? ` · ${riassunto}` : ""} (colore: ${colore}) - Rito Ambrosiano`;

  return {
    title,
    riassunto,
    liturgicalInfo,
    temporalInfo: title,
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

  const riassuntoMatch = html.match(/<div class=['"]riassunto['"]>([\s\S]*?)<\/div>/i);
  const riassunto = riassuntoMatch ? cleanInfoText(riassuntoMatch[1]) : "";

  // Pattern flessibile per ID che gestisce sia "OM" che "ORAMEDIA", sia "VESPRI" che "VESPR0" o "VESPRO"
  let idPattern = "LODI";
  if (moment === "ufficio") idPattern = "UDL|UFFICIO";
  else if (moment === "lodi") idPattern = "LODI|LODIMATTUTINE";
  else if (moment === "ora_media") idPattern = "OM|ORAMEDIA|ORA_MEDIA";
  else if (moment === "vespri") idPattern = "VESPRI|VESPR0|VESPRO";
  else if (moment === "compieta") idPattern = "COMPIETA";

  const allNextIds = "(?:UDL|UFFICIO|LODI|LODIMATTUTINE|OM|ORAMEDIA|ORA_MEDIA|VESPRI|VESPR0|VESPRO|COMPIETA)";
  const regex = new RegExp(
    `<div[^>]*id=["'](?:${idPattern})["'][^>]*>([\\s\\S]*?)(?=<div[^>]*class=["'][^"']*spaziolodi[^"']*["']|<div[^>]*id=["']${allNextIds}["']|<\\/div>\\s*<\\/div>\\s*<\\/div>|$)`,
    "i"
  );
  const match = html.match(regex);
  const contentHtml = match ? match[1].trim() : "";

  const colore = getAmbrosianColor(title, riassunto, title);
  let liturgicalInfo = "";
  if (title) {
    liturgicalInfo = `${title}${riassunto ? ` · ${riassunto}` : ""} (colore: ${colore}) - Rito Ambrosiano`;
  } else {
    liturgicalInfo = `Liturgia delle Ore (colore: ${colore}) - Rito Ambrosiano`;
  }

  return {
    title,
    riassunto,
    liturgicalInfo,
    temporalInfo: title,
    contentHtml,
  };
}


function getAmbrosianColor(saint: string, grado: string, temporal: string): string {
  const combined = `${saint} ${grado} ${temporal}`.toLowerCase();

  // Rosso: Martirio, Martiri, Precursore, Decollazione, Apostoli, Evangelisti, Croce, Passione, Palme, Pentecoste, Santo Stefano, Santi Innocenti, Sangue
  if (
    combined.includes("martir") ||
    combined.includes("precursore") ||
    combined.includes("decollazion") ||
    combined.includes("apostol") ||
    combined.includes("evangelist") ||
    combined.includes("croce") ||
    combined.includes("passione") ||
    combined.includes("palme") ||
    combined.includes("pentecost") ||
    combined.includes("innocenti") ||
    combined.includes("sangue")
  ) {
    return "rosso";
  }

  // Viola: Quaresima, Avvento, Defunti, Ceneri, Penitenziale
  if (
    combined.includes("quaresima") ||
    combined.includes("avvento") ||
    combined.includes("defunt") ||
    combined.includes("ceneri") ||
    combined.includes("penitenz")
  ) {
    return "viola";
  }

  // Bianco: Pasqua, Natale, Epifania, Maria, Vergine, Vescovo, Dottore, Confessore, Papa, Abate, Sacerdote, Pastore, Solennità, Trinità, Tutti i Santi, Battesimo, Sacro Cuore, Corpus Domini, Annunciazione, Trasfigurazione
  if (
    combined.includes("pasqua") ||
    combined.includes("natal") ||
    combined.includes("epifania") ||
    combined.includes("maria") ||
    combined.includes("vergine") ||
    combined.includes("vescovo") ||
    combined.includes("dottore") ||
    combined.includes("confessore") ||
    combined.includes("papa") ||
    combined.includes("abate") ||
    combined.includes("sacerdote") ||
    combined.includes("pastore") ||
    combined.includes("assunzion") ||
    combined.includes("immacolata") ||
    combined.includes("trinit") ||
    combined.includes("tutti i santi") ||
    combined.includes("battesimo") ||
    combined.includes("sacro cuore") ||
    combined.includes("corpus domini") ||
    combined.includes("annunciazione") ||
    combined.includes("trasfigurazione")
  ) {
    return "bianco";
  }

  return "verde";
}


const ambrosianoMetaCache: Record<string, { saint: string; grado: string; colore: string; temporal: string; liturgicalInfo: string }> = {};

async function getQuadrifoglioAmbrosianoData(): Promise<{ salterio?: string; volume?: string } | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch("https://www.ilquadrifogliocops.com/vivere-la-chiesa/liturgia/calendario-liturgico/", {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede/2.0.0" },
      next: { revalidate: 3600 },
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const html = await res.text();
    const salterioMatch = html.match(/Liturgia delle Ore:[\s\S]*?([IVXLCDM]+|\d+)\s+settimana\s+del\s+Salterio/i);
    const volumeMatch = html.match(/Volume\s+([IVXLCDM]+|\d+)/i);
    return {
      salterio: salterioMatch ? salterioMatch[1].toUpperCase() : undefined,
      volume: volumeMatch ? `Volume ${volumeMatch[1].toUpperCase()}` : undefined,
    };
  } catch {
    return null;
  }
}

async function getAmbrosianoDayMetadata(dateStr: string) {
  if (ambrosianoMetaCache[dateStr]) return ambrosianoMetaCache[dateStr];

  const catIds = "4041,4044,4047,4045,7357,22737,4051,4049,5414,20537,4042,4048,6462,21704,10047,8463,9385";
  const { after, before } = getDateWindow(dateStr);

  let saint = "";
  let grado = "";
  let temporal = "";

  try {
    const [resMessa, resOre, quadData] = await Promise.all([
      fetch(`https://www.chiesadimilano.it/wp-json/wp/v2/posts?categories=${catIds}&after=${after}&before=${before}&per_page=5`, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede/2.0.0" },
        next: { revalidate: 1800 },
      }),
      fetch(`https://www.chiesadimilano.it/wp-json/wp/v2/giorno_liturgia_ore?after=${after}&before=${before}&per_page=5`, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede/2.0.0" },
        next: { revalidate: 1800 },
      }),
      getQuadrifoglioAmbrosianoData(),
    ]);


    if (resMessa.ok) {
      const items = await resMessa.json();
      const mPost = items.find((p: any) => p.date?.startsWith(dateStr)) || items[0];
      if (mPost) {
        temporal = cleanInfoText(mPost.title?.rendered || "");
        const mSummary = cleanInfoText(mPost.acf?.summary || "");
        if (mSummary) {
          saint = mSummary.replace(/^Memoria\s+(?:facoltativa\s+)?di\s+/i, "");
          grado = mSummary.toLowerCase().includes("facoltativa") ? "memoria facoltativa" : "memoria";
        }
      }
    }

    if (resOre.ok) {
      const items = await resOre.json();
      const oPost = items.find((p: any) => p.date?.startsWith(dateStr)) || items[0];
      if (oPost) {
        const oTitle = cleanInfoText(oPost.title?.rendered || "");
        const oSummary = cleanInfoText(oPost.acf?.summary || "");
        if (oTitle && !oTitle.toLowerCase().includes("liturgia delle ore")) {
          saint = oTitle;
        }
        if (oSummary) {
          grado = oSummary;
        }
      }
    }

    if (quadData?.salterio && temporal && !temporal.toLowerCase().includes("salterio")) {
      temporal = `${temporal} · settimana ${quadData.salterio} del salterio`;
    }
  } catch (err) {
    console.warn("Errore getAmbrosianoDayMetadata:", err);
  }



  const colore = getAmbrosianColor(saint, grado, temporal);
  let liturgicalInfo = "";
  if (saint) {
    liturgicalInfo = `${saint}${grado ? ` · ${grado}` : ""} (colore: ${colore}) - Rito Ambrosiano`;
  } else if (temporal) {
    liturgicalInfo = `${temporal} (colore: ${colore}) - Rito Ambrosiano`;
  } else {
    liturgicalInfo = "Rito Ambrosiano (Diocesi di Milano)";
  }

  const result = { saint, grado, colore, temporal, liturgicalInfo };
  ambrosianoMetaCache[dateStr] = result;
  return result;
}

/**
 * Recupera le Letture della Santa Messa Ambrosiana (da REST API o da calendario per date future)
 */
async function fetchAmbrosianoMessaFromChiesaDiMilano(dateStr: string) {
  const meta = await getAmbrosianoDayMetadata(dateStr);

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
        const contentHtml = matchedPost.content?.rendered || "";
        if (contentHtml && contentHtml.length > 50) {
          return {
            liturgicalInfo: meta.liturgicalInfo,
            temporalInfo: meta.temporal,
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
          liturgicalInfo: (meta.saint || meta.temporal) ? meta.liturgicalInfo : extracted.liturgicalInfo,
          temporalInfo: meta.temporal || extracted.temporalInfo || extracted.title,
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
    temporalInfo: "",
    contentHtml: sanitizeHtml(content),
  };
}

/**
 * Recupera la Liturgia delle Ore Ambrosiana (da REST API o da calendario per date future)
 */
async function fetchAmbrosianoFromChiesaDiMilano(dateStr: string, moment: string) {
  const meta = await getAmbrosianoDayMetadata(dateStr);

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

        let contentHtml = "";
        if (moment === "ufficio") contentHtml = matchedPost.acf?.udl || "";
        else if (moment === "lodi") contentHtml = matchedPost.acf?.lm || "";
        else if (moment === "ora_media") contentHtml = matchedPost.acf?.om || "";
        else if (moment === "vespri") contentHtml = matchedPost.acf?.vespri || "";
        else if (moment === "compieta") contentHtml = matchedPost.acf?.compieta || "";

        if (contentHtml && contentHtml.length > 50) {
          return {
            liturgicalInfo: meta.liturgicalInfo,
            temporalInfo: meta.temporal,
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
          liturgicalInfo: (meta.saint || meta.temporal) ? meta.liturgicalInfo : extracted.liturgicalInfo,
          temporalInfo: meta.temporal || extracted.temporalInfo || extracted.title,
          contentHtml: sanitizeHtml(extracted.contentHtml),
        };
      }
    }

  }

  throw new Error(`Nessun testo per ${moment} del Rito Ambrosiano trovato su chiesadimilano.it`);
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
  let saint = "";
  let grado = "";
  let colore = "";

  const saintMatch = rawHtml.match(/Scheda Agiografica:\s*<b>(?:<a[^>]*>)?([^<]+)/i);
  if (saintMatch) saint = saintMatch[1].trim();

  const gradoMatch = rawHtml.match(/Grado della Celebrazione:\s*<b>([^<]+)<\/b>/i);
  if (gradoMatch) grado = gradoMatch[1].trim();

  const coloreMatch = rawHtml.match(/Colore liturgico:\s*<b>([^<]+)<\/b>/i);
  if (coloreMatch) colore = coloreMatch[1].trim();

  let liturgicalInfo = "Rito Romano Ufficiale";
  if (saint) {
    liturgicalInfo = `${saint}${grado ? ` · ${grado}` : ""}${colore ? ` (colore: ${colore.toLowerCase()})` : ""} - Rito Romano`;
  } else if (grado) {
    liturgicalInfo = `${grado}${colore ? ` (colore: ${colore.toLowerCase()})` : ""} - Rito Romano`;
  } else {
    const titleMatch = rawHtml.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      liturgicalInfo = titleMatch[1].replace(/^LaChiesa:\s*/i, "").trim() + " - Rito Romano";
    }
  }



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
 * Recupera la Liturgia delle Ore in Rito Romano da ChiesaCattolica.it (Fonte Ufficiale CEI)
 * Fornisce testi rigorosamente suddivisi per ogni ora (Invitatorio, Lodi, Ora Media, Vespri, Compieta, Ufficio)
 */
async function fetchRomanoHoursFromCei(isoDate: string, moment: string) {
  const ceiOraMap: Record<string, string> = {
    invitatorio: "invitatorio",
    lodi: "lodi-mattutine",
    ora_media: "ora-media",
    vespri: "vespri",
    compieta: "compieta",
    ufficio: "ufficio-delle-letture",
  };

  const ceiOra = ceiOraMap[moment];
  if (!ceiOra) return null;

  const cleanDate = isoDate.replace(/-/g, "");
  const url = `https://www.chiesacattolica.it/la-liturgia-delle-ore/?data-liturgia=${cleanDate}&ora=${ceiOra}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede/2.0",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(15000), // 15s timeout
  });


  if (!res.ok) {
    throw new Error(`Errore HTTP ${res.status} da chiesacattolica.it`);
  }

  const html = await res.text();
  const articleMatch = html.match(/<article[^>]*class=["'][^"']*seed-post[^"']*["'][^>]*>([\s\S]*?)<\/article>/i);
  if (!articleMatch) {
    throw new Error("Contenuto liturgico non trovato in chiesacattolica.it");
  }

  let textHtml = articleMatch[1]
    .replace(/<div[^>]*class=["'][^"']*share-container[^"']*["'][\s\S]*$/i, "")
    .replace(/<div[^>]*class=["'][^"']*fontsizehandler[^"']*["'][\s\S]*?<\/div>/gi, "")
    .trim();

  // Estrazione metadati (Santo e colore liturgico)
  let celebrationTitle = "";
  const colorClassMatch = html.match(/cci_main_header_colore_([a-z]+)/i);
  const colore = colorClassMatch ? colorClassMatch[1].trim() : "";

  const saintMatch = html.match(/class=["']cci-link-santo-del-giorno-header["'][^>]*title=["']([^"']+)["']/i);
  const gradoMatch = html.match(/data-titololiturgialabel=["']([^"']+)["']/i);

  if (saintMatch) {
    celebrationTitle = `${saintMatch[1]}${colore ? ` (colore: ${colore})` : ""} - Rito Romano`;
  } else if (gradoMatch) {
    const cleanLabel = gradoMatch[1].replace(/-/g, " ");
    celebrationTitle = `${cleanLabel}${colore ? ` (colore: ${colore})` : ""} - Rito Romano`;
  } else {
    celebrationTitle = await fetchRomanoCelebrationTitle(isoDate);
  }

  return {
    contentHtml: sanitizeHtml(textHtml),
    liturgicalInfo: celebrationTitle,
  };
}

const cachedRomanoCelebrations: Record<string, string> = {};

async function fetchRomanoCelebrationTitle(isoDate: string): Promise<string> {

  if (cachedRomanoCelebrations[isoDate]) {
    return cachedRomanoCelebrations[isoDate];
  }
  try {
    const cleanDate = isoDate.replace(/-/g, "");
    const res = await fetch(`https://www.lachiesa.it/calendario/Detailed/${cleanDate}.shtml`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede/1.9.37" },
      next: { revalidate: 86400 },
    });
    if (res.ok) {
      const html = await res.text();
      let saint = "";
      let grado = "";
      let colore = "";

      const saintMatch = html.match(/Scheda Agiografica:\s*<b>(?:<a[^>]*>)?([^<]+)/i);
      if (saintMatch) saint = saintMatch[1].trim();

      const gradoMatch = html.match(/Grado della Celebrazione:\s*<b>([^<]+)<\/b>/i);
      if (gradoMatch) grado = gradoMatch[1].trim();

      const coloreMatch = html.match(/Colore liturgico:\s*<b>([^<]+)<\/b>/i);
      if (coloreMatch) colore = coloreMatch[1].trim();

      if (saint) {
        const title = `${saint}${grado ? ` · ${grado}` : ""}${colore ? ` (colore: ${colore.toLowerCase()})` : ""} - Rito Romano`;
        cachedRomanoCelebrations[isoDate] = title;
        return title;
      } else if (grado) {
        const title = `${grado}${colore ? ` (colore: ${colore.toLowerCase()})` : ""} - Rito Romano`;
        cachedRomanoCelebrations[isoDate] = title;
        return title;
      }

    }
  } catch (err) {
    console.warn("Errore recupero santo del giorno da LaChiesa:", err);
  }
  return "Rito Romano Ufficiale (CEI)";
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
              temporalInfo: cdmMessaData.temporalInfo,
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
              temporalInfo: "",
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
            temporalInfo: cdmData.temporalInfo,
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
      const lang = searchParams.get("lang") || "it";

      // Per la Santa Messa in Rito Romano in italiano: usa LaChiesa.it per qualsiasi data
      if (moment === "messa" && lang === "it") {
        try {
          const lachiesaData = await fetchRomanoMessaFromLaChiesa(isoDate);
          return NextResponse.json(
            {
              rite: "romano",
              moment: "messa",
              date: isoDate,
              lang: "it",
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

      // Per la Liturgia delle Ore in Rito Romano in italiano: usa ChiesaCattolica.it (Ufficiale CEI con suddivisione separata di Invitatorio, Lodi, Ora Media, Vespri, Compieta, Ufficio)
      if (lang === "it" && moment !== "messa") {
        try {
          const ceiData = await fetchRomanoHoursFromCei(isoDate, moment);
          if (ceiData && ceiData.contentHtml && ceiData.contentHtml.length > 50) {
            return NextResponse.json(
              {
                rite: "romano",
                moment,
                date: isoDate,
                lang: "it",
                liturgicalInfo: ceiData.liturgicalInfo,
                contentHtml: ceiData.contentHtml,
                source: "chiesacattolica.it (Ufficiale CEI)",
              },
              {
                headers: {
                  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
                },
              }
            );
          }
        } catch (ceiErr) {
          console.warn("Fallback su iBreviary per Liturgia delle Ore in Rito Romano:", ceiErr);
        }
      }

      // Liturgia delle Ore o Multilingua via fallback iBreviary
      let url = "";
      if (moment === "messa") {
        url = `https://www.ibreviary.com/m2/letture.php?s=letture&lang=${lang}`;
      } else {
        let s = "lodi";
        if (moment === "invitatorio" || moment === "lodi") s = "lodi";
        else if (moment === "ufficio") s = "ufficio_delle_letture";
        else if (moment === "ora_media") s = "ora_media";
        else if (moment === "vespri") s = "vespri";
        else if (moment === "compieta") s = "compieta";

        url = `https://www.ibreviary.com/m2/breviario.php?lang=${lang}&s=${s}`;
      }


      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede/1.9.28",
          Cookie: `language=${lang};`,
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
      const celebrationTitle = await fetchRomanoCelebrationTitle(isoDate);


      return NextResponse.json(
        {
          rite: "romano",
          moment,
          date: isoDate,
          liturgicalInfo: celebrationTitle,
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
