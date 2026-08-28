"use client";

import { useState, useRef } from "react";
import { PreghieraNav } from "@/components/preghiera-nav";
import { PREGHIERE_TRADIZIONE, PreghieraTradizionale } from "@/lib/preghiere-tradizione-data";
import { QuoteImageModal } from "@/components/quote-image-modal";
import { useTextSelectionQuote } from "@/lib/use-text-selection-quote";

export function PreghiereTradizioneReader() {
  const [selectedPrayer, setSelectedPrayer] = useState<PreghieraTradizionale | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("Tutte");
  const [searchQuery, setSearchQuery] = useState<string>("" );
  const [languageMode, setLanguageMode] = useState<"it" | "la" | "both">("it");
  const [fontSize, setFontSize] = useState<number>(17);
  const [isChurchMode, setIsChurchMode] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const readerContainerRef = useRef<HTMLDivElement | null>(null);
  const {
    quoteModalOpen,
    setQuoteModalOpen,
    selectedQuoteText,
    hasActiveSelection,
  } = useTextSelectionQuote(readerContainerRef);


  const categories = [
    "Tutte",
    "Fondamentali",
    "Mariane",
    "Spirito Santo",
    "Eucaristiche",
    "Cantici",
    "Atti",
    "Devozioni",
  ];

  const filteredPrayers = PREGHIERE_TRADIZIONE.filter((p) => {
    if (activeCategory !== "Tutte" && p.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        (p.latinTitle && p.latinTitle.toLowerCase().includes(q)) ||
        p.description.toLowerCase().includes(q) ||
        p.textItalian.toLowerCase().includes(q) ||
        (p.textLatin && p.textLatin.toLowerCase().includes(q)) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCopy = (prayer: PreghieraTradizionale) => {
    let content = `${prayer.title}\n\n${prayer.textItalian}`;
    if (languageMode === "la" && prayer.textLatin) {
      content = `${prayer.latinTitle || prayer.title}\n\n${prayer.textLatin}`;
    } else if (languageMode === "both" && prayer.textLatin) {
      content = `${prayer.title} (${prayer.latinTitle || ""})\n\n[Italiano]\n${prayer.textItalian}\n\n[Latino]\n${prayer.textLatin}`;
    }
    navigator.clipboard.writeText(content);
    setCopiedId(prayer.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Sottomenu Navigazione Sezione Preghiera */}
      <PreghieraNav />

      {/* Intestazione */}
      <div className="border-b border-[#e4dcce] pb-6 space-y-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#5c4a37] text-white shadow-sm">
            📿
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#aa9576]">
            Patrimonio Spirituale della Chiesa Cattolica
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-serif text-3xl font-normal text-[#3f3933]">
            Preghiere della Tradizione Cristiana
          </h2>
          <span className="rounded-full bg-[#ebdcc8] border border-[#d9c5ac] px-2.5 py-0.5 text-xs font-bold text-[#5c4a37]">
            {PREGHIERE_TRADIZIONE.length} Preghiere · Italiano & Latino
          </span>
        </div>
        <p className="text-sm text-[#736555] max-w-3xl leading-relaxed">
          Il tesoro delle preghiere bimillenarie della Chiesa: dai fondamenti evangelici (il <em>Padre Nostro</em> e l&apos;<em>Ave Maria</em>) alle grandi professioni di fede, inni patristici, sequenze dello Spirito Santo, cantici biblici e invocazioni mariane.
        </p>
      </div>

      {/* Barra Strumenti: Ricerca, Lingua, Modalità Notturna & Tipografia */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[#e4dcce] bg-[#fffdfa] p-3.5 shadow-xs">
        {/* Ricerca */}
        <div className="relative flex-1 min-w-[220px]">
          <input
            type="text"
            placeholder="Cerca preghiera per titolo, testo o tema..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-[#dac8b1] bg-[#fdfbf7] py-2 pl-9 pr-4 text-xs text-[#3f3933] placeholder-[#8a755d] focus:border-[#aa9576] focus:outline-none"
          />
          <span className="absolute left-3 top-2.5 text-xs text-[#8a755d]">🔍</span>
        </div>

        {/* Selettore Lingua */}
        <div className="flex items-center rounded-2xl border border-[#d9cdbf] bg-[#fbf8f4] p-0.5">
          <button
            onClick={() => setLanguageMode("it")}
            className={`px-3 py-1 text-xs font-bold rounded-xl transition ${
              languageMode === "it"
                ? "bg-[#5c4a37] text-white shadow-xs"
                : "text-[#5c4a37] hover:bg-[#ede4d6]"
            }`}
          >
            Italiano
          </button>
          <button
            onClick={() => setLanguageMode("la")}
            className={`px-3 py-1 text-xs font-bold rounded-xl transition ${
              languageMode === "la"
                ? "bg-[#5c4a37] text-white shadow-xs"
                : "text-[#5c4a37] hover:bg-[#ede4d6]"
            }`}
          >
            Latino
          </button>
          <button
            onClick={() => setLanguageMode("both")}
            className={`px-3 py-1 text-xs font-bold rounded-xl transition ${
              languageMode === "both"
                ? "bg-[#5c4a37] text-white shadow-xs"
                : "text-[#5c4a37] hover:bg-[#ede4d6]"
            }`}
          >
            Parallelo 🇮🇹/🇻🇦
          </button>
        </div>

        {/* Dimensione Font */}
        <div className="flex items-center rounded-xl border border-[#d9cdbf] bg-[#fbf8f4] p-0.5">
          <button
            onClick={() => setFontSize((s) => Math.max(14, s - 1))}
            disabled={fontSize <= 14}
            className="px-2 py-1 text-xs font-bold text-[#5c4a37] hover:bg-[#ede4d6] rounded-lg transition disabled:opacity-30"
            title="Riduci font"
          >
            A-
          </button>
          <span className="px-1 text-[11px] font-mono text-[#8a755d]">{fontSize}px</span>
          <button
            onClick={() => setFontSize((s) => Math.min(26, s + 1))}
            disabled={fontSize >= 26}
            className="px-2 py-1 text-xs font-bold text-[#5c4a37] hover:bg-[#ede4d6] rounded-lg transition disabled:opacity-30"
            title="Aumenta font"
          >
            A+
          </button>
        </div>

        {/* Modalità Chiesa */}
        <button
          onClick={() => setIsChurchMode(!isChurchMode)}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
            isChurchMode
              ? "bg-[#292524] border-[#44403c] text-amber-300 shadow-xs"
              : "bg-[#fbf8f4] border-[#d9cdbf] text-[#5c4a37] hover:bg-[#ede4d6]"
          }`}
        >
          <span>{isChurchMode ? "🌙 Notturna" : "☀️ Diurna"}</span>
        </button>
      </div>

      {/* Categorie Filtri */}
      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat);
              setSelectedPrayer(null);
            }}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              activeCategory === cat
                ? "bg-[#5c4a37] text-white shadow-xs"
                : "bg-[#f5ece0] text-[#6b5d4e] hover:bg-[#ebdcc8]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Dettaglio Singola Preghiera Selezionata */}
      {selectedPrayer ? (
        <div
          ref={readerContainerRef}
          className={`rounded-3xl border p-6 sm:p-10 shadow-lg space-y-6 animate-in fade-in duration-200 ${
            isChurchMode
              ? "border-[#3f3a36] bg-[#181614] text-[#ece8e2]"
              : "border-[#e0d6c7] bg-[#fefdfb] text-[#2c2621]"
          }`}
        >

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: isChurchMode ? "#38332f" : "#ebdcc8" }}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedPrayer.icon}</span>
                <span className="text-xs uppercase tracking-widest font-sans font-bold text-[#aa9576]">
                  {selectedPrayer.category} · Tradizione Cristiana
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold" style={{ color: isChurchMode ? "#fbbf24" : "#5c4a37" }}>
                {selectedPrayer.title}
              </h3>
              {selectedPrayer.latinTitle && selectedPrayer.latinTitle !== selectedPrayer.title && (
                <p className="text-sm font-serif italic text-[#8a755d]">
                  «{selectedPrayer.latinTitle}»
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(selectedPrayer)}
                className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition"
                style={{
                  backgroundColor: isChurchMode ? "#2a2420" : "#f5ede0",
                  borderColor: isChurchMode ? "#443e38" : "#dac7b0",
                  color: isChurchMode ? "#fde047" : "#5c4a37",
                }}
              >
                {copiedId === selectedPrayer.id ? (
                  <span className="text-emerald-500 font-bold">✓ Copiato</span>
                ) : (
                  <span>📋 Copia</span>
                )}
              </button>

              <button
                onClick={() => setSelectedPrayer(null)}
                className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition"
                style={{
                  backgroundColor: isChurchMode ? "#2a2420" : "#f5ede0",
                  borderColor: isChurchMode ? "#443e38" : "#dac7b0",
                  color: isChurchMode ? "#fde047" : "#5c4a37",
                }}
              >
                <span>← Indice</span>
              </button>
            </div>
          </div>

          <p className="text-xs italic leading-relaxed text-[#8a755d] font-sans">
            {selectedPrayer.description}
            {selectedPrayer.origin && <span> — <em>{selectedPrayer.origin}</em></span>}
          </p>

          {/* Testo Preghiera */}
          {languageMode === "both" && selectedPrayer.textLatin ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Colonna Italiano */}
              <div className="space-y-2 p-5 rounded-2xl border" style={{ borderColor: isChurchMode ? "#38332f" : "#ebdcc8", backgroundColor: isChurchMode ? "#1e1a17" : "#fffdfa" }}>
                <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#aa9576]">
                  🇮🇹 Testo in Italiano
                </span>
                <p
                  className="font-serif whitespace-pre-line leading-relaxed"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {selectedPrayer.textItalian}
                </p>
              </div>

              {/* Colonna Latino */}
              <div className="space-y-2 p-5 rounded-2xl border" style={{ borderColor: isChurchMode ? "#38332f" : "#ebdcc8", backgroundColor: isChurchMode ? "#1e1a17" : "#fffdfa" }}>
                <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#aa9576]">
                  🇻🇦 Testo in Latino
                </span>
                <p
                  className="font-serif whitespace-pre-line leading-relaxed italic"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {selectedPrayer.textLatin}
                </p>
              </div>
            </div>
          ) : (
            <div
              className="p-6 rounded-2xl border leading-relaxed font-serif whitespace-pre-line shadow-inner"
              style={{
                fontSize: `${fontSize}px`,
                backgroundColor: isChurchMode ? "#1f1b18" : "#fffdfa",
                borderColor: isChurchMode ? "#38332f" : "#ebdcc8",
              }}
            >
              {languageMode === "la" && selectedPrayer.textLatin
                ? selectedPrayer.textLatin
                : selectedPrayer.textItalian}
            </div>
          )}
        </div>
      ) : (
        /* Griglia delle Preghiere */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPrayers.map((prayer) => (
            <div
              key={prayer.id}
              onClick={() => setSelectedPrayer(prayer)}
              className={`group flex flex-col justify-between p-5 rounded-3xl border transition shadow-sm hover:shadow-md cursor-pointer space-y-4 ${
                isChurchMode
                  ? "border-[#3f3a36] bg-[#1e1a17] text-[#ece8e2] hover:bg-[#27221e] hover:border-amber-400"
                  : "border-[#e0d6c7] bg-[#fffdfa] text-[#2c2621] hover:bg-[#fbf7f0] hover:border-[#aa9576]"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl group-hover:scale-110 transition-transform">
                      {prayer.icon}
                    </span>
                    <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#aa9576] bg-[#f4ece0] dark:bg-[#332b24] px-2 py-0.5 rounded-md">
                      {prayer.category}
                    </span>
                  </div>
                  <span className="text-xs text-[#8a755d] font-semibold group-hover:translate-x-1 transition-transform">
                    Recita →
                  </span>
                </div>

                <h3
                  className="font-serif text-lg font-bold group-hover:text-[#5c4a37] dark:group-hover:text-amber-300 transition-colors"
                  style={{ color: isChurchMode ? "#fbbf24" : "#3f3933" }}
                >
                  {prayer.title}
                </h3>
                {prayer.latinTitle && prayer.latinTitle !== prayer.title && (
                  <p className="text-xs font-serif italic text-[#8a755d]">
                    «{prayer.latinTitle}»
                  </p>
                )}
                <p className="text-xs text-[#736555] dark:text-[#a89d91] line-clamp-2 leading-relaxed">
                  {prayer.description}
                </p>
              </div>

              <div
                className="pt-3 border-t flex items-center justify-between text-[11px] text-[#8a755d]"
                style={{ borderColor: isChurchMode ? "#332b24" : "#f0e6d9" }}
              >
                <span className="font-sans font-medium">
                  {prayer.textLatin ? "🇮🇹 Italiano & 🇻🇦 Latino" : "🇮🇹 Italiano"}
                </span>
                <span className="font-bold text-[#5c4a37] dark:text-amber-400">Apri Testo 📖</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Barra Azione Flottante Inferiore per Selezione Testo (Stato WhatsApp) */}
      {hasActiveSelection && !quoteModalOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <button
            type="button"
            onClick={() => setQuoteModalOpen(true)}
            className="flex items-center gap-2 rounded-full bg-[#2c241c] text-white px-5 py-3 text-xs sm:text-sm font-serif font-bold shadow-2xl hover:bg-[#44382c] hover:scale-105 active:scale-95 transition border border-[#d8c5ad] cursor-pointer"
          >
            <span>📸</span>
            <span>Crea Stato WhatsApp</span>
          </button>
        </div>
      )}

      {/* Modale Generatore Card / Stato WhatsApp */}
      <QuoteImageModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        initialText={selectedQuoteText}
        defaultCitation={
          selectedPrayer
            ? `${selectedPrayer.title} · Tradizione Cristiana`
            : "Preghiere della Tradizione Cristiana"
        }
        liturgicalTitle={selectedPrayer?.title || "Tradizione Cristiana"}
      />
    </div>
  );
}

