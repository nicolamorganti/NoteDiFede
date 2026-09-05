"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { QuoteImageModal, resolveLiturgicalColor } from "@/components/quote-image-modal";
import { LiturgicalTtsPlayer } from "@/components/liturgical-tts-player";

export interface OtherSaint {
  nome: string;
  imgUrl: string | null;
  martirologio: string;
}

export interface SantoAmbrosianoData {
  date: string;
  dateLabel: string;
  title: string;
  grado: string;
  imgUrl: string | null;
  martirologio: string;
  altriSanti?: OtherSaint[];
  source: string;
}

export interface SantoAmbrosianoViewProps {
  date: string;
  onDateChange?: (date: string) => void;
  isEmbedded?: boolean;
}

export function SantoAmbrosianoView({
  date,
  onDateChange,
  isEmbedded = false,
}: SantoAmbrosianoViewProps) {
  const [data, setData] = useState<SantoAmbrosianoData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Lightbox Immagine
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

  // Modal Card WhatsApp
  const [quoteModalOpen, setQuoteModalOpen] = useState<boolean>(false);
  const [quoteText, setQuoteText] = useState<string>("");
  const [quoteCitation, setQuoteCitation] = useState<string>("Santo del Giorno");
  const [quoteImageUrl, setQuoteImageUrl] = useState<string | null>(null);

  // Fetch dati del Santo Ambrosiano da Chiesa di Milano
  const fetchSanto = useCallback(async (dateStr: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/santo-del-giorno?date=${dateStr}&rite=ambrosiano`);
      if (!res.ok) {
        throw new Error(`Impossibile caricare il Santo Ambrosiano (${res.status})`);
      }
      const json: SantoAmbrosianoData = await res.json();
      setData(json);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Errore di connessione al servizio liturgico ambrosiano.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSanto(date);
  }, [date, fetchSanto]);

  const changeDateByDays = (days: number) => {
    if (!onDateChange) return;
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    onDateChange(`${year}-${month}-${day}`);
  };

  const handleCopyText = (title: string, text: string) => {
    const full = `${title} (Rito Ambrosiano)\n\n${text}\n\nFonte: Note di Fede · Chiesa di Milano (Arcidiocesi di Milano)`;
    navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const speechText = data
    ? `${data.title}. Secondo il calendario della Chiesa di Milano: ${data.martirologio}${
        data.altriSanti && data.altriSanti.length > 0
          ? `. Si ricorda inoltre: ${data.altriSanti.map((s) => `${s.nome}. ${s.martirologio}`).join(". ")}`
          : ""
      }`
    : "";

  const litColor = resolveLiturgicalColor(data?.title, data?.martirologio, date);

  const openQuoteModal = (text: string, citation: string, img?: string | null) => {
    setQuoteText(text);
    setQuoteCitation(citation);
    setQuoteImageUrl(img || null);
    setQuoteModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Controlli Data (se non forniti esternamente o standalone) */}
      {!isEmbedded && (
        <div className="rounded-3xl border border-[#e2d5c4] bg-[#fdfbf7] p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🕊️</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                  Rito Ambrosiano · Calendario Agiografico Diocesano
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#3f3933]">
                Santo del Giorno (Rito Ambrosiano)
              </h1>
              <p className="text-xs sm:text-sm text-[#7d6b58] mt-1 font-serif italic">
                Agiografia e commemorazioni ufficiali della Chiesa di Milano (Arcidiocesi di Milano)
              </p>
            </div>

            {onDateChange && (
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
                  value={date}
                  onChange={(e) => onDateChange(e.target.value)}
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
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stato di caricamento */}
      {loading ? (
        <div className="rounded-3xl border border-[#e2d5c4] bg-[#fdfbf7] p-16 text-center shadow-sm space-y-4">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#aa9576]/30 border-t-[#5c4a37]"></div>
          <p className="font-serif text-lg text-[#aa9576]">
            Caricamento del Santo del Giorno da Chiesa di Milano...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center shadow-sm space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xl">
            ⚠️
          </div>
          <h3 className="font-serif text-lg font-bold text-rose-800">
            Impossibile caricare il Santo Ambrosiano
          </h3>
          <p className="text-xs text-rose-600 max-w-md mx-auto">{error}</p>
          <button
            onClick={() => fetchSanto(date)}
            className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition cursor-pointer"
          >
            Riprova
          </button>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Card Santo Ambrosiano Principale */}
          <div className="rounded-3xl border border-[#e0d6c7] bg-white p-6 sm:p-10 shadow-lg overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Colonna Iconografia Chiesa di Milano */}
              {data.imgUrl ? (
                <div className="md:col-span-5 flex flex-col items-center">
                  <div
                    onClick={() => setLightboxImage({ url: data.imgUrl!, title: data.title })}
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
                    Iconografia Chiesa di Milano
                  </span>
                </div>
              ) : (
                <div className="md:col-span-4 flex flex-col items-center justify-center p-8 rounded-2xl bg-[#faf6f0] border border-[#ede3d5] text-center">
                  <span className="text-5xl mb-3">🕊️</span>
                  <p className="font-serif text-sm font-semibold text-[#6e5a45]">
                    Calendario Agiografico Ambrosiano
                  </p>
                </div>
              )}

              {/* Colonna Dettagli e Biografia */}
              <div className={`${data.imgUrl ? "md:col-span-7" : "md:col-span-8"} space-y-4`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#f4efe6] px-3 py-1 text-xs font-bold text-[#6e5a45] border border-[#d9cdbf]">
                    📅 {data.dateLabel}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 shadow-2xs flex items-center gap-1.5">
                    <span>🕊️</span>
                    <span>Rito Ambrosiano</span>
                  </span>
                  <span className="rounded-full bg-[#ecfdf5] px-3 py-1 text-xs font-bold text-[#065f46] border border-[#a7f3d0]">
                    Chiesa di Milano (Arcidiocesi)
                  </span>
                </div>

                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2c2621] leading-tight">
                  {data.title}
                </h2>

                {/* Biografia / Testo Agiografico */}
                {data.martirologio && (
                  <div className="rounded-2xl border-l-4 border-emerald-700 bg-[#f9fbf9] p-5 sm:p-6 shadow-2xs space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                      Agiografia · Diocesi di Milano
                    </h3>
                    <div className="font-serif text-base sm:text-lg leading-relaxed text-[#2c2621] space-y-3">
                      {data.martirologio.split("\n\n").map((par, pIdx) => (
                        <p key={pIdx} className={pIdx === 0 ? "first-letter:text-3xl first-letter:font-bold first-letter:text-emerald-800 first-letter:mr-0.5" : ""}>
                          {par}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Barra Strumenti / Azioni */}
                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  {/* Lettore Vocale HD Neurale (Azure) */}
                  <LiturgicalTtsPlayer
                    htmlContent={`<div>${data.martirologio || data.title}</div>`}
                    customSpeechText={speechText}
                    lang="it"
                    title="Ascolta"
                  />

                  {/* Crea Stato WhatsApp con Iconografia */}
                  <button
                    onClick={() =>
                      openQuoteModal(
                        data.martirologio || data.title,
                        `Santo del Giorno · ${data.title} (Rito Ambrosiano)`,
                        data.imgUrl
                      )
                    }
                    className="flex items-center gap-1.5 rounded-xl border border-[#d9cdbf] bg-[#fbf8f4] px-3.5 py-2 text-xs font-bold text-[#5c4a37] hover:bg-[#ede4d6] transition cursor-pointer shadow-2xs"
                    title="Crea Card per lo Stato WhatsApp con iconografia e citazione"
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

                  {/* Vai alla Liturgia delle Ore Ambrosiana */}
                  <Link
                    href={`/liturgia?rite=ambrosiano&date=${date}`}
                    className="flex items-center gap-1.5 rounded-xl border border-[#d9cdbf] bg-[#fbf8f4] px-3.5 py-2 text-xs font-bold text-[#5c4a37] hover:bg-[#ede4d6] transition cursor-pointer shadow-2xs ml-auto"
                  >
                    <span>📖</span>
                    <span>Liturgia delle Ore</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Sezione Altri Santi e Beati del Giorno (Rito Ambrosiano) */}
          {data.altriSanti && data.altriSanti.length > 0 && (
            <div className="rounded-3xl border border-[#e0d6c7] bg-[#fdfbf7] p-6 sm:p-8 shadow-md space-y-5">
              <div className="flex items-center justify-between border-b border-[#e4dcce] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#3f3933]">
                    Altri Santi e Beati di Oggi
                  </h3>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                  {data.altriSanti.length} {data.altriSanti.length === 1 ? "commemorazione" : "commemorazioni"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.altriSanti.map((santo, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[#e2d5c4] bg-white p-5 shadow-xs transition hover:shadow-md hover:border-emerald-700/40 flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start gap-3.5">
                      {santo.imgUrl && (
                        <div
                          onClick={() => setLightboxImage({ url: santo.imgUrl!, title: santo.nome })}
                          className="group relative w-16 sm:w-20 shrink-0 overflow-hidden rounded-xl border border-[#d9cdbf] bg-[#fbf8f4] shadow-2xs cursor-zoom-in transition hover:shadow-md hover:border-[#aa9576]"
                          title="Clicca per ingrandire"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={santo.imgUrl}
                            alt={santo.nome}
                            className="w-full h-20 sm:h-24 object-cover object-top transition duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <span className="text-white text-xs">🔍</span>
                          </div>
                        </div>
                      )}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-700 shrink-0"></span>
                          <h4 className="font-serif text-base font-bold text-[#2c2621] leading-snug">
                            {santo.nome}
                          </h4>
                        </div>
                        {santo.martirologio ? (
                          <div className="font-serif text-xs sm:text-sm text-[#4a423a] leading-relaxed space-y-2">
                            {santo.martirologio.split("\n\n").map((p, pIdx) => (
                              <p key={pIdx}>{p}</p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[#8e7e6e] italic">
                            Commemorazione nel calendario della Chiesa di Milano.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f4efe6]">
                      <button
                        onClick={() =>
                          openQuoteModal(
                            santo.martirologio || santo.nome,
                            `Santo del Giorno · ${santo.nome} (Rito Ambrosiano)`,
                            santo.imgUrl
                          )
                        }
                        className="rounded-lg border border-[#e0d6c7] bg-[#fdfbf7] px-2.5 py-1 text-[11px] font-bold text-[#5c4a37] hover:bg-[#ede4d6] transition cursor-pointer"
                        title="Crea Card per lo Stato WhatsApp con iconografia"
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
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 cursor-zoom-out animate-fadeIn"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImage.url}
              alt={lightboxImage.title}
              className="w-full h-auto max-h-[85vh] object-contain rounded-2xl"
            />
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-xs font-semibold text-center pointer-events-none">
              {lightboxImage.title} · Clicca ovunque per chiudere
            </div>
          </div>
        </div>
      )}

      {/* Modal Card Stato WhatsApp */}
      <QuoteImageModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        initialText={quoteText}
        dateStr={date}
        liturgicalTitle={data?.title || "Santo del Giorno"}
        defaultCitation={quoteCitation}
        imageUrl={quoteImageUrl}
        moment="santo"
        rite="ambrosiano"
      />
    </div>
  );
}
