"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { setNewsletterSubscriptionAction } from "./actions";

interface Props {
  searchParams: Promise<{ id?: string; token?: string }>;
}

export default function DisiscrizioneNewsletterPage({ searchParams }: Props) {
  const resolvedParams = use(searchParams);
  const userId = resolvedParams.id || "";
  const token = resolvedParams.token || "";

  const isLinkValid = Boolean(userId && token);

  const [hasConfirmedAction, setHasConfirmedAction] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>(
    isLinkValid ? "" : "Link di disiscrizione non valido o incompleto."
  );
  const [actionLoading, setActionLoading] = useState(false);

  const handleSetSubscription = async (targetEnabled: boolean) => {
    if (!userId || !token) return;
    setActionLoading(true);
    setError("");

    const res = await setNewsletterSubscriptionAction(userId, token, targetEnabled);
    if (res.success) {
      setIsSubscribed(targetEnabled);
      setHasConfirmedAction(true);
      setMessage(res.message || "");
    } else {
      setError(res.error || "Impossibile completare l'operazione.");
    }
    setActionLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#f7f2ea] flex items-center justify-center p-4 sm:p-6 text-[#3e3933]">
      <div className="w-full max-w-md bg-white border border-[#e4dcce] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 text-center animate-in fade-in duration-300">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f4eee4] border border-[#e8decb] text-2xl shadow-xs">
          {!hasConfirmedAction ? "✉️" : isSubscribed ? "📬" : "🕊️"}
        </div>

        <div className="space-y-1">
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#443729]">
            {!hasConfirmedAction
              ? "Gestione Newsletter"
              : isSubscribed
              ? "Newsletter Riattivata"
              : "Disiscrizione Confermata"}
          </h1>
          <p className="text-xs text-[#8a755d]">
            Note di Fede · La Parola del Giorno
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4 text-xs text-red-700 space-y-1">
            <span className="font-semibold text-sm">⚠️ Attenzione</span>
            <p>{error}</p>
          </div>
        ) : !hasConfirmedAction ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#ebdcc8] bg-[#fbf9f4] p-4 text-xs text-[#5c4a37] leading-relaxed">
              Confermi di volerti disiscrivere dalla ricezione quotidiana de{" "}
              <strong>La Parola del Giorno</strong>?
            </div>

            <button
              type="button"
              onClick={() => handleSetSubscription(false)}
              disabled={actionLoading}
              className="w-full py-3 px-4 rounded-2xl text-xs font-semibold shadow-xs transition duration-200 cursor-pointer disabled:opacity-50 bg-[#5c4a37] text-white hover:bg-[#4b3c2c]"
            >
              {actionLoading ? "Aggiornamento in corso..." : "Conferma Disiscrizione"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#ebdcc8] bg-[#fbf9f4] p-4 text-xs text-[#5c4a37] leading-relaxed">
              {message}
            </div>

            <button
              type="button"
              onClick={() => handleSetSubscription(!isSubscribed)}
              disabled={actionLoading}
              className={`w-full py-3 px-4 rounded-2xl text-xs font-semibold shadow-xs transition duration-200 cursor-pointer disabled:opacity-50 ${
                isSubscribed
                  ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                  : "bg-[#5c4a37] text-white hover:bg-[#4b3c2c]"
              }`}
            >
              {actionLoading
                ? "Aggiornamento..."
                : isSubscribed
                ? "Disiscriviti di nuovo"
                : "Hai cambiato idea? Riattiva la newsletter"}
            </button>
          </div>
        )}

        <div className="pt-4 border-t border-[#ebdcc8] flex items-center justify-center gap-4 text-xs text-[#8a755d]">
          <Link href="/liturgia" className="hover:text-[#5c4a37] underline transition">
            Torna alla Liturgia
          </Link>
          <span>·</span>
          <Link href="/impostazioni" className="hover:text-[#5c4a37] underline transition">
            Il mio Profilo
          </Link>
        </div>
      </div>
    </main>
  );
}
