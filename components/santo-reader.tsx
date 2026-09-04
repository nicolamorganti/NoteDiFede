"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PreghieraNav } from "@/components/preghiera-nav";
import { SantoView } from "@/components/santo-view";
import type { LiturgyRite } from "@/components/liturgia-reader";

function getTodayIsoString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function SantoReader() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayIsoString());
  const [rite, setRite] = useState<LiturgyRite>("ambrosiano");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const urlDate = sp.get("date");
      const urlRite = sp.get("rite") as LiturgyRite;
      if (urlDate) setSelectedDate(urlDate);
      if (urlRite === "ambrosiano" || urlRite === "romano") {
        setRite(urlRite);
      } else {
        const saved = localStorage.getItem("preferred_rite") as LiturgyRite;
        if (saved === "ambrosiano" || saved === "romano") setRite(saved);
      }
    }
  }, []);

  const handleRiteChange = (newRite: LiturgyRite) => {
    setRite(newRite);
    if (typeof window !== "undefined") {
      localStorage.setItem("preferred_rite", newRite);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-2 sm:px-4">
      {/* Intestazione e Navigazione Preghiera */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#443729]">
              Santo del Giorno
            </h1>
            <p className="text-xs sm:text-sm text-[#8a755d]">
              {rite === "ambrosiano"
                ? "Calendario Agiografico dell'Arcidiocesi di Milano (Rito Ambrosiano)"
                : "Martirologio Romano Ufficiale della Chiesa Cattolica (Rito Romano)"}
            </p>
          </div>
          <Link
            href={`/liturgia?moment=santo&rite=${rite}&date=${selectedDate}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#d9cdbf] bg-white text-[#5c4a37] text-xs font-bold hover:bg-[#ede4d6] transition shadow-2xs self-start sm:self-center"
          >
            <span>📖</span>
            <span>Apri nella Liturgia delle Ore →</span>
          </Link>
        </div>

        <PreghieraNav />
      </div>

      {/* Componente SantoView con controlli data e rito integrati */}
      <SantoView
        date={selectedDate}
        rite={rite}
        onRiteChange={handleRiteChange}
        onDateChange={setSelectedDate}
        showHeaderControls={true}
      />
    </div>
  );
}
