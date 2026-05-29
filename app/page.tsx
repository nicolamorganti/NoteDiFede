"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("maestro@notedifede.it");
  const [password, setPassword] = useState("cantoliturgico");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleMockLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Inserisci sia l'indirizzo email che la password.");
      return;
    }

    setLoading(true);
    
    // Simulazione di un login solenne con transizione dolce
    setTimeout(() => {
      setLoading(false);
      setSuccess("Accesso consentito. Ingresso nel repertorio in corso...");
      setTimeout(() => {
        router.push("/canti");
      }, 1000);
    }, 1200);
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(155,131,97,0.15),_transparent_50%),linear-gradient(180deg,_#fdfbf7_0%,_#f6eee0_60%,_#ebdcb9_100%)] px-4 py-12 text-[#3f3933] font-sans antialiased selection:bg-[#aa9576] selection:text-white">
      {/* Sottile cornice decorativa solenne, visibile solo su schermi medio-grandi */}
      <div className="pointer-events-none absolute inset-4 hidden rounded-3xl border border-[#aa9576]/20 md:block" />
      <div className="pointer-events-none absolute inset-6 hidden rounded-[20px] border border-[#aa9576]/10 md:block" />

      <div className="z-10 w-full max-w-md space-y-8">
        {/* Intestazione Liturgica */}
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#5c4a37] shadow-xl shadow-[#5c4a37]/10">
            {/* Icona SVG elegante: Croce stilizzata con onde sonore/armonia */}
            <svg
              className="h-10 w-10 text-[#f6eee0]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 3v18M8 8h8M6 12h12M9 16h6"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-[#8a755d]">
              Archivio Musicale Sacro
            </span>
            <h1 className="font-serif text-3xl font-normal tracking-wide text-[#3f3933] sm:text-4xl">
              Note di Fede
            </h1>
            <div className="mx-auto h-[1px] w-24 bg-gradient-to-r from-transparent via-[#aa9576] to-transparent" />
          </div>

          <p className="mx-auto max-w-xs text-sm leading-relaxed text-[#736555] italic">
            &ldquo;Chi canta bene prega due volte.&rdquo;
            <span className="block mt-1 text-[11px] not-italic font-medium uppercase tracking-[0.1em] text-[#8a755d]">— S. Agostino</span>
          </p>
        </div>

        {/* Card di Login */}
        <div className="rounded-3xl border border-[#e4dcce] bg-[#fffdfa]/95 p-6 shadow-xl shadow-[#8a755d]/10 backdrop-blur-sm sm:p-8">
          <h2 className="font-serif text-xl font-medium text-[#4b3c2c] text-center mb-6">
            Accedi al Santuario Corale
          </h2>

          <form onSubmit={handleMockLogin} className="space-y-5">
            {/* Input Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-wider text-[#6b5d4e]"
              >
                Indirizzo Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@notedifede.it"
                  className="w-full rounded-2xl border border-[#d9cdbf] bg-white/70 px-4 py-3 text-sm text-[#3f3933] placeholder-[#aa9e90] outline-none transition duration-300 focus:border-[#aa9576] focus:bg-white focus:ring-4 focus:ring-[#f6eee0]"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold uppercase tracking-wider text-[#6b5d4e]"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-[#d9cdbf] bg-white/70 px-4 py-3 text-sm text-[#3f3933] placeholder-[#aa9e90] outline-none transition duration-300 focus:border-[#aa9576] focus:bg-white focus:ring-4 focus:ring-[#f6eee0]"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50/50 px-4 py-3 text-sm text-red-700 animate-fadeIn">
                <p className="flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="rounded-2xl border border-[#b9c7b9] bg-[#eef4ef] px-4 py-3 text-sm text-[#395e49] animate-fadeIn">
                <p className="flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{success}</span>
                </p>
              </div>
            )}

            {/* Bottone Accedi */}
            <button
              type="submit"
              disabled={loading}
              className="relative flex w-full items-center justify-center rounded-full bg-[#5c4a37] px-5 py-3 text-sm font-semibold text-[#fffdfa] shadow-lg shadow-[#5c4a37]/15 transition duration-300 hover:bg-[#4b3c2c] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#aa9576] focus:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Verifica delle credenziali...</span>
                </span>
              ) : (
                <span>Accedi</span>
              )}
            </button>
          </form>

          {/* Helper Credentials Box */}
          <div className="mt-8 rounded-2xl border border-[#e4dcce] bg-[#fdfbf7] p-4 text-xs">
            <p className="font-semibold text-[#8a755d] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <svg className="h-4 w-4 text-[#aa9576]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Credenziali per test rapido
            </p>
            <div className="space-y-1 text-[#6b5d4e] font-mono select-all">
              <div className="flex items-center justify-between">
                <span>Email:</span>
                <span className="font-semibold text-[#3f3933]">maestro@notedifede.it</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Password:</span>
                <span className="font-semibold text-[#3f3933]">cantoliturgico</span>
              </div>
            </div>
            <p className="mt-2 text-[10px] text-[#aa9e90] italic text-center">
              Cliccando &ldquo;Accedi&rdquo; verrai indirizzato direttamente alla dashboard.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs tracking-wider text-[#8a755d] uppercase">
          &copy; {new Date().getFullYear()} Note di Fede &bull; Liturgical Choir Directory
        </p>
      </div>
    </main>
  );
}
