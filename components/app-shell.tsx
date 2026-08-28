"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase/client";
import { AuthProvider, useAuth, type AppUserRole } from "@/components/auth-context";
import { AudioProvider } from "@/components/audio-context";
import { GlobalAudioPlayer } from "@/components/global-audio-player";
import { ShareAppButton } from "@/components/share-app-button";
import { APP_VERSION } from "@/lib/version";



function AppShellInner({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, role, fullName } = useAuth();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Errore durante il logout di Supabase:", err);
    } finally {
      router.push("/");
    }
  };

  // Costruisce la navigazione dinamica
  const navigation = [
    { href: "/canti", label: "Catalogo Canti", badge: "Attivo" },
    { href: "/messe", label: "Messe & Celebrazioni", badge: "Attivo" },
    { href: "/liturgia", label: "Preghiera & Liturgia", badge: "Preghiera" },
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
              <Link href="/" className="inline-flex items-center gap-3 group">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#6e5a45] text-[#fbf7f2] shadow-sm">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M12 4v16 M7 9.5h10" />
                  </svg>
                </span>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#887865]">
                      Note di Fede
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold text-[#3f3933]">Portale Liturgico</p>
                    <span className="rounded-full bg-[#dfd3c3] border border-[#cfc1ad] px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#5c4a37]">
                      {APP_VERSION}
                    </span>
                  </div>
                </div>
              </Link>

              <p className="max-w-xs text-xs font-serif italic text-[#685d53]">
                Musica per l&apos;anima, parole per il cuore.
              </p>
            </div>



            <nav className="grid gap-2">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/") ||
                  (item.href === "/liturgia" && pathname.startsWith("/preghiera"));



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
            {user ? (
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


            {/* Pulsante Condividi App nella Sidebar */}
            <div className="pt-1">
              <ShareAppButton variant="sidebar" />
            </div>
          </div>
        </aside>

        {/* Contenuto Principale */}
        <div className="flex min-h-screen flex-1 flex-col">
          <header className="border-b border-[#ddd2c2] bg-[#f6f1ea]/90 px-5 py-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#857866]">
                  Area Riservata
                </p>
                <h1 className="text-xl font-serif font-normal text-[#3f3933]">
                  Musica Sacra & Liturgia
                </h1>

              </div>
              <div className="flex items-center gap-3">
                <ShareAppButton variant="header" />
                <span className="inline-flex items-center rounded-full bg-[#ede4d8] border border-[#d7c7b5] px-2.5 py-1 text-xs font-mono font-medium text-[#6e5a45] shadow-xs">
                  {APP_VERSION}
                </span>
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

export function AppShell({


  children,
  initialUser = null,
  initialRole = null,
  initialFullName = null,
  initialVocalRegister = null,
}: Readonly<{
  children: ReactNode;
  initialUser?: any;
  initialRole?: AppUserRole | null;
  initialFullName?: string | null;
  initialVocalRegister?: string | null;
}>) {
  return (
    <AuthProvider
      initialUser={initialUser}
      initialRole={initialRole}
      initialFullName={initialFullName}
      initialVocalRegister={initialVocalRegister}
    >
      <AudioProvider>
        <AppShellInner>{children}</AppShellInner>
        <GlobalAudioPlayer />
      </AudioProvider>
    </AuthProvider>
  );
}


