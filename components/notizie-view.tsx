"use client";

import React, { useState, useEffect, useMemo } from "react";

interface NewsItem {
  id: string;
  sourceId: "milano" | "vaticano" | "roma" | "cei";
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

const SOURCES_CONFIG = [
  { id: "all", label: "Tutte le fonti", icon: "🌐", color: "#8a755d" },
  { id: "milano", label: "Diocesi di Milano", icon: "⛪", color: "#dc2626" },
  { id: "vaticano", label: "Vatican News", icon: "📡", color: "#ca8a04" },
  { id: "cei", label: "Chiesa Italiana (CEI)", icon: "📰", color: "#2563eb" },
  { id: "roma", label: "Diocesi di Roma", icon: "🏛️", color: "#9333ea" },
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
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
      setNews(data.news || []);
    } catch (err: any) {
      console.error("Errore fetch notizie:", err);
      setError(err.message || "Errore durante il caricamento delle notizie.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

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
        // Fallback a clipboard
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

  // Filtro in memoria per massima reattività
  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      const matchesSource = selectedSource === "all" || item.sourceId === selectedSource;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesSource;

      const matchesSearch =
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.categories.some((c) => c.toLowerCase().includes(q));

      return matchesSource && matchesSearch;
    });
  }, [news, selectedSource, searchQuery]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Intestazione Principale */}
      <div className="rounded-3xl bg-gradient-to-br from-[#fbf8f3] via-[#f7f2ea] to-[#ebdcc8] border border-[#e2d5c4] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f3ebd8] text-[#8a755d] text-xs font-semibold uppercase tracking-wider border border-[#e2d5c4]">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Feed Ufficiali in Tempo Reale
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#2c241c] tracking-tight">
              Ultime Notizie & Eventi Ecclesiali
            </h1>
            <p className="text-sm text-[#6b5d4e]">
              Rassegna stampa e aggiornamenti dalla Diocesi di Milano, dalla Santa Sede (Vatican News), dalla CEI e dalla Diocesi di Roma.
            </p>
          </div>

          <button
            onClick={() => fetchNews(true)}
            disabled={loading}
            className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-[#d8c5ad] bg-white/80 hover:bg-[#ebdcc8] text-[#4a3b2c] text-sm font-medium transition shadow-xs shrink-0 cursor-pointer disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
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
            <span>{loading ? "Aggiornamento..." : "Aggiorna Notizie"}</span>
          </button>
        </div>

        {/* Barra di Ricerca & Filtri */}
        <div className="mt-6 space-y-4">
          {/* Input di Ricerca */}
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a755d]"
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
              placeholder="Cerca tra le notizie (es. Papa, Arcivescovo, Caritas, Giubileo...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white/90 border border-[#d8c5ad] rounded-2xl text-sm text-[#2c241c] placeholder:text-[#a89987] focus:outline-hidden focus:ring-2 focus:ring-[#8a755d] shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#8a755d] hover:text-[#2c241c] font-medium bg-[#f0e6d6] px-2 py-0.5 rounded-full cursor-pointer"
              >
                Cancella
              </button>
            )}
          </div>

          {/* Filtro Fonti Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {SOURCES_CONFIG.map((src) => {
              const isSelected = selectedSource === src.id;
              return (
                <button
                  key={src.id}
                  onClick={() => setSelectedSource(src.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-medium transition whitespace-nowrap shadow-2xs cursor-pointer ${
                    isSelected
                      ? "bg-[#2c241c] text-[#f7f2ea] shadow-sm"
                      : "bg-white/80 hover:bg-white text-[#5c4e3f] border border-[#e2d5c4]"
                  }`}
                >
                  <span>{src.icon}</span>
                  <span>{src.label}</span>
                  {isSelected && (
                    <span className="ml-1 text-[11px] bg-white/20 px-1.5 py-0.2 rounded-full">
                      {filteredNews.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenuto / Griglia Notizie */}
      {loading && news.length === 0 ? (
        <div className="p-12 text-center space-y-4 rounded-3xl bg-[#fbf8f3] border border-[#e2d5c4]">
          <div className="inline-block w-8 h-8 border-3 border-[#8a755d] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-[#6b5d4e]">Caricamento e aggregazione feed in corso...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center space-y-3 rounded-3xl bg-red-50 border border-red-200 text-red-800">
          <p className="font-semibold text-sm">Si è verificato un errore durante il recupero dei feed.</p>
          <p className="text-xs opacity-90">{error}</p>
          <button
            onClick={() => fetchNews(true)}
            className="mt-2 px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-xl hover:bg-red-700 transition cursor-pointer"
          >
            Riprova
          </button>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="p-12 text-center space-y-3 rounded-3xl bg-[#fbf8f3] border border-[#e2d5c4] text-[#6b5d4e]">
          <p className="text-2xl">📰</p>
          <p className="font-medium">Nessuna notizia corrisponde ai criteri di ricerca selezionati.</p>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedSource("all");
              }}
              className="px-4 py-2 rounded-xl border border-[#d8c5ad] bg-white hover:bg-[#ebdcc8] text-xs font-medium mt-2 cursor-pointer"
            >
              Mostra tutte le notizie
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredNews.map((item) => (
            <article
              key={item.id}
              className="flex flex-col justify-between bg-white rounded-3xl border border-[#ebdcc8] shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden group hover:border-[#d8c5ad]"
            >
              {/* Immagine Copertina se presente */}
              {item.imageUrl && (
                <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-[#f4ece1]">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-103 transition duration-300"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <div className="absolute top-3 left-3">
                    <span
                      className="px-2.5 py-1 rounded-full text-white text-[11px] font-semibold tracking-wide shadow-sm"
                      style={{ backgroundColor: item.sourceBadgeColor }}
                    >
                      {item.sourceName}
                    </span>
                  </div>
                </div>
              )}

              {/* Corpo Card */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  {/* Intestazione metadati (quando non c'è immagine) */}
                  {!item.imageUrl && (
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="px-2.5 py-1 rounded-full text-white text-[11px] font-semibold tracking-wide"
                        style={{ backgroundColor: item.sourceBadgeColor }}
                      >
                        {item.sourceName}
                      </span>
                      <span className="text-xs text-[#8a755d] flex items-center gap-1 font-sans">
                        <span>📅</span>
                        <span>{formatRelativeTime(item.isoDate)}</span>
                      </span>
                    </div>
                  )}

                  {/* Data quando c'è immagine */}
                  {item.imageUrl && (
                    <div className="text-xs text-[#8a755d] flex items-center gap-1 font-sans">
                      <span>📅</span>
                      <span>{formatRelativeTime(item.isoDate)}</span>
                    </div>
                  )}

                  {/* Titolo */}
                  <h2 className="font-serif font-bold text-lg text-[#2c241c] leading-snug group-hover:text-[#8a755d] transition">
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
                    <p className="text-xs sm:text-sm text-[#5c4e3f] leading-relaxed line-clamp-3">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Footer Card: Categorie e Azioni */}
                <div className="pt-3 border-t border-[#f3ebd8] flex items-center justify-between gap-2">
                  {/* Categorie Tags */}
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    {item.categories.length > 0 ? (
                      item.categories.map((cat, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center text-[10px] sm:text-[11px] bg-[#fbf8f3] text-[#786653] px-2 py-0.5 rounded-full border border-[#ebdcc8] truncate max-w-[120px]"
                        >
                          <span className="mr-1 text-[9px]">🏷️</span>
                          <span className="truncate">{cat}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-[#a89987] italic">Notizia ecclesiale</span>
                    )}
                  </div>

                  {/* Bottoni Azione */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleShare(item)}
                      title="Condividi notizia"
                      className="h-8 w-8 inline-flex items-center justify-center rounded-xl text-[#786653] hover:bg-[#f3ebd8] hover:text-[#2c241c] transition cursor-pointer"
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
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#2c241c] hover:bg-[#4a3b2c] text-[#f7f2ea] text-xs font-medium transition shadow-2xs"
                    >
                      <span>Leggi</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
