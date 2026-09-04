"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { PreghieraNav } from "@/components/preghiera-nav";
import { SantoRomanoView } from "@/components/santo-romano-view";

function getTodayIsoString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function SantoRomanoPageClient() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayIsoString());
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const urlDate = sp.get("date");
      if (urlDate && /^\d{4}-\d{2}-\d{2}$/.test(urlDate)) {
        setSelectedDate(urlDate);
      }
    }
  }, []);

  const handleDateChange = (newDate: string) => {
    startTransition(() => {
      setSelectedDate(newDate);
      if (typeof window !== "undefined") {
        const sp = new URLSearchParams(window.location.search);
        sp.set("date", newDate);
        window.history.replaceState(null, "", `${window.location.pathname}?${sp.toString()}`);
      }
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      {/* Navigazione Sezioni Preghiera */}
      <PreghieraNav />

      {/* Breadcrumb e Selettore Rapido Rito */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-2 text-xs">
        <div className="flex items-center gap-2 text-[#7d6b58]">
          <Link href="/preghiera/santo" className="hover:text-[#3f3933] hover:underline font-semibold flex items-center gap-1">
            <span>←</span>
            <span>Tutti i Santi</span>
          </Link>
          <span>/</span>
          <span className="font-bold text-[#3f3933]">Rito Romano (CEI)</span>
        </div>

        <Link
          href={`/preghiera/santo/ambrosiano?date=${selectedDate}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
        >
          <span>🕊️</span>
          <span>Passa al Rito Ambrosiano (Chiesa di Milano)</span>
          <span>→</span>
        </Link>
      </div>

      {/* Vista Ufficiale Rito Romano */}
      <SantoRomanoView
        date={selectedDate}
        onDateChange={handleDateChange}
        isEmbedded={false}
      />
    </div>
  );
}
