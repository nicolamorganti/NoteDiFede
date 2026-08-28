"use client";

import { useEffect, useState } from "react";
import { useAudio } from "@/components/audio-context";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Offset bottom dinamico se il player audio è attivo
  let activeTrack = null;
  try {
    const audio = useAudio();
    activeTrack = audio?.activeTrack;
  } catch {}

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;

      if (scrollY > 250) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }

      if (docHeight > 0) {
        const progress = Math.min(100, Math.max(0, Math.round((scrollY / docHeight) * 100)));
        setScrollProgress(progress);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed right-3 sm:right-6 z-40 flex flex-col items-center gap-1.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${
        activeTrack ? "bottom-28 sm:bottom-28" : "bottom-5 sm:bottom-6"
      }`}
    >
      {/* Badge Percentuale di Lettura */}
      <span className="text-[10px] font-mono font-bold bg-[#ede4d8]/95 backdrop-blur border border-[#dac7b0] text-[#6b5d4e] px-2 py-0.5 rounded-full shadow-md select-none">
        {scrollProgress}%
      </span>

      {/* Box Pulsanti Navigazione Rapida */}
      <div className="flex flex-col gap-1 p-1 rounded-2xl bg-[#5c4a37]/90 backdrop-blur-md border border-[#8a755d]/50 shadow-2xl text-white">
        {/* Pulsante Torna in Cima / Inizio */}
        <button
          onClick={scrollToTop}
          className="flex h-11 w-11 sm:h-12 sm:w-12 flex-col items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 transition text-white group"
          title="Torna all'inizio del testo"
          aria-label="Torna in cima"
        >
          <svg
            className="h-5 w-5 group-hover:-translate-y-0.5 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
          </svg>
          <span className="text-[9px] font-bold uppercase tracking-tighter leading-none text-amber-200">
            Inizio
          </span>
        </button>

        {/* Pulsante Salta in Fondo (se non siamo già alla fine) */}
        {scrollProgress < 92 && (
          <button
            onClick={scrollToBottom}
            className="flex h-7 w-11 sm:h-8 sm:w-12 items-center justify-center rounded-lg bg-white/5 hover:bg-white/15 active:scale-90 transition text-white/70 hover:text-white"
            title="Salta alla fine della pagina"
            aria-label="Salta in fondo"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
