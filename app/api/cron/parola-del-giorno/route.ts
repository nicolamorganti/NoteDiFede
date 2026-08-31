import { NextRequest, NextResponse } from "next/server";
import { sendDailyWordNewsletter } from "@/lib/daily-word-newsletter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;


/**
 * Endpoint Cron invocato automaticamente da Vercel Crons ogni giorno alle 04:00 UTC (06:00 italiane)
 */
export async function GET(request: NextRequest) {
  // Verifica sicurezza facoltativa Vercel Cron Secret (se impostato)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  console.log("🕒 Esecuzione Cronjob 'La Parola del Giorno' avviata...");
  const result = await sendDailyWordNewsletter();

  if (!result.success) {
    console.error("❌ Errore esecuzione Cronjob 'La Parola del Giorno':", result.error);
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  console.log(`✅ Cronjob completato con successo. Email inviate a ${result.recipientsCount} iscritti. Modello usato: ${result.usedModel}`);
  return NextResponse.json({
    success: true,
    recipientsCount: result.recipientsCount,
    title: result.gospel.title,
    usedModel: result.usedModel,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
