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

  // Rimuovi script, audio, controlli interattivi
  const removeSelectors = ["script", "style", "audio", "iframe", "button", ".audio-player", ".menu"];
  removeSelectors.forEach((sel) => {
    tmp.querySelectorAll(sel).forEach((el) => el.remove());
  });

  let text = tmp.innerText || tmp.textContent || "";

  // Normalizza e rendi naturale la pronuncia liturgica
  text = text
    .replace(/\bV\.\s*/g, "Guida: ")
    .replace(/\bR\.\s*/g, "Risposta: ")
    .replace(/\bC\.\s*/g, "Celebrante: ")
    .replace(/\bA\.\s*/g, "Assemblea: ")
    .replace(/\bL\.\s*/g, "Lettore: ")
    .replace(/\b\+\s*/g, " ") // Segno di croce
    .replace(/-\s*Menu\s*-/gi, "")
    .replace(/[\r\n]+/g, ". ")
    .replace(/\s+/g, " ")
    .trim();

  return text;
}

export function LiturgicalTtsPlayer({ htmlContent, lang = "it", title = "Ascolta" }: LiturgicalTtsPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceType, setVoiceType] = useState<"neural" | "device" | null>(null);
  const [rate, setRate] = useState<number>(1.0); // 0.85, 1.0, 1.2
  const [isSupported, setIsSupported] = useState(true);

  // Audio HTML5 (per Google Cloud Neural2 / Cache)
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Web Speech API (per Fallback Dispositivo)
  const utterancesRef = useRef<SpeechSynthesisUtterance[]>([]);
  const currentUtteranceIndexRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsSupported("speechSynthesis" in window || typeof Audio !== "undefined");
    }

    return () => {
      stopSpeech();
    };
  }, []);

  // Ferma la riproduzione se cambia il contenuto o la lingua
  useEffect(() => {
    stopSpeech();
  }, [htmlContent, lang]);

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

    try {
      // 1. Prova a richiedere l'audio HD neurale da Google Cloud / Audio-Cache
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: fullText, lang }),
      });

      const data = await res.json();

      if (data.success && data.audioBase64) {
        // Riproduzione Audio Neurale HD
        const audio = new Audio(`data:audio/mp3;base64,${data.audioBase64}`);
        audio.playbackRate = rate;
        audioRef.current = audio;

        audio.onended = () => {
          setIsPlaying(false);
          setIsPaused(false);
          setIsLoading(false);
        };

        audio.onerror = () => {
          console.warn("Errore riproduzione audio neurale, fallback su dispositivo");
          playWithDeviceVoice(fullText);
        };

        await audio.play();
        setVoiceType("neural");
        setIsPlaying(true);
        setIsPaused(false);
        setIsLoading(false);
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
        setIsPlaying(false);
        setIsPaused(false);
        return;
      }

      currentUtteranceIndexRef.current = index;
      const utt = utterancesRef.current[index];

      utt.onend = () => {
        playNext(index + 1);
      };

      utt.onerror = (e) => {
        if (e.error !== "canceled" && e.error !== "interrupted") {
          console.warn("SpeechSynthesis error:", e);
        }
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
          title="Ascolta la lettura vocale del testo (Voce Neurale HD / Dispositivo)"
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
    </div>
  );
}
