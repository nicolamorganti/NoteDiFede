"use client";

import { useState, useEffect, useRef } from "react";
import { PreghieraNav } from "@/components/preghiera-nav";
import { LiturgicalTtsPlayer } from "@/components/liturgical-tts-player";
import { getLiturgicalDayDetails } from "@/lib/liturgical-calendar";



export type LiturgyRite = "ambrosiano" | "romano";
export type LiturgyMoment = "lodi" | "ora_media" | "vespri" | "compieta" | "ufficio" | "messa";
export type LineSpacingOption = "compact" | "normal" | "relaxed";

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

function formatMarkdownToHtml(markdown: string): string {
  let html = markdown
    .replace(/^### (.*$)/gim, '<h4 class="omelia-h4">$1</h4>')
    .replace(/^## (.*$)/gim, '<h3 class="omelia-h3">$1</h3>')
    .replace(/^# (.*$)/gim, '<h2 class="omelia-h2">$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^>\s*(.*$)/gim, '<blockquote class="omelia-quote">$1</blockquote>')
    .replace(/^\s*-\s+(.*$)/gim, '<li class="omelia-li">$1</li>')
    .replace(/^\s*\*\s+(.*$)/gim, '<li class="omelia-li">$1</li>')
    .replace(/\n\n+/g, '</p><p class="omelia-p">')
    .replace(/\n/g, "<br />");

  return `<div class="omelia-body"><p class="omelia-p">${html}</p></div>`;
}

function extractGospelText(html: string): string {
  const plainText = html
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();

  const vangeloMatch = plainText.search(/(?:VANGELO|Dal Vangelo secondo)/i);
  if (vangeloMatch !== -1) {
    const afterVangelo = plainText.slice(vangeloMatch);
    const endMatch = afterVangelo.search(
      /(?:DOPO IL VANGELO|SUI DONI|ALLA COMUNIONE|PREGHIERA DEI FEDELI|PROFESSIONE DI FEDE|DOPO LA COMUNIONE)/i
    );
    if (endMatch !== -1 && endMatch > 100) {
      return afterVangelo.slice(0, endMatch).trim();
    }
    return afterVangelo.trim();
  }
  return plainText.trim();
}


function splitContentAtGospelEnd(html: string) {
  // 1. Cerca la fine del tag audio (dopo l'audio del Vangelo)
  const audioEndIdx = html.indexOf("</audio>");
  if (audioEndIdx !== -1) {
    const splitPoint = audioEndIdx + "</audio>".length;
    return {
      before: html.slice(0, splitPoint),
      after: html.slice(splitPoint),
      hasGospel: true,
    };
  }

  // 2. In alternativa, cerca l'inizio della sezione successiva
  const markers = [
    /<strong>\s*DOPO IL VANGELO\s*<\/strong>/i,
    /<strong>\s*SUI DONI\s*<\/strong>/i,
    /<strong>\s*ALLA COMUNIONE\s*<\/strong>/i,
    /<h[1-6][^>]*>\s*DOPO IL VANGELO\s*<\/h[1-6]>/i,
  ];

  for (const regex of markers) {
    const match = regex.exec(html);
    if (match) {
      return {
        before: html.slice(0, match.index),
        after: html.slice(match.index),
        hasGospel: true,
      };
    }
  }

  return {
    before: html,
    after: "",
    hasGospel: false,
  };
}

const LITURGICAL_LANGUAGES = [
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "la", name: "Latino", flag: "🇻🇦" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "ro", name: "Română", flag: "🇷🇴" },
  { code: "monastico", name: "Monastico", flag: "⛪" },
  { code: "vetus", name: "Vetus Ordo", flag: "🕊️" },
];

export function LiturgiaReader() {
  // Stato Rito con persistenza in localStorage (default: ambrosiano)
  const [rite, setRite] = useState<LiturgyRite>("ambrosiano");
  const [moment, setMoment] = useState<LiturgyMoment>("lodi");
  const [selectedDate, setSelectedDate] = useState<string>(getTodayIsoString());
  const [selectedLang, setSelectedLang] = useState<string>("it");
  const [isDualMode, setIsDualMode] = useState<boolean>(false);
  const [secondaryLang, setSecondaryLang] = useState<string>("la");
  const [contentHtmlSecondary, setContentHtmlSecondary] = useState<string>("");
  const [loadingSecondary, setLoadingSecondary] = useState<boolean>(false);

  // Preferenze di lettura
  const [fontSize, setFontSize] = useState<number>(17); // 14 to 26 px
  const [lineSpacing, setLineSpacing] = useState<LineSpacingOption>("compact"); // compact, normal, relaxed
  const [isChurchMode, setIsChurchMode] = useState<boolean>(false); // Modalità Chiesa Notturna

  // Dati e caricamento
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [contentHtml, setContentHtml] = useState<string>("");
  const [liturgicalInfo, setLiturgicalInfo] = useState<string>("");
  const [temporalInfo, setTemporalInfo] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);


  // Stato Supporto alla Comprensione (Omelia Card. Martini)
  const [omeliaLoading, setOmeliaLoading] = useState<boolean>(false);
  const [omeliaText, setOmeliaText] = useState<string | null>(null);
  const [omeliaError, setOmeliaError] = useState<string | null>(null);
  const [showOmelia, setShowOmelia] = useState<boolean>(false);
  const [copiedOmelia, setCopiedOmelia] = useState<boolean>(false);
  const [omeliaElapsedSeconds, setOmeliaElapsedSeconds] = useState<number>(0);

  const readerContainerRef = useRef<HTMLDivElement | null>(null);
  const omeliaSectionRef = useRef<HTMLDivElement | null>(null);
  const omeliaAbortControllerRef = useRef<AbortController | null>(null);

  // Inizializza preferenze da localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedRite = localStorage.getItem("preferred_rite") as LiturgyRite;
      if (savedRite === "ambrosiano" || savedRite === "romano") {
        setRite(savedRite);
      }
      const savedLang = localStorage.getItem("liturgia_pref_lang");
      if (savedLang) setSelectedLang(savedLang);
      const savedDual = localStorage.getItem("liturgia_dual_mode");
      if (savedDual === "true") setIsDualMode(true);
      const savedSecLang = localStorage.getItem("liturgia_secondary_lang");
      if (savedSecLang) setSecondaryLang(savedSecLang);

      const savedSize = localStorage.getItem("liturgia_font_size");
      if (savedSize) {
        const num = parseInt(savedSize, 10);
        if (!isNaN(num) && num >= 14 && num <= 28) {
          setFontSize(num);
        }
      }
      const savedSpacing = localStorage.getItem("liturgia_line_spacing") as LineSpacingOption;
      if (savedSpacing === "compact" || savedSpacing === "normal" || savedSpacing === "relaxed") {
        setLineSpacing(savedSpacing);
      }
      const savedChurchMode = localStorage.getItem("liturgia_church_mode");
      if (savedChurchMode === "true") {
        setIsChurchMode(true);
      }

      // Imposta il momento automatico in base all'ora
      setMoment(getAutomaticMoment());
    }
  }, []);

  const handleLangChange = (newLang: string) => {
    setSelectedLang(newLang);
    if (secondaryLang === newLang) {
      setSecondaryLang(newLang === "la" ? "it" : "la");
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("liturgia_pref_lang", newLang);
    }
  };

  const handleSecondaryLangChange = (newLang: string) => {
    setSecondaryLang(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("liturgia_secondary_lang", newLang);
    }
  };

  const toggleDualMode = () => {
    const next = !isDualMode;
    setIsDualMode(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("liturgia_dual_mode", String(next));
    }
  };

  // Timer per l'elaborazione dell'omelia
  useEffect(() => {
    let interval: any;
    if (omeliaLoading) {
      setOmeliaElapsedSeconds(0);
      interval = setInterval(() => {
        setOmeliaElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setOmeliaElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [omeliaLoading]);

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
      const next = Math.max(14, Math.min(26, prev + delta));
      if (typeof window !== "undefined") {
        localStorage.setItem("liturgia_font_size", String(next));
      }
      return next;
    });
  };

  // Cambia interlinea a rotazione
  const cycleLineSpacing = () => {
    setLineSpacing((prev) => {
      let next: LineSpacingOption = "compact";
      if (prev === "compact") next = "normal";
      else if (prev === "normal") next = "relaxed";
      else next = "compact";

      if (typeof window !== "undefined") {
        localStorage.setItem("liturgia_line_spacing", next);
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

  // Caricamento dei testi (Primaria)
  const fetchLiturgy = async () => {
    setLoading(true);
    setError(null);
    setOmeliaText(null);
    setShowOmelia(false);
    setOmeliaError(null);

    try {
      const langParam = rite === "romano" ? `&lang=${selectedLang}` : "";
      const res = await fetch(
        `/api/liturgia?rite=${rite}&moment=${moment}&date=${selectedDate}${langParam}`
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Errore HTTP ${res.status}`);
      }
      const data = await res.json();
      setContentHtml(data.contentHtml || "<p>Nessun testo disponibile.</p>");
      setLiturgicalInfo(data.liturgicalInfo || "");
      setTemporalInfo(data.temporalInfo || "");


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

  // Caricamento testo a fronte per lingua secondaria (Rito Romano)
  const fetchSecondaryLiturgy = async () => {
    if (rite !== "romano" || !isDualMode) return;
    setLoadingSecondary(true);

    try {
      const res = await fetch(
        `/api/liturgia?rite=romano&moment=${moment}&date=${selectedDate}&lang=${secondaryLang}`
      );
      if (res.ok) {
        const data = await res.json();
        setContentHtmlSecondary(data.contentHtml || "<p>Nessun testo secondario disponibile.</p>");
      }
    } catch (err) {
      console.error("Errore fetch liturgia secondaria:", err);
    } finally {
      setLoadingSecondary(false);
    }
  };

  useEffect(() => {
    fetchLiturgy();
  }, [rite, moment, selectedDate, selectedLang]);

  useEffect(() => {
    if (isDualMode && rite === "romano") {
      fetchSecondaryLiturgy();
    }
  }, [rite, moment, selectedDate, secondaryLang, isDualMode]);



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

  // Annulla generazione omelia
  const handleCancelOmelia = () => {
    if (omeliaAbortControllerRef.current) {
      omeliaAbortControllerRef.current.abort();
    }
    setOmeliaLoading(false);
    setOmeliaError("Generazione annullata dall'utente.");
  };

  // Generazione Supporto alla Comprensione (Omelia Card. Martini) con Gemini
  const handleGenerateOmelia = async () => {
    if (omeliaText) {
      setShowOmelia((prev) => !prev);
      return;
    }

    if (!contentHtml) return;

    const gospelText = extractGospelText(contentHtml);
    if (!gospelText || gospelText.length < 20) {
      setOmeliaError("Testo del Vangelo non identificato.");
      return;
    }

    const controller = new AbortController();
    omeliaAbortControllerRef.current = controller;

    setOmeliaLoading(true);
    setOmeliaError(null);
    setShowOmelia(true);

    try {
      const res = await fetch("/api/liturgia/omelia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: gospelText,
          liturgicalInfo,
          rite,
          date: selectedDate,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Errore HTTP ${res.status}: Impossibile completare la richiesta.`);
      }

      const data = await res.json();
      setOmeliaText(data.omelia);

      setTimeout(() => {
        if (omeliaSectionRef.current) {
          omeliaSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } catch (err: any) {
      if (err.name === "AbortError") {
        setOmeliaError("Elaborazione annullata.");
      } else {
        console.error("Errore generazione Omelia:", err);
        setOmeliaError(err.message || "Impossibile generare la riflessione sul Vangelo.");
      }
    } finally {
      setOmeliaLoading(false);
    }
  };

  // Copia Omelia
  const handleCopyOmelia = async () => {
    if (!omeliaText) return;
    try {
      await navigator.clipboard.writeText(omeliaText);
      setCopiedOmelia(true);
      setTimeout(() => setCopiedOmelia(false), 2500);
    } catch (e) {
      console.error("Errore copia omelia:", e);
    }
  };

  // Data formattata in italiano per il titolo
  const formattedDateTitle = new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(selectedDate));

  // Dettagli teologici e canonici del giorno liturgico (Tempo, Salterio I-IV, Anno I-II)
  const liturgicalDayDetails = getLiturgicalDayDetails(selectedDate, rite, temporalInfo);



  // Valori calcolati per l'interlinea
  const lineHeightValue = lineSpacing === "compact" ? 1.38 : lineSpacing === "normal" ? 1.58 : 1.85;
  const paragraphMarginValue = lineSpacing === "compact" ? "0.45em" : lineSpacing === "normal" ? "0.75em" : "1.15em";
  const spacingLabel = lineSpacing === "compact" ? "Compatta" : lineSpacing === "normal" ? "Normale" : "Ampia";

  // Suddivide il testo esattamente dopo l'audio del Vangelo
  const splitContent = splitContentAtGospelEnd(contentHtml);

  // Render del blocco "Supporto alla Comprensione"
  const renderSupportoComprensione = () => (
    <div className="my-8 pt-4 pb-2 border-y" style={{ borderColor: isChurchMode ? "#38332f" : "#ebdcc8" }}>
      <div
        className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-3xl border shadow-sm transition"
        style={{
          backgroundColor: isChurchMode ? "#25201d" : "#fdfbf7",
          borderColor: isChurchMode ? "#443e38" : "#ebdcc8",
        }}
      >
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-lg">✨</span>
            <h3 className="font-serif font-bold text-base" style={{ color: isChurchMode ? "#fbbf24" : "#5c4a37" }}>
              Supporto alla Comprensione
            </h3>
          </div>
          <p className="text-xs text-[#8a755d]">
            Breve riflessione sul Vangelo di oggi
          </p>
        </div>


        <button
          onClick={handleGenerateOmelia}
          disabled={omeliaLoading}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#5c4a37] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#4a3a29] transition shadow-md disabled:opacity-50 shrink-0"
        >
          {omeliaLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
              <span>Elaborazione Riflessione...</span>
            </>
          ) : showOmelia && omeliaText ? (
            <>
              <span>📖 Mostra/Nascondi Riflessione</span>
            </>
          ) : (
            <>
              <span>✨ Supporto alla Comprensione</span>
            </>
          )}
        </button>
      </div>

      {/* Sezione di Caricamento Animato con Timer */}
      {omeliaLoading && (
        <div
          className="mt-6 p-8 rounded-3xl border text-center space-y-4 shadow-sm"
          style={{
            backgroundColor: isChurchMode ? "#1f1b18" : "#fbf8f3",
            borderColor: isChurchMode ? "#443e38" : "#ebdcc8",
          }}
        >
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5c4a37] text-white shadow-md animate-bounce">
            ✨
          </div>
          <div className="space-y-1">
            <h4 className="font-serif font-bold text-base" style={{ color: isChurchMode ? "#fbbf24" : "#5c4a37" }}>
              Ascolto del Vangelo in corso...
            </h4>
            <p className="text-xs text-[#8a755d] max-w-md mx-auto">
              Gemini Flash sta elaborando una breve riflessione omiletica secondo la sapienza del Cardinale Carlo Maria Martini.
            </p>
          </div>

          {/* Timer di avanzamento & Pulsante Annulla */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold"
              style={{
                backgroundColor: isChurchMode ? "#332b26" : "#ebdcc8",
                color: isChurchMode ? "#fde047" : "#5c4a37",
              }}
            >
              ⏱️ {omeliaElapsedSeconds}s trascorsi · provo catena Gemini Flash (20s)
            </span>
            <button
              onClick={handleCancelOmelia}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition"
              style={{
                backgroundColor: isChurchMode ? "#3b1e1e" : "#fef2f2",
                color: isChurchMode ? "#fca5a5" : "#b91c1c",
                border: `1px solid ${isChurchMode ? "#6b2525" : "#fecaca"}`,
              }}
            >
              ✕ Annulla attesa
            </button>
          </div>
        </div>
      )}

      {/* Errore Generazione Omelia */}
      {omeliaError && (
        <div
          className="mt-6 p-6 rounded-3xl border text-center space-y-3 shadow-sm"
          style={{
            backgroundColor: isChurchMode ? "#281b18" : "#fff8f3",
            borderColor: isChurchMode ? "#58201a" : "#fed7aa",
          }}
        >
          <div
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
            style={{
              backgroundColor: isChurchMode ? "#421815" : "#ffedd5",
              color: isChurchMode ? "#fca5a5" : "#9a3412",
            }}
          >
            ⚠️
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold" style={{ color: isChurchMode ? "#fca5a5" : "#9a3412" }}>
              Stato riflessione sul Vangelo:
            </p>
            <p className="text-xs max-w-md mx-auto" style={{ color: isChurchMode ? "#e5b7b2" : "#c2410c" }}>
              {omeliaError}
            </p>
          </div>
          <button
            onClick={handleGenerateOmelia}
            className="px-5 py-2 rounded-full bg-[#5c4a37] text-white text-xs font-bold hover:bg-[#4a3a29] transition shadow-sm"
          >
            🔄 Riprova con il modello successivo
          </button>
        </div>
      )}

      {/* Risultato Supporto alla Comprensione Generato */}
      {showOmelia && omeliaText && !omeliaLoading && (
        <div
          ref={omeliaSectionRef}
          className="mt-6 p-6 sm:p-8 rounded-3xl border shadow-md transition-colors duration-300 space-y-5"
          style={{
            backgroundColor: isChurchMode ? "#201c19" : "#faf6f0",
            borderColor: isChurchMode ? "#443e38" : "#e5d7c5",
          }}
        >
          {/* Intestazione Card */}
          <div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4"
            style={{ borderColor: isChurchMode ? "#38332f" : "#e8dcce" }}
          >
            <div className="space-y-1">
              <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#aa9576]">
                Riflessione Biblica · Stile Card. Martini
              </span>
              <h4 className="text-lg sm:text-xl font-bold font-serif" style={{ color: isChurchMode ? "#fbbf24" : "#5c4a37" }}>
                Supporto alla Comprensione del Vangelo
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyOmelia}
                className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition"
                style={{
                  borderColor: isChurchMode ? "#443e38" : "#d9cdbf",
                  backgroundColor: isChurchMode ? "#2b2521" : "#fbf8f4",
                  color: isChurchMode ? "#ece8e2" : "#5c4a37",
                }}
              >
                {copiedOmelia ? (
                  <span className="text-emerald-600 font-bold">Copiata!</span>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    <span>Copia Riflessione</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowOmelia(false)}
                className="rounded-xl border p-1.5 text-xs transition"
                style={{
                  borderColor: isChurchMode ? "#443e38" : "#d9cdbf",
                  backgroundColor: isChurchMode ? "#2b2521" : "#fbf8f4",
                  color: isChurchMode ? "#ece8e2" : "#5c4a37",
                }}
                title="Nascondi"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Contenuto Testo Omelia */}
          <div
            className="omelia-rendered-content font-serif leading-relaxed max-h-[450px] overflow-y-auto pr-3 rounded-2xl p-4 border shadow-inner"
            style={{
              fontSize: `${fontSize - 1}px`,
              backgroundColor: isChurchMode ? "#1a1614" : "#fefdfa",
              borderColor: isChurchMode ? "#38332f" : "#e4d7c7",
            }}
            dangerouslySetInnerHTML={{ __html: formatMarkdownToHtml(omeliaText) }}
          />

          {/* Citazione conclusiva */}
          <div
            className="border-t pt-3 text-center italic text-xs text-[#8a755d]"
            style={{ borderColor: isChurchMode ? "#38332f" : "#e8dcce" }}
          >
            «Il Vangelo non è una pagina da conservare nel cassetto, ma un fuoco che accende il cammino dell'uomo.» — Card. Carlo Maria Martini
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Sottomenu di Navigazione Sezione Preghiera */}
      <PreghieraNav />

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
            {moment === "messa" ? "Santa Messa" : "Liturgia delle Ore"}
          </h2>
          <div className="mt-1 space-y-0.5">
            <p className="text-sm font-semibold text-[#5c4a37] capitalize">
              {MOMENTS.find((m) => m.id === moment)?.label} · {formattedDateTitle}
            </p>
            <p className="text-xs text-[#8a755d] italic font-serif">
              {liturgicalDayDetails.tempoLiturgico}, {liturgicalDayDetails.salterioLabel} · <span className="font-sans font-bold text-[#6b5d4e] not-italic">{liturgicalDayDetails.annoFeriale}</span>
            </p>
          </div>
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

        {/* Strumenti Lettura (Lingua + Dimensione Font + Interlinea + Modalità Chiesa + Copia) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Selettore Lingua & Testo a Fronte (attivo per Rito Romano) */}
          {rite === "romano" && (
            <>
              <div className="relative flex items-center rounded-xl border border-[#d9cdbf] bg-[#fbf8f4] px-2 py-1">
                <span className="text-xs mr-1">🌐</span>
                <select
                  value={selectedLang}
                  onChange={(e) => handleLangChange(e.target.value)}
                  className="bg-transparent text-xs font-bold text-[#5c4a37] focus:outline-none cursor-pointer pr-1"
                >
                  {LITURGICAL_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={toggleDualMode}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                  isDualMode
                    ? "bg-[#5c4a37] border-[#4a3c2c] text-amber-200 shadow-xs"
                    : "bg-[#fbf8f4] border-[#d9cdbf] text-[#5c4a37] hover:bg-[#ede4d6]"
                }`}
                title="Attiva/disattiva visualizzazione a due colonne con testo a fronte bilingue"
              >
                <span>📖 Testo a Fronte</span>
              </button>
            </>
          )}

          {/* Lettore Vocale Text-to-Speech */}
          <LiturgicalTtsPlayer
            htmlContent={contentHtml}
            lang={rite === "romano" ? selectedLang : "it"}
            title="Ascolta"
          />

          {/* Dimensione Font */}
          <div className="flex items-center rounded-xl border border-[#d9cdbf] bg-[#fbf8f4] p-0.5">

            <button
              onClick={() => handleFontSizeChange(-1)}
              disabled={fontSize <= 14}
              className="px-2.5 py-1 text-xs font-bold text-[#5c4a37] hover:bg-[#ede4d6] rounded-lg transition disabled:opacity-30"
              title="Riduci dimensione testo"
            >
              A-
            </button>
            <span className="px-1 text-[11px] font-mono text-[#8a755d]">{fontSize}px</span>
            <button
              onClick={() => handleFontSizeChange(1)}
              disabled={fontSize >= 26}
              className="px-2.5 py-1 text-xs font-bold text-[#5c4a37] hover:bg-[#ede4d6] rounded-lg transition disabled:opacity-30"
              title="Aumenta dimensione testo"
            >
              A+
            </button>
          </div>

          {/* Regolazione Interlinea Spaziatura */}
          <button
            onClick={cycleLineSpacing}
            className="flex items-center gap-1.5 rounded-xl border border-[#d9cdbf] bg-[#fbf8f4] px-3 py-1.5 text-xs font-semibold text-[#5c4a37] hover:bg-[#ede4d6] transition"
            title="Cambia interlinea e spaziatura (Compatta / Normale / Ampia)"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            <span>{spacingLabel}</span>
          </button>

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
      <div
        className="rounded-2xl border p-3 text-xs text-center transition space-y-1"
        style={{
          borderColor: isChurchMode ? "#44403c" : "#ebdcc8",
          backgroundColor: isChurchMode ? "#1c1917" : "#fdfbf7",
          color: isChurchMode ? "#fde047" : "#8a755d",
        }}
      >
        {liturgicalInfo && <div className="font-serif font-bold">{liturgicalInfo}</div>}
        <div className="text-[11px] opacity-90 italic">
          {liturgicalDayDetails.tempoLiturgico} · {liturgicalDayDetails.salterioLabel} · <span className="font-semibold not-italic">{liturgicalDayDetails.annoFeriale}</span>
        </div>
      </div>


      {/* Area di Lettura dei Testi Liturgici */}
      <div
        ref={readerContainerRef}
        className="rounded-3xl border p-6 sm:p-10 shadow-lg transition-colors duration-300"
        style={{
          borderColor: isChurchMode ? "#3f3a36" : "#e0d6c7",
          backgroundColor: isChurchMode ? "#181614" : "#fefdfb",
          color: isChurchMode ? "#ece8e2" : "#2c2621",
        }}
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
        ) : isDualMode && rite === "romano" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Colonna Sinistra (Lingua Primaria) */}
            <div className="flex flex-col border-b lg:border-b-0 lg:border-r pb-6 lg:pb-0 lg:pr-6 border-[#e4dcce]/50">
              <div className="flex items-center justify-between border-b pb-2 mb-4 border-[#e4dcce]/40">
                <div className="flex items-center gap-2">
                  <span className="text-xs">🌐</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#aa9576]">
                    {LITURGICAL_LANGUAGES.find((l) => l.code === selectedLang)?.flag}{" "}
                    {LITURGICAL_LANGUAGES.find((l) => l.code === selectedLang)?.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#8a755d] bg-[#f5ece0] px-2 py-0.5 rounded-md">
                  Testo Primario
                </span>
              </div>
              <article
                className="liturgia-content prose max-w-none font-serif flex-1"
                style={{
                  fontSize: `${fontSize}px`,
                  lineHeight: lineHeightValue,
                }}
              >
                <div dangerouslySetInnerHTML={{ __html: splitContent.before }} />
                {renderSupportoComprensione()}
                {splitContent.after && (
                  <div dangerouslySetInnerHTML={{ __html: splitContent.after }} />
                )}
              </article>
            </div>

            {/* Colonna Destra (Lingua Secondaria a Fronte) */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between border-b pb-2 mb-4 border-[#e4dcce]/40">
                <div className="flex items-center gap-2">
                  <span className="text-xs">⚖️</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#aa9576]">
                    A Fronte:
                  </span>
                  <select
                    value={secondaryLang}
                    onChange={(e) => handleSecondaryLangChange(e.target.value)}
                    className="bg-[#f0e4d2] border border-[#d8c5ad] rounded-lg px-2 py-0.5 text-xs font-bold text-[#5c4a37] focus:outline-none cursor-pointer"
                  >
                    {LITURGICAL_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.flag} {l.name}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-[10px] font-mono text-[#8a755d] bg-[#ebdcc8] px-2 py-0.5 rounded-md">
                  Traditio / Lingua a Fronte
                </span>
              </div>
              {loadingSecondary ? (
                <div className="py-16 text-center text-xs text-[#8a755d] flex items-center justify-center gap-2">
                  <span className="animate-spin text-base">⏳</span>
                  <span>Caricamento testo a fronte...</span>
                </div>
              ) : (
                <article
                  className="liturgia-content prose max-w-none font-serif flex-1"
                  style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: lineHeightValue,
                  }}
                  dangerouslySetInnerHTML={{ __html: contentHtmlSecondary }}
                />
              )}
            </div>
          </div>
        ) : (
          <article
            className="liturgia-content prose max-w-none font-serif"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: lineHeightValue,
            }}
          >
            {/* Prima parte del testo (fino alla fine dell'audio del Vangelo) */}
            <div dangerouslySetInnerHTML={{ __html: splitContent.before }} />

            {/* Pulsante & Card "Supporto alla Comprensione" esattamente dopo l'audio del Vangelo */}
            {renderSupportoComprensione()}

            {/* Seconda parte del testo (se presente, es. Dopo il Vangelo, Sui Doni, Comunione) */}
            {splitContent.after && (
              <div dangerouslySetInnerHTML={{ __html: splitContent.after }} />
            )}
          </article>
        )}
      </div>


      {/* Stili CSS dedicati per la formattazione dei testi liturgici */}
      <style jsx global>{`
        .liturgia-content {
          word-break: break-word;
        }
        .liturgia-content p,
        .liturgia-content .liturgia-paragrafo {
          margin-bottom: ${paragraphMarginValue};
          display: block;
        }
        .liturgia-content b,
        .liturgia-content strong {
          font-weight: 700;
          color: ${isChurchMode ? "#f5f5f4" : "#1c1917"};
        }
        .liturgia-content .rubrica,
        .liturgia-content .lo_nota,
        .liturgia-content [style*="color:#c42b25"],
        .liturgia-content [style*="color: #c42b25"],
        .liturgia-content [style*="color:#cc0000"],
        .liturgia-content [style*="color: #cc0000"],
        .liturgia-content [style*="color:#990000"],
        .liturgia-content [style*="color: #990000"],
        .liturgia-content [style*="color:red"],
        .liturgia-content [style*="color: red"] {
          color: ${isChurchMode ? "#f87171 !important" : "#b91c1c !important"};
          font-style: italic;
          display: block;
          margin-top: 0.35em;
          margin-bottom: 0.35em;
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
          font-size: 1.12em;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: ${isChurchMode ? "#fbbf24" : "#6e5a45"};
          margin-top: 1.4em;
          margin-bottom: 0.4em;
          border-bottom: 1px solid ${isChurchMode ? "#292524" : "#f0e6d8"};
          padding-bottom: 0.2em;
        }
        .liturgia-content .salmo-titolo,
        .liturgia-content .preghiera-titolo,
        .liturgia-content h4 {
          display: block;
          font-family: inherit;
          font-weight: 700;
          font-size: 1.02em;
          color: ${isChurchMode ? "#fde047" : "#5c4a37"};
          margin-top: 1em;
          margin-bottom: 0.3em;
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
          margin: 1.5em 0;
        }
        .omelia-rendered-content h2,
        .omelia-rendered-content h3,
        .omelia-rendered-content h4 {
          font-weight: bold;
          margin-top: 0.8em;
          margin-bottom: 0.2em;
          color: ${isChurchMode ? "#fbbf24" : "#5c4a37"};
        }
        .omelia-rendered-content strong {
          color: ${isChurchMode ? "#fde047" : "#5c4a37"};
        }
      `}</style>
    </div>
  );
}
