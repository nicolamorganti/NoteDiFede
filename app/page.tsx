"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { notifyNewRegistration } from "@/app/actions/notifications";
import { ShareAppButton } from "@/components/share-app-button";
import { APP_VERSION } from "@/lib/version";



export default function LoginPage() {
  const router = useRouter();
  
// Il reindirizzamento se l'utente è già loggato ora è gestito in modo robusto dal middleware (lato server).

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("error") === "auth_failed") {
        setError("Autenticazione con Google non riuscita. Riprova.");
      }
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Errore durante l'accesso con Google.");
      setGoogleLoading(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password || (isSignUp && !fullName)) {
      setError("Compila tutti i campi obbligatori.");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Registrazione nuovo utente
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              username: email.split("@")[0] + "_" + Math.floor(Math.random() * 1000),
            },
          },
        });

        if (signUpError) throw signUpError;

        // Invia notifica agli amministratori (non blocca se fallisce)
        try {
          await notifyNewRegistration(email, fullName);
        } catch (err) {
          console.error("Errore invio notifica registrazione:", err);
        }

        setSuccess("Registrazione effettuata! Ti abbiamo inviato un'email di conferma: controlla la tua casella di posta (anche nella cartella Spam) e clicca sul link di attivazione prima di effettuare l'accesso.");
        setIsSignUp(false);
        setPassword("");
      } else {
        // Login utente
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        // Il middleware si occuperà di aggiornare il cookie.
        // Possiamo fare direttamente il push alla dashboard.

        setSuccess("Accesso consentito. Ingresso in corso...");
        setTimeout(() => {
          router.push("/liturgia");
        }, 800);

      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Si è verificato un errore durante l'autenticazione.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(155,131,97,0.15),_transparent_50%),linear-gradient(180deg,_#fdfbf7_0%,_#f6eee0_60%,_#ebdcb9_100%)] px-4 py-12 text-[#3f3933] font-sans antialiased selection:bg-[#aa9576] selection:text-white">
      {/* Sottile cornice decorativa */}
      <div className="pointer-events-none absolute inset-4 hidden rounded-3xl border border-[#aa9576]/20 md:block" />
      <div className="pointer-events-none absolute inset-6 hidden rounded-[20px] border border-[#aa9576]/10 md:block" />

      <div className="z-10 w-full max-w-md space-y-8">
        {/* Pulsante Condividi in alto */}
        <div className="flex justify-end">
          <ShareAppButton variant="header" />
        </div>

        {/* Intestazione Liturgica */}
        <div className="text-center space-y-4">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#5c4a37] shadow-xl shadow-[#5c4a37]/10">
            {/* Icona SVG elegante: Croce latina minimale */}
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
                strokeWidth={1.8}
                d="M12 4v16 M7 9.5h10"
              />
            </svg>
          </div>


          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-[#8a755d]">
              Musica Sacra & Preghiera
            </span>
            <h1 className="font-serif text-3xl font-normal tracking-wide text-[#3f3933] sm:text-4xl">
              Note di Fede
            </h1>
            <div className="mx-auto h-[1px] w-24 bg-gradient-to-r from-transparent via-[#aa9576] to-transparent" />
          </div>

          <p className="mx-auto max-w-sm text-sm font-serif italic text-[#5c4a37]">
            Musica per l&apos;anima, parole per il cuore
          </p>

          <p className="mx-auto max-w-xs text-xs italic text-[#8a755d] pt-0.5">
            &ldquo;Il cantare è proprio di chi ama.&rdquo;
            <span className="block mt-0.5 text-[10px] not-italic font-medium uppercase tracking-[0.1em] text-[#aa9576]">— S. Agostino</span>
          </p>
        </div>



        {/* Card di Login / Registrazione */}
        <div className="rounded-3xl border border-[#e4dcce] bg-[#fffdfa]/95 p-6 shadow-xl shadow-[#8a755d]/10 backdrop-blur-sm sm:p-8">
          <div className="flex border-b border-[#e4dcce] mb-6">
            <button
              onClick={() => {
                setIsSignUp(false);
                setError("");
                setSuccess("");
              }}
              className={`flex-1 pb-3 text-sm font-semibold uppercase tracking-wider transition ${
                !isSignUp ? "border-b-2 border-[#5c4a37] text-[#5c4a37]" : "text-[#736555] hover:text-[#3f3933]"
              }`}
            >
              Accedi
            </button>
            <button
              onClick={() => {
                setIsSignUp(true);
                setError("");
                setSuccess("");
              }}
              className={`flex-1 pb-3 text-sm font-semibold uppercase tracking-wider transition ${
                isSignUp ? "border-b-2 border-[#5c4a37] text-[#5c4a37]" : "text-[#736555] hover:text-[#3f3933]"
              }`}
            >
              Registrati
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input Nome Completo (solo per registrazione) */}
            {isSignUp && (
              <div className="space-y-1.5">
                <label
                  htmlFor="fullName"
                  className="text-xs font-semibold uppercase tracking-wider text-[#6b5d4e]"
                >
                  Nome e Cognome
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Mario Rossi"
                  className="w-full rounded-2xl border border-[#d9cdbf] bg-white/70 px-4 py-3 text-sm text-[#3f3933] placeholder-[#aa9e90] outline-none transition duration-300 focus:border-[#aa9576] focus:bg-white focus:ring-4 focus:ring-[#f6eee0]"
                  disabled={loading}
                />
              </div>
            )}

            {/* Input Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-wider text-[#6b5d4e]"
              >
                Indirizzo Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@esempio.com"
                className="w-full rounded-2xl border border-[#d9cdbf] bg-white/70 px-4 py-3 text-sm text-[#3f3933] placeholder-[#aa9e90] outline-none transition duration-300 focus:border-[#aa9576] focus:bg-white focus:ring-4 focus:ring-[#f6eee0]"
                disabled={loading}
              />
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-wider text-[#6b5d4e]"
              >
                Password
              </label>
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
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-700 animate-fadeIn">
                <p className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{success}</span>
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full rounded-2xl bg-[#5c4a37] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#5c4a37]/10 transition duration-300 hover:bg-[#4b3c2c] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading || googleLoading}
            >
              {loading ? (isSignUp ? "Registrazione..." : "Accesso in corso...") : (isSignUp ? "Registrati con Email" : "Accedi con Email")}
            </button>
          </form>

          {/* Pulsante Google OAuth */}
          <div className="mt-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full rounded-2xl border border-[#d9cdbf] bg-white py-3 text-sm font-semibold text-[#3f3933] shadow-sm transition duration-300 hover:bg-[#fdfbf7] hover:border-[#aa9576] active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <div className="h-4 w-4 rounded-full border-2 border-[#5c4a37] border-t-transparent animate-spin" />
              ) : (
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{isSignUp ? "Continua con Google" : "Accedi con Google"}</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e4dcce]" />
            </div>
            <span className="relative bg-[#fffdfa] px-3 text-xs uppercase tracking-wider text-[#aa9e90]">
              oppure
            </span>
          </div>


          {/* Guest Access Button */}
          <button
            type="button"
            onClick={() => router.push("/liturgia")}
            className="w-full rounded-2xl border-2 border-[#8a755d] bg-transparent py-3 text-sm font-semibold text-[#8a755d] transition duration-300 hover:bg-[#8a755d]/5 hover:text-[#5c4a37] hover:border-[#5c4a37] active:scale-[0.98] flex items-center justify-center gap-2"
          >

            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            Accedi come Ospite
          </button>
          <p className="text-center text-[10px] text-[#8a755d] mt-2 leading-relaxed">
            Sola lettura: puoi consultare il repertorio dei canti e visualizzare gli spartiti.
          </p>
        </div>

        <p className="text-center text-[11px] font-mono text-[#a89885]">
          Note di Fede • {APP_VERSION}
        </p>
      </div>
    </main>
  );
}

