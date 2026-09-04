"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { PreghieraNav } from "@/components/preghiera-nav";
import { SantoRomanoView } from "@/components/santo-romano-view";
import { SantoAmbrosianoView } from "@/components/santo-ambrosiano-view";

export type SantoRite = "romano" | "ambrosiano";

function getTodayIsoString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function SantoReader() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayIsoString());
  const [selectedRite, setSelectedRite] = useState<SantoRite>("romano");
  const [, startTransition] = useTransition();

  // Inizializza data e rito da parametri URL o localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const urlDate = sp.get("date");
      if (urlDate && /^\d{4}-\d{2}-\d{2}$/.test(urlDate)) {
        setSelectedDate(urlDate);
      }

      const urlRite = sp.get("rite");
      if (urlRite === "ambrosiano" || urlRite === "romano") {
        setSelectedRite(urlRite);
      } else {
        const stored = localStorage.getItem("preferred_rite");
        if (stored === "ambrosiano" || stored === "romano") {
          setSelectedRite(stored);
        }
      }
    }
  }, []);

  // Gestione cambio rito
  const handleSelectRite = (newRite: SantoRite) => {
    setSelectedRite(newRite);
    if (typeof window !== "undefined") {
      localStorage.setItem("preferred_rite", newRite);
      const sp = new URLSearchParams(window.location.search);
      sp.set("rite", newRite);
      sp.set("date", selectedDate);
      window.history.replaceState(null, "", `${window.location.pathname}?${sp.toString()}`);
    }
  };

  // Cambio giorno (+1 / -1)
  const changeDateByDays = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const nextDate = `${year}-${month}-${day}`;
    startTransition(() => {
      setSelectedDate(nextDate);
      if (typeof window !== "undefined") {
        const sp = new URLSearchParams(window.location.search);
        sp.set("date", nextDate);
        sp.set("rite", selectedRite);
        window.history.replaceState(null, "", `${window.location.pathname}?${sp.toString()}`);
      }
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      {/* Barra di Navigazione Sezioni Preghiera */}
      <PreghieraNav />

      {/* Header Unificato con Selettore Rito e Data */}
      <div className="rounded-3xl border border-[#e2d5c4] bg-[#fdfbf7] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xl">👑</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#aa9576]">
                Agiografia & Iconografia Sacra dei Santi
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#3f3933]">
              Santo del Giorno
            </h1>
            <p className="text-xs sm:text-sm text-[#7d6b58] font-serif italic">
              {selectedRite === "romano"
                ? "Martirologio Romano e commemorazioni ufficiali CEI (Conferenza Episcopale Italiana)"
                : "Calendario Agiografico Diocesano della Chiesa di Milano (Arcidiocesi di Milano)"}
            </p>
          </div>

          {/* Selettore Data */}
          <div className="flex items-center gap-2 self-start md:self-auto rounded-2xl border border-[#d9cdbf] bg-[#fbf8f4] p-1.5 shadow-2xs">
            <button
              onClick={() => changeDateByDays(-1)}
              className="rounded-xl border border-[#d9cdbf] bg-white p-2 text-[#5c4a37] hover:bg-[#ede4d6] transition cursor-pointer"
              title="Giorno precedente"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedDate(val);
                if (typeof window !== "undefined") {
                  const sp = new URLSearchParams(window.location.search);
                  sp.set("date", val);
                  window.history.replaceState(null, "", `${window.location.pathname}?${sp.toString()}`);
                }
              }}
              className="rounded-xl border border-[#d9cdbf] bg-white px-3 py-1.5 text-xs font-semibold text-[#3f3933] outline-none transition focus:border-[#aa9576] cursor-pointer"
            />

            <button
              onClick={() => changeDateByDays(1)}
              className="rounded-xl border border-[#d9cdbf] bg-white p-2 text-[#5c4a37] hover:bg-[#ede4d6] transition cursor-pointer"
              title="Giorno successivo"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => {
                const today = getTodayIsoString();
                setSelectedDate(today);
                if (typeof window !== "undefined") {
                  const sp = new URLSearchParams(window.location.search);
                  sp.set("date", today);
                  window.history.replaceState(null, "", `${window.location.pathname}?${sp.toString()}`);
                }
              }}
              className="rounded-xl bg-[#f4efe6] px-3 py-1.5 text-xs font-bold text-[#6e5a45] hover:bg-[#ebdcc8] transition cursor-pointer"
            >
              Oggi
            </button>
          </div>
        </div>

        {/* Barra di Selezione Rito (Romano CEI vs Ambrosiano Milano) */}
        <div className="mt-6 pt-5 border-t border-[#ede4d6] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-[#ede4d6] border border-[#ddd0c0] self-start">
            <button
              onClick={() => handleSelectRite("romano")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedRite === "romano"
                  ? "bg-[#5c4a37] text-white shadow-sm"
                  : "text-[#6b5d4e] hover:bg-white/60"
              }`}
            >
              <span>🏛️</span>
              <span>Rito Romano (Martirologio CEI)</span>
            </button>

            <button
              onClick={() => handleSelectRite("ambrosiano")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedRite === "ambrosiano"
                  ? "bg-[#5c4a37] text-white shadow-sm"
                  : "text-[#6b5d4e] hover:bg-white/60"
              }`}
            >
              <span>🕊️</span>
              <span>Rito Ambrosiano (Chiesa di Milano)</span>
            </button>
          </div>

          {/* Link diretti alle sotto-pagine dedicate */}
          <div className="flex items-center gap-3 text-xs text-[#8a755d]">
            <span className="hidden lg:inline text-[11px] uppercase tracking-wider font-semibold">
              Sotto-pagine dedicate:
            </span>
            <Link
              href={`/preghiera/santo/romano?date=${selectedDate}`}
              className="hover:text-[#5c4a37] hover:underline font-semibold flex items-center gap-1 transition"
            >
              <span>🏛️ Pagina Romano</span>
              <span>↗</span>
            </Link>
            <span>·</span>
            <Link
              href={`/preghiera/santo/ambrosiano?date=${selectedDate}`}
              className="hover:text-[#5c4a37] hover:underline font-semibold flex items-center gap-1 transition"
            >
              <span>🕊️ Pagina Ambrosiano</span>
              <span>↗</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Render della Vista Specifica per il Rito Selezionato */}
      {selectedRite === "romano" ? (
        <SantoRomanoView
          date={selectedDate}
          onDateChange={setSelectedDate}
          isEmbedded={true}
        />
      ) : (
        <SantoAmbrosianoView
          date={selectedDate}
          onDateChange={setSelectedDate}
          isEmbedded={true}
        />
      )}
    </div>
  );
}
