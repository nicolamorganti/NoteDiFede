import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/env";

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

/**
 * Estrazione Vangelo Rito Ambrosiano (da chiesadimilano.it REST API e fallback)
 */
async function fetchAmbrosianGospel(targetDate: string): Promise<DailyGospelData> {
  // 1. Prova tramite la REST API ufficiale di Chiesa di Milano
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
    });

    if (res.ok) {
      const items = await res.json();
      if (Array.isArray(items) && items.length > 0) {
        const matchedPost = items.find((p: any) => p.date?.startsWith(targetDate)) || items[0];
        const contentHtml = matchedPost.content?.rendered || "";
        const title = matchedPost.title?.rendered ? matchedPost.title.rendered.replace(/<[^>]+>/g, "").trim() : "Santa Messa";
        if (contentHtml) {
          const parsed = parseAmbrosianGospelFromHtml(contentHtml, title, "Rito Ambrosiano", targetDate);
          if (parsed.gospelText && parsed.gospelText.length > 20) {
            return parsed;
          }
        }
      }
    }
  } catch (err) {
    console.warn("Errore REST API Chiesa di Milano per Vangelo Ambrosiano:", err);
  }

  // 2. Fallback su iBreviary Messa Ambrosiana
  try {
    const url = "https://www.ibreviary.com/m2/messale.php?r=AMB";
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede-Newsletter/1.0",
      },
      next: { revalidate: 1800 },
    });
    if (res.ok) {
      const html = await res.text();
      const parsed = parseAmbrosianGospelFromHtml(html, "Santa Messa", "Rito Ambrosiano", targetDate);
      if (parsed.gospelText && parsed.gospelText.length > 20) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Errore fallback iBreviary per Vangelo Ambrosiano:", err);
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
    });

    if (res.ok) {
      const rawHtml = await res.text();

      let title = "Santa Messa - Rito Romano";
      let gospelCitation = "Dal Santo Vangelo di oggi";
      let gospelText = "";

      const saintMatch = rawHtml.match(/Scheda Agiografica:\s*<b>(?:<a[^>]*>)?([^<]+)/i);
      const gradoMatch = rawHtml.match(/Grado della Celebrazione:\s*<b>([^<]+)<\/b>/i);
      if (saintMatch) title = saintMatch[1].trim();
      else if (gradoMatch) title = gradoMatch[1].trim();

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
function parseAmbrosianGospelFromHtml(html: string, fallbackTitle: string, riassunto: string, dateStr: string): DailyGospelData {
  let block = "";

  // 1. Cerca il blocco intitolato VANGELO come intestazione/sezione distinta
  const headingMatch = html.match(
    /(?:<h[1-6][^>]*>\s*<strong>\s*VANGELO\b|<strong>\s*VANGELO\b\s*<\/strong>|<p>\s*<strong>\s*VANGELO\b)([\s\S]*?)(?:<!--|<audio|<div class=['"]audio|DOPO IL VANGELO|A CONCLUSIONE|SUI DONI|ALLA COMUNIONE|PREGHIERA DEI FEDELI|PROFESSIONE DI FEDE|DOPO LA COMUNIONE|<\/article>)/i
  );

  if (headingMatch && headingMatch[1]) {
    block = headingMatch[1];
  } else {
    // Fallback: cerca <strong>VANGELO</strong> fino a tag successivo
    const fallbackMatch = html.match(
      /<strong>\s*VANGELO\s*<\/strong>([\s\S]*?)(?:<!--|<audio|DOPO IL VANGELO|SUI DONI)/i
    );
    if (fallbackMatch && fallbackMatch[1]) {
      block = fallbackMatch[1];
    }
  }

  let gospelCitation = "Dal Santo Vangelo di oggi";
  let gospelText = "";

  if (block) {
    const cleanBlock = block
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<[^>]+>/g, "\n")
      .replace(/&nbsp;/g, " ")
      .replace(/\r/g, "")
      .replace(/\n\s*\n+/g, "\n")
      .trim();

    const lines = cleanBlock.split("\n").map((l) => l.trim()).filter(Boolean);
    const citationLines: string[] = [];
    const textLines: string[] = [];

    for (const line of lines) {
      if (
        /^(?:[1-3]?\s*[A-Z][a-z]{1,4}\s*\d+|(?:Dal|Lettura del)\s+Vangelo)/i.test(line) &&
        textLines.length === 0
      ) {
        citationLines.push(line);
      } else if (
        !/^(?:Parola del Signore|Rendo grazie a Dio|Gloria a te, o Cristo|Lode a te, o Cristo)/i.test(line)
      ) {
        textLines.push(line);
      }
    }

    if (citationLines.length > 0) {
      gospelCitation = citationLines.join(" · ");
    }
    gospelText = textLines.join("\n\n");
  }

  const titleMatch = html.match(/<h1[^>]*class=["']entry-title["'][^>]*>([\s\S]*?)<\/h1>/i);
  const cleanTitle = titleMatch
    ? titleMatch[1].replace(/<[^>]+>/g, "").replace(/ - Chiesa di Milano.*/i, "").trim()
    : fallbackTitle;


  return {
    title: cleanTitle,
    riassunto,
    colore: "verde",
    dateStr,
    rite: "ambrosiano",
    gospelCitation,
    gospelText: gospelText || "In quel tempo Gesù parlava alle folle del Regno di Dio.",
  };
}

/**
 * Genera con Gemini la "Postura Cristiana del Giorno" (50-100 parole, rigorosamente compiuta)
 */
export async function generateChristianPosture(gospelData: DailyGospelData): Promise<{ reflection: string; usedModel: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY non configurata nelle variabili d'ambiente.");
  }

  const prompt = `Sei una guida spirituale e biblista dal tratto essenziale, limpido e profondamente concreto, nello stile autentico del Cardinale Carlo Maria Martini.

Leggi questo brano del Santo Vangelo di oggi (${gospelData.title} - ${gospelData.gospelCitation}):
"""
${gospelData.gospelText}
"""

Compito:
Scrivi la "Postura Cristiana per Oggi", trasformando il Vangelo in indicazioni pratiche per le nostre relazioni quotidiane con il prossimo (a casa, al lavoro, con chi incontriamo oggi):
- COME guardare oggi le persone accanto a noi: quale sguardo avere verso chi è stanco, fastidioso o in difficoltà?
- GESTI E PAROLE CONCRETE: quale atteggiamento pratico assumere? (es. ascoltare senza fretta, non giudicare, trattenere una risposta pungente, accogliere un'interruzione, farsi carico con dolcezza di un bisogno nascosto).
- Lunghezza: tra 50 e 90 parole (massimo 90 parole).

REGOLE TASSATIVE:
1. Concludi SEMPRE l'intero pensiero in modo compiuto con un punto fermo finale. NON lasciare mai frasi a metà o troncate.
2. NON inserire titoli markdown (es. NON scrivere "**La Postura Cristiana...**").
3. Niente formule introduttive o convenevoli da pulpito (es. non iniziare con "Oggi Gesù ci invita...", "Cari fratelli..."). Entra immediatamente nel vivo dell'atteggiamento pratico di oggi.`;


  const candidateModels = [
    process.env.GEMINI_MODEL,
    "gemini-3.7-flash",
    "gemini-flash-latest",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
    "gemini-3.6-flash",
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
            temperature: 0.65,
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

/**
 * Genera l'HTML dell'email "La Parola del Giorno" con layout liturgico raffinato
 */
export function buildDailyWordEmailHtml(data: DailyWordResult): string {
  const { gospel, reflection } = data;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://note-di-fede.vercel.app";
  const dateFormatted = formatItalianDateLong(gospel.dateStr);
  const riteLabel = gospel.rite === "romano" ? "Rito Romano" : "Rito Ambrosiano";

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

          <!-- Box: Postura Cristiana del Giorno (In evidenza in alto) -->
          <tr>
            <td style="padding: 28px 24px 16px 24px;">
              <div style="background-color: #fcf9f2; border: 1px solid #ebdcc8; border-left: 5px solid #d97706; border-radius: 14px; padding: 18px 20px; box-shadow: 0 2px 8px rgba(217, 119, 6, 0.05);">
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                  <span style="font-size: 14px; font-weight: 700; font-family: Georgia, serif; color: #92400e; letter-spacing: 0.5px;">
                    ✨ La Postura Cristiana per Oggi
                  </span>
                </div>
                <p style="margin: 0; font-family: Georgia, serif; font-size: 15px; line-height: 1.65; color: #3f2f1f; font-style: italic;">
                  «${reflection}»
                </p>
              </div>
            </td>
          </tr>

          <!-- Sezione: Il Vangelo del Giorno -->
          <tr>
            <td style="padding: 16px 24px 28px 24px;">
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
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #8a7863;">
                Ricevi questa email perché sei iscritto alla comunità di <strong>Note di Fede</strong>.
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


/**
 * Esegue la pipeline completa di generazione e invio della newsletter (Ambrosiano e Romano)
 */
export async function sendDailyWordNewsletter(options?: {
  testEmail?: string;
  rite?: LiturgyRite;
  dateStr?: string;
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
      const { reflection, usedModel } = await generateChristianPosture(gospel);
      const emailHtml = buildDailyWordEmailHtml({ gospel, reflection, usedModel });

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

    // 2. Recupera le preferenze di rito dai profili
    const { data: profilesData } = await adminClient
      .from("profiles")
      .select("id, preferred_rite");

    const profileMap = new Map<string, string>();
    (profilesData || []).forEach((p: any) => {
      if (p.id && p.preferred_rite) {
        profileMap.set(p.id, p.preferred_rite);
      }
    });

    // 3. Suddivide i destinatari in Ambrosiano e Romano
    const ambrosianoRecipients: string[] = [];
    const romanoRecipients: string[] = [];

    for (const u of allUsers) {
      if (u.email && u.email.includes("@")) {
        const userRite = profileMap.get(u.id);
        if (userRite === "romano") {
          romanoRecipients.push(u.email);
        } else {
          ambrosianoRecipients.push(u.email);
        }
      }
    }

    let totalSent = 0;
    let lastReflection = "";
    let lastGospel: DailyGospelData = {} as any;
    let lastModel = "";

    // 4. Genera e invia Rito Ambrosiano (se ci sono destinatari)
    if (ambrosianoRecipients.length > 0) {
      const ambrosianoGospel = await fetchDailyGospel(options?.dateStr, "ambrosiano");
      const { reflection: ambReflection, usedModel: ambModel } = await generateChristianPosture(ambrosianoGospel);
      const ambHtml = buildDailyWordEmailHtml({ gospel: ambrosianoGospel, reflection: ambReflection, usedModel: ambModel });

      const ambSubject = `🕊️ La Parola del Giorno: ${ambrosianoGospel.title}`;
      const sentAmb = await sendResendChunk(resendApiKey, ambrosianoRecipients, ambSubject, ambHtml, false);
      totalSent += sentAmb;

      lastReflection = ambReflection;
      lastGospel = ambrosianoGospel;
      lastModel = ambModel;
    }

    // 5. Genera e invia Rito Romano (se ci sono destinatari con preferenza romana)
    if (romanoRecipients.length > 0) {
      const romanoGospel = await fetchDailyGospel(options?.dateStr, "romano");
      const { reflection: romReflection, usedModel: romModel } = await generateChristianPosture(romanoGospel);
      const romHtml = buildDailyWordEmailHtml({ gospel: romanoGospel, reflection: romReflection, usedModel: romModel });

      const romSubject = `🕊️ La Parola del Giorno (Rito Romano): ${romanoGospel.title}`;
      const sentRom = await sendResendChunk(resendApiKey, romanoRecipients, romSubject, romHtml, false);
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
