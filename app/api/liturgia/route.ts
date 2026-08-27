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
    .replace(/<hr\s*\/?>/gi, "<hr class='my-6 border-[#e2d5c4]' />");
}

function cleanInfoText(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatAmbrosianoHtml(raw: string): string {
  let html = raw;

  // Rimuovi tag wrapper <p style="..."> inline sostituendoli con div semantici
  html = html
    .replace(/<p style='[^']*'>/gi, "<div class='liturgia-paragrafo mb-4'>")
    .replace(/<\/p>/gi, "</div>");

  // Normalizza rubriche in rosso
  html = html.replace(
    /<span style=['"]color:\s*#cc0000[^'"]*['"]>([\s\S]*?)<\/span>/gi,
    "<span class='rubrica font-serif italic text-red-700 dark:text-red-400'>$1</span>"
  );

  // Formatta le sezioni liturgiche principali
  const headings = [
    "RITO DELLA LUCE",
    "INNO",
    "NOTIZIA DEL SANTO",
    "SALMODIA",
    "Salmi Laudativi",
    "Salmo diretto",
    "PRIMA ORAZIONE",
    "SECONDA ORAZIONE",
    "TERZA ORAZIONE",
    "CANTICO DI ZACCARIA",
    "CANTICO DELLA BEATA VERGINE",
    "CANTICO DEI TRE GIOVANI",
    "CANTICO",
    "COMMEMORAZIONE DEL BATTESIMO",
    "ACCLAMAZIONI A CRISTO SIGNORE",
    "INTERCESSIONI",
    "INVOCAZIONI",
    "CONCLUSIONE",
    "LETTURA BREVE",
    "RESPONSORIO",
    "Orazione",
  ];

  for (const h of headings) {
    const reg = new RegExp(`<b>\\s*${h}\\s*<\\/b>`, "gi");
    html = html.replace(reg, `<h3 class="sezione-titolo">${h}</h3>`);
  }

  // Formatta titoli di salmi e cantici
  html = html.replace(/<b>\s*(Salmo\s+\d+[^<]*)<\/b>/gi, `<h4 class="salmo-titolo">$1</h4>`);
  html = html.replace(/<b>\s*(Cantico\s+[^<]*)<\/b>/gi, `<h4 class="salmo-titolo">$1</h4>`);

  // Antifone in grassetto/evidenza
  html = html.replace(/<b>\s*(Ant\.\s*\d*)\s*<\/b>/gi, `<span class="antifona-badge">$1</span> `);

  // Padre Nostro
  html = html.replace(/<b>\s*(Padre\s+Nostro\.?)\s*<\/b>/gi, `<h4 class="preghiera-titolo">$1</h4>`);
  
  // Kyrie Eleison
  html = html.replace(
    /<b>\s*(Kyrie\s+eleison,\s*Kyrie\s+eleison,\s*Kyrie\s+eleison\.?)\s*<\/b>/gi,
    `<div class="kyrie-block my-2 font-bold text-stone-800 dark:text-stone-200">$1</div>`
  );

  return html;
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
  const formattedDateItalian = `${day}/${month}/${year}`;

  try {
    if (rite === "ambrosiano") {
      // 1. RITO AMBROSIANO via Google Apps Script Feed
      let scelta = "LODI";
      if (moment === "ufficio") scelta = "UFFICIO";
      else if (moment === "lodi") scelta = "LODI";
      else if (moment === "ora_media") scelta = "ORA MEDIA";
      else if (moment === "vespri") scelta = "VESPRI";
      else if (moment === "compieta") scelta = "COMPIETA";
      else if (moment === "messa") scelta = "LODI";

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

      const formattedHtml = formatAmbrosianoHtml(rawHtml);

      return NextResponse.json({
        rite: "ambrosiano",
        moment,
        date: `${year}-${month}-${day}`,
        liturgicalInfo: infoText,
        contentHtml: formattedHtml,
      }, {
        headers: {
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
        },
      });
    } else {
      // 2. RITO ROMANO via iBreviary
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

      // Estrai il blocco #contenuto o .inner
      let content = html;
      const match = html.match(/<div class="inner">([\s\S]*?)<\/div>\s*<\/div>\s*<\/body>/i) ||
                    html.match(/<div id="contenuto">([\s\S]*?)<\/div>\s*<\/body>/i);

      if (match && match[1]) {
        content = match[1];
      }

      const sanitized = sanitizeHtml(content);

      return NextResponse.json({
        rite: "romano",
        moment,
        date: `${year}-${month}-${day}`,
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
