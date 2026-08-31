"use server";

import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/env";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";

export async function setNewsletterSubscriptionAction(userId: string, token: string, enabled: boolean) {
  if (!verifyUnsubscribeToken(userId, token)) {
    return { success: false, error: "Token di sicurezza non valido o scaduto." };
  }

  try {
    const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
    const supabaseServiceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { error } = await adminClient
      .from("profiles")
      .update({ newsletter_enabled: enabled })
      .eq("id", userId);

    if (error) {
      console.error("Errore aggiornamento newsletter_enabled:", error);
      return { success: false, error: "Impossibile aggiornare la preferenza. Riprova più tardi." };
    }

    return {
      success: true,
      enabled,
      message: enabled
        ? "Iscrizione riattivata con successo! Riceverai di nuovo La Parola del Giorno alle 06:00."
        : "Ti sei disiscritto con successo da La Parola del Giorno. Non riceverai più le riflessioni quotidiane.",
    };
  } catch (err: any) {
    console.error("Eccezione setNewsletterSubscriptionAction:", err);
    return { success: false, error: err.message || "Errore imprevisto." };
  }
}
