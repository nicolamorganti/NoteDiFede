"use client";

import { useState, useEffect, useRef } from "react";
import { PreghieraNav } from "@/components/preghiera-nav";
import { BIBLE_BOOKS, BibleBook } from "@/lib/bibbia-books";
import { BibleApiResponse, BibleVerse, BibleCrossRef, BibleFootnote } from "@/app/api/bibbia/route";


export type LineSpacingOption = "compact" | "normal" | "relaxed";

// Funzione di formattazione markdown per la Lectio Divina
function formatMarkdownToHtml(markdown: string): string {
  let html = markdown
    // Titoli h3 / h2
    .replace(/^### (.*$)/gim, '<h4 class="lectio-h4">$1</h4>')
    .replace(/^## (.*$)/gim, '<h3 class="lectio-h3">$1</h3>')
    .replace(/^# (.*$)/gim, '<h2 class="lectio-h2">$1</h2>')
    // Grassetti
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Corsivi
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Elenchi puntati
    .replace(/^\s*-\s+(.*$)/gim, '<li class="lectio-li">$1</li>')
    .replace(/^\s*\*\s+(.*$)/gim, '<li class="lectio-li">$1</li>')
    // Paragrafi e a capo
    .replace(/\n\n/g, '</p><p class="lectio-p">')
    .replace(/\n/g, '<br />');

  return `<p class="lectio-p">${html}</p>`;
}

export function BibbiaReader() {
  // Stato Libro e Capitolo
  const [selectedBookId, setSelectedBookId] = useState<string>("Gv");
  const [chapter, setChapter] = useState<number>(1);
  const [testamentFilter, setTestamentFilter] = useState<"all" | "nt" | "at">("nt");
  const [searchFilter, setSearchFilter] = useState<string>("");

  // Preferenze di lettura
  const [fontSize, setFontSize] = useState<number>(18);
  const [lineSpacing, setLineSpacing] = useState<LineSpacingOption>("compact");
  const [isChurchMode, setIsChurchMode] = useState<boolean>(false);

  // Dati capitolo
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [chapterData, setChapterData] = useState<BibleApiResponse | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedVerseNum, setSelectedVerseNum] = useState<number | null>(null);

  // Stato Audio & Passi Paralleli (Scrutatio)
  const [showAudioPlayer, setShowAudioPlayer] = useState<boolean>(false);
  const [activeCrossRefVerseNum, setActiveCrossRefVerseNum] = useState<number | null>(null);
  const [showFootnotes, setShowFootnotes] = useState<boolean>(true);

  // Stato Lectio Divina con Gemini
  const [lectioLoading, setLectioLoading] = useState<boolean>(false);
  const [lectioText, setLectioText] = useState<string | null>(null);
  const [lectioError, setLectioError] = useState<string | null>(null);
  const [showLectio, setShowLectio] = useState<boolean>(false);
  const [copiedLectio, setCopiedLectio] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const readerContainerRef = useRef<HTMLDivElement | null>(null);
  const lectioSectionRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentBook = BIBLE_BOOKS.find((b) => b.id === selectedBookId) || BIBLE_BOOKS[0];

  const handleNavigateToRef = (ref: BibleCrossRef) => {
    if (ref.bookCode && ref.chapter) {
      setSelectedBookId(ref.bookCode);
      const targetBook = BIBLE_BOOKS.find((b) => b.id === ref.bookCode);
      if (targetBook) {
        setTestamentFilter(targetBook.testament);
      }
      setChapter(ref.chapter);
      setActiveCrossRefVerseNum(null);
      if (readerContainerRef.current) {
        readerContainerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };


  // Inizializza preferenze da localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedBook = localStorage.getItem("bibbia_last_book");
      const savedChapter = localStorage.getItem("bibbia_last_chapter");
      if (savedBook && BIBLE_BOOKS.some((b) => b.id === savedBook)) {
        setSelectedBookId(savedBook);
        const bookObj = BIBLE_BOOKS.find((b) => b.id === savedBook);
        if (bookObj) {
          setTestamentFilter(bookObj.testament);
        }
      }
      if (savedChapter) {
        const num = parseInt(savedChapter, 10);
        if (!isNaN(num) && num >= 1) {
          setChapter(num);
        }
      }

      const savedSize = localStorage.getItem("liturgia_font_size");
      if (savedSize) {
        const num = parseInt(savedSize, 10);
        if (!isNaN(num) && num >= 14 && num <= 28) setFontSize(num);
      }
      const savedSpacing = localStorage.getItem("liturgia_line_spacing") as LineSpacingOption;
      if (savedSpacing === "compact" || savedSpacing === "normal" || savedSpacing === "relaxed") {
        setLineSpacing(savedSpacing);
      }
      const savedChurchMode = localStorage.getItem("liturgia_church_mode");
      if (savedChurchMode === "true") setIsChurchMode(true);
    }
  }, []);

  // Fetch del capitolo
  const fetchChapter = async (bId: string, chapNum: number) => {
    setLoading(true);
    setError(null);
    setSelectedVerseNum(null);
    setActiveCrossRefVerseNum(null);
    setShowAudioPlayer(false);
    // Reset lectio on chapter change
    setLectioText(null);
    setLectioError(null);
    setShowLectio(false);


    try {
      const res = await fetch(`/api/bibbia?book=${encodeURIComponent(bId)}&chapter=${chapNum}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Errore HTTP ${res.status}`);
      }
      const data: BibleApiResponse = await res.json();
      setChapterData(data);

      if (typeof window !== "undefined") {
        localStorage.setItem("bibbia_last_book", bId);
        localStorage.setItem("bibbia_last_chapter", String(chapNum));
      }

      if (readerContainerRef.current) {
        readerContainerRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    } catch (err: any) {
      console.error("Errore fetch capitolo bibbia:", err);
      setError(err.message || "Impossibile caricare il capitolo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChapter(selectedBookId, chapter);
  }, [selectedBookId, chapter]);

  // Gestione cambio libro
  const handleSelectBook = (book: BibleBook) => {
    setSelectedBookId(book.id);
    setChapter(1);
  };

  // Navigazione capitoli
  const handlePrevChapter = () => {
    if (chapter > 1) {
      setChapter((c) => c - 1);
    } else {
      const currentIndex = BIBLE_BOOKS.findIndex((b) => b.id === selectedBookId);
      if (currentIndex > 0) {
        const prevBook = BIBLE_BOOKS[currentIndex - 1];
        setSelectedBookId(prevBook.id);
        setChapter(prevBook.chaptersCount);
      }
    }
  };

  const handleNextChapter = () => {
    if (chapter < currentBook.chaptersCount) {
      setChapter((c) => c + 1);
    } else {
      const currentIndex = BIBLE_BOOKS.findIndex((b) => b.id === selectedBookId);
      if (currentIndex < BIBLE_BOOKS.length - 1) {
        const nextBook = BIBLE_BOOKS[currentIndex + 1];
        setSelectedBookId(nextBook.id);
        setChapter(1);
      }
    }
  };

  // Timer secondi trascorsi durante la generazione
  useEffect(() => {
    let interval: any;
    if (lectioLoading) {
      setElapsedSeconds(0);
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [lectioLoading]);

  // Annulla generazione in corso
  const handleCancelLectio = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLectioLoading(false);
    setLectioError("Generazione annullata dall'utente.");
  };

  // Generazione Lectio Divina con Gemini
  const handleGenerateLectio = async () => {
    if (lectioText) {
      setShowLectio((prev) => !prev);
      return;
    }

    if (!chapterData || !chapterData.verses.length) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLectioLoading(true);
    setLectioError(null);
    setShowLectio(true);

    const fullChapterText = chapterData.verses
      .map((v) => `${v.num}. ${v.text}`)
      .join("\n");

    try {
      const res = await fetch("/api/bibbia/lectio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookName: chapterData.bookName,
          chapter: chapterData.chapter,
          category: chapterData.category,
          text: fullChapterText,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Errore HTTP ${res.status}: Impossibile completare la richiesta.`);
      }

      const data = await res.json();
      setLectioText(data.lectio);

      setTimeout(() => {
        if (lectioSectionRef.current) {
          lectioSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } catch (err: any) {
      if (err.name === "AbortError") {
        setLectioError("Elaborazione annullata.");
      } else {
        console.error("Errore generazione Lectio:", err);
        setLectioError(err.message || "Impossibile generare la Lectio Divina.");
      }
    } finally {
      setLectioLoading(false);
    }
  };


  // Copia Lectio
  const handleCopyLectio = async () => {
    if (!lectioText) return;
    try {
      await navigator.clipboard.writeText(lectioText);
      setCopiedLectio(true);
      setTimeout(() => setCopiedLectio(false), 2500);
    } catch (e) {
      console.error("Errore copia Lectio:", e);
    }
  };

  // Preferenze UI
  const handleFontSizeChange = (delta: number) => {
    setFontSize((prev) => {
      const next = Math.max(14, Math.min(26, prev + delta));
      if (typeof window !== "undefined") {
        localStorage.setItem("liturgia_font_size", String(next));
      }
      return next;
    });
  };

  const cycleLineSpacing = () => {
    setLineSpacing((prev) => {
      let next: LineSpacingOption = "compact";
      if (prev === "compact") next = "normal";
      else if (prev === "normal") next = "relaxed";
      else next = "compact";

      if (typeof window !== "undefined") {
        localStorage.setItem("liturgia_line_spacing", next);
      }
      return next;
    });
  };

  const toggleChurchMode = () => {
    setIsChurchMode((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("liturgia_church_mode", String(next));
      }
      return next;
    });
  };

  const handleCopyChapter = async () => {
    if (!chapterData || !chapterData.verses.length) return;
    try {
      const formatted = `${chapterData.bookName}, Capitolo ${chapterData.chapter} (CEI 2008)\n\n` +
        chapterData.verses.map((v) => `[${v.num}] ${v.text}`).join("\n\n");
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error("Errore copia:", e);
    }
  };

  // Libri filtrati
  const filteredBooks = BIBLE_BOOKS.filter((b) => {
    if (testamentFilter === "nt" && b.testament !== "nt") return false;
    if (testamentFilter === "at" && b.testament !== "at") return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        b.shortName.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const lineHeightValue = lineSpacing === "compact" ? 1.38 : lineSpacing === "normal" ? 1.58 : 1.85;
  const paragraphMarginValue = lineSpacing === "compact" ? "0.45em" : lineSpacing === "normal" ? "0.75em" : "1.15em";
  const spacingLabel = lineSpacing === "compact" ? "Compatta" : lineSpacing === "normal" ? "Normale" : "Ampia";

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Sottomenu di Navigazione Sezione Preghiera */}
      <PreghieraNav />

      {/* Intestazione */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e4dcce] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#5c4a37] text-white shadow-sm">
              📜
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#aa9576]">
              Testo Ufficiale CEI 2008
            </span>
          </div>
          <h2 className="font-serif text-3xl font-normal text-[#3f3933] mt-1">
            La Sacra Bibbia (CEI 2008)
          </h2>
          <p className="text-sm text-[#736555]">
            Antico e Nuovo Testamento · Traduzione Ufficiale della Conferenza Episcopale Italiana
          </p>
        </div>

        {/* Badge Canone Cattolico */}
        <div className="inline-flex items-center gap-2 rounded-2xl bg-[#ebe3d5] border border-[#dacbb8] px-4 py-2 text-xs font-bold text-[#5c4a37]">
          <span>Canone Cattolico Ufficiale (73 Libri)</span>
        </div>
      </div>

      {/* Filtri Testamento & Ricerca Libro */}
      <div className="rounded-3xl border border-[#e4dcce] bg-[#fffdfa] p-4 sm:p-5 shadow-sm space-y-4">
        {/* Filtri Testamento */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center p-1 rounded-2xl bg-[#ede4d8] border border-[#dacbb8]">
            <button
              onClick={() => setTestamentFilter("nt")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                testamentFilter === "nt"
                  ? "bg-[#5c4a37] text-white shadow-md"
                  : "text-[#6b5d4e] hover:text-[#3f3933]"
              }`}
            >
              Nuovo Testamento (27)
            </button>
            <button
              onClick={() => setTestamentFilter("at")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                testamentFilter === "at"
                  ? "bg-[#5c4a37] text-white shadow-md"
                  : "text-[#6b5d4e] hover:text-[#3f3933]"
              }`}
            >
              Antico Testamento (46)
            </button>
            <button
              onClick={() => setTestamentFilter("all")}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                testamentFilter === "all"
                  ? "bg-[#5c4a37] text-white shadow-md"
                  : "text-[#6b5d4e] hover:text-[#3f3933]"
              }`}
            >
              Tutti (73)
            </button>
          </div>

          {/* Ricerca Libro */}
          <div className="relative min-w-[220px]">
            <input
              type="text"
              placeholder="Cerca libro (es. Giovanni, Salmi)..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full rounded-xl border border-[#d9cdbf] bg-[#fbf8f4] px-3.5 py-1.5 text-xs text-[#3f3933] placeholder-[#9c8974] outline-none transition focus:border-[#aa9576]"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter("")}
                className="absolute right-2.5 top-1.5 text-xs text-[#8a755d] hover:text-[#3f3933]"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Griglia Selezione Libri */}
        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1 py-1">
          {filteredBooks.map((b) => {
            const isSelected = b.id === selectedBookId;
            return (
              <button
                key={b.id}
                onClick={() => handleSelectBook(b)}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                  isSelected
                    ? "bg-[#5c4a37] text-white font-bold shadow-sm"
                    : "bg-[#f4efe6] text-[#5c4a37] hover:bg-[#ebdcc8] border border-[#e4d7c7]"
                }`}
              >
                {b.shortName}
              </button>
            );
          })}
        </div>

        {/* Selettore Capitoli a Griglia */}
        <div className="border-t border-[#ebdcc8] pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5c4a37]">
              Capitoli di {currentBook.name} ({currentBook.chaptersCount}):
            </span>
            <span className="text-xs text-[#8a755d]">
              Capitolo selezionato: <b>{chapter}</b>
            </span>
          </div>

          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto pr-1 py-1">
            {Array.from({ length: currentBook.chaptersCount }, (_, i) => i + 1).map((c) => {
              const isSelected = c === chapter;
              return (
                <button
                  key={c}
                  onClick={() => setChapter(c)}
                  className={`h-8 w-8 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                    isSelected
                      ? "bg-[#aa9576] text-white shadow-md scale-105"
                      : "bg-[#f8f4ec] text-[#6b5d4e] hover:bg-[#ebdcc8] border border-[#e0d3c3]"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Barra Strumenti Lettura & Navigazione Capitoli */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[#e4dcce] bg-[#fffdfa] p-3.5 shadow-sm">
        {/* Navigazione Veloce Capitoli */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevChapter}
            className="flex items-center gap-1 rounded-xl border border-[#d9cdbf] bg-[#fbf8f4] px-3 py-1.5 text-xs font-semibold text-[#5c4a37] hover:bg-[#ede4d6] transition"
            title="Capitolo precedente"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Prec.</span>
          </button>

          <span className="text-xs font-bold text-[#5c4a37] px-2 font-serif">
            {currentBook.shortName} {chapter}
          </span>

          <button
            onClick={handleNextChapter}
            className="flex items-center gap-1 rounded-xl border border-[#d9cdbf] bg-[#fbf8f4] px-3 py-1.5 text-xs font-semibold text-[#5c4a37] hover:bg-[#ede4d6] transition"
            title="Capitolo successivo"
          >
            <span className="hidden sm:inline">Succ.</span>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Strumenti Tipografici */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Dimensione Font */}
          <div className="flex items-center rounded-xl border border-[#d9cdbf] bg-[#fbf8f4] p-0.5">
            <button
              onClick={() => handleFontSizeChange(-1)}
              disabled={fontSize <= 14}
              className="px-2.5 py-1 text-xs font-bold text-[#5c4a37] hover:bg-[#ede4d6] rounded-lg transition disabled:opacity-30"
              title="Riduci dimensione testo"
            >
              A-
            </button>
            <span className="px-1 text-[11px] font-mono text-[#8a755d]">{fontSize}px</span>
            <button
              onClick={() => handleFontSizeChange(1)}
              disabled={fontSize >= 26}
              className="px-2.5 py-1 text-xs font-bold text-[#5c4a37] hover:bg-[#ede4d6] rounded-lg transition disabled:opacity-30"
              title="Aumenta dimensione testo"
            >
              A+
            </button>
          </div>

          {/* Interlinea */}
          <button
            onClick={cycleLineSpacing}
            className="flex items-center gap-1.5 rounded-xl border border-[#d9cdbf] bg-[#fbf8f4] px-3 py-1.5 text-xs font-semibold text-[#5c4a37] hover:bg-[#ede4d6] transition"
            title="Cambia interlinea (Compatta / Normale / Ampia)"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            <span>{spacingLabel}</span>
          </button>

          {/* Modalità Chiesa */}
          <button
            onClick={toggleChurchMode}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              isChurchMode
                ? "bg-[#292524] border-[#44403c] text-amber-300 shadow-sm"
                : "bg-[#fbf8f4] border-[#d9cdbf] text-[#5c4a37] hover:bg-[#ede4d6]"
            }`}
          >
            <span>{isChurchMode ? "🌙 Notturna" : "☀️ Diurna"}</span>
          </button>

          {/* Copia Capitolo */}
          <button
            onClick={handleCopyChapter}
            className="flex items-center gap-1.5 rounded-xl border border-[#d9cdbf] bg-[#fbf8f4] px-3 py-1.5 text-xs font-semibold text-[#5c4a37] hover:bg-[#ede4d6] transition"
            title="Copia l'intero capitolo negli appunti"
          >
            {copied ? (
              <span className="text-emerald-600 font-bold">Copiato!</span>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                <span className="hidden sm:inline">Copia</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Area di Lettura dei Versetti */}
      <div
        ref={readerContainerRef}
        className={`rounded-3xl border p-6 sm:p-10 shadow-lg transition-colors duration-300 ${
          isChurchMode
            ? "border-[#3f3a36] bg-[#181614] text-[#ece8e2]"
            : "border-[#e0d6c7] bg-[#fefdfb] text-[#2c2621]"
        }`}
      >
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#aa9576]/30 border-t-[#5c4a37]"></div>
            <p className="font-serif text-lg text-[#aa9576]">
              Caricamento di {currentBook.name} {chapter} (CEI 2008)...
            </p>
          </div>
        ) : error ? (
          <div className="py-12 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="font-serif text-lg text-rose-800">Impossibile caricare il capitolo</h4>
            <p className="text-xs text-rose-600 max-w-md mx-auto">{error}</p>
            <button
              onClick={() => fetchChapter(selectedBookId, chapter)}
              className="rounded-full bg-[#5c4a37] px-5 py-2 text-xs font-semibold text-white hover:bg-[#4b3c2c] transition"
            >
              Riprova
            </button>
          </div>
        ) : chapterData ? (
          <article
            className="bibbia-content font-serif max-w-none"
            style={{ fontSize: `${fontSize}px`, lineHeight: lineHeightValue }}
          >
            {/* Intestazione Capitolo */}
            <div className="border-b pb-5 mb-6 text-center space-y-2" style={{ borderColor: isChurchMode ? "#38332f" : "#ebdcc8" }}>
              <span className="text-xs uppercase tracking-widest font-sans font-bold text-[#aa9576]">
                {chapterData.category} · CEI 2008
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif" style={{ color: isChurchMode ? "#fbbf24" : "#5c4a37" }}>
                {chapterData.bookName}
              </h1>
              <p className="text-base font-sans font-semibold text-[#8a755d]">
                Capitolo {chapterData.chapter}
              </p>

              {/* Player Audio Proclamazione (Minimale e Sobrio in stile Note di Fede) */}
              {(chapterData.audioStreamUrl || chapterData.audioEmbedUrl) && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAudioPlayer(!showAudioPlayer)}
                    className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold shadow-xs transition hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      backgroundColor: isChurchMode ? "#292420" : "#f7f0e4",
                      borderColor: isChurchMode ? "#443e38" : "#dac7b0",
                      color: isChurchMode ? "#fde047" : "#5c4a37",
                    }}
                  >
                    <span>{showAudioPlayer ? "⏸️ Chiudi Player Audio" : "🎧 Ascolta la Lettura Proclamata"}</span>
                  </button>

                  {showAudioPlayer && (
                    <div
                      className="mt-3 max-w-md mx-auto p-4 rounded-3xl border shadow-md transition space-y-2 text-left animate-in fade-in duration-200"
                      style={{
                        backgroundColor: isChurchMode ? "#1f1b18" : "#fffdfa",
                        borderColor: isChurchMode ? "#443e38" : "#ebdcc8",
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 px-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🎧</span>
                          <span className="text-xs font-serif font-bold" style={{ color: isChurchMode ? "#fbbf24" : "#5c4a37" }}>
                            {chapterData.bookName} {chapterData.chapter}
                          </span>
                        </div>
                        <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#aa9576]">
                          Audio Ufficiale
                        </span>
                      </div>

                      {chapterData.audioStreamUrl ? (
                        <audio
                          controls
                          controlsList="nodownload"
                          preload="metadata"
                          src={chapterData.audioStreamUrl}
                          className="w-full h-10 rounded-xl mt-1"
                        />
                      ) : (
                        <iframe
                          src={chapterData.audioEmbedUrl!}
                          width="100%"
                          height="64"
                          frameBorder="0"
                          scrolling="no"
                          allow="autoplay; encrypted-media"
                          title={`Audio ${chapterData.bookName} ${chapterData.chapter}`}
                          className="block w-full rounded-xl"
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Versetti con Passi Paralleli */}
            <div className="space-y-3">
              {chapterData.verses.map((v) => {
                const isSelected = selectedVerseNum === v.num;
                const isRefsOpen = activeCrossRefVerseNum === v.num;
                const hasRefs = v.crossRefs && v.crossRefs.length > 0;

                return (
                  <div
                    key={v.num}
                    className={`transition-colors rounded-2xl p-2.5 sm:p-3 ${
                      isSelected || isRefsOpen
                        ? isChurchMode
                          ? "bg-[#2d2824] ring-1 ring-amber-400/80"
                          : "bg-[#f5ecdd] ring-1 ring-[#aa9576]/80"
                        : "hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                    style={{ marginBottom: paragraphMarginValue }}
                  >
                    <p
                      onClick={() => setSelectedVerseNum(isSelected ? null : v.num)}
                      className="cursor-pointer"
                    >
                      <sup
                        className={`select-none mr-1.5 font-sans font-bold text-[0.72em] ${
                          isChurchMode ? "text-amber-400" : "text-[#99221b]"
                        }`}
                      >
                        {v.num}
                      </sup>
                      <span className="whitespace-pre-line">{v.text}</span>

                      {/* Pulsantino Passi Paralleli (Cross References) */}
                      {hasRefs && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCrossRefVerseNum(isRefsOpen ? null : v.num);
                          }}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 ml-2 text-[11px] font-sans font-semibold transition align-middle hover:scale-105 shadow-xs"
                          style={{
                            backgroundColor: isChurchMode ? "#3d352f" : "#ebdcc8",
                            color: isChurchMode ? "#fde047" : "#5c4a37",
                            border: `1px solid ${isChurchMode ? "#584e46" : "#d8c5ad"}`,
                          }}
                          title={`${v.crossRefs?.length} passi paralleli collegati`}
                        >
                          <span>🔗</span>
                          <span>{v.crossRefs?.length}</span>
                        </button>
                      )}
                    </p>

                    {/* Pannello Espandibile dei Passi Paralleli */}
                    {isRefsOpen && hasRefs && (
                      <div
                        className="mt-3 p-3 sm:p-4 rounded-2xl border shadow-inner transition space-y-2 animate-in fade-in duration-200"
                        style={{
                          backgroundColor: isChurchMode ? "#1f1b18" : "#fffdfa",
                          borderColor: isChurchMode ? "#443e38" : "#e0d3c1",
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#aa9576]">
                            🔗 Passi Paralleli & Riferimenti al versetto {v.num}
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveCrossRefVerseNum(null)}
                            className="text-xs text-[#8a755d] hover:text-rose-600 px-2 py-0.5 rounded-md"
                          >
                            ✕ Chiudi
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          {v.crossRefs?.map((ref, rIdx) => (
                            <button
                              key={rIdx}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNavigateToRef(ref);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-sans font-bold transition hover:scale-105 shadow-xs"
                              style={{
                                backgroundColor: isChurchMode ? "#3a2d24" : "#f2e6d5",
                                color: isChurchMode ? "#fbbf24" : "#5c4a37",
                                border: `1px solid ${isChurchMode ? "#584435" : "#decaba"}`,
                              }}
                              title={ref.bookName ? `Vai a ${ref.bookName} ${ref.chapter}` : `Vedi ${ref.label}`}
                            >
                              <span>📖 {ref.label}</span>
                              {ref.bookName && (
                                <span className="text-[10px] opacity-75 font-normal">
                                  ({ref.bookName})
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Note in Calce (Esegesi & Commento) */}
            {chapterData.footnotes && chapterData.footnotes.length > 0 && (
              <div className="my-10 pt-6 border-t" style={{ borderColor: isChurchMode ? "#38332f" : "#ebdcc8" }}>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📝</span>
                    <h3 className="font-serif font-bold text-lg" style={{ color: isChurchMode ? "#fbbf24" : "#5c4a37" }}>
                      Note al Testo & Esegesi (CEI / Gerusalemme)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFootnotes(!showFootnotes)}
                    className="rounded-full px-3 py-1 text-xs font-sans font-semibold border transition"
                    style={{
                      backgroundColor: isChurchMode ? "#2a2420" : "#f5ede0",
                      borderColor: isChurchMode ? "#443e38" : "#dac7b0",
                      color: isChurchMode ? "#fde047" : "#5c4a37",
                    }}
                  >
                    {showFootnotes ? "Nascondi Note" : `Mostra Note (${chapterData.footnotes.length})`}
                  </button>
                </div>

                {showFootnotes && (
                  <div className="space-y-3">
                    {chapterData.footnotes.map((fn, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 sm:p-4 rounded-2xl border text-xs leading-relaxed transition"
                        style={{
                          backgroundColor: isChurchMode ? "#1e1917" : "#fdfbf7",
                          borderColor: isChurchMode ? "#3b342e" : "#ebdcc8",
                          color: isChurchMode ? "#d4ceb8" : "#4a3e30",
                        }}
                      >
                        <span className="font-sans font-bold text-[#99221b] mr-2">
                          {fn.reference}:
                        </span>
                        <span className="font-serif text-[1.05em]">{fn.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}


            {/* ========================================================================= */}
            {/* PULSANTE LECTIO DIVINA (CARDINALE CARLO MARIA MARTINI) */}
            {/* ========================================================================= */}
            <div className="my-10 pt-6 border-t" style={{ borderColor: isChurchMode ? "#38332f" : "#ebdcc8" }}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-3xl border shadow-sm transition"
                style={{
                  backgroundColor: isChurchMode ? "#25201d" : "#fdfbf7",
                  borderColor: isChurchMode ? "#443e38" : "#ebdcc8"
                }}
              >
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-lg">✨</span>
                    <h3 className="font-serif font-bold text-base" style={{ color: isChurchMode ? "#fbbf24" : "#5c4a37" }}>
                      Lectio Divina con Intelligenza Artificiale
                    </h3>
                  </div>
                  <p className="text-xs text-[#8a755d]">
                    Genera una <em>Lectio, Meditatio, Contemplatio, Actio, Oratio</em> in perfetto stile <strong>Card. Carlo Maria Martini</strong>.
                  </p>
                </div>

                <button
                  onClick={handleGenerateLectio}
                  disabled={lectioLoading}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#5c4a37] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#4a3a29] transition shadow-md disabled:opacity-50 shrink-0"
                >
                  {lectioLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                      <span>Elaborazione Lectio...</span>
                    </>
                  ) : showLectio && lectioText ? (
                    <>
                      <span>📖 Mostra/Nascondi Meditazione</span>
                    </>
                  ) : (
                    <>
                      <span>✨ Genera Lectio Divina</span>
                    </>
                  )}
                </button>
              </div>

              {/* Sezione di Caricamento Animato Lectio con Timer */}

              {lectioLoading && (
                <div className="mt-6 p-8 rounded-3xl border text-center space-y-4 shadow-sm"
                  style={{
                    backgroundColor: isChurchMode ? "#1f1b18" : "#fbf8f3",
                    borderColor: isChurchMode ? "#443e38" : "#ebdcc8"
                  }}
                >
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5c4a37] text-white shadow-md animate-bounce">
                    ✨
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-serif font-bold text-base" style={{ color: isChurchMode ? "#fbbf24" : "#5c4a37" }}>
                      Ascolto della Parola in corso...
                    </h4>
                    <p className="text-xs text-[#8a755d] max-w-md mx-auto">
                      Gemini Flash sta elaborando la <em>Lectio, Meditatio, Contemplatio, Actio e Oratio</em> su {chapterData.bookName} {chapterData.chapter}.
                    </p>
                  </div>

                  {/* Timer di avanzamento & Pulsante Annulla */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold"
                      style={{
                        backgroundColor: isChurchMode ? "#332b26" : "#ebdcc8",
                        color: isChurchMode ? "#fde047" : "#5c4a37"
                      }}
                    >
                      ⏱️ {elapsedSeconds}s trascorsi · provo catena Gemini Flash (20s)
                    </span>
                    <button
                      onClick={handleCancelLectio}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition"
                      style={{
                        backgroundColor: isChurchMode ? "#3b1e1e" : "#fef2f2",
                        color: isChurchMode ? "#fca5a5" : "#b91c1c",
                        border: `1px solid ${isChurchMode ? "#6b2525" : "#fecaca"}`
                      }}
                    >
                      ✕ Annulla attesa
                    </button>
                  </div>
                </div>
              )}

              {/* Errore Generazione Lectio */}
              {lectioError && (
                <div className="mt-6 p-6 rounded-3xl border text-center space-y-3 shadow-sm"
                  style={{
                    backgroundColor: isChurchMode ? "#281b18" : "#fff8f3",
                    borderColor: isChurchMode ? "#58201a" : "#fed7aa"
                  }}
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                    style={{
                      backgroundColor: isChurchMode ? "#421815" : "#ffedd5",
                      color: isChurchMode ? "#fca5a5" : "#9a3412"
                    }}
                  >
                    ⚠️
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold" style={{ color: isChurchMode ? "#fca5a5" : "#9a3412" }}>
                      Stato elaborazione meditazione:
                    </p>
                    <p className="text-xs max-w-md mx-auto" style={{ color: isChurchMode ? "#e5b7b2" : "#c2410c" }}>
                      {lectioError}
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateLectio}
                    className="px-5 py-2 rounded-full bg-[#5c4a37] text-white text-xs font-bold hover:bg-[#4a3a29] transition shadow-sm"
                  >
                    🔄 Riprova con il modello successivo
                  </button>
                </div>
              )}

              {/* Risultato Lectio Divina Generato */}
              {showLectio && lectioText && !lectioLoading && (
                <div
                  ref={lectioSectionRef}
                  className="mt-6 p-6 sm:p-10 rounded-3xl border shadow-md transition-colors duration-300 space-y-6"
                  style={{
                    backgroundColor: isChurchMode ? "#201c19" : "#faf6f0",
                    borderColor: isChurchMode ? "#443e38" : "#e5d7c5"
                  }}
                >
                  {/* Intestazione Card Lectio */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5"
                    style={{ borderColor: isChurchMode ? "#38332f" : "#e8dcce" }}
                  >
                    <div className="space-y-1">
                      <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#aa9576]">
                        Meditazione Spirituale · Metodo Card. Martini
                      </span>
                      <h3 className="text-xl sm:text-2xl font-bold font-serif" style={{ color: isChurchMode ? "#fbbf24" : "#5c4a37" }}>
                        Lectio Divina: {chapterData.bookName} {chapterData.chapter}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyLectio}
                        className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition"
                        style={{
                          borderColor: isChurchMode ? "#443e38" : "#d9cdbf",
                          backgroundColor: isChurchMode ? "#2b2521" : "#fbf8f4",
                          color: isChurchMode ? "#ece8e2" : "#5c4a37"
                        }}
                      >
                        {copiedLectio ? (
                          <span className="text-emerald-600 font-bold">Copiata!</span>
                        ) : (
                          <>
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                            <span>Copia Meditazione</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setShowLectio(false)}
                        className="rounded-xl border p-1.5 text-xs transition"
                        style={{
                          borderColor: isChurchMode ? "#443e38" : "#d9cdbf",
                          backgroundColor: isChurchMode ? "#2b2521" : "#fbf8f4",
                          color: isChurchMode ? "#ece8e2" : "#5c4a37"
                        }}
                        title="Nascondi"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Controlli Vista Lectio */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl"
                    style={{
                      backgroundColor: isChurchMode ? "#2b2521" : "#f0e6d8"
                    }}
                  >
                    <span className="text-xs font-semibold text-[#8a755d]">
                      Modalità di Lettura della Meditazione:
                    </span>
                    <span className="text-xs text-[#aa9576] font-bold">
                      Completa · Testo Scorrevole
                    </span>
                  </div>

                  {/* Contenuto Testo Lectio Scorrevole */}
                  <div
                    className="lectio-rendered-content font-serif leading-relaxed max-h-[550px] overflow-y-auto pr-3 rounded-2xl p-4 border shadow-inner"
                    style={{
                      fontSize: `${fontSize - 1}px`,
                      backgroundColor: isChurchMode ? "#1a1614" : "#fefdfa",
                      borderColor: isChurchMode ? "#38332f" : "#e4d7c7"
                    }}
                    dangerouslySetInnerHTML={{ __html: formatMarkdownToHtml(lectioText) }}
                  />

                  {/* Citazione conclusiva Card. Martini */}
                  <div className="border-t pt-4 text-center italic text-xs text-[#8a755d]"
                    style={{ borderColor: isChurchMode ? "#38332f" : "#e8dcce" }}
                  >
                    «La Parola di Dio non è mai statica: entra nella nostra vita, interpella le nostre fragilità e accende la speranza.» — Card. Carlo Maria Martini
                  </div>
                </div>
              )}
            </div>



            {/* Navigazione a Piè di Pagina */}
            <div className="border-t pt-8 mt-10 flex items-center justify-between" style={{ borderColor: isChurchMode ? "#38332f" : "#ebdcc8" }}>
              <button
                onClick={handlePrevChapter}
                className="flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-bold transition"
                style={{
                  borderColor: isChurchMode ? "#443e38" : "#d9cdbf",
                  backgroundColor: isChurchMode ? "#25201d" : "#fbf8f4",
                  color: isChurchMode ? "#ece8e2" : "#5c4a37",
                }}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Capitolo Precedente</span>
              </button>

              <button
                onClick={handleNextChapter}
                className="flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-bold transition"
                style={{
                  borderColor: isChurchMode ? "#443e38" : "#d9cdbf",
                  backgroundColor: isChurchMode ? "#25201d" : "#fbf8f4",
                  color: isChurchMode ? "#ece8e2" : "#5c4a37",
                }}
              >
                <span>Capitolo Successivo</span>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </article>
        ) : null}
      </div>

      {/* Stili CSS dedicati per la Lectio Divina */}
      <style jsx global>{`
        .lectio-rendered-content .lectio-h2 {
          font-size: 1.35em;
          font-weight: 700;
          color: ${isChurchMode ? "#fbbf24" : "#6e5a45"};
          margin-top: 1.4em;
          margin-bottom: 0.5em;
          border-bottom: 1px solid ${isChurchMode ? "#38332f" : "#e6dcce"};
          padding-bottom: 0.25em;
        }
        .lectio-rendered-content .lectio-h3 {
          font-size: 1.2em;
          font-weight: 700;
          color: ${isChurchMode ? "#fbbf24" : "#5c4a37"};
          margin-top: 1.2em;
          margin-bottom: 0.4em;
        }
        .lectio-rendered-content .lectio-h4 {
          font-size: 1.05em;
          font-weight: 700;
          color: ${isChurchMode ? "#fde047" : "#7c6853"};
          margin-top: 1em;
          margin-bottom: 0.3em;
        }
        .lectio-rendered-content .lectio-p {
          margin-bottom: 0.85em;
          line-height: 1.6;
        }
        .lectio-rendered-content .lectio-li {
          margin-left: 1.5em;
          list-style-type: disc;
          margin-bottom: 0.35em;
        }
        .lectio-rendered-content strong {
          color: ${isChurchMode ? "#fef3c7" : "#4a3e30"};
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
