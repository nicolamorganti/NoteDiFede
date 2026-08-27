"use client";

import { useEffect, useState } from "react";

export function ServiceWorkerRegister() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // 1. Registra Service Worker se supportato dal browser
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("Service Worker registrato con successo. Scope:", reg.scope);
          })
          .catch((err) => {
            console.warn("Registrazione Service Worker non riuscita:", err);
          });
      });
    }

    // 2. Monitor stato connessione (Offline in chiesa)
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50/95 px-4 py-1.5 text-xs font-medium text-amber-900 shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
      </span>
      <span>Modalità Offline: canti e spartiti in cache sono disponibili.</span>
    </div>
  );
}
