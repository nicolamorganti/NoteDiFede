import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { requireEnv } from "@/lib/env";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          // Si può ignorare questo errore se chiamato da un Server Component (non possono settare cookie)
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.delete({ name, ...options });
        } catch (error) {
          // Idem
        }
      },
    },
  });
}

export async function verifyUserRole(requiredRoles: ("ospite" | "cantore" | "maestro" | "responsabile")[]) {
  // Ora verifica la sessione automaticamente dai cookie
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, role: null, profile: null, error: "Non autorizzato: sessione non valida o scaduta." };
  }

  // Usa il service role per recuperare i dettagli protetti del profilo
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseServiceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, username, full_name, role, vocal_register")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { user, role: null, profile: null, error: "Profilo utente non trovato." };
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(profile.role as any)) {
    return { user, role: profile.role as any, profile, error: "Non autorizzato: permessi insufficienti." };
  }

  return { user, role: profile.role as any, profile, error: null };
}
