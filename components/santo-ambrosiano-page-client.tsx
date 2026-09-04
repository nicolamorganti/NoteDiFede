"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { PreghieraNav } from "@/components/preghiera-nav";
import { SantoAmbrosianoView } from "@/components/santo-ambrosiano-view";

function getTodayIsoString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function SantoAmbrosianoPageClient() {
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
          <span className="font-bold text-[#3f3933]">Rito Ambrosiano (Chiesa di Milano)</span>
        </div>

        <Link
          href={`/preghiera/santo/romano?date=${selectedDate}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-[#fbf8f4] px-3 py-1.5 font-bold text-[#5c4a37] hover:bg-[#ede4d6] transition shadow-2xs"
        >
          <span>🏛️</span>
          <span>Passa al Rito Romano (CEI)</span>
          <span>→</span>
        </Link>
      </div>

      {/* Vista Ufficiale Rito Ambrosiano */}
      <SantoAmbrosianoView
        date={selectedDate}
        onDateChange={handleDateChange}
        isEmbedded={false}
      />
    </div>
  );
}
