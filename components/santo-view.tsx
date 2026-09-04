"use client";

import React, { useState, useEffect, useCallback } from "react";
import { QuoteImageModal, resolveLiturgicalColor } from "@/components/quote-image-modal";
import { LiturgicalTtsPlayer } from "@/components/liturgical-tts-player";
import type { LiturgyRite } from "@/components/liturgia-reader";

export interface OtherSaint {
  nome: string;
  imgUrl: string | null;
  martirologio: string;
}

export interface SantoData {
  date: string;
  dateLabel: string;
  title: string;
  grado: string;
  imgUrl: string | null;
  martirologio: string;
  altriSanti: OtherSaint[];
  source: string;
  rite: LiturgyRite;
}

export interface SantoViewProps {
  date: string;
  rite: LiturgyRite;
  isChurchMode?: boolean;
  fontSize?: number;
  onRiteChange?: (rite: LiturgyRite) => void;
  onDateChange?: (date: string) => void;
  showHeaderControls?: boolean;
}

export function SantoView({
  date,
  rite,
  isChurchMode = false,
  fontSize = 17,
  onRiteChange,
  onDateChange,
  showHeaderControls = false,
}: SantoViewProps) {
  const [data, setData] = useState<SantoData | null>(null);
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

  // Fetch dati del Santo per la data e il rito correnti
  const fetchSanto = useCallback(async (dateStr: string, currentRite: LiturgyRite) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/santo-del-giorno?date=${dateStr}&rite=${currentRite}`);
      if (!res.ok) {
        throw new Error(`Impossibile caricare il Santo del Giorno (${res.status})`);
      }
      const json: SantoData = await res.json();
      setData(json);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Errore di connessione al servizio liturgico.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSanto(date, rite);
  }, [date, rite, fetchSanto]);

  const changeDateByDays = (days: number) => {
    if (!onDateChange) return;
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    onDateChange(`${year}-${month}-${day}`);
  };

  const copyToClipboard = () => {
    if (!data) return;
    const textToCopy = `${data.title} (${data.grado})\n${data.dateLabel} - ${data.source}\n\n${data.martirologio}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const openQuoteModalForMain = () => {
    if (!data) return;
    const selection = window.getSelection()?.toString().trim();
    const text = selection && selection.length > 5 ? selection : data.martirologio.slice(0, 280) + "...";
    setQuoteText(text);
    setQuoteCitation(`${data.title} · ${data.grado}`);
    setQuoteImageUrl(data.imgUrl || null);
    setQuoteModalOpen(true);
  };

  const openQuoteModalForOther = (other: OtherSaint) => {
    const text = other.martirologio.slice(0, 280) + (other.martirologio.length > 280 ? "..." : "");
    setQuoteText(text);
    setQuoteCitation(`${other.nome} · Santo del Giorno`);
    setQuoteImageUrl(other.imgUrl || null);
    setQuoteModalOpen(true);
  };

  const litColor = resolveLiturgicalColor(data?.grado, undefined, data?.title);

  return (
    <div className="space-y-6">
      {/* Controlli opzionali di testata (Data e Rito se mostrati) */}
      {showHeaderControls && (
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#e5dacf]">
          {/* Selettore Giorno */}
          <div className="flex items-center gap-1.5 bg-[#f5ede3] p-1 rounded-xl border border-[#e0d3c4]">
            <button
              onClick={() => changeDateByDays(-1)}
              className="p-1.5 rounded-lg hover:bg-white text-[#5c4a37] transition cursor-pointer text-sm font-bold"
              title="Giorno precedente"
            >
              ← Ieri
            </button>
            <input
              type="date"
              value={date}
              onChange={(e) => onDateChange && onDateChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#443729] px-2 py-1 outline-none cursor-pointer"
            />
            <button
              onClick={() => changeDateByDays(1)}
              className="p-1.5 rounded-lg hover:bg-white text-[#5c4a37] transition cursor-pointer text-sm font-bold"
              title="Giorno successivo"
            >
              Domani →
            </button>
          </div>

          {/* Selettore Rito */}
          {onRiteChange && (
            <div className="flex items-center gap-1 bg-[#f5ede3] p-1 rounded-xl border border-[#e0d3c4]">
              <button
                onClick={() => onRiteChange("ambrosiano")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                  rite === "ambrosiano"
                    ? "bg-[#5c4a37] text-white shadow-xs"
                    : "text-[#735e46] hover:bg-white/60"
                }`}
              >
                🕊️ Rito Ambrosiano
              </button>
              <button
                onClick={() => onRiteChange("romano")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                  rite === "romano"
                    ? "bg-[#5c4a37] text-white shadow-xs"
                    : "text-[#735e46] hover:bg-white/60"
                }`}
              >
                🏛️ Rito Romano
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stato di caricamento */}
      {loading ? (
        <div className="py-20 text-center space-y-4">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#aa9576]/30 border-t-[#5c4a37]"></div>
          <p className="font-serif text-lg text-[#aa9576]">
            Recupero del Santo del Giorno ({rite === "ambrosiano" ? "Rito Ambrosiano · Chiesa di Milano" : "Rito Romano · CEI"})...
          </p>
        </div>
      ) : error ? (
        <div className="py-12 text-center space-y-4 rounded-2xl bg-amber-50/70 border border-amber-200 p-6">
          <span className="text-3xl">⚠️</span>
          <p className="font-serif text-[#854d0e]">{error}</p>
          <button
            onClick={() => fetchSanto(date, rite)}
            className="px-4 py-2 rounded-xl bg-[#5c4a37] text-white text-xs font-bold hover:bg-[#443729] transition cursor-pointer"
          >
            Riprova
          </button>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Scheda Principale del Santo */}
          <div
            className={`rounded-3xl border p-6 sm:p-8 transition shadow-sm ${
              isChurchMode
                ? "bg-[#1f1c19] border-[#38332e] text-[#f2eee9]"
                : "bg-white/95 border-[#e8dfd3] text-[#2c2621]"
            }`}
          >
            {/* Intestazione: Grado Liturgico e Fonte */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#f0e7dc]">
              <div className="flex items-center gap-2">
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-2xs"
                  style={{
                    backgroundColor: litColor.badgeBg,
                    color: litColor.badgeText,
                    borderColor: litColor.badgeBorder,
                  }}
                >
                  {data.grado || (rite === "ambrosiano" ? "Rito Ambrosiano" : "Memoria")}
                </span>
                <span className="text-xs text-[#8a755d] italic">
                  {data.dateLabel}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8a755d]">
                <span>{rite === "ambrosiano" ? "🕊️" : "🏛️"}</span>
                <span>{data.source}</span>
              </div>
            </div>

            {/* Titolo e Barra Strumenti (TTS e Condivisione) */}
            <div className="pt-5 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2
                className="font-serif font-bold text-2xl sm:text-3xl tracking-tight leading-tight"
                style={{ color: isChurchMode ? "#ffffff" : "#443729" }}
              >
                {data.title}
              </h2>

              <div className="flex items-center gap-2 flex-wrap shrink-0">
                {/* Lettore Vocale Neurale Azure HD */}
                {data.martirologio && (
                  <LiturgicalTtsPlayer
                    htmlContent={`<div>${data.martirologio}</div>`}
                    customSpeechText={`${data.title}. ${data.grado}. ${data.martirologio}`}
                    title={`Ascolta vita di ${data.title}`}
                  />
                )}

                {/* Genera Card WhatsApp */}
                <button
                  onClick={openQuoteModalForMain}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition shadow-2xs cursor-pointer"
                  title="Crea card per lo stato di WhatsApp o social"
                >
                  <span>💬</span>
                  <span>Crea Stato WhatsApp</span>
                </button>

                {/* Copia Testo */}
                <button
                  onClick={copyToClipboard}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#d9cdbf] bg-[#faf7f2] text-[#5c4a37] text-xs font-bold hover:bg-[#ede4d6] transition shadow-2xs cursor-pointer"
                  title="Copia testo della biografia"
                >
                  <span>{copied ? "✓ Copiato" : "📋 Copia"}</span>
                </button>
              </div>
            </div>

            {/* Ritratto Sacro e Biografia */}
            <div className="mt-4 flex flex-col md:flex-row gap-6 items-start">
              {data.imgUrl && (
                <div className="w-full md:w-64 shrink-0">
                  <div
                    onClick={() => setLightboxImage({ url: data.imgUrl!, title: data.title })}
                    className="relative group rounded-2xl overflow-hidden border border-[#dfd3c3] shadow-md bg-[#f8f5ee] cursor-zoom-in"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={data.imgUrl}
                      alt={data.title}
                      className="w-full h-auto max-h-80 object-cover object-top transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                      <span>🔍</span>
                      <span>Ingrandisci</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-center text-[#8a755d] mt-1.5 italic">
                    Iconografia ufficiale {rite === "ambrosiano" ? "Arcidiocesi di Milano" : "CEI"}
                  </div>
                </div>
              )}

              {/* Paragrafi della Biografia / Martirologio */}
              <div className="flex-1 space-y-4">
                {data.martirologio.split("\n\n").map((p, idx) => (
                  <p
                    key={idx}
                    className="font-serif leading-relaxed text-justify"
                    style={{
                      fontSize: `${fontSize}px`,
                      lineHeight: "1.75",
                      color: isChurchMode ? "#ece8e2" : "#2c2621",
                    }}
                  >
                    {p}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Sezione: Altri Santi e Beati del giorno (Attiva soprattutto nel Rito Romano) */}
          {data.altriSanti && data.altriSanti.length > 0 && (
            <div
              className={`rounded-3xl border p-6 sm:p-8 transition shadow-sm ${
                isChurchMode
                  ? "bg-[#1a1715] border-[#38332e] text-[#ece8e2]"
                  : "bg-[#fcfaf6] border-[#e8dfd3] text-[#2c2621]"
              }`}
            >
              <div className="flex items-center gap-2 pb-4 mb-4 border-b border-[#e8ded0]">
                <span className="text-xl">✨</span>
                <h3 className="font-serif font-bold text-lg text-[#5c4a37]">
                  Altri Santi e Beati del giorno ({data.altriSanti.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.altriSanti.map((other, i) => (
                  <div
                    key={i}
                    className={`rounded-2xl border p-4 flex flex-col justify-between transition ${
                      isChurchMode
                        ? "bg-[#24201c] border-[#3f3830]"
                        : "bg-white border-[#ece2d5] hover:border-[#cfbeaa]"
                    }`}
                  >
                    <div>
                      <div className="flex items-start gap-3 mb-2">
                        {other.imgUrl && (
                          <div
                            onClick={() => setLightboxImage({ url: other.imgUrl!, title: other.nome })}
                            className="relative group w-14 h-14 rounded-xl overflow-hidden border border-[#dfd3c3] shrink-0 cursor-zoom-in bg-[#f4ece1]"
                            title="Clicca per ingrandire"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={other.imgUrl}
                              alt={other.nome}
                              className="w-full h-full object-cover object-top transition duration-200 group-hover:scale-110"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px]">
                              🔍
                            </div>
                          </div>
                        )}
                        <h4 className="font-serif font-bold text-sm text-[#443729] leading-snug">
                          {other.nome}
                        </h4>
                      </div>
                      <p
                        className="font-serif text-xs text-[#5c4a37] line-clamp-4 leading-relaxed italic"
                        style={{ color: isChurchMode ? "#d4cebf" : "#5c4a37" }}
                      >
                        {other.martirologio}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#f2ebe2] flex items-center justify-between text-xs">
                      <LiturgicalTtsPlayer
                        htmlContent={`<div>${other.martirologio}</div>`}
                        customSpeechText={`${other.nome}. ${other.martirologio}`}
                        title={`Ascolta vita di ${other.nome}`}
                      />
                      <button
                        onClick={() => openQuoteModalForOther(other)}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer flex items-center gap-1"
                      >
                        <span>💬</span>
                        <span>Crea Stato</span>
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
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
        >
          <div className="max-w-2xl max-h-[90vh] flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImage.url}
              alt={lightboxImage.title}
              className="max-h-[80vh] w-auto rounded-2xl object-contain shadow-2xl border border-white/20"
            />
            <p className="mt-3 text-white font-serif text-sm font-semibold text-center drop-shadow-md">
              {lightboxImage.title}
            </p>
            <span className="text-white/60 text-xs mt-1">Clicca ovunque per chiudere</span>
          </div>
        </div>
      )}

      {/* Modal Creazione Card WhatsApp */}
      <QuoteImageModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        quoteText={quoteText}
        citation={quoteCitation}
        liturgicalColor={litColor.colorKey}
        imageUrl={quoteImageUrl || undefined}
        moment="santo"
        rite={rite}
        dateStr={date}
      />
    </div>
  );
}
