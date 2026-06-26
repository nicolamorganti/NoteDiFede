"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase/client";

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any | null>(null);
  const [role, setRole] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("nDF_user_role");
    }
    return null;
  });
  const [fullName, setFullName] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("nDF_user_fullname");
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name")
          .eq("id", session.user.id)
          .single();
        
        if (profile) {
          setRole(profile.role);
          setFullName(profile.full_name);
          localStorage.setItem("nDF_user_role", profile.role);
          localStorage.setItem("nDF_user_fullname", profile.full_name || "");
        }
      } else {
        localStorage.removeItem("nDF_user_role");
        localStorage.removeItem("nDF_user_fullname");
        setRole(null);
        setFullName(null);
      }
      setLoading(false);
    }

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setUser(session.user);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name")
          .eq("id", session.user.id)
          .single();
        if (profile) {
          setRole(profile.role);
          setFullName(profile.full_name);
          localStorage.setItem("nDF_user_role", profile.role);
          localStorage.setItem("nDF_user_fullname", profile.full_name || "");
        }
      } else {
        setUser(null);
        setRole(null);
        setFullName(null);
        localStorage.removeItem("nDF_user_role");
        localStorage.removeItem("nDF_user_fullname");
      }
      setLoading(false);
    });

    // Ascolto dei cambiamenti di localStorage tra le varie schede (tab) del browser
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "nDF_user_role") {
        setRole(e.newValue);
      }
      if (e.key === "nDF_user_fullname") {
        setFullName(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Errore durante il logout di Supabase:", err);
    } finally {
      // Pulisce lo stato locale e reindirizza in ogni caso (anche se la chiamata di rete fallisce)
      setUser(null);
      setRole(null);
      setFullName(null);
      localStorage.removeItem("nDF_user_role");
      localStorage.removeItem("nDF_user_fullname");
      router.push("/");
    }
  };

  // Costruisce la navigazione dinamica
  const navigation = [
    { href: "/canti", label: "Catalogo Canti", badge: "Attivo" },
    { href: "/messe", label: "Messe & Liturgia", badge: "Attivo" },
  ];

  // Mostra il link Impostazioni solo se è Maestro o Responsabile
  if (role === "maestro" || role === "responsabile") {
    navigation.push({ href: "/impostazioni", label: "Impostazioni", badge: "Gestisci" });
  }

  return (
    <div className="min-h-screen bg-[#f6f1ea] text-[#3e3933]">
      <div className="mx-auto flex min-h-screen w-full max-w-screen-2xl flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="flex flex-col justify-between border-b border-[#ddd2c2] bg-[#ede4d8] px-5 py-5 text-[#3f3933] lg:sticky lg:top-0 lg:h-screen lg:w-80 lg:border-b-0 lg:border-r lg:px-6 lg:py-8 lg:overflow-y-auto">
          <div className="space-y-6">
            <div className="space-y-3">
              <Link href="/" className="inline-flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#6e5a45] font-semibold text-[#fbf7f2]">
                  NF
                </span>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#887865]">
                    Note di Fede
                  </p>
                  <p className="text-lg font-semibold">Portale Coro</p>
                </div>
              </Link>

              <p className="max-w-xs text-sm leading-6 text-[#685d53]">
                Gestione dei canti, delle celebrazioni e degli spartiti liturgici.
              </p>
            </div>

            <nav className="grid gap-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "border-[#aa9576] bg-[#f2e7d5] text-[#4a3e30]"
                        : "border-[#d7c7b5] bg-[#f7f0e6] text-[#453e37] hover:bg-[#f2e8da]"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className={`rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.18em] ${
                      isActive ? "bg-[#aa9576] text-white" : "bg-[#d9cab6] text-[#4e443a]"
                    }`}>
                      {item.badge}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Profilo utente in fondo alla sidebar */}
          <div className="mt-8 border-t border-[#ddd2c2] pt-6 space-y-4">
            {loading ? (
              <p className="text-xs text-[#736555] italic">Caricamento utente...</p>
            ) : user ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#8a755d]">
                    Utente Collegato
                  </p>
                  <p className="text-sm font-bold text-[#3f3933] truncate">
                    {fullName || user.email}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#736555]">
                    Ruolo: <span className="text-[#8c7355]">{role || "ospite"}</span>
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full text-center rounded-2xl border border-red-200 bg-red-50/40 py-2.5 text-xs font-bold text-red-700 hover:bg-red-50 hover:text-red-800 transition"
                >
                  Disconnetti
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#8a755d]">
                    Accesso Pubblico
                  </p>
                  <p className="text-xs text-[#736555]">
                    Sei loggato come ospite generico. Il materiale audio è riservato.
                  </p>
                </div>
                <Link
                  href="/"
                  className="block w-full text-center rounded-2xl bg-[#5c4a37] py-2.5 text-xs font-bold text-white hover:bg-[#4b3c2c] transition"
                >
                  Accedi o Registrati
                </Link>
              </div>
            )}
          </div>
        </aside>

        {/* Contenuto Principale */}
        <div className="flex min-h-screen flex-1 flex-col">
          <header className="border-b border-[#ddd2c2] bg-[#f6f1ea]/90 px-5 py-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#857866]">
                  Area Riservata
                </p>
                <h1 className="text-xl font-serif font-normal text-[#3f3933]">
                  Coro Liturgico
                </h1>
              </div>
            </div>
          </header>

          <main className="flex-1 px-5 py-6 sm:px-6 lg:px-8 xl:px-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
