"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, type ReactNode } from "react";
import { supabase } from "@/lib/supabase/client";
import { AuthProvider, useAuth, type AppUserRole } from "@/components/auth-context";
import { AudioProvider } from "@/components/audio-context";
import { GlobalAudioPlayer } from "@/components/global-audio-player";
import { ShareAppButton } from "@/components/share-app-button";
import { APP_VERSION } from "@/lib/version";
import { ScrollToTop } from "@/components/scroll-to-top";

function AppShellInner({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, role, fullName, vocalRegister } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Chiudi il menu mobile su cambio rotta
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Errore durante il logout di Supabase:", err);
    } finally {
      setIsMobileMenuOpen(false);
      router.push("/");
    }
  };

  // Costruisce la navigazione dinamica (Preghiera & Liturgia come predefinita)
  const navigation = [
    {
      href: "/liturgia",
      label: "Preghiera & Liturgia",
      subtitle: "Ambrosiano & Romano",
      badge: "Preghiera",
      icon: "📖",
    },
    {
      href: "/messe",
      label: "Messe & Celebrazioni",
      subtitle: "Rito Ambrosiano",
      badge: "Ambrosiano",
      icon: "⛪",
    },
    {
      href: "/canti",
      label: "Catalogo Canti",
      subtitle: "Repertorio generale",
      badge: "Attivo",
      icon: "🎵",
    },
    {
      href: "/notizie",
      label: "Notizie & Attualità",
      subtitle: "Milano, Vaticano, CEI, Roma",
      badge: "News",
      icon: "📰",
    },
    {
      href: "/crediti",
      label: "Crediti & Progetto",
      subtitle: "Curatori e finalità no-profit",
      badge: "Info",
      icon: "✨",
    },
  ];




  // Mostra il link Impostazioni solo se è Maestro o Responsabile
  if (role === "maestro" || role === "responsabile") {
    navigation.push({
      href: "/impostazioni",
      label: "Impostazioni",
      subtitle: "Gestione coro e permessi",
      badge: "Gestisci",
      icon: "⚙️",
    });
  }

  return (
    <div className="min-h-screen bg-[#f6f1ea] text-[#3e3933]">
      <div className="mx-auto flex min-h-screen w-full max-w-screen-2xl flex-col lg:flex-row">
        {/* ========================================================================= */}
        {/* DESKTOP SIDEBAR (Fissa e visibile solo su schermi grandi lg) */}
        {/* ========================================================================= */}
        <aside className="hidden lg:flex lg:flex-col justify-between border-r border-[#ddd2c2] bg-[#ede4d8] px-6 py-8 text-[#3f3933] lg:sticky lg:top-0 lg:h-screen lg:w-80 lg:overflow-y-auto">
          <div className="space-y-6">
            <div className="space-y-3">
              <Link href="/liturgia" className="inline-flex items-center gap-3 group">

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
                    className={`flex items-center justify-between rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "border-[#aa9576] bg-[#f2e7d5] text-[#4a3e30]"
                        : "border-[#d7c7b5] bg-[#f7f0e6] text-[#453e37] hover:bg-[#f2e8da]"
                    }`}
                  >
                    <div>
                      <p className="font-semibold leading-tight">{item.label}</p>
                      {item.subtitle && (
                        <p className={`text-[11px] font-sans ${isActive ? "text-[#8a755d]" : "text-[#887865]"}`}>
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] font-bold ${
                        isActive ? "bg-[#aa9576] text-white" : "bg-[#d9cab6] text-[#4e443a]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Profilo utente in fondo alla sidebar desktop */}
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
                    {vocalRegister && ` · ${vocalRegister}`}
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

        {/* ========================================================================= */}
        {/* CONTENUTO PRINCIPALE & HEADER MOBILE / DESKTOP */}
        {/* ========================================================================= */}
        <div className="flex min-h-screen flex-1 flex-col">
          {/* Header Mobile / Tablet compatto con Hamburger Menu */}
          <header className="border-b border-[#ddd2c2] bg-[#f6f1ea]/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8 sticky top-0 z-30">
            <div className="flex items-center justify-between">
              {/* Logo / Titolo */}
              <div className="flex items-center gap-3">
                <Link href="/liturgia" className="flex items-center gap-2.5 group">

                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#5c4a37] text-white shadow-xs">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M12 4v16 M7 9.5h10" />
                    </svg>
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-[#3f3933] leading-tight">Note di Fede</p>
                      <span className="rounded-md bg-[#ede4d8] border border-[#d7c7b5] px-1.5 py-0.2 text-[10px] font-mono font-bold text-[#6e5a45]">
                        {APP_VERSION}
                      </span>
                    </div>
                    <p className="text-[10px] font-serif italic text-[#887865] hidden sm:block">
                      Musica Sacra & Liturgia
                    </p>
                  </div>
                </Link>
              </div>

              {/* Azioni Destra: Condividi + Menu Hamburger / Profilo Utente */}
              <div className="flex items-center gap-2">
                <ShareAppButton variant="header" />

                {/* Pulsante Hamburger / Profilo per Mobile e Tablet (< lg) */}
                <button
                  onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                  className="lg:hidden flex items-center gap-2 rounded-xl border border-[#d7c7b5] bg-[#ede4d8] px-3 py-1.5 text-xs font-bold text-[#453e37] hover:bg-[#e4d7c7] active:scale-95 transition shadow-xs"
                  aria-label="Menu e Profilo Utente"
                >
                  {user ? (
                    <>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#5c4a37] text-[10px] text-white font-bold">
                        {(fullName || user.email || "U")[0].toUpperCase()}
                      </span>
                      <span className="max-w-[85px] truncate text-[11px] hidden xs:inline">
                        {fullName?.split(" ")[0] || "Profilo"}
                      </span>
                    </>
                  ) : (
                    <span className="text-[11px]">Accedi</span>
                  )}
                  <svg className="h-4 w-4 text-[#5c4a37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </header>

          {/* ========================================================================= */}
          {/* SLIDE-OVER DRAWER MENU PER MOBILE (QUANDO L'HAMBURGER È APERTO) */}
          {/* ========================================================================= */}
          {isMobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              {/* Sfondo oscurato / Backdrop */}
              <div
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
              />

              {/* Pannello Menu Laterale Scorrevole */}
              <div className="relative ml-auto flex h-full w-full max-w-xs flex-col justify-between bg-[#fbf8f4] p-6 shadow-2xl border-l border-[#d8c8b4] z-10 animate-in slide-in-from-right duration-300">
                <div className="space-y-6">
                  {/* Testata Menu Mobile */}
                  <div className="flex items-center justify-between border-b border-[#ebdcc8] pb-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#8a755d]">
                        Navigazione & Utente
                      </p>
                      <h3 className="text-lg font-serif font-bold text-[#3f3933]">Menu Rapido</h3>
                    </div>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="rounded-xl border border-[#d9cdbf] bg-[#f4efe6] p-2 text-[#5c4a37] hover:bg-[#ebdcc8] active:scale-95 transition"
                      aria-label="Chiudi menu"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Card Utente nel Drawer */}
                  <div className="rounded-2xl border border-[#d9cdbf] bg-[#f4efe6] p-4 shadow-xs">
                    {user ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5c4a37] text-white text-sm font-bold shadow-xs">
                            {(fullName || user.email || "U")[0].toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-[#3f3933] truncate">
                              {fullName || user.email}
                            </p>
                            <p className="text-[11px] font-semibold text-[#8a755d] uppercase tracking-wider">
                              Ruolo: <span className="text-[#5c4a37] font-bold">{role || "ospite"}</span>
                              {vocalRegister && ` · ${vocalRegister}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-[#5c4a37]">Accesso Pubblico</p>
                        <p className="text-xs text-[#736555]">Accedi per il materiale audio e le funzioni complete.</p>
                        <Link
                          href="/"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block w-full text-center rounded-xl bg-[#5c4a37] py-2 text-xs font-bold text-white hover:bg-[#4b3c2c] transition"
                        >
                          Accedi o Registrati
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Voci di Navigazione */}
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
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                            isActive
                              ? "border-[#aa9576] bg-[#f2e7d5] text-[#4a3e30] shadow-xs"
                              : "border-[#d7c7b5] bg-[#fffdfa] text-[#453e37] hover:bg-[#f6eee3]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{item.icon}</span>
                            <div>
                              <p className="font-semibold leading-tight">{item.label}</p>
                              {item.subtitle && (
                                <p className={`text-[11px] font-sans ${isActive ? "text-[#8a755d]" : "text-[#887865]"}`}>
                                  {item.subtitle}
                                </p>
                              )}
                            </div>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] font-bold ${
                              isActive ? "bg-[#aa9576] text-white" : "bg-[#d9cab6] text-[#4e443a]"
                            }`}
                          >
                            {item.badge}
                          </span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                {/* Footer del Drawer Mobile */}
                <div className="border-t border-[#ebdcc8] pt-4 space-y-3">
                  {user && (
                    <button
                      onClick={handleSignOut}
                      className="w-full text-center rounded-2xl border border-red-200 bg-red-50/50 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 transition"
                    >
                      Disconnetti
                    </button>
                  )}
                  <ShareAppButton variant="sidebar" />
                </div>
              </div>
            </div>
          )}

          {/* Area Contenuto Pagina */}
          <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
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
        <ScrollToTop />
      </AudioProvider>
    </AuthProvider>
  );
}
