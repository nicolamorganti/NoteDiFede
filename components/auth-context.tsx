"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

export type AppUserRole = "ospite" | "cantore" | "maestro" | "responsabile";

export type AuthContextType = {
  user: User | null;
  role: AppUserRole | null;
  fullName: string | null;
  vocalRegister: string | null;
  isAdmin: boolean;
  isCantoreOrAdmin: boolean;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  fullName: null,
  vocalRegister: null,
  isAdmin: false,
  isCantoreOrAdmin: false,
  isLoading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({
  children,
  initialUser = null,
  initialRole = null,
  initialFullName = null,
  initialVocalRegister = null,
}: {
  children: ReactNode;
  initialUser?: User | null;
  initialRole?: AppUserRole | null;
  initialFullName?: string | null;
  initialVocalRegister?: string | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [role, setRole] = useState<AppUserRole | null>(initialRole);
  const [fullName, setFullName] = useState<string | null>(initialFullName);
  const [vocalRegister, setVocalRegister] = useState<string | null>(initialVocalRegister);
  const [isLoading, setIsLoading] = useState(!initialUser);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role, full_name, vocal_register")
        .eq("id", userId)
        .maybeSingle();

      if (!error && profile) {
        setRole(profile.role as AppUserRole);
        setFullName(profile.full_name);
        setVocalRegister(profile.vocal_register);
      }
    } catch (err) {
      console.error("Errore recupero profilo in AuthProvider:", err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setRole(null);
          setFullName(null);
          setVocalRegister(null);
        }
      } catch (err) {
        console.error("Errore inizializzazione AuthProvider:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === "SIGNED_OUT" || !session) {
        setUser(null);
        setRole(null);
        setFullName(null);
        setVocalRegister(null);
        setIsLoading(false);
      } else if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const isAdmin = user !== null && (role === "maestro" || role === "responsabile");
  const isCantoreOrAdmin = user !== null && (role === "cantore" || role === "maestro" || role === "responsabile");

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        fullName,
        vocalRegister,
        isAdmin,
        isCantoreOrAdmin,
        isLoading,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve essere utilizzato all'interno di AuthProvider");
  }
  return context;
}
