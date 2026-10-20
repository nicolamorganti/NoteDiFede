import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";
import { notifyNewRegistration } from "@/app/actions/notifications";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/canti";

  // Prevenzione Open Redirect: accetta solo percorsi interni relativi che non iniziano con //
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/canti";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const user = data.user;
      const adminClient = createAdminSupabaseClient();

      const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Utente Google";

      // Verifica o completa il profilo dell'utente (il trigger handle_new_user crea la riga,
      // ma se full_name era vuoto al momento del trigger la aggiorniamo)
      const { data: existingProfile } = await adminClient
        .from("profiles")
        .select("id, full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (!existingProfile) {
        const username =
          (user.email?.split("@")[0] || "user") + "_" + Math.floor(Math.random() * 1000);

        await adminClient.from("profiles").insert({
          id: user.id,
          username,
          full_name: fullName,
          role: "ospite",
          vocal_register: "nessuno",
        });
      } else if (!existingProfile.full_name && fullName) {
        await adminClient
          .from("profiles")
          .update({ full_name: fullName })
          .eq("id", user.id);
      }

      // Determina se si tratta del primo accesso assoluto (utente creato negli ultimi 2 minuti)
      const createdAtMs = user.created_at ? new Date(user.created_at).getTime() : 0;
      const isFirstSignIn =
        !existingProfile || (createdAtMs > 0 && Date.now() - createdAtMs < 2 * 60 * 1000);

      if (isFirstSignIn && user.email) {
        try {
          await notifyNewRegistration(user.email, fullName);
        } catch (err) {
          console.error("Errore notifica nuovo utente Google:", err);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // In caso di errore nel token, rimanda al login con avviso
  return NextResponse.redirect(`${origin}/?error=auth_failed`);
}
