import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";
import { notifyNewRegistration } from "@/app/actions/notifications";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/canti";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const user = data.user;
      const adminClient = createAdminSupabaseClient();

      // Verifica o crea il profilo dell'utente se è il primo accesso via Google
      const { data: existingProfile } = await adminClient
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!existingProfile) {
        const fullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "Utente Google";

        const username =
          (user.email?.split("@")[0] || "user") + "_" + Math.floor(Math.random() * 1000);

        await adminClient.from("profiles").insert({
          id: user.id,
          username,
          full_name: fullName,
          role: "ospite",
          vocal_register: null,
        });

        // Invia notifica agli amministratori per la nuova registrazione
        if (user.email) {
          try {
            await notifyNewRegistration(user.email, fullName);
          } catch (err) {
            console.error("Errore notifica nuovo utente Google:", err);
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // In caso di errore nel token, rimanda al login con avviso
  return NextResponse.redirect(`${origin}/?error=auth_failed`);
}
