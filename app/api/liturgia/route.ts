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
      let infoText = "";
      if (infoRes && infoRes.ok) {
        infoText = await infoRes.text();
      }

      return NextResponse.json({
        rite: "ambrosiano",
        moment,
        date: `${year}-${month}-${day}`,
        liturgicalInfo: infoText.trim(),
        contentHtml: rawHtml,
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
