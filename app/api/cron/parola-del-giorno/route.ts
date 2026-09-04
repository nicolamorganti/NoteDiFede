import { NextRequest, NextResponse } from "next/server";
import { sendDailyWordNewsletter } from "@/lib/daily-word-newsletter";
import { verifyUserRole } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Endpoint Cron invocato automaticamente da Vercel Crons ogni giorno alle 04:00 UTC (06:00 italiane)
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const userAgent = (request.headers.get("user-agent") || "").toLowerCase();
  const cronSecret = process.env.CRON_SECRET;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // 1. Riconosci la chiamata automatica di Vercel Crons (user-agent: vercel-cron/1.0)
  const isVercelCron = userAgent.includes("vercel-cron");

  // 2. Riconosci se l'Authorization header corrisponde al CRON_SECRET o alla service role key
  const isSecretMatch =
    (Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`) ||
    (Boolean(serviceRoleKey) && authHeader === `Bearer ${serviceRoleKey}`);

  // 3. Fallback: autorizza anche se invocato da un utente con ruolo maestro/responsabile loggato
  let isAdminSession = false;
  try {
    const { role } = await verifyUserRole(["maestro", "responsabile"]);
    if (role) {
      isAdminSession = true;
    }
  } catch {
    // Nessuna sessione attiva
  }

  const isAuthorized = isSecretMatch || isVercelCron || isAdminSession;

  if (!isAuthorized) {
    console.warn("⚠️ Tentativo non autorizzato di esecuzione Cronjob La Parola del Giorno");
    return NextResponse.json(
      { error: "Non autorizzato: token CRON o sessione amministrativa non valida." },
      { status: 401 }
    );
  }

  const triggerSource = isVercelCron
    ? "Vercel Cron (Automatico)"
    : isSecretMatch
    ? "Bearer Token"
    : "Admin Session";

  console.log(`🕒 Esecuzione Cronjob 'La Parola del Giorno' avviata (${triggerSource})...`);
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
    triggerSource,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
