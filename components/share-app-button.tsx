"use client";

import { useState } from "react";

interface ShareAppButtonProps {
  variant?: "header" | "sidebar" | "card" | "compact";
  className?: string;
}

export function ShareAppButton({ variant = "header", className = "" }: ShareAppButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: "Note di Fede — Musica per l'anima, parole per il cuore",
      text: "Note di Fede: musica per l'anima, parole per il cuore. Canti liturgici, celebrazioni, liturgia delle ore e Sacra Bibbia.",
      url: typeof window !== "undefined" ? window.location.origin : "https://notedifede.vercel.app",
    };



    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: any) {
        if (err.name === "AbortError") return; // L'utente ha chiuso il foglio di condivisione
        console.warn("navigator.share fallito, passo a clipboard:", err);
      }
    }

    // Fallback: copia negli appunti
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (e) {
      console.error("Errore copia link:", e);
    }
  };

  if (variant === "header") {
    return (
      <button
        onClick={handleShare}
        className={`inline-flex items-center gap-1.5 rounded-full border border-[#d7c7b5] bg-[#ede4d8] px-3 py-1 text-xs font-semibold text-[#5c4a37] hover:bg-[#e4d7c7] transition shadow-xs ${className}`}
        title="Condividi Note di Fede con cantori e parrocchiani"
      >
        {copied ? (
          <>
            <span className="text-emerald-700 font-bold">✓ Link Copiato!</span>
          </>
        ) : (
          <>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>Condividi App</span>
          </>
        )}
      </button>
    );
  }

  if (variant === "sidebar") {
    return (
      <button
        onClick={handleShare}
        className={`w-full flex items-center justify-center gap-2 rounded-2xl border border-[#d7c7b5] bg-[#fbf8f4] py-2.5 px-3 text-xs font-bold text-[#5c4a37] hover:bg-[#ede4d6] transition shadow-xs ${className}`}
        title="Condividi l'app con altri membri del coro o della comunità"
      >
        {copied ? (
          <span className="text-emerald-700 font-bold">✓ Link Copiato negli Appunti!</span>
        ) : (
          <>
            <svg className="h-4 w-4 text-[#8a755d]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>Condividi l'App</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center gap-2 rounded-xl bg-[#5c4a37] px-4 py-2 text-xs font-bold text-white hover:bg-[#4a3a29] transition shadow-sm ${className}`}
    >
      {copied ? (
        <span>✓ Link Copiato!</span>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span>Condividi Note di Fede</span>
        </>
      )}
    </button>
  );
}
