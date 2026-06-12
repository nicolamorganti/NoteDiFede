import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/env";

export function createServerSupabaseClient() {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function verifyUserRole(token: string, requiredRoles: ("ospite" | "cantore" | "maestro" | "responsabile")[]) {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseServiceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Verify token
  const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !user) {
    return { user: null, role: null, profile: null, error: "Non autorizzato: token non valido." };
  }

  // Fetch profile
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
