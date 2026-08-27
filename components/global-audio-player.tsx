"use client";

import { useAudio } from "@/components/audio-context";
import { useState } from "react";

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const SPEED_OPTIONS = [0.75, 0.9, 1.0, 1.25];

export function GlobalAudioPlayer() {
  const {
    activeTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    togglePlay,
    seek,
    setVolume,
    setPlaybackRate,
    closePlayer,
  } = useAudio();

  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.8);

  if (!activeTrack) {
    return null;
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(Number(e.target.value));
  };

  const handleSkip = (seconds: number) => {
    seek(Math.max(0, Math.min(duration, currentTime + seconds)));
  };

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume || 0.8);
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-4xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
      <div className="rounded-3xl border border-[#d8c8b4] bg-[#fbf8f4]/95 p-3.5 shadow-2xl backdrop-blur-md sm:p-4 text-[#3e3933]">
        {/* Riga superiore: Info traccia & Controlli rapidi */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          {/* Info brano */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#6e5a45] text-white shadow-sm">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#3f3933] truncate">
                {activeTrack.songTitle}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="inline-block rounded-md bg-[#ede3d4] border border-[#dacab5] px-1.5 py-0.2 text-[10px] font-semibold uppercase tracking-wider text-[#6e5a45]">
                  {activeTrack.partLabel}
                </span>
                <span className="text-[11px] text-[#8a7a6a] hidden sm:inline">
                  • In riproduzione
                </span>
              </div>
            </div>
          </div>

          {/* Selettore Velocità (Playback Rate) */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="flex items-center gap-1 rounded-xl bg-[#ede3d4] hover:bg-[#e2d5c2] border border-[#d9caa9] px-2.5 py-1 text-xs font-mono font-bold text-[#5c4a37] transition"
              title="Velocità di riproduzione"
            >
              <span>{playbackRate}x</span>
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showSpeedMenu && (
              <div className="absolute right-0 bottom-full mb-2 flex flex-col gap-1 rounded-2xl border border-[#d8c8b4] bg-[#fffdfa] p-1.5 shadow-lg z-50 min-w-[70px]">
                {SPEED_OPTIONS.map((rate) => (
                  <button
                    key={rate}
                    onClick={() => {
                      setPlaybackRate(rate);
                      setShowSpeedMenu(false);
                    }}
                    className={`rounded-xl px-2.5 py-1 text-xs font-mono font-semibold text-left transition ${
                      playbackRate === rate
                        ? "bg-[#6e5a45] text-white"
                        : "text-[#5c4a37] hover:bg-[#f4ebe1]"
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Controllo Volume (Desktop) */}
          <div className="hidden md:flex items-center gap-1.5 text-[#6e5a45]">
            <button onClick={toggleMute} className="p-1 hover:text-[#4a3d2e] transition">
              {volume === 0 ? (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-16 h-1.5 bg-[#dfd2c0] rounded-lg appearance-none cursor-pointer accent-[#6e5a45]"
            />
          </div>

          {/* Chiudi Player */}
          <button
            onClick={closePlayer}
            className="rounded-full p-1.5 text-[#9e8c78] hover:bg-[#ebdcc8] hover:text-[#453b30] transition"
            title="Chiudi player"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Riga centrale: Controlli di riproduzione e Scrubber */}
        <div className="flex items-center gap-3">
          {/* Skip -10s */}
          <button
            onClick={() => handleSkip(-10)}
            className="rounded-full p-1.5 text-[#7a6b5c] hover:bg-[#ede3d4] hover:text-[#3f3933] transition"
            title="Indietro 10 secondi"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
            </svg>
          </button>

          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#5c4a37] text-white shadow-md transition hover:bg-[#4b3c2c] active:scale-95"
            title={isPlaying ? "Pausa" : "Riproduci"}
          >
            {isPlaying ? (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="h-4 w-4 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Skip +10s */}
          <button
            onClick={() => handleSkip(10)}
            className="rounded-full p-1.5 text-[#7a6b5c] hover:bg-[#ede3d4] hover:text-[#3f3933] transition"
            title="Avanti 10 secondi"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
            </svg>
          </button>

          {/* Tempo corrente */}
          <span className="text-xs font-mono font-medium text-[#7a6b5c] w-9 text-right shrink-0">
            {formatTime(currentTime)}
          </span>

          {/* Barra di avanzamento */}
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-[#e4d8c7] rounded-lg appearance-none cursor-pointer accent-[#5c4a37]"
            />
          </div>

          {/* Durata totale */}
          <span className="text-xs font-mono font-medium text-[#7a6b5c] w-9 shrink-0">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
