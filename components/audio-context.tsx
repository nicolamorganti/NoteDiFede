"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from "react";

export type AudioTrack = {
  songTitle: string;
  partLabel: string;
  url: string;
  songId?: string;
};

type AudioContextType = {
  activeTrack: AudioTrack | null;
  isPlaying: boolean;
  isLooping: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  playTrack: (track: AudioTrack) => void;
  togglePlay: () => void;
  toggleLoop: () => void;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  closePlayer: () => void;
};

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [activeTrack, setActiveTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [playbackRate, setPlaybackRateState] = useState(1.0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Inizializza l'elemento audio
  useEffect(() => {
    if (!audioRef.current && typeof window !== "undefined") {
      const audio = new Audio();
      audio.volume = volume;
      audio.playbackRate = playbackRate;
      audio.loop = isLooping;

      audio.addEventListener("timeupdate", () => {
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio.duration || 0);
      });

      audio.addEventListener("ended", () => {
        if (!audio.loop) {
          setIsPlaying(false);
          setCurrentTime(0);
        }
      });

      audio.addEventListener("error", (e) => {
        console.error("Errore riproduzione audio globale:", e);
        setIsPlaying(false);
      });

      audioRef.current = audio;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Sincronizza loop
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping;
    }
  }, [isLooping]);

  // Sincronizza MediaSession API (controlli lockscreen nativi Android / iOS / Bluetooth)
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    if (activeTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: activeTrack.songTitle,
        artist: activeTrack.partLabel || "Coro",
        album: "Note di Fede",
        artwork: [
          { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
        ],
      });

      navigator.mediaSession.setActionHandler("play", () => {
        audioRef.current?.play().catch(console.error);
        setIsPlaying(true);
      });

      navigator.mediaSession.setActionHandler("pause", () => {
        audioRef.current?.pause();
        setIsPlaying(false);
      });

      navigator.mediaSession.setActionHandler("seekbackward", (details) => {
        const skip = details.seekOffset || 10;
        seek(Math.max(0, (audioRef.current?.currentTime || 0) - skip));
      });

      navigator.mediaSession.setActionHandler("seekforward", (details) => {
        const skip = details.seekOffset || 10;
        seek(Math.min(duration, (audioRef.current?.currentTime || 0) + skip));
      });

      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime !== undefined && details.seekTime !== null) {
          seek(details.seekTime);
        }
      });

      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    } else {
      navigator.mediaSession.playbackState = "none";
    }
  }, [activeTrack, isPlaying, duration]);

  // Sincronizza posizione con MediaSession
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "mediaSession" in navigator &&
      "setPositionState" in navigator.mediaSession &&
      duration > 0 &&
      !isNaN(duration)
    ) {
      try {
        navigator.mediaSession.setPositionState({
          duration: Math.max(0, duration),
          playbackRate: playbackRate,
          position: Math.max(0, Math.min(currentTime, duration)),
        });
      } catch (e) {
        // ignore
      }
    }
  }, [currentTime, duration, playbackRate]);

  const playTrack = (track: AudioTrack) => {
    if (!audioRef.current) return;

    if (activeTrack?.url === track.url) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
      return;
    }

    // Nuova traccia
    audioRef.current.src = track.url;
    audioRef.current.playbackRate = playbackRate;
    audioRef.current.volume = volume;
    audioRef.current.loop = isLooping;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    setActiveTrack(track);

    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch((err) => {
        console.error("Errore durante l'avvio della traccia:", err);
        setIsPlaying(false);
      });
  };

  const togglePlay = () => {
    if (!audioRef.current || !activeTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const toggleLoop = () => {
    setIsLooping((prev) => !prev);
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resume = () => {
    if (audioRef.current && activeTrack) {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const setVolume = (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
  };

  const setPlaybackRate = (rate: number) => {
    setPlaybackRateState(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const closePlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setActiveTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  return (
    <AudioContext.Provider
      value={{
        activeTrack,
        isPlaying,
        isLooping,
        currentTime,
        duration,
        volume,
        playbackRate,
        playTrack,
        togglePlay,
        toggleLoop,
        pause,
        resume,
        seek,
        setVolume,
        setPlaybackRate,
        closePlayer,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}


export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio deve essere utilizzato all'interno di un AudioProvider");
  }
  return context;
}
