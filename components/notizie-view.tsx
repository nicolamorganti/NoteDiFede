"use client";

import React, { useState, useEffect } from "react";

interface NewsItem {
  id: string;
  sourceId: "vaticano" | "cei" | "roma" | "milano";
  sourceName: string;
  sourceBadgeColor: string;
  title: string;
  link: string;
  pubDate: string;
  isoDate: string;
  description: string;
  imageUrl: string | null;
  categories: string[];
}

// 1. Ordine canonico richiesto: Tutte, Vaticano, CEI, Roma, Milano
const SOURCES_CONFIG = [
  { id: "all", label: "Tutte le fonti", icon: "🌐", color: "#8a755d" },
  { id: "vaticano", label: "Vatican News", icon: "📡", color: "#ca8a04" },
  { id: "cei", label: "Chiesa Italiana (CEI)", icon: "📰", color: "#2563eb" },
  { id: "roma", label: "Diocesi di Roma", icon: "🏛️", color: "#9333ea" },
  { id: "milano", label: "Diocesi di Milano", icon: "⛪", color: "#dc2626" },
];

function formatRelativeTime(isoDateStr: string): string {
  try {
    const d = new Date(isoDateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return "Poco fa";
    if (diffMin < 60) return `${diffMin} min fa`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "ora" : "ore"} fa`;
    if (diffDays === 1) return "Ieri";
    if (diffDays < 7) return `${diffDays} giorni fa`;

    return new Intl.DateTimeFormat("it-IT", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return "";
  }
}

export function NotizieView() {
  const [mounted, setMounted] = useState<boolean>(false);
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchNews();
  }, []);

  const fetchNews = async (forceRefresh: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/notizie${forceRefresh ? "?refresh=true" : ""}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Errore HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Impossibile recuperare le notizie");
      setAllNews(data.news || []);
    } catch (err: any) {
      console.error("Errore fetch notizie:", err);
      setError(err.message || "Errore durante il caricamento delle notizie.");
    } finally {
      setLoading(false);
    }
  };

  // Conteggio articoli per sorgente
  const sourceCounts: Record<string, number> = { all: allNews.length };
  allNews.forEach((item) => {
    sourceCounts[item.sourceId] = (sourceCounts[item.sourceId] || 0) + 1;
  });

  // Filtraggio diretto durante il render
  const cleanQ = searchQuery.toLowerCase().trim();
  const filteredNews = allNews.filter((item) => {
    if (selectedSource !== "all" && item.sourceId !== selectedSource) {
      return false;
    }
    if (cleanQ) {
      const matchesSearch =
        item.title.toLowerCase().includes(cleanQ) ||
        item.description.toLowerCase().includes(cleanQ) ||
        item.categories.some((c) => c.toLowerCase().includes(cleanQ));
      if (!matchesSearch) return false;
    }
    return true;
  });

  const handleShare = async (item: NewsItem) => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: item.description,
          url: item.link,
        });
        return;
      } catch {
        // fallback a clipboard
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(`${item.title}\n\n${item.link}`);
        setCopiedId(item.id);
        setTimeout(() => setCopiedId(null), 2500);
      } catch (e) {
        console.warn("Clipboard fallita:", e);
      }
    }
  };

  if (!mounted) {
    return (
      <div className="p-10 text-center space-y-3 rounded-2xl bg-[#fbf8f3] border border-[#e2d5c4]">
        <div className="inline-block w-7 h-7 border-3 border-[#8a755d] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs sm:text-sm font-medium text-[#6b5d4e]">Caricamento Notizie Ecclesiali...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 max-w-5xl mx-auto pb-16">
      {/* Header Compatto (senza slider orizzontali invasivi) */}
      <div className="rounded-2xl sm:rounded-3xl bg-[#fbf8f3] border border-[#ebdcc8] p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#6e5a45] text-white shadow-xs">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
            </span>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold font-serif text-[#2c241c] leading-tight">
                Notizie & Eventi Ecclesiali
              </h1>
              <p className="text-xs text-[#786653] hidden sm:block">
                Feed ufficiali: Vaticano, CEI, Diocesi di Roma e Diocesi di Milano
              </p>
            </div>
          </div>

          {/* Bottone Aggiorna Compatto */}
          <button
            type="button"
            onClick={() => fetchNews(true)}
            disabled={loading}
            title="Aggiorna Notizie dai feed RSS"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#d8c5ad] bg-white hover:bg-[#ebdcc8] text-[#4a3b2c] text-xs font-semibold transition shadow-2xs shrink-0 cursor-pointer disabled:opacity-50"
          >
            <svg
              className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#8a755d]" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="hidden xs:inline">{loading ? "Caricamento..." : "Aggiorna"}</span>
          </button>
        </div>

        {/* Ricerca & Filtri con Flex Wrap (Nessuna barra orizzontale) */}
        <div className="mt-3.5 space-y-2.5">
          {/* Input di Ricerca Compatto */}
          <div className="relative">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8a755d]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Cerca tra le notizie (es. Papa, Arcivescovo, Caritas...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white border border-[#d8c5ad] rounded-xl text-xs sm:text-sm text-[#2c241c] placeholder:text-[#a89987] focus:outline-hidden focus:ring-2 focus:ring-[#8a755d] shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#8a755d] hover:text-[#2c241c] font-medium bg-[#f0e6d6] px-1.5 py-0.5 rounded-md cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtro Fonti Pills con Flex Wrap (Ordine: Tutte, Vaticano, CEI, Roma, Milano) */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {SOURCES_CONFIG.map((src) => {
              const isSelected = selectedSource === src.id;
              const count = sourceCounts[src.id] || 0;
              return (
                <button
                  key={src.id}
                  type="button"
                  onClick={() => {
                    setSelectedSource(src.id);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition shadow-2xs cursor-pointer select-none ${
                    isSelected
                      ? "bg-[#2c241c] text-white shadow-sm ring-2 ring-[#8a755d]/50"
                      : "bg-white hover:bg-[#f7f2ea] text-[#5c4e3f] border border-[#e2d5c4]"
                  }`}
                >
                  <span className="text-xs">{src.icon}</span>
                  <span>{src.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isSelected ? "bg-white/20 text-[#fde047]" : "bg-[#f0e6d6] text-[#6b5d4e]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenuto / Griglia Notizie */}
      {loading && allNews.length === 0 ? (
        <div className="p-10 text-center space-y-3 rounded-2xl bg-[#fbf8f3] border border-[#e2d5c4]">
          <div className="inline-block w-7 h-7 border-3 border-[#8a755d] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs sm:text-sm font-medium text-[#6b5d4e]">Caricamento e aggregazione notizie in corso...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center space-y-2 rounded-2xl bg-red-50 border border-red-200 text-red-800">
          <p className="font-semibold text-xs sm:text-sm">Si è verificato un errore durante il recupero dei feed.</p>
          <p className="text-xs opacity-90">{error}</p>
          <button
            type="button"
            onClick={() => fetchNews(true)}
            className="mt-2 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-xl hover:bg-red-700 transition cursor-pointer"
          >
            Riprova
          </button>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="p-10 text-center space-y-2 rounded-2xl bg-[#fbf8f3] border border-[#e2d5c4] text-[#6b5d4e]">
          <p className="text-xl">📰</p>
          <p className="text-xs sm:text-sm font-medium">Nessuna notizia trovata per il filtro o la ricerca selezionata.</p>
          {(selectedSource !== "all" || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedSource("all");
              }}
              className="px-3 py-1.5 rounded-xl border border-[#d8c5ad] bg-white hover:bg-[#ebdcc8] text-xs font-medium mt-1.5 cursor-pointer"
            >
              Mostra tutte le notizie ({allNews.length})
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {filteredNews.map((item) => (
            <article
              key={item.id}
              className="flex flex-col justify-between bg-white rounded-2xl border border-[#ebdcc8] shadow-2xs hover:shadow-sm transition-all duration-150 overflow-hidden group hover:border-[#d8c5ad]"
            >
              {/* Immagine Copertina Compatta se presente */}
              {item.imageUrl && (
                <div className="relative h-40 sm:h-44 w-full overflow-hidden bg-[#f4ece1]">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-102 transition duration-200"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span
                      className="px-2 py-0.5 rounded-md text-white text-[10px] font-bold tracking-wide shadow-sm"
                      style={{ backgroundColor: item.sourceBadgeColor }}
                    >
                      {item.sourceName}
                    </span>
                  </div>
                </div>
              )}

              {/* Corpo Card Compatto */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  {/* Intestazione metadati (quando non c'è immagine) */}
                  {!item.imageUrl && (
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="px-2 py-0.5 rounded-md text-white text-[10px] font-bold tracking-wide"
                        style={{ backgroundColor: item.sourceBadgeColor }}
                      >
                        {item.sourceName}
                      </span>
                      <span className="text-[11px] text-[#8a755d] flex items-center gap-1 font-sans">
                        <span>📅</span>
                        <span>{formatRelativeTime(item.isoDate)}</span>
                      </span>
                    </div>
                  )}

                  {/* Data quando c'è immagine */}
                  {item.imageUrl && (
                    <div className="text-[11px] text-[#8a755d] flex items-center gap-1 font-sans">
                      <span>📅</span>
                      <span>{formatRelativeTime(item.isoDate)}</span>
                    </div>
                  )}

                  {/* Titolo */}
                  <h2 className="font-serif font-bold text-base sm:text-lg text-[#2c241c] leading-snug group-hover:text-[#8a755d] transition">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="focus:outline-hidden hover:underline"
                    >
                      {item.title}
                    </a>
                  </h2>

                  {/* Estratto Descrizione */}
                  {item.description && (
                    <p className="text-xs text-[#5c4e3f] leading-relaxed line-clamp-2 sm:line-clamp-3">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Footer Card: Categorie e Azioni */}
                <div className="pt-2.5 border-t border-[#f3ebd8] flex items-center justify-between gap-2">
                  {/* Categorie Tags */}
                  <div className="flex items-center gap-1 overflow-hidden">
                    {item.categories.length > 0 ? (
                      item.categories.map((cat, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center text-[10px] bg-[#fbf8f3] text-[#786653] px-1.5 py-0.5 rounded-md border border-[#ebdcc8] truncate max-w-[110px]"
                        >
                          <span className="mr-1 text-[8px]">🏷️</span>
                          <span className="truncate">{cat}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-[#a89987] italic">Notizia ecclesiale</span>
                    )}
                  </div>

                  {/* Bottoni Azione */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleShare(item)}
                      title="Condividi notizia"
                      className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-[#786653] hover:bg-[#f3ebd8] hover:text-[#2c241c] transition cursor-pointer"
                    >
                      {copiedId === item.id ? (
                        <span className="text-xs font-bold text-green-600">✓</span>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                          />
                        </svg>
                      )}
                    </button>

                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2c241c] hover:bg-[#4a3b2c] text-[#f7f2ea] text-xs font-medium transition shadow-2xs"
                    >
                      <span>Leggi</span>
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
