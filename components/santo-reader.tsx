"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import { PreghieraNav } from "@/components/preghiera-nav";
import { QuoteImageModal, resolveLiturgicalColor } from "@/components/quote-image-modal";
import { LiturgicalTtsPlayer } from "@/components/liturgical-tts-player";



interface OtherSaint {
  nome: string;
  imgUrl: string | null;
  martirologio: string;
}

interface SantoData {
  date: string;
  dateLabel: string;
  title: string;
  grado: string;
  imgUrl: string | null;
  martirologio: string;
  altriSanti: OtherSaint[];
  source: string;
}

function getTodayIsoString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function SantoReader() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayIsoString());
  const [data, setData] = useState<SantoData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  // Lightbox Immagine
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);


  // Modal Card WhatsApp
  const [quoteModalOpen, setQuoteModalOpen] = useState<boolean>(false);
  const [quoteText, setQuoteText] = useState<string>("");
  const [quoteCitation, setQuoteCitation] = useState<string>("Santo del Giorno");

  // Fetch dati del Santo
  const fetchSanto = useCallback(async (dateStr: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/santo-del-giorno?date=${dateStr}`);
      if (!res.ok) {
        throw new Error(`Impossibile caricare il Santo del Giorno (${res.status})`);
      }
      const json: SantoData = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Errore di connessione al servizio liturgico.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSanto(selectedDate);
  }, [selectedDate, fetchSanto]);

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
    });
  };

  // Copia Testo
  const handleCopyText = (title: string, text: string) => {
    const full = `${title}\n\n${text}\n\nFonte: Note di Fede · chiesacattolica.it (CEI)`;
    navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Testo per la sintesi vocale neurale Azure
  const speechText = data
    ? `${data.title}. ${data.grado ? `Grado liturgico: ${data.grado}. ` : ""}Dal Martirologio Romano: ${data.martirologio}`
    : "";

  // Colore liturgico effettivo del Santo (Bianco, Rosso, ecc.)
  const litColor = resolveLiturgicalColor(data?.title, data?.martirologio, selectedDate);

  // Apri Generatore Card
  const openQuoteModal = (text: string, citation: string) => {

    setQuoteText(text);
    setQuoteCitation(citation);
    setQuoteModalOpen(true);
  };


  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      {/* Barra di Navigazione Sezioni Preghiera */}
      <PreghieraNav />

      {/* Header Pagina */}
      <div className="rounded-3xl border border-[#e2d5c4] bg-[#fdfbf7] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">👑</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#aa9576]">
                Martirologio Romano · Iconografia & Vite dei Santi
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#3f3933]">
              Santo del Giorno
            </h1>
            <p className="text-xs sm:text-sm text-[#7d6b58] mt-1 font-serif italic">
              Commemorazioni ufficiali della Chiesa Cattolica Italiana (Conferenza Episcopale Italiana)
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
              onChange={(e) => setSelectedDate(e.target.value)}
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
              onClick={() => setSelectedDate(getTodayIsoString())}
              className="rounded-xl bg-[#f4efe6] px-3 py-1.5 text-xs font-bold text-[#6e5a45] hover:bg-[#ebdcc8] transition cursor-pointer"
            >
              Oggi
            </button>
          </div>
        </div>
      </div>

      {/* Stato di caricamento */}
      {loading ? (
        <div className="rounded-3xl border border-[#e2d5c4] bg-[#fdfbf7] p-16 text-center shadow-sm space-y-4">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#aa9576]/30 border-t-[#5c4a37]"></div>
          <p className="font-serif text-lg text-[#aa9576]">
            Caricamento del Santo del Giorno in corso...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center shadow-sm space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xl">
            ⚠️
          </div>
          <h3 className="font-serif text-lg font-bold text-rose-800">
            Impossibile caricare i dati
          </h3>
          <p className="text-xs text-rose-600 max-w-md mx-auto">{error}</p>
          <button
            onClick={() => fetchSanto(selectedDate)}
            className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition cursor-pointer"
          >
            Riprova
          </button>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Card Santo Principale */}
          <div className="rounded-3xl border border-[#e0d6c7] bg-white p-6 sm:p-10 shadow-lg overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Colonna Immagine Ufficiale */}
              {data.imgUrl ? (
                <div className="md:col-span-5 flex flex-col items-center">
                  <div
                    onClick={() => setLightboxOpen(true)}
                    className="group relative w-full overflow-hidden rounded-2xl border-2 border-[#d9cdbf] bg-[#fbf8f4] shadow-md cursor-zoom-in transition-all duration-300 hover:shadow-xl hover:border-[#aa9576]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={data.imgUrl}
                      alt={data.title}
                      className="w-full h-auto max-h-[460px] object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-[#5c4a37] shadow-md flex items-center gap-1.5">
                        <span>🔍</span> Clicca per ingrandire
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-[#8e7e6e] mt-2 italic">
                    Iconografia sacra ufficiale CEI
                  </span>
                </div>
              ) : (
                <div className="md:col-span-4 flex flex-col items-center justify-center p-8 rounded-2xl bg-[#faf6f0] border border-[#ede3d5] text-center">
                  <span className="text-5xl mb-3">🕊️</span>
                  <p className="font-serif text-sm font-semibold text-[#6e5a45]">
                    Commemorazione nel Martirologio
                  </p>
                </div>
              )}

              {/* Colonna Dettagli e Martirologio */}
              <div className={`${data.imgUrl ? "md:col-span-7" : "md:col-span-8"} space-y-4`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#f4efe6] px-3 py-1 text-xs font-bold text-[#6e5a45] border border-[#d9cdbf]">
                    📅 {data.dateLabel}
                  </span>
                  {data.grado && (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold border shadow-2xs flex items-center gap-1.5 ${
                        litColor.colorKey === "rosso"
                          ? "bg-rose-50 text-rose-900 border-rose-200"
                          : litColor.colorKey === "verde"
                          ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                          : litColor.colorKey === "viola"
                          ? "bg-purple-50 text-purple-900 border-purple-200"
                          : "bg-[#fcfaf7] text-[#634e35] border-[#d9cdbf]"
                      }`}
                      title={`Colore liturgico: ${litColor.colorName}`}
                    >
                      <span>{litColor.icon}</span>
                      <span>{data.grado}</span>
                    </span>
                  )}
                  <span className="rounded-full bg-[#ecfdf5] px-3 py-1 text-xs font-bold text-[#065f46] border border-[#a7f3d0]">
                    🏛️ Fonte CEI
                  </span>
                </div>

                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2c2621] leading-tight">
                  {data.title}
                </h2>

                {/* Testo del Martirologio */}
                {data.martirologio && (
                  <div className="rounded-2xl border-l-4 border-[#aa9576] bg-[#fbf9f5] p-5 sm:p-6 shadow-2xs space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#8a755d]">
                      Dal Martirologio Romano
                    </h3>
                    <p className="font-serif text-base sm:text-lg leading-relaxed text-[#3f3933] whitespace-pre-line first-letter:text-3xl first-letter:font-bold first-letter:text-[#8a755d] first-letter:mr-0.5">
                      {data.martirologio}
                    </p>
                  </div>
                )}

                {/* Barra Strumenti / Azioni */}
                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  {/* Lettore Vocale HD Neurale (Azure) */}
                  <LiturgicalTtsPlayer
                    htmlContent={data.martirologio || data.title}
                    customSpeechText={speechText}
                    lang="it"
                    title="Ascolta"
                  />


                  {/* Crea Stato WhatsApp */}
                  <button
                    onClick={() =>
                      openQuoteModal(
                        data.martirologio || data.title,
                        `Santo del Giorno · ${data.title}`
                      )
                    }
                    className="flex items-center gap-1.5 rounded-xl border border-[#d9cdbf] bg-[#fbf8f4] px-3.5 py-2 text-xs font-bold text-[#5c4a37] hover:bg-[#ede4d6] transition cursor-pointer shadow-2xs"
                    title="Crea Card per lo Stato WhatsApp dal testo del Santo"
                  >
                    <span>📸</span>
                    <span>Crea Stato</span>
                  </button>

                  {/* Copia Testo */}
                  <button
                    onClick={() => handleCopyText(data.title, data.martirologio)}
                    className="flex items-center gap-1.5 rounded-xl border border-[#d9cdbf] bg-[#fbf8f4] px-3.5 py-2 text-xs font-bold text-[#5c4a37] hover:bg-[#ede4d6] transition cursor-pointer shadow-2xs"
                  >
                    <span>{copied ? "✓" : "📋"}</span>
                    <span>{copied ? "Copiato!" : "Copia"}</span>
                  </button>

                  {/* Vai alla Liturgia del Giorno */}
                  <Link
                    href={`/liturgia`}
                    className="flex items-center gap-1.5 rounded-xl border border-[#d9cdbf] bg-[#fbf8f4] px-3.5 py-2 text-xs font-bold text-[#5c4a37] hover:bg-[#ede4d6] transition cursor-pointer shadow-2xs ml-auto"
                  >
                    <span>📖</span>
                    <span>Liturgia delle Ore</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Sezione Altri Santi e Beati del Giorno */}
          {data.altriSanti && data.altriSanti.length > 0 && (
            <div className="rounded-3xl border border-[#e0d6c7] bg-[#fdfbf7] p-6 sm:p-8 shadow-md space-y-5">
              <div className="flex items-center justify-between border-b border-[#e4dcce] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#3f3933]">
                    Altri Santi e Beati di Oggi
                  </h3>
                </div>
                <span className="rounded-full bg-[#f4efe6] px-3 py-1 text-xs font-bold text-[#6e5a45] border border-[#d9cdbf]">
                  {data.altriSanti.length} commemorazioni
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.altriSanti.map((santo, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[#e2d5c4] bg-white p-5 shadow-xs transition hover:shadow-md hover:border-[#aa9576] flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#aa9576]"></span>
                        <h4 className="font-serif text-base font-bold text-[#2c2621]">
                          {santo.nome}
                        </h4>
                      </div>
                      {santo.martirologio ? (
                        <p className="font-serif text-xs sm:text-sm text-[#4a423a] leading-relaxed">
                          {santo.martirologio}
                        </p>
                      ) : (
                        <p className="text-xs text-[#8e7e6e] italic">
                          Commemorazione nel Martirologio Romano.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f4efe6]">
                      <button
                        onClick={() =>
                          openQuoteModal(
                            santo.martirologio || santo.nome,
                            `Santo del Giorno · ${santo.nome}`
                          )
                        }
                        className="rounded-lg border border-[#e0d6c7] bg-[#fdfbf7] px-2.5 py-1 text-[11px] font-bold text-[#5c4a37] hover:bg-[#ede4d6] transition cursor-pointer"
                        title="Crea Card per lo Stato WhatsApp"
                      >
                        📸 Card
                      </button>
                      <button
                        onClick={() => handleCopyText(santo.nome, santo.martirologio)}
                        className="rounded-lg border border-[#e0d6c7] bg-[#fdfbf7] px-2.5 py-1 text-[11px] font-bold text-[#5c4a37] hover:bg-[#ede4d6] transition cursor-pointer"
                      >
                        📋 Copia
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Lightbox Immagine Ingrandita */}
      {lightboxOpen && data?.imgUrl && (
        <div
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 cursor-zoom-out animate-fadeIn"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.imgUrl}
              alt={data.title}
              className="w-full h-auto max-h-[85vh] object-contain rounded-2xl"
            />
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-xs font-semibold text-center pointer-events-none">
              {data.title} · Clicca ovunque per chiudere
            </div>
          </div>
        </div>
      )}

      {/* Modal Card Stato WhatsApp */}
      <QuoteImageModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        initialText={quoteText}
        dateStr={selectedDate}
        liturgicalTitle={data?.title || "Santo del Giorno"}
        defaultCitation={quoteCitation}
      />
    </div>
  );
}
