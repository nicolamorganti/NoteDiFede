import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Ignora se chiamato da un Server Component di sola lettura
        }
      },
    },
  });
}

export type UserRole = "ospite" | "cantore" | "maestro" | "responsabile";

export async function verifyUserRole(requiredRoles: UserRole[]) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, role: null, profile: null, error: "Non autorizzato: sessione non valida o scaduta." };
  }

  const adminClient = createAdminSupabaseClient();

  // Usa il service role per recuperare i dettagli protetti del profilo
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, username, full_name, role, vocal_register")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { user, role: null, profile: null, error: "Profilo utente non trovato." };
  }

  const userRole = profile.role as UserRole;

  if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
    return { user, role: userRole, profile, error: "Non autorizzato: permessi insufficienti." };
  }

  return { user, role: userRole, profile, error: null };
}
