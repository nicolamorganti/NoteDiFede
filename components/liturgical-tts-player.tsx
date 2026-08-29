"use client";

import { useEffect, useState, useRef } from "react";

interface LiturgicalTtsPlayerProps {
  htmlContent: string;
  lang?: string;
  title?: string;
}

export function cleanTextForSpeech(html: string): string {
  if (!html || typeof window === "undefined") return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;

  // 1. Rimuovi elementi non testuali o non pertinenti alla preghiera ad alta voce
  const removeSelectors = [
    "script",
    "style",
    "audio",
    "iframe",
    "button",
    "sup",
    ".audio-player",
    ".menu",
    "nav",
    "svg",
    // Rimuovi istruzioni per la celebrazione e rubriche rosse / didascaliche
    ".rubrica",
    ".rubriche",
    ".rubrique",
    ".red",
    ".rosso",
    ".istruzioni",
    ".didascalia",
    ".guida-celebrazione",
    ".notainiziale",
    ".nota",
    "font[color='red']",
    "font[color='#ff0000']",
    "font[color='#b91c1c']",
    "font[color='#990000']",
    "span[style*='color: red']",
    "span[style*='color: #b91c1c']",
    "span[style*='color:#b91c1c']",
    "span[style*='color: rgb(185, 28, 28)']",
    "span[style*='color: rgb(255, 0, 0)']",
  ];
  removeSelectors.forEach((sel) => {
    tmp.querySelectorAll(sel).forEach((el) => el.remove());
  });

  // Rimuovi anche elementi con testo in rosso verificando lo stile inline
  tmp.querySelectorAll("span, p, font, em, i").forEach((el) => {
    const style = el.getAttribute("style") || "";
    const color = el.getAttribute("color") || "";
    if (
      style.includes("color: red") ||
      style.includes("color: #b91c1c") ||
      style.includes("color:#b91c1c") ||
      style.includes("color: rgb(185, 28, 28)") ||
      style.includes("color: rgb(255, 0, 0)") ||
      color === "red" ||
      color === "#b91c1c"
    ) {
      el.remove();
    }
  });

  let text = tmp.innerText || tmp.textContent || "";

  // 2. Rimuovi istruzioni tra parentesi e rubriche residue
  text = text
    .replace(/\([A-Z\s,]{1,50}\)/g, "") // es. (PAUSA), (SILENZIO), (TUTTI), (ORAZIONE)
    .replace(/\((?:Si fa una breve pausa|Si fa un breve silenzio|Tutti si alzano|Tutti si inginocchiano|In piedi|In ginocchio|Seduti|Pausa di silenzio|Pausa|Silenzio|Orazione|Antifona|Salmo|Cantico|Lettura|Vangelo|Prima Lettura|Seconda Lettura|Responsorio)[^)]*\)/gi, "")
    .replace(/\[(?:Si fa una breve pausa|Si fa un breve silenzio|Tutti si alzano|Tutti si inginocchiano|In piedi|In ginocchio|Seduti|Pausa|Silenzio|Orazione|Antifona)[^\]]*\]/gi, "");

  // 3. Rimuovi citazioni bibliche tecniche (es. Lc 1,68-79, Sal 142, 1-7, Mt 5,1-12, Is 60,1-6)
  const bibleBooksPattern =
    "(?:[1-3]\\s*)?(?:Gen|Es|Lv|Nm|Dt|Gs|Gdc|Rt|1Sam|2Sam|1Re|2Re|1Cr|2Cr|Esd|Ne|Tb|Gdt|Est|1Mac|2Mac|Gb|Sal|Pr|Qo|Ct|Sap|Sir|Is|Ger|Lam|Bar|Ez|Dn|Os|Gl|Am|Abd|Gna|Mi|Na|Ab|Sof|Ag|Zc|Ml|Mt|Mc|Lc|Gv|At|Rm|1Cor|2Cor|Gal|Ef|Fil|Col|1Ts|2Ts|1Tm|2Tm|Tt|Fm|Eb|Gc|1Pt|2Pt|1Gv|2Gv|3Gv|Gd|Ap)";

  // Parentesi con citazione biblica: es. (Lc 1, 68-79), (Sal 142, 1-7), (Mt 5, 1-12a)
  const parenCitationRegex = new RegExp(`\\(\\s*${bibleBooksPattern}\\s*\\.?\\s*\\d+(?:[\\s,.:;\\-–—a-zA-Z\\d]*)\\)`, "gi");
  text = text.replace(parenCitationRegex, "");

  // Citazione biblica senza parentesi su linea o inizio versetto: es. Lc 1,68-79 : o Sal 118, 1-8
  const inlineCitationRegex = new RegExp(`\\b${bibleBooksPattern}\\s*\\.?\\s*\\d+\\s*,\\s*\\d+(?:[\\-–—]\\d+)?(?:\\s*[,.]\\s*\\d+(?:[\\-–—]\\d+)?)*\\b`, "gi");
  text = text.replace(inlineCitationRegex, "");

  // 4. Normalizzazione dei dialoghi liturgici
  text = text
    .replace(/\bV\.\s*/g, "Guida: ")
    .replace(/\bR\.\s*/g, "Risposta: ")
    .replace(/\bC\.\s*/g, "Celebrante: ")
    .replace(/\bA\.\s*/g, "Assemblea: ")
    .replace(/\bL\.\s*/g, "Lettore: ");

  // 5. Rimuovi segni grafici liturgici che disturbano la lettura:
  // - Asterischi (*) usati nei salmi per la cadenza metrica
  // - Crocette (†, +, ☩) per la flessione
  // - Trattini lunghi o multipli (--, —, –)
  // - Barre (/), pipe (|), cancelletti (#), underscore (_), accenti circonflessi (^)
  text = text
    .replace(/[*†☩#_~^=|\/\\<>]/g, " ")
    .replace(/\s*[-–—]{1,}\s*/g, ", ") // Sostituisci trattini di stacco con una virgola per dare naturalezza di pausa
    .replace(/-\s*Menu\s*-/gi, "")
    .replace(/[\r\n]+/g, ". ")
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*,+/g, ",")
    .replace(/\s*\.\s*\.+/g, ".")
    .replace(/\s*,\s*\./g, ".")
    .replace(/\(\s*\)/g, "")
    .replace(/\[\s*\]/g, "")
    .trim();

  return text;
}

export function getAcousticWeight(text: string): number {
  if (!text) return 0;
  let weight = text.length;
  // Pause acustiche per punteggiatura forte (. ! ? :)
  const strongPauses = (text.match(/[.!?:]/g) || []).length;
  weight += strongPauses * 28;
  // Pause acustiche per punteggiatura media (, ;)
  const mediumPauses = (text.match(/[,;]/g) || []).length;
  weight += mediumPauses * 14;
  // Pausa naturale di chiusura versetto/paragrafo
  weight += 22;
  return weight;
}

export function LiturgicalTtsPlayer({ htmlContent, lang = "it", title = "Ascolta" }: LiturgicalTtsPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceType, setVoiceType] = useState<"neural" | "device" | null>(null);
  const [rate, setRate] = useState<number>(1.0); // 0.85, 1.0, 1.2
  const [autoScroll, setAutoScroll] = useState<boolean>(true); // Sincronizzazione e auto-scroll a tempo
  const [isSupported, setIsSupported] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  // Audio HTML5 (per Google Cloud Neural2 / Microsoft Azure Neural Cache)
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Web Speech API (per Fallback Dispositivo)
  const utterancesRef = useRef<SpeechSynthesisUtterance[]>([]);
  const currentUtteranceIndexRef = useRef<number>(0);

  // Riferimenti per Highlight e Auto-Scroll sincronizzato
  const currentHighlightedElementRef = useRef<HTMLElement | null>(null);
  const isUserScrollingRef = useRef<boolean>(false);
  const userInteractedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Rileva interazione manuale utente con lo scroll per non forzare la vista durante la lettura manuale
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onUserTouchOrWheel = () => {
      isUserScrollingRef.current = true;
      if (userInteractedTimeoutRef.current) clearTimeout(userInteractedTimeoutRef.current);
      userInteractedTimeoutRef.current = setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 4000); // Ritorna all'auto-scroll dopo 4 secondi di inattività
    };

    window.addEventListener("wheel", onUserTouchOrWheel, { passive: true });
    window.addEventListener("touchmove", onUserTouchOrWheel, { passive: true });
    return () => {
      window.removeEventListener("wheel", onUserTouchOrWheel);
      window.removeEventListener("touchmove", onUserTouchOrWheel);
      if (userInteractedTimeoutRef.current) clearTimeout(userInteractedTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsSupported("speechSynthesis" in window || typeof Audio !== "undefined");

      const handleScroll = () => {
        setIsScrolled(window.scrollY > 200);
      };
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", handleScroll);
        stopSpeech();
      };
    }
  }, []);

  // Ferma la riproduzione se cambia il contenuto o la lingua
  useEffect(() => {
    stopSpeech();
  }, [htmlContent, lang]);

  // Pulisce l'evidenziazione dorata sui blocchi DOM
  const clearHighlight = () => {
    if (currentHighlightedElementRef.current) {
      currentHighlightedElementRef.current.classList.remove("tts-active-reading-block");
      currentHighlightedElementRef.current = null;
    }
    if (typeof document !== "undefined") {
      document.querySelectorAll(".tts-active-reading-block").forEach((el) => {
        el.classList.remove("tts-active-reading-block");
      });
    }
  };

  // Aggiorna la posizione e l'highlight del blocco liturgico correntemente letto con precisione millimetrica
  const updateHighlightAndScroll = (progressRatio: number) => {
    if (typeof document === "undefined") return;

    // Trova il contenitore principale del testo liturgico
    const readerContainer =
      document.querySelector(".liturgia-content") ||
      document.querySelector(".benedizionale-content") ||
      document.querySelector(".messale-content") ||
      document.querySelector(".bibbia-content") ||
      document.querySelector("article");

    if (!readerContainer) return;

    // Seleziona solo i blocchi foglia (senza figli p/li/h per evitare doppie misurazioni del testo)
    const blocks = Array.from(
      readerContainer.querySelectorAll<HTMLElement>(
        "p, h1, h2, h3, h4, li, .orazione, .antifona"
      )
    ).filter((el) => {
      // Escludi contenitori padre che racchiudono già altri paragrafi o liste
      if (el.querySelector("p, li, h1, h2, h3, h4")) return false;
      if (el.closest(".audio-player, button, nav, script, .no-speech, .menu, .rubrica")) return false;
      const clean = cleanTextForSpeech(el.innerHTML);
      return clean.length > 5;
    });

    if (blocks.length === 0) return;

    // Calcola il peso acustico effettivo di ciascun blocco (comprensivo delle pause del parlato)
    const weights = blocks.map((b) => getAcousticWeight(cleanTextForSpeech(b.innerHTML)));
    const totalWeight = weights.reduce((acc, w) => acc + w, 0);
    if (totalWeight === 0) return;

    // Calcola l'indice del blocco attivo: un blocco [start, end] è attivo finché il parlato è al suo interno
    const targetPos = Math.max(0, Math.min(1, progressRatio)) * totalWeight;
    let runningSum = 0;
    let activeBlockIndex = 0;

    for (let i = 0; i < blocks.length; i++) {
      const blockStart = runningSum;
      const blockEnd = runningSum + weights[i];
      runningSum = blockEnd;

      // Il blocco rimane attivo fino al completamento dell'ultima frase
      if (targetPos >= blockStart && targetPos < blockEnd) {
        activeBlockIndex = i;
        break;
      }
      if (targetPos < blockStart) {
        activeBlockIndex = Math.max(0, i - 1);
        break;
      }
      if (i === blocks.length - 1) {
        activeBlockIndex = i;
      }
    }

    const activeEl = blocks[activeBlockIndex];
    if (!activeEl) return;

    if (currentHighlightedElementRef.current !== activeEl) {
      if (currentHighlightedElementRef.current) {
        currentHighlightedElementRef.current.classList.remove("tts-active-reading-block");
      }
      activeEl.classList.add("tts-active-reading-block");
      currentHighlightedElementRef.current = activeEl;

      // Auto-scroll fluido al centro dello schermo
      if (autoScroll && !isUserScrollingRef.current) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  };


  const mapLangToLocale = (l: string): string => {
    switch (l) {
      case "it":
        return "it-IT";
      case "la":
        return "it-IT";
      case "en":
        return "en-US";
      case "es":
        return "es-ES";
      case "fr":
        return "fr-FR";
      case "pt":
        return "pt-PT";
      case "ro":
        return "ro-RO";
      default:
        return "it-IT";
    }
  };

  const startSpeech = async () => {
    if (!htmlContent) return;
    stopSpeech();

    const fullText = cleanTextForSpeech(htmlContent);
    if (!fullText) return;

    setIsLoading(true);

    // Sblocco preventivo dell'elemento audio su iOS Safari (deve avvenire nel contesto sincrono del tap)
    let audio: HTMLAudioElement | null = null;
    if (typeof window !== "undefined" && typeof Audio !== "undefined") {
      audio = new Audio();
      audioRef.current = audio;
      // Pre-sblocco iOS Safari
      audio.load();
    }

    try {
      // 1. Richiedi l'audio HD neurale da /api/tts (Audio-Cache o Microsoft Azure Neural)
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: fullText, lang }),
      });

      const data = await res.json();

      if (data.success && data.audioBase64 && audio) {
        // Conversione Base64 -> Blob URL (compatibile al 100% con iOS Safari, macOS e Android)
        const binaryString = window.atob(data.audioBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "audio/mpeg" });
        const blobUrl = URL.createObjectURL(blob);

        audio.src = blobUrl;
        audio.playbackRate = rate;

        // Tracking e sincronizzazione continua con buffer prudenziale di 0.85s (evita cambi prima del termine della frase)
        audio.ontimeupdate = () => {
          if (audio && audio.duration && audio.duration > 0) {
            const adjustedCurrentTime = Math.max(0, audio.currentTime - 0.85);
            const ratio = adjustedCurrentTime / audio.duration;
            updateHighlightAndScroll(ratio);
          }
        };

        audio.onended = () => {
          URL.revokeObjectURL(blobUrl);
          clearHighlight();
          setIsPlaying(false);
          setIsPaused(false);
          setIsLoading(false);
        };

        audio.onerror = (e) => {
          console.warn("Errore riproduzione audio neurale, fallback su dispositivo:", e);
          URL.revokeObjectURL(blobUrl);
          playWithDeviceVoice(fullText);
        };

        await audio.play();
        setVoiceType("neural");
        setIsPlaying(true);
        setIsPaused(false);
        setIsLoading(false);
        updateHighlightAndScroll(0);
        return;
      }
    } catch (err) {
      console.warn("Errore chiamata API /api/tts, passo al dispositivo:", err);
    }

    // 2. Fallback trasparente sulla sintesi vocale del dispositivo
    playWithDeviceVoice(fullText);
  };



  const playWithDeviceVoice = (fullText: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsLoading(false);
      return;
    }

    window.speechSynthesis.cancel();

    const chunks = fullText.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g) || [fullText];
    const targetLocale = mapLangToLocale(lang);

    const availableVoices = window.speechSynthesis.getVoices();
    const matchedVoice =
      availableVoices.find((v) => v.lang === targetLocale) ||
      availableVoices.find((v) => v.lang.startsWith(targetLocale.slice(0, 2))) ||
      null;

    utterancesRef.current = chunks
      .map((chunk) => chunk.trim())
      .filter((chunk) => chunk.length > 0)
      .map((chunk) => {
        const u = new SpeechSynthesisUtterance(chunk);
        u.lang = targetLocale;
        u.rate = rate;
        if (matchedVoice) u.voice = matchedVoice;
        return u;
      });

    if (utterancesRef.current.length === 0) {
      setIsLoading(false);
      return;
    }

    currentUtteranceIndexRef.current = 0;

    const playNext = (index: number) => {
      if (index >= utterancesRef.current.length) {
        clearHighlight();
        setIsPlaying(false);
        setIsPaused(false);
        return;
      }

      currentUtteranceIndexRef.current = index;
      const utt = utterancesRef.current[index];

      utt.onstart = () => {
        const ratio = utterancesRef.current.length > 0 ? index / utterancesRef.current.length : 0;
        updateHighlightAndScroll(ratio);
      };

      utt.onend = () => {
        playNext(index + 1);
      };

      utt.onerror = (e) => {
        if (e.error !== "canceled" && e.error !== "interrupted") {
          console.warn("SpeechSynthesis error:", e);
        }
        clearHighlight();
        setIsPlaying(false);
        setIsPaused(false);
      };

      window.speechSynthesis.speak(utt);
    };

    setVoiceType("device");
    setIsPlaying(true);
    setIsPaused(false);
    setIsLoading(false);
    playNext(0);
  };

  const pauseSpeech = () => {
    if (voiceType === "neural" && audioRef.current) {
      audioRef.current.pause();
      setIsPaused(true);
    } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    }
  };

  const resumeSpeech = () => {
    if (voiceType === "neural" && audioRef.current) {
      audioRef.current.play();
      setIsPaused(false);
    } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      }
    }
  };

  const stopSpeech = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    clearHighlight();
    setIsPlaying(false);
    setIsPaused(false);
    setIsLoading(false);
  };

  const cycleRate = () => {
    let nextRate = 1.0;
    if (rate === 1.0) nextRate = 1.2;
    else if (rate === 1.2) nextRate = 0.85;
    else nextRate = 1.0;

    setRate(nextRate);

    if (voiceType === "neural" && audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    } else if (isPlaying && !isPaused && typeof window !== "undefined" && "speechSynthesis" in window) {
      const currentIndex = currentUtteranceIndexRef.current;
      window.speechSynthesis.cancel();
      utterancesRef.current.forEach((u) => (u.rate = nextRate));

      const playFrom = (idx: number) => {
        if (idx >= utterancesRef.current.length) {
          setIsPlaying(false);
          return;
        }
        currentUtteranceIndexRef.current = idx;
        const utt = utterancesRef.current[idx];
        utt.onend = () => playFrom(idx + 1);
        window.speechSynthesis.speak(utt);
      };
      playFrom(currentIndex);
    }
  };

  if (!isSupported) return null;

  return (
    <>
      <style jsx global>{`
        .tts-active-reading-block {
          background-color: rgba(245, 158, 11, 0.12) !important;
          border-left: 4px solid #f59e0b !important;
          padding-left: 0.65rem !important;
          border-radius: 0.75rem !important;
          transition: all 0.5s ease-in-out !important;
          box-shadow: 0 0 15px rgba(245, 158, 11, 0.08) !important;
        }
      `}</style>

      <div className="flex items-center gap-1.5 rounded-xl border border-[#d9cdbf] bg-[#fbf8f4] px-2.5 py-1 shadow-xs transition">
        {isLoading ? (
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#8a755d]">
            <span className="inline-block animate-spin text-sm">⏳</span>
            <span>Caricamento voce...</span>
          </div>
        ) : !isPlaying ? (
          <button
            onClick={startSpeech}
            className="flex items-center gap-1.5 text-xs font-bold text-[#5c4a37] hover:text-[#3f3933] transition"
            title="Ascolta la lettura vocale del testo con auto-scroll sincronizzato"
          >
            <span className="text-sm">🔊</span>
            <span>{title}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            {/* Badge Tipo di Voce */}
            <span className="text-[10px] font-mono font-bold bg-[#ede4d8] text-[#5c4a37] px-1.5 py-0.5 rounded-md select-none">
              {voiceType === "neural" ? "🎙️ HD" : "🔊 Voce"}
            </span>

            {/* Animazione Onda Sonora */}
            <div className="flex items-center gap-0.5 h-3">
              <span className={`w-0.5 h-3 bg-amber-600 rounded-full ${!isPaused ? "animate-pulse" : "opacity-40"}`} />
              <span className={`w-0.5 h-2 bg-amber-600 rounded-full ${!isPaused ? "animate-pulse delay-75" : "opacity-40"}`} />
              <span className={`w-0.5 h-3 bg-amber-600 rounded-full ${!isPaused ? "animate-pulse delay-150" : "opacity-40"}`} />
            </div>

            {isPaused ? (
              <button
                onClick={resumeSpeech}
                className="flex items-center gap-1 text-xs font-bold text-amber-800 hover:text-amber-950 transition"
                title="Riprendi lettura"
              >
                <span>▶️</span>
              </button>
            ) : (
              <button
                onClick={pauseSpeech}
                className="flex items-center gap-1 text-xs font-bold text-amber-800 hover:text-amber-950 transition"
                title="Metti in pausa"
              >
                <span>⏸️</span>
              </button>
            )}

            <button
              onClick={stopSpeech}
              className="text-xs font-bold text-rose-700 hover:text-rose-900 transition px-0.5"
              title="Ferma lettura vocale"
            >
              ⏹️
            </button>

            {/* Toggle Auto-Scroll */}
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold transition flex items-center gap-0.5 ${
                autoScroll
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : "bg-[#eee3d5] text-[#8a755d] hover:bg-[#e4d4c2]"
              }`}
              title={autoScroll ? "Auto-scroll attivo (il testo scorre con la voce)" : "Auto-scroll disattivato"}
            >
              <span>📜</span>
              <span>{autoScroll ? "Scroll ON" : "Scroll OFF"}</span>
            </button>

            {/* Velocità Lettura */}
            <button
              onClick={cycleRate}
              className="rounded-md bg-[#eee3d5] px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#6b5d4e] hover:bg-[#e4d4c2] transition"
              title="Cambia velocità voce (0.85x, 1.0x, 1.2x)"
            >
              {rate}x
            </button>
          </div>
        )}

        {/* Floating Audio Controller galleggiante (appare solo quando l'audio è attivo e l'utente scorre in basso, posizionato a fianco del pulsante scroll senza coprire la %) */}
        {(isPlaying || isPaused) && isScrolled && (
          <div className="fixed bottom-5 sm:bottom-6 right-18 sm:right-24 z-40 flex items-center gap-2 rounded-2xl bg-[#5c4a37]/95 backdrop-blur-md border border-[#8a755d]/50 p-2 shadow-2xl text-white animate-in fade-in slide-in-from-bottom-3 duration-300">
            <span className="text-[10px] font-mono font-bold bg-[#ede4d8] text-[#5c4a37] px-1.5 py-0.5 rounded-md select-none">
              {voiceType === "neural" ? "🎙️ HD" : "🔊 Voce"}
            </span>

            {/* Onda sonora animata */}
            <div className="flex items-center gap-0.5 h-3">
              <span className={`w-0.5 h-3 bg-amber-400 rounded-full ${!isPaused ? "animate-pulse" : "opacity-40"}`} />
              <span className={`w-0.5 h-2 bg-amber-400 rounded-full ${!isPaused ? "animate-pulse delay-75" : "opacity-40"}`} />
              <span className={`w-0.5 h-3 bg-amber-400 rounded-full ${!isPaused ? "animate-pulse delay-150" : "opacity-40"}`} />
            </div>

            {isPaused ? (
              <button
                onClick={resumeSpeech}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition text-white"
                title="Riprendi lettura"
              >
                ▶️
              </button>
            ) : (
              <button
                onClick={pauseSpeech}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition text-white"
                title="Metti in pausa"
              >
                ⏸️
              </button>
            )}

            <button
              onClick={stopSpeech}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 hover:bg-rose-500/30 text-rose-300 hover:text-rose-100 active:scale-95 transition"
              title="Ferma lettura vocale"
            >
              ⏹️
            </button>

            {/* Toggle Auto-Scroll nel floating controller */}
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`rounded-lg px-2 py-1 text-[11px] font-bold transition flex items-center gap-1 ${
                autoScroll
                  ? "bg-amber-400/25 text-amber-200 border border-amber-400/40"
                  : "bg-white/10 text-white/60 hover:text-white"
              }`}
              title={autoScroll ? "Auto-scroll attivo (il testo scorre con la voce)" : "Auto-scroll disattivato"}
            >
              <span>📜</span>
              <span>{autoScroll ? "Scroll ON" : "Scroll OFF"}</span>
            </button>

            <button
              onClick={cycleRate}
              className="rounded-lg bg-white/10 px-2 py-1 text-[11px] font-mono font-bold text-amber-200 hover:bg-white/20 active:scale-95 transition"
              title="Cambia velocità voce"
            >
              {rate}x
            </button>
          </div>
        )}
      </div>
    </>
  );
}


