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

/**
 * Recupera le Letture della Santa Messa Ambrosiana direttamente dalla REST API ufficiale di chiesadimilano.it
 */
async function fetchAmbrosianoMessaFromChiesaDiMilano(dateStr: string) {
  const catIds = "4041,4044,4047,4045,7357,22737,4051,4049,5414,20537,4042,4048,6462,21704,10047,8463,9385";
  const { after, before } = getDateWindow(dateStr);
  const url = `https://www.chiesadimilano.it/wp-json/wp/v2/posts?categories=${catIds}&after=${after}&before=${before}&per_page=15`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede/1.9.5",
      Accept: "application/json",
    },
    next: { revalidate: 1800 },
  });

  if (!res.ok) {
    throw new Error(`Errore HTTP ${res.status} da chiesadimilano.it per la Messa Ambrosiana`);
  }

  const items = await res.json();
  if (!Array.isArray(items) || items.length === 0) {
    // Se la data è futura, chiesadimilano.it pubblica giorno per giorno a mezzanotte
    const todayStr = new Date().toISOString().split("T")[0];
    if (dateStr > todayStr) {
      return {
        liturgicalInfo: "Santa Messa - Rito Ambrosiano (Data futura)",
        contentHtml: `<div class="p-6 rounded-2xl border border-[#e5d7c5] bg-[#faf6f0] text-center space-y-3">
          <p class="font-serif text-base font-bold text-[#5c4a37]">Letture Messa Rito Ambrosiano non ancora pubblicate</p>
          <p class="text-xs text-[#8a755d] max-w-md mx-auto">
            La Diocesi di Milano pubblica le letture ufficiali della Santa Messa giorno per giorno alla mezzanotte. Per questa data futura i testi saranno disponibili il giorno stesso.
          </p>
        </div>`,
      };
    }
    throw new Error("Nessuna lettura della Messa ambrosiana trovata su chiesadimilano.it per questa data");
  }

  // Cerca il post con la data esatta richiesta (tenendo conto del fuso orario)
  const matchedPost = items.find((p: any) => p.date?.startsWith(dateStr)) || items[0];

  const title = cleanInfoText(matchedPost.title?.rendered || "");
  const summary = cleanInfoText(matchedPost.acf?.summary || "");
  const overtitle = cleanInfoText(matchedPost.acf?.overtitle || "");

  let liturgicalInfo = "Santa Messa - Rito Ambrosiano";
  if (title) {
    liturgicalInfo = `${title}${summary ? ` · ${summary}` : ""}${overtitle ? ` (${overtitle})` : ""} - Messa Rito Ambrosiano`;
  }

  const contentHtml = matchedPost.content?.rendered || "";
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
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede/1.9.5",
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
  const { after, before } = getDateWindow(dateStr);
  const url = `https://www.chiesadimilano.it/wp-json/wp/v2/giorno_liturgia_ore?after=${after}&before=${before}&per_page=15`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede/1.9.5",
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

  // Cerca il post corrispondente al giorno richiesto
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
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede/1.9.5",
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
      // 1. GESTIONE SANTA MESSA AMBROSIANA
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
              source: "chiesadimilano.it (Almanacco Letture)",
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

      // 2. GESTIONE LITURGIA DELLE ORE AMBROSIANA (Ufficio, Lodi, Ora Media, Vespri, Compieta)
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
