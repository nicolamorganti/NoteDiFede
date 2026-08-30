import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/env";

export interface DailyGospelData {
  title: string;
  riassunto: string;
  colore: string;
  dateStr: string;
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
 * Formatta la data in italiano (es. "Lunedì 31 Agosto 2026")
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
 * Estrae il Vangelo del giorno dalla liturgia della Messa di rito ambrosiano
 */
export async function fetchDailyGospel(dateStr?: string): Promise<DailyGospelData> {
  const targetDate = dateStr || getItalianDateString();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // 1. Tenta di interrogare l'API interna della liturgia
  try {
    const res = await fetch(`${siteUrl}/api/liturgia?rite=ambrosiano&moment=messa&date=${targetDate}`, {
      headers: { "User-Agent": "NoteDiFede-Newsletter/1.0" },
      next: { revalidate: 1800 },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.contentHtml) {
        const parsed = parseGospelFromHtml(data.contentHtml, data.title || "Santa Messa", data.riassunto || "", targetDate);
        if (parsed.gospelText.length > 30) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn("Chiamata API interna liturgia non riuscita, fallback su scraping diretto:", err);
  }

  // 2. Fallback diretto su chiesadimilano.it
  try {
    const calendarRes = await fetch("https://www.chiesadimilano.it/letture-rito-ambrosiano", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede-Newsletter/1.0" },
      next: { revalidate: 3600 },
    });

    if (calendarRes.ok) {
      const calHtml = await calendarRes.text();
      const [y, m, d] = targetDate.split("-");
      const datePattern = new RegExp(`data-date=["']${y}-${parseInt(m, 10)}-${parseInt(d, 10)}["'][^>]*href=["']([^"']+)["']`, "i");
      const altPattern = new RegExp(`href=["']([^"']+)["'][^>]*data-date=["']${y}-${parseInt(m, 10)}-${parseInt(d, 10)}["']`, "i");
      const match = calHtml.match(datePattern) || calHtml.match(altPattern);

      if (match && match[1]) {
        const pageRes = await fetch(match[1], {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede-Newsletter/1.0" },
        });
        if (pageRes.ok) {
          const pageHtml = await pageRes.text();
          return parseGospelFromHtml(pageHtml, "Santa Messa", "", targetDate);
        }
      }
    }
  } catch (err) {
    console.error("Errore fallback scraping chiesadimilano:", err);
  }

  // Fallback se il recupero remoto non fosse momentaneamente accessibile
  return {
    title: "Liturgia del Giorno",
    riassunto: "Rito Ambrosiano",
    colore: "verde",
    dateStr: targetDate,
    gospelCitation: "Vangelo del Giorno",
    gospelText: "In quel tempo, Gesù disse ai suoi discepoli: «Amatevi gli uni gli altri come io ho amato voi. Da questo tutti sapranno che siete miei discepoli: se avete amore gli uni per gli altri». Amatevi e custodite la Parola della verità.",
  };
}

/**
 * Analizza l'HTML liturgico per isolare citazione e testo del Vangelo
 */
function parseGospelFromHtml(html: string, fallbackTitle: string, riassunto: string, dateStr: string): DailyGospelData {
  const plainText = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/\r/g, "")
    .replace(/\n\s*\n+/g, "\n")
    .trim();

  let gospelCitation = "Dal Vangelo di oggi";
  let gospelText = "";

  // Cerca la sezione del Vangelo
  const vangeloIndex = plainText.search(/(?:VANGELO|Dal Vangelo secondo|Lettura del Vangelo)/i);
  if (vangeloIndex !== -1) {
    const afterVangelo = plainText.slice(vangeloIndex);
    
    // Trova eventuale citazione (es. Dal Vangelo secondo Matteo (Mt 5,1-12))
    const citationMatch = afterVangelo.match(/(?:Dal Vangelo secondo\s+[^\n]+|Lettura del Santo Vangelo\s+[^\n]+)/i);
    if (citationMatch) {
      gospelCitation = citationMatch[0].trim();
    }

    const endSectionIndex = afterVangelo.search(
      /(?:DOPO IL VANGELO|SUI DONI|ALLA COMUNIONE|PREGHIERA DEI FEDELI|PROFESSIONE DI FEDE|DOPO LA COMUNIONE|Parola del Signore|Rendo grazie a Dio)/i
    );

    if (endSectionIndex !== -1 && endSectionIndex > 80) {
      gospelText = afterVangelo.slice(0, endSectionIndex).trim();
    } else {
      gospelText = afterVangelo.slice(0, 1500).trim();
    }
  } else {
    gospelText = plainText.slice(0, 1200).trim();
  }

  // Pulizia finale del testo del Vangelo
  gospelText = gospelText
    .replace(/^VANGELO\s*/i, "")
    .replace(/^Dal Vangelo secondo[^\n]+\n?/i, "")
    .replace(/^Lettura del Santo Vangelo[^\n]+\n?/i, "")
    .replace(/Parola del Signore.*/i, "")
    .trim();

  // Titolo della celebrazione
  const titleMatch = html.match(/<h1[^>]*class=["']entry-title["'][^>]*>([\s\S]*?)<\/h1>/i);
  const cleanTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").replace(/ - Chiesa di Milano.*/i, "").trim() : fallbackTitle;

  return {
    title: cleanTitle,
    riassunto,
    colore: "verde",
    dateStr,
    gospelCitation,
    gospelText: gospelText || "Testo del Vangelo in ascolto.",
    fullContentHtml: html,
  };
}

/**
 * Genera con Gemini la "Postura Cristiana del Giorno" (50-100 parole)
 */
export async function generateChristianPosture(gospelData: DailyGospelData): Promise<{ reflection: string; usedModel: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY non configurata nelle variabili d'ambiente.");
  }

  const prompt = `Sei una guida spirituale dal tratto essenziale, limpido e profondo, nello stile autentico del Cardinale Carlo Maria Martini.

Leggi questo brano del Vangelo di oggi (${gospelData.title} - ${gospelData.gospelCitation}):
"""
${gospelData.gospelText}
"""

Compito:
Scrivi la "Postura Cristiana del Giorno" per chi si sveglia questa mattina:
- Indica con precisione e concretezza COME dobbiamo impostare oggi il nostro pensiero, le nostre scelte e il nostro sguardo verso il prossimo per vivere secondo l'insegnamento di Gesù.
- Lunghezza TASSATIVA: tra 50 e 100 parole (massimo 100 parole). Chi riceve l'email deve poterla leggere e meditare in meno di un minuto.
- Stile: Incisivo, caldo, sobrio, diretto al cuore e alla vita reale della giornata (lavoro, relazioni, pazienza, ascolto, carità).
- NON inserire saluti formali o formule introduttive (es. "Oggi Gesù ci invita...", "Cari amici..."). Entra immediatamente nel vivo del gesto interiore da compiere oggi.`;

  const candidateModels = [
    process.env.GEMINI_MODEL,
    "gemini-3.7-flash",
    "gemini-flash-latest",
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
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text && text.length > 20) {
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
                      Note di Fede · La Parola del Giorno
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

          <!-- Sezione: Il Santo Vangelo di Oggi -->
          <tr>
            <td style="padding: 16px 24px 28px 24px;">
              <div style="margin-bottom: 12px;">
                <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #aa9576;">
                  📖 Dal Santo Vangelo
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
 * Esegue la pipeline completa di generazione e invio della newsletter
 */
export async function sendDailyWordNewsletter(options?: {
  testEmail?: string;
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
    // 1. Estrae Vangelo
    const gospel = await fetchDailyGospel(options?.dateStr);

    // 2. Genera riflessione su postura cristiana con Gemini
    const { reflection, usedModel } = await generateChristianPosture(gospel);

    // 3. Compila Template HTML
    const emailHtml = buildDailyWordEmailHtml({ gospel, reflection, usedModel });

    // 4. Determina i destinatari
    let recipients: string[] = [];

    if (options?.testEmail) {
      recipients = [options.testEmail.trim()];
    } else {
      // Invio massivo a tutti gli utenti registrati su Supabase
      const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
      const supabaseServiceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

      const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: usersData, error: usersErr } = await adminClient.auth.admin.listUsers({
        perPage: 1000,
      });

      if (usersErr) {
        throw new Error(`Errore recupero iscritti: ${usersErr.message}`);
      }

      recipients = (usersData?.users || [])
        .map((u) => u.email)
        .filter((email): email is string => Boolean(email && email.includes("@")));
    }

    if (recipients.length === 0) {
      return {
        success: false,
        recipientsCount: 0,
        reflection,
        gospel,
        usedModel,
        error: "Nessun indirizzo email destinatario valido trovato.",
      };
    }

    // 5. Invio tramite Resend API (singolo o a lotti se destinatari multipli)
    const emailSubject = `🕊️ La Parola del Giorno: ${gospel.title}`;

    // Resend accetta fino a 50 destinatari per chiamata in 'to'/'bcc' o chiamate batch
    const batchSize = 40;
    let sentCount = 0;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const chunk = recipients.slice(i, i + batchSize);

      const payload = options?.testEmail
        ? {
            from: "Note di Fede <onboarding@resend.dev>",
            to: chunk,
            subject: `[TEST] ${emailSubject}`,
            html: emailHtml,
          }
        : {
            from: "Note di Fede <onboarding@resend.dev>",
            to: chunk[0],
            bcc: chunk.length > 1 ? chunk.slice(1) : undefined,
            subject: emailSubject,
            html: emailHtml,
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
        console.error("Errore invio Resend chunk:", errText);
        throw new Error(`Errore Resend: ${errText}`);
      }

      sentCount += chunk.length;
    }

    return {
      success: true,
      recipientsCount: sentCount,
      reflection,
      gospel,
      usedModel,
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
