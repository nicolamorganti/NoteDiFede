"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export type LiturgyRite = "ambrosiano" | "romano";
export type LiturgyMoment = "lodi" | "ora_media" | "vespri" | "compieta" | "ufficio" | "messa";

const MOMENTS: { id: LiturgyMoment; label: string; icon: string; timeHint: string }[] = [
  { id: "lodi", label: "Lodi", icon: "☀️", timeHint: "06:00 - 09:30" },
  { id: "ora_media", label: "Ora Media", icon: "🕒", timeHint: "09:30 - 17:00" },
  { id: "vespri", label: "Vespri", icon: "🌅", timeHint: "17:00 - 21:00" },
  { id: "compieta", label: "Compieta", icon: "🌙", timeHint: "21:00 - 06:00" },
  { id: "ufficio", label: "Ufficio", icon: "📖", timeHint: "Letture" },
  { id: "messa", label: "Messa", icon: "✝️", timeHint: "Vangelo & Letture" },
];

function getAutomaticMoment(): LiturgyMoment {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 10) return "lodi";
  if (hour >= 10 && hour < 17) return "ora_media";
  if (hour >= 17 && hour < 21) return "vespri";
  if (hour >= 21 || hour < 5) return "compieta";
  return "ufficio";
}

function getTodayIsoString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function LiturgiaReader() {
  // Stato Rito con persistenza in localStorage (default: ambrosiano)
  const [rite, setRite] = useState<LiturgyRite>("ambrosiano");
  const [moment, setMoment] = useState<LiturgyMoment>("lodi");
  const [selectedDate, setSelectedDate] = useState<string>(getTodayIsoString());

  // Preferenze di lettura
  const [fontSize, setFontSize] = useState<number>(18); // 15, 18, 21, 24
  const [isChurchMode, setIsChurchMode] = useState<boolean>(false); // Modalità Chiesa Notturna

  // Dati e caricamento
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [contentHtml, setContentHtml] = useState<string>("");
  const [liturgicalInfo, setLiturgicalInfo] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const readerContainerRef = useRef<HTMLDivElement | null>(null);

  // Inizializza preferenze da localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedRite = localStorage.getItem("preferred_rite") as LiturgyRite;
      if (savedRite === "ambrosiano" || savedRite === "romano") {
        setRite(savedRite);
      }
      const savedSize = localStorage.getItem("liturgia_font_size");
      if (savedSize) {
        const num = parseInt(savedSize, 10);
        if (!isNaN(num) && num >= 14 && num <= 28) {
          setFontSize(num);
        }
      }
      const savedChurchMode = localStorage.getItem("liturgia_church_mode");
      if (savedChurchMode === "true") {
        setIsChurchMode(true);
      }

      // Imposta il momento automatico in base all'ora
      setMoment(getAutomaticMoment());
    }
  }, []);

  // Salva rito preferito su cambio
  const handleRiteChange = (newRite: LiturgyRite) => {
    setRite(newRite);
    if (typeof window !== "undefined") {
      localStorage.setItem("preferred_rite", newRite);
    }
  };

  // Salva dimensione font
  const handleFontSizeChange = (delta: number) => {
    setFontSize((prev) => {
      const next = Math.max(15, Math.min(26, prev + delta));
      if (typeof window !== "undefined") {
        localStorage.setItem("liturgia_font_size", String(next));
      }
      return next;
    });
  };

  // Salva modalità chiesa
  const toggleChurchMode = () => {
    setIsChurchMode((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("liturgia_church_mode", String(next));
      }
      return next;
    });
  };

  // Caricamento dei testi
  const fetchLiturgy = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/liturgia?rite=${rite}&moment=${moment}&date=${selectedDate}`
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Errore HTTP ${res.status}`);
      }
      const data = await res.json();
      setContentHtml(data.contentHtml || "<p>Nessun testo disponibile.</p>");
      setLiturgicalInfo(data.liturgicalInfo || "");
      
      // Scorri delicatamente in cima all'area di lettura
      if (readerContainerRef.current) {
        readerContainerRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    } catch (err: any) {
      console.error("Errore fetch liturgia:", err);
      setError(err.message || "Impossibile caricare i testi liturgici.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiturgy();
  }, [rite, moment, selectedDate]);

  // Gestione cambio data veloce (Oggi, Ieri, Domani)
  const changeDateByDays = (days: number) => {
    const current = new Date(selectedDate);
    if (!isNaN(current.getTime())) {
      current.setDate(current.getDate() + days);
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, "0");
      const day = String(current.getDate()).padStart(2, "0");
      setSelectedDate(`${year}-${month}-${day}`);
    }
  };

  // Copia testo pulito negli appunti
  const handleCopyText = async () => {
    if (!contentHtml) return;
    try {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = contentHtml;
      const plainText = tempDiv.innerText || tempDiv.textContent || "";
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error("Errore copia testo:", e);
    }
  };

  // Data formattata in italiano per il titolo
  const formattedDateTitle = new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(selectedDate));

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Header Intestazione */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e4dcce] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#5c4a37] text-white shadow-sm">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#aa9576]">
              Preghiera Liturgica Quotidiana
            </span>
          </div>
          <h2 className="font-serif text-3xl font-normal text-[#3f3933] mt-1">
            Liturgia delle Ore
          </h2>
          <p className="text-sm text-[#736555] capitalize">
            {formattedDateTitle}
          </p>
        </div>

        {/* Selettore Rito (Memorizzato per utente) */}
        <div className="flex items-center p-1 rounded-2xl bg-[#ebe3d5] border border-[#dacbb8] shadow-inner">
          <button
            onClick={() => handleRiteChange("ambrosiano")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              rite === "ambrosiano"
                ? "bg-[#5c4a37] text-white shadow-md"
                : "text-[#6b5d4e] hover:text-[#3f3933]"
            }`}
          >
            <span>Rito Ambrosiano</span>
            {rite === "ambrosiano" && (
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            )}
          </button>

          <button
            onClick={() => handleRiteChange("romano")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              rite === "romano"
                ? "bg-[#5c4a37] text-white shadow-md"
                : "text-[#6b5d4e] hover:text-[#3f3933]"
            }`}
          >
            <span>Rito Romano</span>
            {rite === "romano" && (
              <span className="h-2 w-2 rounded-full bg-indigo-400"></span>
            )}
          </button>
        </div>
      </div>

      {/* Barra Selettore Momenti del Giorno */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {MOMENTS.map((m) => {
          const isActive = moment === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMoment(m.id)}
              className={`flex flex-col items-center justify-center rounded-2xl border p-3 text-center transition ${
                isActive
                  ? "border-[#5c4a37] bg-[#5c4a37] text-white shadow-md scale-[1.02]"
                  : "border-[#e0d6c7] bg-[#fffdfa] text-[#5c4a37] hover:bg-[#f6eee3] hover:border-[#aa9576]"
              }`}
            >
              <span className="text-xl mb-1">{m.icon}</span>
              <span className="text-xs font-bold">{m.label}</span>
              <span
                className={`text-[10px] ${
                  isActive ? "text-white/80" : "text-[#8e7e6e]"
                }`}
              >
                {m.timeHint}
              </span>
            </button>
          );
        })}
      </div>

      {/* Barra di Controllo: Data + Strumenti Lettura */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#e4dcce] bg-[#fffdfa] p-4 shadow-sm">
        {/* Controlli Data */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeDateByDays(-1)}
            className="rounded-xl border border-[#d9cdbf] bg-[#fbf8f4] p-2 text-[#5c4a37] hover:bg-[#ede4d6] transition"
            title="Giorno precedente"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-xl border border-[#d9cdbf] bg-[#fbf8f4] px-3 py-1.5 text-xs font-semibold text-[#3f3933] outline-none transition focus:border-[#aa9576]"
          />

          <button
            onClick={() => changeDateByDays(1)}
            className="rounded-xl border border-[#d9cdbf] bg-[#fbf8f4] p-2 text-[#5c4a37] hover:bg-[#ede4d6] transition"
            title="Giorno successivo"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => setSelectedDate(getTodayIsoString())}
            className="rounded-xl bg-[#f4efe6] px-3 py-1.5 text-xs font-bold text-[#6e5a45] hover:bg-[#ebdcc8] transition"
          >
            Oggi
          </button>
        </div>

        {/* Strumenti Lettura (Dimensione Testo + Modalità Chiesa + Copia) */}
        <div className="flex items-center gap-2">
          {/* Dimensione Font */}
          <div className="flex items-center rounded-xl border border-[#d9cdbf] bg-[#fbf8f4] p-0.5">
            <button
              onClick={() => handleFontSizeChange(-2)}
              disabled={fontSize <= 15}
              className="px-2.5 py-1 text-xs font-bold text-[#5c4a37] hover:bg-[#ede4d6] rounded-lg transition disabled:opacity-30"
              title="Riduci dimensione testo"
            >
              A-
            </button>
            <span className="px-1 text-[11px] font-mono text-[#8a755d]">{fontSize}px</span>
            <button
              onClick={() => handleFontSizeChange(2)}
              disabled={fontSize >= 26}
              className="px-2.5 py-1 text-xs font-bold text-[#5c4a37] hover:bg-[#ede4d6] rounded-lg transition disabled:opacity-30"
              title="Aumenta dimensione testo"
            >
              A+
            </button>
          </div>

          {/* Toggle Modalità Chiesa (Sfondo Scuro per penombra) */}
          <button
            onClick={toggleChurchMode}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              isChurchMode
                ? "bg-[#292524] border-[#44403c] text-amber-300 shadow-sm"
                : "bg-[#fbf8f4] border-[#d9cdbf] text-[#5c4a37] hover:bg-[#ede4d6]"
            }`}
            title="Modalità Chiesa Notturna (sfondo scuro per penombra)"
          >
            <span>{isChurchMode ? "🌙 Notturna" : "☀️ Diurna"}</span>
          </button>

          {/* Pulsante Copia */}
          <button
            onClick={handleCopyText}
            className="flex items-center gap-1.5 rounded-xl border border-[#d9cdbf] bg-[#fbf8f4] px-3 py-1.5 text-xs font-semibold text-[#5c4a37] hover:bg-[#ede4d6] transition"
            title="Copia testo negli appunti"
          >
            {copied ? (
              <span className="text-emerald-600 font-bold">Copiato!</span>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                <span className="hidden sm:inline">Copia</span>
              </>
            )}
          </button>

          {/* Ricarica */}
          <button
            onClick={fetchLiturgy}
            className="rounded-xl border border-[#d9cdbf] bg-[#fbf8f4] p-2 text-[#5c4a37] hover:bg-[#ede4d6] transition"
            title="Ricarica testo"
          >
            <svg className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[#aa9576]" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Info Liturgica del Giorno se presente */}
      {liturgicalInfo && (
        <div className={`rounded-2xl border p-3 text-xs italic text-center transition ${
          isChurchMode
            ? "border-[#44403c] bg-[#1c1917] text-amber-200"
            : "border-[#ebdcc8] bg-[#fdfbf7] text-[#8a755d]"
        }`}>
          {liturgicalInfo}
        </div>
      )}

      {/* Area di Lettura del Breviario */}
      <div
        ref={readerContainerRef}
        className={`rounded-3xl border p-6 sm:p-10 shadow-lg transition-colors duration-300 ${
          isChurchMode
            ? "border-[#3f3a36] bg-[#181614] text-[#ece8e2]"
            : "border-[#e0d6c7] bg-[#fefdfb] text-[#2c2621]"
        }`}
      >
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#aa9576]/30 border-t-[#5c4a37]"></div>
            <p className="font-serif text-lg text-[#aa9576]">
              Caricamento dei testi di {MOMENTS.find((m) => m.id === moment)?.label} ({rite === "ambrosiano" ? "Rito Ambrosiano" : "Rito Romano"})...
            </p>
          </div>
        ) : error ? (
          <div className="py-12 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="font-serif text-lg text-rose-800">Impossibile caricare la liturgia</h4>
            <p className="text-xs text-rose-600 max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchLiturgy}
              className="rounded-full bg-[#5c4a37] px-5 py-2 text-xs font-semibold text-white hover:bg-[#4b3c2c] transition"
            >
              Riprova
            </button>
          </div>
        ) : (
          <article
            className="liturgia-content prose max-w-none font-serif leading-relaxed"
            style={{ fontSize: `${fontSize}px` }}
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        )}
      </div>

      {/* Stili CSS dedicati per la formattazione dei testi liturgici */}
      <style jsx global>{`
        .liturgia-content {
          line-height: 1.8;
          white-space: pre-line;
          word-break: break-word;
        }
        .liturgia-content p,
        .liturgia-content .liturgia-paragrafo {
          margin-bottom: 1.25em;
          display: block;
        }
        .liturgia-content b,
        .liturgia-content strong {
          font-weight: 700;
          color: ${isChurchMode ? "#f5f5f4" : "#1c1917"};
        }
        .liturgia-content .rubrica,
        .liturgia-content [style*="color:#cc0000"],
        .liturgia-content [style*="color: #cc0000"],
        .liturgia-content [style*="color:#990000"],
        .liturgia-content [style*="color: #990000"],
        .liturgia-content [style*="color:red"],
        .liturgia-content [style*="color: red"] {
          color: ${isChurchMode ? "#f87171 !important" : "#b91c1c !important"};
          font-style: italic;
          display: inline;
        }
        .liturgia-content .sezione,
        .liturgia-content .sezione-titolo,
        .liturgia-content .titolo,
        .liturgia-content h1,
        .liturgia-content h2,
        .liturgia-content h3 {
          display: block;
          font-family: inherit;
          font-weight: 700;
          font-size: 1.15em;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: ${isChurchMode ? "#fbbf24" : "#6e5a45"};
          margin-top: 1.8em;
          margin-bottom: 0.6em;
          border-bottom: 1px solid ${isChurchMode ? "#292524" : "#f0e6d8"};
          padding-bottom: 0.3em;
        }
        .liturgia-content .salmo-titolo,
        .liturgia-content .preghiera-titolo,
        .liturgia-content h4 {
          display: block;
          font-family: inherit;
          font-weight: 700;
          font-size: 1.05em;
          color: ${isChurchMode ? "#fde047" : "#5c4a37"};
          margin-top: 1.4em;
          margin-bottom: 0.4em;
        }
        .liturgia-content .antifona-badge {
          display: inline-block;
          font-weight: bold;
          color: ${isChurchMode ? "#f87171" : "#b91c1c"};
        }
        .liturgia-content .capolettera_grande,
        .liturgia-content .capolettera_piccolo {
          font-weight: bold;
          color: ${isChurchMode ? "#f87171" : "#b91c1c"};
        }
        .liturgia-content hr {
          border-color: ${isChurchMode ? "#3f3a36" : "#e2d5c4"};
          margin: 2em 0;
        }
      `}</style>

    </div>
  );
}
