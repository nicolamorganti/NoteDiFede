"use client";

import { useState, useEffect, useRef } from "react";
import { PreghieraNav } from "@/components/preghiera-nav";
import { QuoteImageModal } from "@/components/quote-image-modal";
import { useTextSelectionQuote } from "@/lib/use-text-selection-quote";

export type LineSpacingOption = "compact" | "normal" | "relaxed";

export function MinistriInfermiReader() {
  const [fontSize, setFontSize] = useState<number>(17);
  const [lineSpacing, setLineSpacing] = useState<LineSpacingOption>("compact");
  const [isChurchMode, setIsChurchMode] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const readerContainerRef = useRef<HTMLDivElement | null>(null);
  const {
    quoteModalOpen,
    setQuoteModalOpen,
    selectedQuoteText,
    hasActiveSelection,
  } = useTextSelectionQuote(readerContainerRef);


  // Tab per la scelta rapida delle formule, letture e orazioni
  const [penitentialFormula, setPenitentialFormula] = useState<number>(1);
  const [selectedGospel, setSelectedGospel] = useState<number>(0);
  const [selectedPrayer, setSelectedPrayer] = useState<number>(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
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

  const handleCopyAll = async () => {
    const el = document.getElementById("infermi-content");
    if (!el) return;
    try {
      await navigator.clipboard.writeText(el.innerText || el.textContent || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error("Errore copia:", e);
    }
  };

  const lineHeightValue = lineSpacing === "compact" ? 1.38 : lineSpacing === "normal" ? 1.58 : 1.85;
  const paragraphMarginValue = lineSpacing === "compact" ? "0.5em" : lineSpacing === "normal" ? "0.85em" : "1.25em";
  const spacingLabel = lineSpacing === "compact" ? "Compatta" : lineSpacing === "normal" ? "Normale" : "Ampia";

  // Classi dinamiche basate sullo stato isChurchMode (senza dark: che confligge con le impostazioni OS)
  const boxBgClass = isChurchMode
    ? "bg-[#25201d] border-[#443e38] text-[#ece8e2]"
    : "bg-[#fdfbf7] border-[#e6dcce] text-[#2c2621]";

  const tabInactiveBtnClass = isChurchMode
    ? "bg-[#2c2622] text-[#d6cbbe] hover:bg-[#38312c]"
    : "bg-[#ede4d8] text-[#5c4a37] hover:bg-[#dfd4c5]";

  const dividerClass = isChurchMode ? "border-[#3f3a36]" : "border-[#e4dcce]";

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      {/* Sottomenu di Navigazione Sezione Preghiera */}
      <PreghieraNav />

      {/* Intestazione */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e4dcce] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#5c4a37] text-white shadow-sm">
              🕊️
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#aa9576]">
              Rito Pastorale degli Infermi
            </span>
          </div>
          <h2 className="font-serif text-3xl font-normal text-[#3f3933] mt-1">
            Comunione agli Infermi
          </h2>
          <p className="text-sm text-[#736555]">
            Formulario ufficiale per il Ministro Straordinario della Santa Comunione
          </p>
        </div>

        {/* Badge Diocesi */}
        <div className="inline-flex items-center gap-2 rounded-2xl bg-[#ebe3d5] border border-[#dacbb8] px-4 py-2 text-xs font-bold text-[#5c4a37]">
          <span>Chiesa di Milano · Rito Ufficiale</span>
        </div>
      </div>

      {/* Barra Strumenti Lettura */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[#e4dcce] bg-[#fffdfa] p-3.5 shadow-sm">
        <div className="text-xs font-semibold text-[#6e5a45]">
          Strumenti di Lettura per la Visita:
        </div>

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

          {/* Copia */}
          <button
            onClick={handleCopyAll}
            className="flex items-center gap-1.5 rounded-xl border border-[#d9cdbf] bg-[#fbf8f4] px-3 py-1.5 text-xs font-semibold text-[#5c4a37] hover:bg-[#ede4d6] transition"
          >
            {copied ? (
              <span className="text-emerald-600 font-bold">Copiato!</span>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                <span>Copia Rito</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Contenitore Testo del Rito Liturgico */}
      <div
        ref={readerContainerRef}
        id="infermi-content"
        className={`rounded-3xl border p-6 sm:p-10 shadow-lg transition-colors duration-300 ${
          isChurchMode
            ? "border-[#3f3a36] bg-[#181614] text-[#ece8e2]"
            : "border-[#e0d6c7] bg-[#fefdfb] text-[#2c2621]"
        }`}

        style={{ fontSize: `${fontSize}px`, lineHeight: lineHeightValue }}
      >
        <article className="infermi-article font-serif space-y-8">
          
          {/* ========================================================================= */}
          {/* 1. RITI INIZIALI */}
          {/* ========================================================================= */}
          <section className="space-y-4">
            <h3 className="rito-titolo">1. Riti Iniziali</h3>

            <p className="rubrica">
              Il ministro, entrando dal malato, rivolge a lui e a tutti i presenti un fraterno saluto con queste parole o simili:
            </p>

            <p className="dialogo-guida">
              <b>Pace a questa casa e a quanti vi abitano.</b>
            </p>

            <p className="rubrica">
              Poi, deposto il Santissimo sulla mensa, lo adora insieme con i presenti con una delle seguenti antifone, osservando un breve silenzio:
            </p>

            {/* Antifone Adorazione */}
            <div className={`space-y-4 pl-4 border-l-2 ${isChurchMode ? "border-[#443e38]" : "border-[#d6c5b0]"}`}>
              <div className="space-y-1">
                <span className="opzione-label">Opzione A:</span>
                <p>
                  <b>
                    O sacro convito, in cui Cristo è nostro cibo,<br />
                    si perpetua il memoriale della sua Pasqua,<br />
                    l’anima nostra è colmata di grazia,<br />
                    e ci è dato il pegno della gloria futura.
                  </b>
                </p>
              </div>

              <div className="space-y-1">
                <span className="opzione-label">Opzione B:</span>
                <p>
                  Ecco il pane degli angeli,<br />
                  pane dei pellegrini,<br />
                  vero pane dei figli.<br />
                  Buon pastore, vero pane,<br />
                  o Gesù, pietà di noi:<br />
                  nutrici e difendici,<br />
                  portaci ai beni eterni<br />
                  nella terra dei viventi.<br />
                  Tu che tutto sai e puoi,<br />
                  che ci nutri sulla terra,<br />
                  conduci i tuoi fratelli<br />
                  alla tavola del cielo<br />
                  nella gioia dei tuoi santi.
                </p>
              </div>

              <div className="space-y-1">
                <span className="opzione-label">Opzione C:</span>
                <p>
                  Adoriamo, o Cristo, il tuo corpo glorioso,<br />
                  nato dalla Vergine Maria;<br />
                  per noi hai voluto soffrire,<br />
                  per noi ti sei offerto vittima sulla croce<br />
                  e dal tuo fianco squarciato<br />
                  hai versato l’acqua e il sangue del nostro riscatto.<br />
                  Sii nostro conforto nell’ultimo passaggio<br />
                  e accoglici benigno nella casa del Padre:<br />
                  o Gesù dolce, o Gesù pio,<br />
                  o Gesù, Figlio di Maria.
                </p>
              </div>
            </div>

            {/* Atto Penitenziale */}
            <div className="pt-4 space-y-3">
              <p className="rubrica">
                Il ministro invita l’infermo e i presenti a fare l’atto penitenziale:
              </p>
              <p>
                Fratelli, riconosciamo i nostri peccati e chiediamo il perdono del Signore per esser degni di partecipare a questo santo rito insieme al nostro fratello infermo.
              </p>

              <p className="rubrica">Si fa una breve pausa di silenzio.</p>

              {/* Selettore Formula Penitenziale */}
              <div className="flex gap-2 my-3 not-prose">
                {[1, 2, 3].map((f) => (
                  <button
                    key={f}
                    onClick={() => setPenitentialFormula(f)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      penitentialFormula === f
                        ? "bg-[#5c4a37] text-white shadow-sm"
                        : tabInactiveBtnClass
                    }`}
                  >
                    {f}ª Formula
                  </button>
                ))}
              </div>

              {penitentialFormula === 1 && (
                <div className={`p-4 rounded-2xl border space-y-2 ${boxBgClass}`}>
                  <span className="rubrica font-bold">1ª Formula (Confesso a Dio):</span>
                  <p>
                    <b>Confesso a Dio onnipotente e a voi, fratelli,</b><br />
                    <b>che ho molto peccato in pensieri, parole, opere e omissioni,</b>
                  </p>
                  <p className="rubrica text-xs">e, battendosi il petto, dicono:</p>
                  <p>
                    <b>per mia colpa, mia colpa, mia grandissima colpa.</b>
                  </p>
                  <p className="rubrica text-xs">E proseguono:</p>
                  <p>
                    <b>E supplico la beata sempre vergine Maria,</b><br />
                    <b>gli angeli, i santi e voi, fratelli,</b><br />
                    <b>di pregare per me il Signore Dio nostro.</b>
                  </p>
                </div>
              )}

              {penitentialFormula === 2 && (
                <div className={`p-4 rounded-2xl border space-y-2 ${boxBgClass}`}>
                  <span className="rubrica font-bold">2ª Formula:</span>
                  <p>
                    <span className="rubrica font-sans">℣.</span> <b>Pietà di noi, Signore.</b><br />
                    <span className="rubrica font-sans">℟.</span> <b>Contro di te abbiamo peccato.</b><br />
                    <span className="rubrica font-sans">℣.</span> <b>Mostraci, Signore, la tua misericordia.</b><br />
                    <span className="rubrica font-sans">℟.</span> <b>E donaci la tua salvezza.</b>
                  </p>
                </div>
              )}

              {penitentialFormula === 3 && (
                <div className={`p-4 rounded-2xl border space-y-2 ${boxBgClass}`}>
                  <span className="rubrica font-bold">3ª Formula (Invocazioni a Cristo):</span>
                  <p>
                    Signore, che nel tuo mistero pasquale ci hai meritato la salvezza, abbi pietà di noi.<br />
                    <b className={isChurchMode ? "text-amber-400" : "text-amber-800"}>Kýrie, eléison.</b>
                  </p>
                  <p>
                    Signore, che nelle nostre sofferenze rinnovi sempre le meraviglie della tua beata passione, abbi pietà di noi.<br />
                    <b className={isChurchMode ? "text-amber-400" : "text-amber-800"}>Kýrie, eléison.</b>
                  </p>
                  <p>
                    Signore, che con la comunione al tuo corpo ci rendi partecipi del tuo sacrificio, abbi pietà di noi.<br />
                    <b className={isChurchMode ? "text-amber-400" : "text-amber-800"}>Kýrie, eléison.</b>
                  </p>
                </div>
              )}

              {/* Assoluzione del Ministro */}
              <div className="pt-2 space-y-1">
                <p className="rubrica">Il ministro conclude:</p>
                <p>
                  Dio onnipotente abbia misericordia di noi, perdoni i nostri peccati e ci conduca alla vita eterna.<br />
                  <span className="rubrica font-sans">℟.</span> <b>Amen.</b>
                </p>
              </div>
            </div>
          </section>

          <hr className={dividerClass} />

          {/* ========================================================================= */}
          {/* 2. LETTURA DELLA PAROLA DI DIO */}
          {/* ========================================================================= */}
          <section className="space-y-4">
            <h3 className="rito-titolo">2. Lettura della Parola di Dio</h3>

            <p className="rubrica">
              Uno dei presenti o lo stesso ministro legge un brano della Sacra Scrittura introducendolo con: <em>«Dice il Signore:»</em>
            </p>

            {/* Selettore Vangelo */}
            <div className="flex flex-wrap gap-1.5 my-3 not-prose">
              {[
                { title: "Gv 6, 51", desc: "Pane vivo dal cielo" },
                { title: "Gv 6, 54-55", desc: "Chi mangia ha la vita eterna" },
                { title: "Gv 6, 54-58", desc: "Dimora in me e io in lui" },
                { title: "Gv 14, 6", desc: "La via, verità e vita" },
                { title: "Gv 14, 27", desc: "Vi lascio la pace" },
                { title: "Gv 15, 4-5", desc: "Io sono la vite" },
                { title: "1 Cor 11, 26", desc: "Annunziate la morte" },
                { title: "1 Gv 4, 16", desc: "Dio è amore" },
              ].map((g, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedGospel(idx)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    selectedGospel === idx
                      ? "bg-[#5c4a37] text-white shadow-sm"
                      : tabInactiveBtnClass
                  }`}
                >
                  {g.title}
                </button>
              ))}
            </div>

            <div className={`p-4 rounded-2xl border space-y-2 ${boxBgClass}`}>
              {selectedGospel === 0 && (
                <div>
                  <span className="rubrica text-xs">Dal Vangelo secondo Giovanni (6, 51):</span>
                  <p className="mt-1">
                    «Io sono il pane vivo, disceso dal cielo.<br />
                    Se uno mangia di questo pane vivrà in eterno<br />
                    e il pane che io darò è la mia carne per la vita del mondo».
                  </p>
                </div>
              )}

              {selectedGospel === 1 && (
                <div>
                  <span className="rubrica text-xs">Dal Vangelo secondo Giovanni (6, 54-55):</span>
                  <p className="mt-1">
                    «Chi mangia la mia carne e beve il mio sangue ha la vita eterna e io lo risusciterò nell’ultimo giorno.<br />
                    Perché la mia carne è vero cibo e il mio sangue vera bevanda».
                  </p>
                </div>
              )}

              {selectedGospel === 2 && (
                <div>
                  <span className="rubrica text-xs">Dal Vangelo secondo Giovanni (6, 54-58):</span>
                  <p className="mt-1">
                    «Chi mangia la mia carne e beve il mio sangue ha la vita eterna e io lo risusciterò nell’ultimo giorno. Perché la mia carne è vero cibo e il mio sangue vera bevanda. Chi mangia la mia carne e beve il mio sangue dimora in me e io in lui. Come il Padre, che ha la vita, ha mandato me e io vivo per il Padre, così anche colui che mangia di me vivrà per me. Questo è il pane disceso dal cielo, non come quello che mangiarono i padri vostri e morirono. Chi mangia questo pane, vivrà in eterno».
                  </p>
                </div>
              )}

              {selectedGospel === 3 && (
                <div>
                  <span className="rubrica text-xs">Dal Vangelo secondo Giovanni (14, 6):</span>
                  <p className="mt-1">
                    «Io sono la via, la verità e la vita. Nessuno viene al Padre se non per mezzo di me».
                  </p>
                </div>
              )}

              {selectedGospel === 4 && (
                <div>
                  <span className="rubrica text-xs">Dal Vangelo secondo Giovanni (14, 27):</span>
                  <p className="mt-1">
                    «Vi lascio la pace, vi do la mia pace. Non come la dà il mondo, io la do a voi. Non sia turbato il vostro cuore e non abbia timore».
                  </p>
                </div>
              )}

              {selectedGospel === 5 && (
                <div>
                  <span className="rubrica text-xs">Dal Vangelo secondo Giovanni (15, 4-5):</span>
                  <p className="mt-1">
                    «Rimanete in me e io in voi. Come il tralcio non può far frutto da se stesso se non rimane nella vite, così anche voi se non rimanete in me. Io sono la vite, voi i tralci. Chi rimane in me e io in lui, fa molto frutto, perché senza di me non potete far nulla».
                  </p>
                </div>
              )}

              {selectedGospel === 6 && (
                <div>
                  <span className="rubrica text-xs">Dalla prima lettera di san Paolo ai Corinzi (11, 26):</span>
                  <p className="mt-1">
                    «Ogni volta che mangiate di questo pane e bevete di questo calice, voi annunziate la morte del Signore finché egli venga».
                  </p>
                </div>
              )}

              {selectedGospel === 7 && (
                <div>
                  <span className="rubrica text-xs">Dalla prima lettera di san Giovanni apostolo (4, 16):</span>
                  <p className="mt-1">
                    «Noi abbiamo riconosciuto e creduto all’amore che Dio ha per noi. Dio è amore; chi sta nell’amore dimora in Dio e Dio dimora in lui».
                  </p>
                </div>
              )}
            </div>
          </section>

          <hr className={dividerClass} />

          {/* ========================================================================= */}
          {/* 3. RITI DI COMUNIONE */}
          {/* ========================================================================= */}
          <section className="space-y-4">
            <h3 className="rito-titolo">3. Riti di Comunione</h3>

            <p className="rubrica">
              Il ministro introduce la preghiera del Signore dicendo:
            </p>
            <p>
              E ora, tutti insieme, rivolgiamo al Padre la preghiera che Gesù Cristo nostro Signore ci ha insegnato:
            </p>

            {/* Padre Nostro */}
            <div className={`p-4 rounded-2xl border ${boxBgClass}`}>
              <p className="font-bold">
                Padre nostro, che sei nei cieli,<br />
                sia santificato il tuo nome,<br />
                venga il tuo regno,<br />
                sia fatta la tua volontà,<br />
                come in cielo così in terra.<br />
                Dacci oggi il nostro pane quotidiano,<br />
                e rimetti a noi i nostri debiti<br />
                come anche noi li rimettiamo ai nostri debitori,<br />
                e non abbandonarci alla tentazione,<br />
                ma liberaci dal male.
              </p>
            </div>

            {/* Ostensione */}
            <p className="rubrica">
              Il ministro fa l’ostensione del santissimo Sacramento dicendo:
            </p>
            <p className="dialogo-guida">
              <b>Beati gli invitati alla Cena del Signore.</b><br />
              <b>Ecco l’Agnello di Dio, che toglie i peccati del mondo.</b>
            </p>

            <p className="rubrica">
              L’infermo e i presenti rispondono:
            </p>
            <p className="dialogo-guida">
              <b>O Signore, non sono degno di partecipare alla tua mensa:<br />ma di’ soltanto una parola e io sarò salvato.</b>
            </p>

            {/* Distribuzione Comunione */}
            <p className="rubrica">
              Il ministro si accosta all’infermo e gli presenta il Sacramento dicendo:
            </p>
            <p className="dialogo-guida">
              <b>Il corpo di Cristo.</b>
            </p>

            <p className="rubrica">
              L’infermo risponde e riceve la comunione:
            </p>
            <p className="dialogo-guida">
              <b>Amen.</b>
            </p>

            <p className="rubrica">
              Terminata la distribuzione, il ministro fa le necessarie abluzioni. Segue una breve pausa di sacro silenzio.
            </p>

            {/* Orazioni Conclusive */}
            <div className="pt-4 space-y-3">
              <p className="rubrica font-bold">Orazione Conclusiva (Preghiamo):</p>

              {/* Selettore Orazione */}
              <div className="flex flex-wrap gap-1.5 my-2 not-prose">
                {[
                  "1. Proteggi questo fratello",
                  "2. Mistero pasquale",
                  "3. Spirito del tuo amore",
                  "4. Famiglia dei credenti",
                  "5. Tempo di Pasqua",
                ].map((name, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedPrayer(idx)}
                    className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                      selectedPrayer === idx
                        ? "bg-[#5c4a37] text-white shadow-sm"
                        : tabInactiveBtnClass
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>

              <div className={`p-4 rounded-2xl border space-y-2 ${boxBgClass}`}>
                {selectedPrayer === 0 && (
                  <p>
                    Signore, Padre santo,<br />
                    la comunione al Corpo del tuo Figlio protegga e conforti questo nostro fratello, gli rechi sollievo nel corpo e nello spirito e sia per lui pegno sicuro di vita eterna.<br />
                    Per Cristo nostro Signore.<br />
                    <span className="rubrica font-sans">℟.</span> <b>Amen.</b>
                  </p>
                )}

                {selectedPrayer === 1 && (
                  <p>
                    O Padre, che hai portato a compimento l’opera della nostra redenzione nel mistero pasquale del tuo Figlio, fa’ che, annunziando con fede nei segni sacramentali la sua morte e risurrezione, sperimentiamo sempre più i doni della salvezza.<br />
                    Per Cristo nostro Signore.<br />
                    <span className="rubrica font-sans">℟.</span> <b>Amen.</b>
                  </p>
                )}

                {selectedPrayer === 2 && (
                  <p>
                    Infondi in noi, o Dio, lo Spirito del tuo amore, perché nutriti con l’unico pane di vita formiamo un cuor solo e un’anima sola.<br />
                    Per Cristo nostro Signore.<br />
                    <span className="rubrica font-sans">℟.</span> <b>Amen.</b>
                  </p>
                )}

                {selectedPrayer === 3 && (
                  <p>
                    O Padre, che in questo sacro convito ci rendi partecipi del corpo e sangue del Cristo, santifica la famiglia dei credenti e rafforzala nel vincolo della carità fraterna.<br />
                    Per Cristo nostro Signore.<br />
                    <span className="rubrica font-sans">℟.</span> <b>Amen.</b>
                  </p>
                )}

                {selectedPrayer === 4 && (
                  <p>
                    <span className="rubrica text-xs">Nel Tempo di Pasqua:</span><br />
                    Infondi in noi, o Padre, lo Spirito della tua carità, perché saziati con i sacramenti pasquali, viviamo concordi nel vincolo del tuo amore.<br />
                    Per Cristo nostro Signore.<br />
                    <span className="rubrica font-sans">℟.</span> <b>Amen.</b>
                  </p>
                )}
              </div>
            </div>
          </section>

          <hr className={dividerClass} />

          {/* ========================================================================= */}
          {/* 4. RITO DI CONCLUSIONE */}
          {/* ========================================================================= */}
          <section className="space-y-4">
            <h3 className="rito-titolo">4. Rito di Conclusione</h3>

            <p className="rubrica">
              Il ministro, invocando la benedizione di Dio e facendo su se stesso il segno della croce, dice:
            </p>

            <div className={`p-4 rounded-2xl border space-y-3 ${boxBgClass}`}>
              <div>
                <p>
                  <b>Il Signore ci benedica, ci preservi da ogni male, e ci conduca alla vita eterna.</b><br />
                  <span className="rubrica font-sans">℟.</span> <b>Amen.</b>
                </p>
              </div>

              <div className={`pt-2 border-t ${isChurchMode ? "border-[#38332f]" : "border-[#ebdcc8]"}`}>
                <span className="rubrica text-xs">Oppure:</span>
                <p className="mt-1">
                  <b>Ci benedica e ci custodisca il Signore onnipotente e misericordioso, Padre e Figlio e Spirito Santo.</b><br />
                  <span className="rubrica font-sans">℟.</span> <b>Amen.</b>
                </p>
              </div>
            </div>
          </section>
        </article>
      </div>

      {/* Stili CSS dedicati */}
      <style jsx global>{`
        .infermi-article .rito-titolo {
          font-weight: 700;
          font-size: 1.25em;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: ${isChurchMode ? "#fbbf24" : "#6e5a45"};
          border-bottom: 1.5px solid ${isChurchMode ? "#38332f" : "#ebdcc8"};
          padding-bottom: 0.3em;
          margin-bottom: 0.8em;
        }
        .infermi-article .rubrica {
          color: ${isChurchMode ? "#f87171 !important" : "#b91c1c !important"};
          font-style: italic;
          font-size: 0.95em;
          margin-bottom: ${paragraphMarginValue};
        }
        .infermi-article .dialogo-guida {
          margin-bottom: ${paragraphMarginValue};
          color: ${isChurchMode ? "#f5f5f4" : "#1c1917"};
        }
        .infermi-article .opzione-label {
          font-size: 0.75em;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: ${isChurchMode ? "#d6cbbe" : "#8a755d"};
          display: block;
        }
        .infermi-article p {
          margin-bottom: ${paragraphMarginValue};
        }
      `}</style>

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
        defaultCitation="Cura Pastorale degli Infermi (Rituale Romano)"
        liturgicalTitle="Cura Pastorale degli Infermi"
      />
    </div>
  );
}

