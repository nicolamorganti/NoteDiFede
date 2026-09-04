import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/env";
import { generateUnsubscribeToken } from "@/lib/unsubscribe-token";

export type LiturgyRite = "ambrosiano" | "romano";


export interface DailyGospelData {
  title: string;
  riassunto: string;
  colore: string;
  dateStr: string;
  rite: LiturgyRite;
  gospelCitation: string;
  gospelText: string;
  fullContentHtml?: string;
}

export interface DailyWordResult {
  gospel: DailyGospelData;
  reflection: string;
  usedModel: string;
}

/**
 * Ottiene la data corrente nel fuso orario italiano (Europe/Rome) in formato YYYY-MM-DD
 */
export function getItalianDateString(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Formatta la data in italiano (es. "Domenica 30 Agosto 2026")
 */
export function formatItalianDateLong(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat("it-IT", {
    timeZone: "Europe/Rome",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(dateObj);
}

/**
 * Calcola le informazioni temporali del ciclo settimanale della Domenica:
 * - Dal Lunedì mattina (00:00) alla Domenica (23:59), la domenica target è la domenica di questa settimana.
 * - Durante la Domenica dopo le 06:00, isSundayPast6AM è true (la newsletter è già stata inviata).
 * - Il Lunedì alle 00:00 il ciclo avanza automaticamente alla Domenica successiva (+6 giorni).
 */
export function getSundayCycleInfo(inputDate = new Date()): {
  currentDateIso: string;
  currentHour: number;
  isSundayToday: boolean;
  isSundayPast6AM: boolean;
  targetSundayIso: string;
  targetSundayLabel: string;
} {
  const romeFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  });

  const parts = romeFormatter.formatToParts(inputDate);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  const currentDateIso = `${partMap.year}-${partMap.month}-${partMap.day}`;
  const currentHour = parseInt(partMap.hour || "0", 10);

  const [y, m, d] = currentDateIso.split("-").map(Number);
  const localDate = new Date(y, m - 1, d);
  const dayOfWeek = localDate.getDay(); // 0 = Domenica, 1 = Lunedì, ..., 6 = Sabato

  let daysUntilSunday = 0;
  let isSundayToday = false;

  if (dayOfWeek === 0) {
    isSundayToday = true;
    daysUntilSunday = 0;
  } else {
    daysUntilSunday = 7 - dayOfWeek;
  }

  const targetSundayDate = new Date(localDate);
  targetSundayDate.setDate(targetSundayDate.getDate() + daysUntilSunday);

  const tYear = targetSundayDate.getFullYear();
  const tMonth = String(targetSundayDate.getMonth() + 1).padStart(2, "0");
  const tDay = String(targetSundayDate.getDate()).padStart(2, "0");
  const targetSundayIso = `${tYear}-${tMonth}-${tDay}`;
  const targetSundayLabel = formatItalianDateLong(targetSundayIso);

  return {
    currentDateIso,
    currentHour,
    isSundayToday,
    isSundayPast6AM: isSundayToday && currentHour >= 6,
    targetSundayIso,
    targetSundayLabel,
  };
}

export const DEFAULT_SUNDAY_PROMPT_TEMPLATE = `Sei una guida spirituale e biblista dal tratto essenziale, disadorno e penetrante, nello stile autentico del Cardinale Carlo Maria Martini.

Vangelo di questa Domenica ({gospelTitle} - {gospelCitation}):
"""
{gospelText}
"""

Compito:
Scrivi una meditazione spirituale ed esistenziale sulla Parola di questa Domenica per la comunità di fedeli e coristi.
Estrai la postura interiore e l'atteggiamento concreto che questo Vangelo richiede nella vita quotidiana della settimana che inizia.

ISTRUZIONI PER EVITARE LA RIPETITIVITÀ:
1. RADICAMENTO NEL TESTO: Individua un verbo, un gesto o una parola precisa di Gesù in questo racconto e fanne la chiave della riflessione.
2. ATTUALITÀ ESISTENZIALE: Collega il brano alle fatiche, alle speranze e alle relazioni concrete delle persone (nella vita familiare, nel lavoro, nella comunità parrocchiale o nelle decisioni personali).
3. STILE: Sobrio, profondo, senza retorica o formule devozionali stanche (evita frasi fatte come "in un mondo frenetico", "accogliere con dolcezza", "Gesù ci invita oggi a...").
4. LUNGHEZZA: tra 100 e 160 parole, con frasi incisive e ritmo meditativo.
5. Concludi SEMPRE con una frase compiuta e punto fermo finale. Niente titoli markdown.`;

/**
 * Estrae il Vangelo del giorno dalla liturgia della Messa (Rito Ambrosiano o Romano)
 */
export async function fetchDailyGospel(
  dateStr?: string,
  rite: LiturgyRite = "ambrosiano"
): Promise<DailyGospelData> {
  const targetDate = dateStr || getItalianDateString();

  if (rite === "romano") {
    return fetchRomanGospel(targetDate);
  } else {
    return fetchAmbrosianGospel(targetDate);
  }
}

// Cache in memoria del calendario letture di Chiesa di Milano (aggiornata ogni ora)
let cachedAmbrosianoMessaMap: Record<string, string> | null = null;
let lastAmbrosianoCalendarFetch = 0;

async function getAmbrosianoCalendarMap(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cachedAmbrosianoMessaMap && now - lastAmbrosianoCalendarFetch < 3600000) {
    return cachedAmbrosianoMessaMap;
  }

  try {
    const res = await fetch("https://www.chiesadimilano.it/letture-rito-ambrosiano", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede-Newsletter/1.0",
      },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(15000),
    });

    if (res.ok) {
      const html = await res.text();
      const messaMap: Record<string, string> = {};
      const messaLinks = [...html.matchAll(/<a\s+[^>]*>/gi)];
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
      cachedAmbrosianoMessaMap = messaMap;
      lastAmbrosianoCalendarFetch = now;
      return messaMap;
    }
  } catch (err) {
    console.warn("Errore getAmbrosianoCalendarMap:", err);
  }

  return cachedAmbrosianoMessaMap || {};
}

/**
 * Estrazione Vangelo Rito Ambrosiano (da calendario ufficiale di chiesadimilano.it, REST API e fallback)
 */
async function fetchAmbrosianGospel(targetDate: string): Promise<DailyGospelData> {
  // 1. Prova tramite la pagina del calendario ufficiale (copre sia oggi sia tutte le domeniche e date future)
  try {
    const messaMap = await getAmbrosianoCalendarMap();
    const directUrl = messaMap[targetDate];
    if (directUrl) {
      const res = await fetch(directUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede-Newsletter/1.0",
          Accept: "text/html,application/xhtml+xml",
        },
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) {
        const html = await res.text();
        const parsed = parseAmbrosianGospelFromHtml(html, "Santa Messa", "Rito Ambrosiano", targetDate);
        if (parsed.gospelText && parsed.gospelText.length > 30) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn("Errore calendario Chiesa di Milano per Vangelo Ambrosiano:", err);
  }

  // 2. Prova tramite la REST API ufficiale di Chiesa di Milano (se pubblicata come post del giorno)
  try {
    const catIds = "4041,4044,4047,4045,7357,22737,4051,4049,5414,20537,4042,4048,6462,21704,10047,8463,9385";
    const d = new Date(targetDate + "T12:00:00Z");
    const prev = new Date(d);
    prev.setDate(prev.getDate() - 1);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);

    const prevStr = prev.toISOString().split("T")[0];
    const nextStr = next.toISOString().split("T")[0];
    const after = `${prevStr}T20:00:00`;
    const before = `${nextStr}T04:00:00`;

    const url = `https://www.chiesadimilano.it/wp-json/wp/v2/posts?categories=${catIds}&after=${after}&before=${before}&per_page=15`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede-Newsletter/1.0",
        Accept: "application/json",
      },
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(15000),
    });

    if (res.ok) {
      const items = await res.json();
      if (Array.isArray(items) && items.length > 0) {
        const matchedPost = items.find((p: any) => p.date?.startsWith(targetDate)) || items[0];
        const contentHtml = matchedPost.content?.rendered || "";
        const title = matchedPost.title?.rendered ? matchedPost.title.rendered.replace(/<[^>]+>/g, "").trim() : "Santa Messa";
        if (contentHtml) {
          const parsed = parseAmbrosianGospelFromHtml(contentHtml, title, "Rito Ambrosiano", targetDate);
          if (parsed.gospelText && parsed.gospelText.length > 30) {
            return parsed;
          }
        }
      }
    }
  } catch (err) {
    console.warn("Errore REST API Chiesa di Milano per Vangelo Ambrosiano:", err);
  }

  // 3. Fallback su iBreviary Messa Ambrosiana (se data odierna)
  if (targetDate === getItalianDateString()) {
    try {
      const url = "https://www.ibreviary.com/m2/messale.php?r=AMB";
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede-Newsletter/1.0",
        },
        next: { revalidate: 1800 },
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) {
        const html = await res.text();
        const parsed = parseAmbrosianGospelFromHtml(html, "Santa Messa", "Rito Ambrosiano", targetDate);
        if (parsed.gospelText && parsed.gospelText.length > 30) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn("Errore fallback iBreviary per Vangelo Ambrosiano:", err);
    }
  }

  return {
    title: "Liturgia del Giorno",
    riassunto: "Rito Ambrosiano",
    colore: "verde",
    dateStr: targetDate,
    rite: "ambrosiano",
    gospelCitation: "Vangelo del Giorno",
    gospelText: "In quel tempo, Gesù disse ai suoi discepoli: «Amatevi gli uni gli altri come io ho amato voi. Da questo tutti sapranno che siete miei discepoli: se avete amore gli uni per gli altri».",
  };
}


/**
 * Estrazione Vangelo Rito Romano (da lachiesa.it)
 */
async function fetchRomanGospel(targetDate: string): Promise<DailyGospelData> {
  const [y, m, d] = targetDate.split("-");
  const url = `https://www.lachiesa.it/calendario/Detailed/${y}${m}${d}.shtml`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede-Newsletter/1.0" },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(20000), // 20s timeout
    });

    if (res.ok) {
      const rawHtml = await res.text();

      let title = "Santa Messa - Rito Romano";
      let gospelCitation = "Dal Santo Vangelo di oggi";
      let gospelText = "";

      const sundaySectionMatch = rawHtml.match(
        /<div class="section-title">([^<]*(?:DOMENICA|TEMPO|AVVENTO|QUARESIMA|PASQUA|NATALE)[^<]*)<\/div>/i
      );
      const saintMatch = rawHtml.match(/Scheda Agiografica:\s*<b>(?:<a[^>]*>)?([^<]+)/i);
      const gradoMatch = rawHtml.match(/Grado della Celebrazione:\s*<b>([^<]+)<\/b>/i);

      if (sundaySectionMatch && sundaySectionMatch[1].trim()) {
        title = sundaySectionMatch[1].trim();
      } else if (saintMatch) {
        title = saintMatch[1].trim();
      } else if (gradoMatch) {
        title = gradoMatch[1].trim();
      }

      const sectionMatches = [
        ...rawHtml.matchAll(
          /<div class="section">([\s\S]*?)<\/div>\s*(?=<div class="section"|<div id="footer"|<footer|$)/gi
        ),
      ];

      for (const m of sectionMatches) {
        const sHtml = m[1];
        if (/id="vangelo"/i.test(sHtml) || /<div class="section-title"[^>]*>Vangelo<\/div>/i.test(sHtml)) {
          const cMatch = sHtml.match(/<div class="section-content">([\s\S]*?)<\/div>\s*$/i) || [null, sHtml];
          const content = cMatch[1] || "";

          const miniMatch = content.match(/<div class="section-content-mini">([\s\S]*?)<\/div>/i);
          let citationPrefix = "";
          if (miniMatch) {
            citationPrefix = miniMatch[1]
              .replace(/<audio[\s\S]*?<\/audio>/gi, "")
              .replace(/<[^>]+>/g, " ")
              .replace(/\s+/g, " ")
              .trim();
          }

          const testoMatch = content.match(/<div class="section-content-testo">([\s\S]*?)<\/div>/i);
          const cleanTesto = (testoMatch ? testoMatch[1] : content)
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
            .replace(/<[^>]+>/g, "\n")
            .replace(/&nbsp;/g, " ")
            .replace(/\r/g, "")
            .replace(/\n\s*\n+/g, "\n")
            .trim();

          const lines = cleanTesto.split("\n").map((l) => l.trim()).filter(Boolean);
          const textLines: string[] = [];

          for (const line of lines) {
            if (/^(?:Dal|Lettura del)\s+Vangelo/i.test(line) && textLines.length === 0) {
              gospelCitation = citationPrefix ? `${citationPrefix} · ${line}` : line;
            } else if (!/^(?:Parola del Signore|Rendo grazie a Dio|Gloria a te, o Cristo|Lode a te, o Cristo)/i.test(line)) {
              textLines.push(line);
            }
          }

          if (citationPrefix && !gospelCitation.includes(citationPrefix)) {
            gospelCitation = `${citationPrefix} · ${gospelCitation}`;
          }

          gospelText = textLines.join("\n\n");
          break;
        }
      }

      if (gospelText && gospelText.length > 30) {
        return {
          title,
          riassunto: "Rito Romano",
          colore: "verde",
          dateStr: targetDate,
          rite: "romano",
          gospelCitation,
          gospelText,
        };
      }
    }
  } catch (err) {
    console.error("Errore recupero Vangelo Rito Romano da lachiesa.it:", err);
  }

  // Fallback API interna o generico
  return {
    title: "Liturgia del Giorno",
    riassunto: "Rito Romano",
    colore: "verde",
    dateStr: targetDate,
    rite: "romano",
    gospelCitation: "Vangelo del Giorno",
    gospelText: "In quel tempo, Gesù disse ai suoi discepoli: «Se qualcuno vuole venire dietro a me, rinneghi se stesso, prenda la sua croce e mi segua».",
  };
}

/**
 * Analizza l'HTML liturgico ambrosiano isolando ESCLUSIVAMENTE il paragrafo e la citazione del Vangelo
 */
function parseAmbrosianGospelFromHtml(
  html: string,
  fallbackTitle: string,
  riassunto: string,
  dateStr: string
): DailyGospelData {
  const titleMatch =
    html.match(/<h1[^>]*class=["']entry-title["'][^>]*>([\s\S]*?)<\/h1>/i) ||
    html.match(/<title>([^<]+)<\/title>/i);
  let title = titleMatch
    ? titleMatch[1].replace(/<[^>]+>/g, "").replace(/ - Chiesa di Milano.*/i, "").trim()
    : fallbackTitle;

  const riassuntoMatch = html.match(/<div class=['"]riassunto['"]>([\s\S]*?)<\/div>/i);
  const cleanRiassunto = riassuntoMatch
    ? riassuntoMatch[1].replace(/<[^>]+>/g, " ").trim()
    : riassunto;

  let gospelCitation = "Dal Santo Vangelo di oggi";
  let gospelText = "";

  // Cerca il punto in cui inizia la sezione VANGELO
  const vPos = html.search(/<(?:p|h[1-6]|div|strong|b)[^>]*>\s*(?:<strong>)?\s*VANGELO\b/i);

  if (vPos !== -1) {
    const afterV = html.slice(vPos);
    // Cerca la fine della sezione VANGELO
    const endPos = afterV.search(
      /<(?:p|h[1-6]|div)[^>]*>\s*(?:<strong>)?\s*(?:DOPO IL VANGELO|A CONCLUSIONE|SUI DONI|ALLA COMUNIONE|PREGHIERA DEI FEDELI|PROFESSIONE DI FEDE|DOPO LA COMUNIONE)/i
    );
    let vBlock = endPos !== -1 ? afterV.slice(0, endPos) : afterV.slice(0, 4000);

    // Pulizia audio player, script, stili, commenti
    vBlock = vBlock
      .replace(/<audio[\s\S]*?<\/audio>/gi, "")
      .replace(/<!--[\s\S]*?-->/gi, "")
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

    const lines = vBlock
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/h[1-6]>/gi, "\n\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&#8211;/g, "-")
      .replace(/&#8217;/g, "'")
      .replace(/&#8220;/g, "“")
      .replace(/&#8221;/g, "”")
      .replace(/\r/g, "")
      .split("\n")
      .map((l) => l.replace(/[ \t]+/g, " ").trim())
      .filter(Boolean);

    const citationParts: string[] = [];
    const textParts: string[] = [];

    for (const line of lines) {
      if (/^VANGELO\b/i.test(line)) {
        const rest = line.replace(/^VANGELO\s*/i, "").trim();
        if (rest) citationParts.push(rest);
      } else if (/^(?:Lettura(?:\s+del)?|Dal)\s+Vangelo/i.test(line)) {
        citationParts.push(line);
      } else if (
        /^(?:[1-3]?\s*[A-Z][a-z]{1,4}\s*\d+)/i.test(line) &&
        textParts.length === 0
      ) {
        citationParts.push(line);
      } else if (
        !/^(?:Parola del Signore|Rendo grazie a Dio|Gloria a te, o Cristo|Lode a te, o Cristo)/i.test(
          line
        )
      ) {
        textParts.push(line);
      }
    }

    if (citationParts.length > 0) {
      gospelCitation = citationParts.join(" · ");
    }
    gospelText = textParts.join("\n\n");
  }
  return {
    title,
    riassunto: cleanRiassunto,
    colore: "verde",
    dateStr,
    rite: "ambrosiano",
    gospelCitation,
    gospelText:
      gospelText ||
      "In quel tempo, Gesù disse ai suoi discepoli: «Amatevi gli uni gli altri come io ho amato voi».",
  };
}

/**
 * Genera con Gemini la "Postura Cristiana del Giorno" (50-100 parole, rigorosamente compiuta)
 */
export async function generateChristianPosture(
  gospelData: DailyGospelData,
  customPrompt?: string
): Promise<{ reflection: string; usedModel: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY non configurata nelle variabili d'ambiente.");
  }

  let prompt = "";
  if (customPrompt && customPrompt.trim().length > 10) {
    prompt = customPrompt
      .replace(/{gospelTitle}/g, gospelData.title)
      .replace(/{gospelCitation}/g, gospelData.gospelCitation)
      .replace(/{gospelText}/g, gospelData.gospelText);

    if (!prompt.includes(gospelData.gospelText)) {
      prompt = `Vangelo (${gospelData.title} - ${gospelData.gospelCitation}):\n"""\n${gospelData.gospelText}\n"""\n\n${prompt}`;
    }
  } else {
    prompt = `Sei una guida spirituale e biblista dal tratto essenziale, disadorno e penetrante, nello stile autentico del Cardinale Carlo Maria Martini.

Vangelo di oggi (${gospelData.title} - ${gospelData.gospelCitation}):
"""
${gospelData.gospelText}
"""

Compito:
Estrai la "Postura Cristiana per Oggi": un atteggiamento relazionale ed esistenziale concreto, generato ESCLUSIVAMENTE dalla specificità e dal paradosso di questo brano.

ISTRUZIONI PER EVITARE LA RIPETITIVITÀ:
1. RADICAMENTO NEL TESTO: Individua un verbo, un gesto o una parola precisa e caratteristica di Gesù in questo racconto e fanne la chiave della postura di oggi.
2. VARIETÀ DI SITUAZIONI: Non limitarti alla sola pazienza o all'ascolto. A seconda del brano, la postura può essere:
   - Audacia o coraggio di esporsi
   - Saper fare un passo indietro o fare spazio
   - Difendere la verità con mitezza ma senza compromessi
   - Meraviglia e gioia aperta verso la realtà
   - Condivisione materiale o gratuità spiazzante
   - Riposo e custodia del silenzio interiore
3. SCENA CONCRETA: Descrivi una situazione reale della giornata (in ufficio, a tavola, per strada, di fronte a una decisione o a un imprevisto) in cui quel gesto evangelico si incarna oggi.

REGOLE TASSATIVE:
- Niente cliché religiosi o formule ripetitive (VIETATO usare: "trattenere una risposta pungente", "senza fretta", "sguardo di misericordia", "accogliere con dolcezza", "in un mondo frenetico").
- Niente convenevoli o prediche (non iniziare mai con "Oggi il Vangelo ci chiama...", "Gesù ci invita...": entra d'impatto nella postura).
- Lunghezza: tra 60 e 95 parole.
- Concludi SEMPRE con una frase compiuta e punto fermo finale. Niente titoli markdown.`;
  }


  const candidateModels = [
    process.env.GEMINI_MODEL,
    "gemini-flash-latest",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
    "gemini-flash-lite-latest",
    "gemini-3.1-flash-lite",
  ].filter(Boolean) as string[];

  let reflection: string | null = null;
  let usedModel = "";
  let lastError = "";

  for (const model of candidateModels) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.68,
            maxOutputTokens: 2048,
            thinkingConfig: {
              thinkingBudget: 0,
            },
          },
        }),

        signal: controller.signal,
      });

      clearTimeout(timeoutId);


      if (res.ok) {
        const data = await res.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text && text.length > 20) {
          text = text
            .replace(/^\*\*.*?\*\*\s*/i, "")
            .replace(/^#+\s*.*?\n/i, "")
            .replace(/^[«"]/, "")
            .replace(/[»"]$/, "")
            .trim();

          reflection = text;
          usedModel = model;
          break;
        }
      } else {
        const errBody = await res.text();
        lastError = `[${model}] HTTP ${res.status}: ${errBody}`;
        console.warn(`Tentativo modello ${model} fallito per newsletter, provo il successivo:`, lastError);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = `[${model}] ${err.message || String(err)}`;
      console.warn(`Eccezione modello ${model} per newsletter:`, lastError);
    }
  }

  if (!reflection) {
    throw new Error(`Impossibile generare la postura cristiana con i modelli Gemini. Dettagli: ${lastError}`);
  }

  return { reflection, usedModel };
}

export interface DailyWordEmailData {
  gospel: DailyGospelData;
  reflection: string;
  usedModel?: string;
  customTitle?: string;
  authorSignature?: string;
  unsubscribeUrl?: string;
}


/**
 * Converte i markup markdown (es. **grassetto**, *corsivo*) in tag HTML adatti ai client email
 */
export function formatMarkdownToEmailHtml(text: string): string {
  if (!text) return "";
  let clean = text.trim();
  // Rimuovi eventuali caporali/virgolette già presenti agli estremi per non duplicarle
  clean = clean.replace(/^«\s*/, "").replace(/\s*»$/, "");
  // Converti **grassetto** in tag <strong> con stile solido e colore caldo in risalto
  clean = clean.replace(
    /\*\*(.*?)\*\*/g,
    '<strong style="font-weight: 700; font-style: normal; color: #78350f;">$1</strong>'
  );
  // Converti *corsivo*
  clean = clean.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  return clean;
}

/**
 * Genera l'HTML dell'email "La Parola del Giorno" con layout liturgico raffinato
 */
export function buildDailyWordEmailHtml(data: DailyWordEmailData): string {
  const { gospel, reflection, unsubscribeUrl, customTitle, authorSignature } = data;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://note-di-fede.vercel.app";
  const dateFormatted = formatItalianDateLong(gospel.dateStr);
  const riteLabel = gospel.rite === "romano" ? "Rito Romano" : "Rito Ambrosiano";
  const formattedReflection = formatMarkdownToEmailHtml(reflection);

  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>La Parola del Giorno · Note di Fede</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f3ec; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2d261e; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f7f3ec; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Contenitore Principale -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #fffdfa; border-radius: 20px; border: 1px solid #e5dbcb; box-shadow: 0 10px 25px rgba(92, 74, 55, 0.06); overflow: hidden;">
          
          <!-- Testata / Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #443729 0%, #2f251a 100%); padding: 32px 24px; text-align: center;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <span style="font-size: 28px; display: inline-block; margin-bottom: 6px;">🕊️</span>
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #f59e0b; margin-bottom: 4px;">
                      Note di Fede · La Parola del Giorno (${riteLabel})
                    </div>
                    <h1 style="margin: 0; font-family: Georgia, serif; font-size: 24px; font-weight: normal; color: #ffffff; line-height: 1.3;">
                      ${gospel.title}
                    </h1>
                    <div style="font-size: 12px; color: #d6cbbe; margin-top: 8px; text-transform: capitalize;">
                      ${dateFormatted}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 1. Il Vangelo del Giorno / della Domenica -->
          <tr>
            <td style="padding: 24px 24px 16px 24px;">
              <div style="margin-bottom: 12px;">
                <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #aa9576;">
                  📖 Il Vangelo del Giorno
                </span>
                <div style="font-size: 14px; font-weight: 700; font-family: Georgia, serif; color: #6b21a8; margin-top: 2px;">
                  ${gospel.gospelCitation}
                </div>
              </div>
              <div style="font-family: Georgia, serif; font-size: 15px; line-height: 1.7; color: #2c251e; background-color: #ffffff; border: 1px solid #f0e7dc; border-radius: 14px; padding: 20px; text-align: justify;">
                ${gospel.gospelText.split("\n").filter(Boolean).map(p => `<p style="margin: 0 0 12px 0;">${p}</p>`).join("")}
              </div>
            </td>
          </tr>

          <!-- 2. Commento al Vangelo e 3. Firma -->
          <tr>
            <td style="padding: 12px 24px 28px 24px;">
              <div style="background-color: #fcf9f2; border: 1px solid #ebdcc8; border-left: 5px solid #d97706; border-radius: 14px; padding: 20px 22px; box-shadow: 0 2px 8px rgba(217, 119, 6, 0.05);">
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                  <span style="font-size: 14px; font-weight: 700; font-family: Georgia, serif; color: #92400e; letter-spacing: 0.5px;">
                    ${customTitle || "✨ Commento al Vangelo"}
                  </span>
                </div>
                <p style="margin: 0; font-family: Georgia, serif; font-size: 15px; line-height: 1.65; color: #3f2f1f; font-style: italic;">
                  «${formattedReflection}»
                </p>
                ${
                  authorSignature
                    ? `
                <div style="margin-top: 16px; padding-top: 12px; border-top: 1px dashed #ebdcc8; text-align: right;">
                  <span style="font-family: Georgia, serif; font-size: 13px; font-style: italic; color: #7c644d; font-weight: 700; letter-spacing: 0.3px;">
                    — ${authorSignature}
                  </span>
                </div>`
                    : ""
                }
              </div>
            </td>
          </tr>

          <!-- Pulsante Call to Action -->
          <tr>
            <td align="center" style="padding: 0 24px 32px 24px;">
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 12px; background-color: #5c4a37;">
                    <a href="${siteUrl}/liturgia" target="_blank" style="font-size: 13px; font-weight: 700; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; display: inline-block; letter-spacing: 0.5px;">
                      Apri Liturgia e Audio su Note di Fede ↗
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f4eee4; border-top: 1px solid #e8decb; padding: 20px 24px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #8a7863; line-height: 1.5;">
                Ricevi questa email perché sei iscritto alla comunità di <strong>Note di Fede</strong>.
                ${unsubscribeUrl ? `<br /><a href="${unsubscribeUrl}" target="_blank" style="color: #8a7863; text-decoration: underline; font-size: 10px; display: inline-block; margin-top: 6px;">Disiscriviti con un clic da questa newsletter</a>` : ""}
              </p>
              <p style="margin: 0; font-size: 10px; color: #aa9781;">
                Note di Fede · Archivio Musica Liturgica, Liturgia delle Ore e Sacra Scrittura
              </p>
            </td>
          </tr>


        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Invia un'email o un lotto di email via Resend
 */
async function sendResendChunk(
  resendApiKey: string,
  recipients: string[],
  subject: string,
  html: string,
  isTest: boolean
) {
  const batchSize = 40;
  let count = 0;

  const fromAddress = process.env.RESEND_FROM_EMAIL || "Note di Fede <onboarding@resend.dev>";

  for (let i = 0; i < recipients.length; i += batchSize) {
    const chunk = recipients.slice(i, i + batchSize);
    
    if (isTest) {
      const payload = {
        from: fromAddress,
        to: chunk,
        subject: `[TEST] ${subject}`,
        html,
      };

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
          "User-Agent": "NoteDiFede-Newsletter/1.0",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20000), // 20s timeout
      });


      if (!res.ok) {
        const errText = await res.text();
        console.error("Errore invio Resend test:", errText);
        throw new Error(`Errore Resend: ${errText}`);
      }
    } else {
      // Invio in produzione tramite Batch API ufficiale di Resend (ogni utente riceve una mail diretta)
      const batchPayload = chunk.map((email) => ({
        from: fromAddress,
        to: [email],
        subject,
        html,
      }));

      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
          "User-Agent": "NoteDiFede-Newsletter/1.0",
        },
        body: JSON.stringify(batchPayload),
        signal: AbortSignal.timeout(20000), // 20s timeout
      });


      if (!res.ok) {
        const errText = await res.text();
        console.error("Errore invio Resend batch chunk:", errText);
        throw new Error(`Errore Resend: ${errText}`);
      }
    }

    count += chunk.length;
  }

  return count;
}


async function sendResendBatchPersonalized(
  resendApiKey: string,
  recipients: { id: string; email: string }[],
  subject: string,
  gospel: DailyGospelData,
  reflection: string,
  usedModel: string,
  customTitle?: string,
  authorSignature?: string
) {
  const batchSize = 40;
  let count = 0;
  const fromAddress = process.env.RESEND_FROM_EMAIL || "Note di Fede <onboarding@resend.dev>";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://note-di-fede.vercel.app";

  for (let i = 0; i < recipients.length; i += batchSize) {
    const chunk = recipients.slice(i, i + batchSize);

    const batchPayload = chunk.map((u) => {
      const token = generateUnsubscribeToken(u.id);
      const unsubscribeUrl = `${siteUrl}/newsletter/disiscrizione?id=${u.id}&token=${token}`;
      const html = buildDailyWordEmailHtml({ gospel, reflection, usedModel, unsubscribeUrl, customTitle, authorSignature });

      return {
        from: fromAddress,
        to: [u.email],
        subject,
        html,
      };
    });

    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
        "User-Agent": "NoteDiFede-Newsletter/1.0",
      },
      body: JSON.stringify(batchPayload),
      signal: AbortSignal.timeout(20000), // 20s timeout
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Errore invio Resend batch chunk:", errText);
      throw new Error(`Errore Resend: ${errText}`);
    }

    count += chunk.length;
  }

  return count;
}

/**
 * Esegue la pipeline completa di generazione e invio della newsletter (Ambrosiano e Romano)
 */
export async function sendDailyWordNewsletter(options?: {
  testEmail?: string;
  rite?: LiturgyRite;
  dateStr?: string;
  customReflection?: string;
  customTitle?: string;
  authorSignature?: string;
}): Promise<{
  success: boolean;
  recipientsCount: number;
  reflection: string;
  gospel: DailyGospelData;
  usedModel: string;
  error?: string;
}> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return {
      success: false,
      recipientsCount: 0,
      reflection: "",
      gospel: {} as any,
      usedModel: "",
      error: "RESEND_API_KEY non configurata nelle variabili d'ambiente.",
    };
  }

  try {
    // CASO 1: Test Personale singolo per un rito specifico
    if (options?.testEmail) {
      const selectedRite = options.rite || "ambrosiano";
      const gospel = await fetchDailyGospel(options.dateStr, selectedRite);
      let reflection = options.customReflection || "";
      let usedModel = options.customReflection ? "Bozza Domenica Personalizzata" : "";

      if (!reflection) {
        const generated = await generateChristianPosture(gospel);
        reflection = generated.reflection;
        usedModel = generated.usedModel;
      }

      const emailHtml = buildDailyWordEmailHtml({
        gospel,
        reflection,
        usedModel,
        customTitle: options.customTitle,
        authorSignature: options.authorSignature,
      });

      const emailSubject = `🕊️ La Parola del Giorno (${selectedRite === "romano" ? "Rito Romano" : "Rito Ambrosiano"}): ${gospel.title}`;
      await sendResendChunk(resendApiKey, [options.testEmail.trim()], emailSubject, emailHtml, true);

      return {
        success: true,
        recipientsCount: 1,
        reflection,
        gospel,
        usedModel,
      };
    }

    // CASO 2: Esecuzione Cronjob alle 06:00 per TUTTI gli iscritti
    const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
    const supabaseServiceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Recupera la lista di tutti gli utenti Auth
    const { data: usersData, error: usersErr } = await adminClient.auth.admin.listUsers({
      perPage: 1000,
    });

    if (usersErr) {
      throw new Error(`Errore recupero iscritti Auth: ${usersErr.message}`);
    }

    const allUsers = usersData?.users || [];
    if (allUsers.length === 0) {
      return {
        success: false,
        recipientsCount: 0,
        reflection: "",
        gospel: {} as any,
        usedModel: "",
        error: "Nessun iscritto trovato su Supabase.",
      };
    }

    // 2. Recupera preferenze di rito e newsletter_enabled dai profili
    const { data: profilesData } = await adminClient
      .from("profiles")
      .select("id, preferred_rite, newsletter_enabled");

    const profileMap = new Map<string, { preferred_rite?: string; newsletter_enabled?: boolean }>();
    (profilesData || []).forEach((p: any) => {
      if (p.id) {
        profileMap.set(p.id, {
          preferred_rite: p.preferred_rite,
          newsletter_enabled: p.newsletter_enabled,
        });
      }
    });

    // 3. Suddivide i destinatari in Ambrosiano e Romano escludendo chi si è disiscritto
    const ambrosianoRecipients: { id: string; email: string }[] = [];
    const romanoRecipients: { id: string; email: string }[] = [];

    for (const u of allUsers) {
      if (u.email && u.email.includes("@")) {
        const userProf = profileMap.get(u.id);
        
        // Se l'utente ha esplicitamente disabilitato la newsletter, salta
        if (userProf?.newsletter_enabled === false) {
          continue;
        }

        const userRite = userProf?.preferred_rite;
        if (userRite === "romano") {
          romanoRecipients.push({ id: u.id, email: u.email });
        } else {
          ambrosianoRecipients.push({ id: u.id, email: u.email });
        }
      }
    }

    // Controlla se oggi è domenica per verificare se ci sono bozze personalizzate congelate (is_enabled = true)
    let customAmbrosianoDraft: { reflection_text: string; reflection_title: string; author_signature?: string } | null = null;
    let customRomanoDraft: { reflection_text: string; reflection_title: string; author_signature?: string } | null = null;

    const todayDateStr = options?.dateStr || getItalianDateString();
    const cycleInfo = getSundayCycleInfo(new Date(todayDateStr + "T12:00:00Z"));

    if (cycleInfo.isSundayToday && !options?.testEmail) {
      try {
        const { data: drafts } = await adminClient
          .from("sunday_newsletter_drafts")
          .select("rite, reflection_text, reflection_title, author_signature, is_enabled")
          .eq("sunday_date", todayDateStr)
          .eq("is_enabled", true);

        if (drafts && drafts.length > 0) {
          for (const d of drafts as any[]) {
            if (d.rite === "ambrosiano" && d.reflection_text && d.reflection_text.trim().length > 10) {
              customAmbrosianoDraft = {
                reflection_text: d.reflection_text.trim(),
                reflection_title: d.reflection_title || "✨ Commento al Vangelo della Domenica",
                author_signature: d.author_signature || undefined,
              };
            }
            if (d.rite === "romano" && d.reflection_text && d.reflection_text.trim().length > 10) {
              customRomanoDraft = {
                reflection_text: d.reflection_text.trim(),
                reflection_title: d.reflection_title || "✨ Commento al Vangelo della Domenica",
                author_signature: d.author_signature || undefined,
              };
            }
          }
        }
      } catch (draftErr) {
        console.warn("Verifica bozze domenicali su Supabase:", draftErr);
      }
    }

    let totalSent = 0;
    let lastReflection = "";
    let lastGospel: DailyGospelData = {} as any;
    let lastModel = "";

    // 4. Genera e invia Rito Ambrosiano (se ci sono destinatari)
    if (ambrosianoRecipients.length > 0) {
      const ambrosianoGospel = await fetchDailyGospel(options?.dateStr, "ambrosiano");
      let ambReflection = "";
      let ambModel = "";
      let ambTitle: string | undefined = undefined;
      let ambSignature: string | undefined = undefined;

      if (customAmbrosianoDraft) {
        ambReflection = customAmbrosianoDraft.reflection_text;
        ambTitle = customAmbrosianoDraft.reflection_title;
        ambSignature = customAmbrosianoDraft.author_signature;
        ambModel = "Bozza Domenicale Personalizzata";
        console.log("📌 Invio Newsletter Domenicale Ambrosiana PERSONALIZZATA:", ambTitle);
      } else {
        const generated = await generateChristianPosture(ambrosianoGospel);
        ambReflection = generated.reflection;
        ambModel = generated.usedModel;
      }

      const ambSubject = `🕊️ La Parola del Giorno: ${ambrosianoGospel.title}`;

      const sentAmb = await sendResendBatchPersonalized(
        resendApiKey,
        ambrosianoRecipients,
        ambSubject,
        ambrosianoGospel,
        ambReflection,
        ambModel,
        ambTitle,
        ambSignature
      );
      totalSent += sentAmb;

      lastReflection = ambReflection;
      lastGospel = ambrosianoGospel;
      lastModel = ambModel;
    }

    // 5. Genera e invia Rito Romano (se ci sono destinatari con preferenza romana)
    if (romanoRecipients.length > 0) {
      const romanoGospel = await fetchDailyGospel(options?.dateStr, "romano");
      let romReflection = "";
      let romModel = "";
      let romTitle: string | undefined = undefined;
      let romSignature: string | undefined = undefined;

      if (customRomanoDraft) {
        romReflection = customRomanoDraft.reflection_text;
        romTitle = customRomanoDraft.reflection_title;
        romSignature = customRomanoDraft.author_signature;
        romModel = "Bozza Domenicale Personalizzata";
        console.log("📌 Invio Newsletter Domenicale Romana PERSONALIZZATA:", romTitle);
      } else {
        const generated = await generateChristianPosture(romanoGospel);
        romReflection = generated.reflection;
        romModel = generated.usedModel;
      }

      const romSubject = `🕊️ La Parola del Giorno (Rito Romano): ${romanoGospel.title}`;

      const sentRom = await sendResendBatchPersonalized(
        resendApiKey,
        romanoRecipients,
        romSubject,
        romanoGospel,
        romReflection,
        romModel,
        romTitle,
        romSignature
      );
      totalSent += sentRom;

      if (!lastReflection) {
        lastReflection = romReflection;
        lastGospel = romanoGospel;
        lastModel = romModel;
      }
    }

    return {
      success: true,
      recipientsCount: totalSent,
      reflection: lastReflection,
      gospel: lastGospel,
      usedModel: lastModel,
    };

  } catch (err: any) {
    console.error("Errore esecuzione newsletter:", err);
    return {
      success: false,
      recipientsCount: 0,
      reflection: "",
      gospel: {} as any,
      usedModel: "",
      error: err.message || "Errore sconosciuto durante l'elaborazione della newsletter.",
    };
  }
}
