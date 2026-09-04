"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  getSundayNewsletterDraftAction,
  generateSundayReflectionAIAction,
  saveSundayNewsletterDraftAction,
  testSundayNewsletterDraftAction,
} from "@/app/(dashboard)/impostazioni/actions";
import { formatMarkdownToEmailHtml } from "@/lib/daily-word-newsletter";

export function SundayNewsletterEditor() {
  const [selectedRite, setSelectedRite] = useState<"ambrosiano" | "romano">("ambrosiano");
  const [loading, setLoading] = useState(true);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  // Dati ciclo e Vangelo festivo
  const [cycleInfo, setCycleInfo] = useState<any>(null);
  const [gospel, setGospel] = useState<any>(null);

  // Campi bozza
  const [customPrompt, setCustomPrompt] = useState("");
  const [reflectionTitle, setReflectionTitle] = useState("✨ Commento al Vangelo della Domenica");
  const [reflectionText, setReflectionText] = useState("");
  const [authorSignature, setAuthorSignature] = useState("Dario");
  const [isEnabled, setIsEnabled] = useState(false);

  // Stato salvataggio e metadata
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedAuthor, setLastSavedAuthor] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [tableMissing, setTableMissing] = useState(false);

  // Messaggi utente
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Ref per debounce autosave
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstMount = useRef(true);

  // 1. Caricamento dati per il rito selezionato
  const loadDraft = useCallback(async (rite: "ambrosiano" | "romano") => {
    setLoading(true);
    setFeedbackMessage(null);
    try {
      const res = await getSundayNewsletterDraftAction(rite);
      setCycleInfo(res.cycleInfo);
      setGospel(res.gospel);
      setCustomPrompt(res.draft.custom_prompt);
      setReflectionTitle(res.draft.reflection_title || "✨ Commento al Vangelo della Domenica");
      setReflectionText(res.draft.reflection_text || "");
      setAuthorSignature(res.draft.author_signature !== undefined && res.draft.author_signature !== null ? res.draft.author_signature : "Dario");
      setIsEnabled(res.draft.is_enabled);
      setLastSavedAuthor(res.draft.last_edited_by_name);
      setLastSavedTime(res.draft.updated_at ? new Date(res.draft.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null);
      setTableMissing(Boolean(res.tableMissing));
      setSaveStatus("idle");
    } catch (err: any) {
      console.error("Errore caricamento bozza domenicale:", err);
      setFeedbackMessage({ type: "error", text: err.message || "Errore durante il caricamento della bozza." });
    } finally {
      setLoading(false);
      isFirstMount.current = false;
    }
  }, []);

  useEffect(() => {
    loadDraft(selectedRite);
  }, [selectedRite, loadDraft]);

  // 2. Funzione di salvataggio automatico
  const executeSave = useCallback(
    async (
      promptToSave: string,
      titleToSave: string,
      textToSave: string,
      signatureToSave: string,
      enabledToSave: boolean
    ) => {
      setSaveStatus("saving");
      try {
        const res = await saveSundayNewsletterDraftAction({
          rite: selectedRite,
          custom_prompt: promptToSave,
          reflection_title: titleToSave,
          reflection_text: textToSave,
          author_signature: signatureToSave,
          is_enabled: enabledToSave,
        });

        if (res.error) {
          setSaveStatus("error");
          setFeedbackMessage({ type: "error", text: res.error });
        } else {
          setSaveStatus("saved");
          setLastSavedAuthor(res.author);
          setLastSavedTime(new Date(res.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        }
      } catch (err: any) {
        console.error("Errore autosave:", err);
        setSaveStatus("error");
      }
    },
    [selectedRite]
  );

  // 3. Debounce per testo, titolo, firma e prompt
  const scheduleAutoSave = (
    newPrompt: string,
    newTitle: string,
    newText: string,
    newSignature: string,
    newEnabled: boolean
  ) => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    setSaveStatus("saving");
    autoSaveTimerRef.current = setTimeout(() => {
      executeSave(newPrompt, newTitle, newText, newSignature, newEnabled);
    }, 1200);
  };

  // Trigger cambio testo meditazione
  const handleTextChange = (val: string) => {
    setReflectionText(val);
    scheduleAutoSave(customPrompt, reflectionTitle, val, authorSignature, isEnabled);
  };

  // Trigger cambio titolo meditazione
  const handleTitleChange = (val: string) => {
    setReflectionTitle(val);
    scheduleAutoSave(customPrompt, val, reflectionText, authorSignature, isEnabled);
  };

  // Trigger cambio firma autore
  const handleSignatureChange = (val: string) => {
    setAuthorSignature(val);
    scheduleAutoSave(customPrompt, reflectionTitle, reflectionText, val, isEnabled);
  };

  // Trigger cambio prompt
  const handlePromptChange = (val: string) => {
    setCustomPrompt(val);
    scheduleAutoSave(val, reflectionTitle, reflectionText, authorSignature, isEnabled);
  };

  // Trigger switch congelamento (salvataggio immediato senza debounce)
  const handleToggleFreeze = (newVal: boolean) => {
    setIsEnabled(newVal);
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    executeSave(customPrompt, reflectionTitle, reflectionText, authorSignature, newVal);
  };

  // 4. Generazione assistita con AI
  const handleGenerateAi = async () => {
    if (!customPrompt || customPrompt.trim().length < 10) {
      setFeedbackMessage({ type: "error", text: "Il prompt non può essere vuoto." });
      return;
    }
    setGeneratingAi(true);
    setFeedbackMessage(null);
    try {
      const res = await generateSundayReflectionAIAction(selectedRite, customPrompt);
      if (res.error) {
        setFeedbackMessage({ type: "error", text: res.error });
      } else {
        setReflectionText(res.reflection);
        executeSave(customPrompt, reflectionTitle, res.reflection, authorSignature, isEnabled);
        setFeedbackMessage({
          type: "success",
          text: `Commento generato con successo con ${res.usedModel}! Puoi rifinirlo liberamente nel box sottostante.`,
        });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: "error", text: err.message || "Errore durante la generazione AI." });
    } finally {
      setGeneratingAi(false);
    }
  };

  // 5. Invio test immediato
  const handleSendTest = async () => {
    if (!reflectionText || reflectionText.trim().length < 5) {
      setFeedbackMessage({ type: "error", text: "Inserisci o genera prima un commento prima di inviare il test." });
      return;
    }
    setSendingTest(true);
    setFeedbackMessage(null);
    try {
      const res = await testSundayNewsletterDraftAction({
        rite: selectedRite,
        reflection_text: reflectionText,
        reflection_title: reflectionTitle,
        author_signature: authorSignature,
      });

      if (res.error) {
        setFeedbackMessage({ type: "error", text: res.error });
      } else {
        setFeedbackMessage({ type: "success", text: res.success || "Test inviato con successo!" });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: "error", text: err.message || "Errore invio test." });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Testata della Sezione Domenica */}
      <div className="rounded-3xl border border-[#e2d5c4] bg-[#fdfbf7] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🌟</span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#aa9576]">
                Edizione Speciale Festiva · La Parola della Domenica
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#3f3933]">
              Gestione Newsletter della Domenica
            </h2>
            <p className="text-xs sm:text-sm text-[#7d6b58] font-serif italic mt-1">
              Prepara durante la settimana il commento evangelico per la liturgia domenicale, con AI assistita e salvataggio automatico continuo.
            </p>
          </div>

          {/* Badge Ciclo Temporale */}
          {cycleInfo && (
            <div className="self-start md:self-auto shrink-0">
              {cycleInfo.isSundayPast6AM ? (
                <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-900 shadow-2xs">
                  <span>✅</span>
                  <span>Spedita questa mattina alle 06:00</span>
                </div>
              ) : cycleInfo.isSundayToday ? (
                <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-900 shadow-2xs">
                  <span>⏳</span>
                  <span>In spedizione questa mattina</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-2xl border border-[#d9cdbf] bg-[#fbf8f4] px-4 py-2 text-xs font-bold text-[#5c4a37] shadow-2xs">
                  <span>📅</span>
                  <span>Preparazione per: {cycleInfo.targetSundayLabel}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tab Scelta Rito (Ambrosiano vs Romano) */}
        <div className="mt-6 pt-5 border-t border-[#ede4d6] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-[#ede4d6] border border-[#ddd0c0]">
            <button
              onClick={() => setSelectedRite("ambrosiano")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedRite === "ambrosiano"
                  ? "bg-[#5c4a37] text-white shadow-sm"
                  : "text-[#6b5d4e] hover:bg-white/60"
              }`}
            >
              <span>🕊️</span>
              <span>Domenica Rito Ambrosiano</span>
            </button>

            <button
              onClick={() => setSelectedRite("romano")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedRite === "romano"
                  ? "bg-[#5c4a37] text-white shadow-sm"
                  : "text-[#6b5d4e] hover:bg-white/60"
              }`}
            >
              <span>🏛️</span>
              <span>Domenica Rito Romano</span>
            </button>
          </div>

          {/* Indicatore Stato Salvataggio (Stile Google Docs) */}
          <div className="flex items-center gap-2 text-xs">
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1.5 text-amber-700 font-semibold animate-pulse">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-600"></span>
                <span>Salvataggio in corso...</span>
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <span>✓</span>
                <span>
                  Salvato {lastSavedAuthor ? `da ${lastSavedAuthor}` : ""} {lastSavedTime ? `alle ${lastSavedTime}` : ""}
                </span>
              </span>
            )}
            {saveStatus === "error" && (
              <span className="flex items-center gap-1.5 text-rose-700 font-semibold">
                <span>⚠️</span>
                <span>Errore salvataggio automatico</span>
              </span>
            )}
            {saveStatus === "idle" && lastSavedAuthor && (
              <span className="text-[#8a755d] text-[11px] italic">
                Ultima bozza salvata da {lastSavedAuthor} {lastSavedTime ? `alle ${lastSavedTime}` : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Avviso se la tabella nel DB non è ancora creata */}
      {tableMissing && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <span>⚠️</span>
            <span>Tabella di salvataggio non ancora creata su Supabase</span>
          </div>
          <p>
            Per consentire il salvataggio automatico continuo delle bozze domenicali tra Nicola e Dario, è necessario eseguire la migrazione SQL{" "}
            <code>20260904150000_create_sunday_newsletter_drafts.sql</code> nell&apos;SQL Editor di Supabase.
          </p>
        </div>
      )}

      {/* Messaggi di feedback (Successo / Errore) */}
      {feedbackMessage && (
        <div
          className={`rounded-2xl border px-4 py-3 text-xs font-semibold flex items-center justify-between gap-3 ${
            feedbackMessage.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button onClick={() => setFeedbackMessage(null)} className="text-xs font-bold hover:underline cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center space-y-4 rounded-3xl border border-[#e2d5c4] bg-[#fdfbf7]">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#aa9576]/30 border-t-[#5c4a37]"></div>
          <p className="font-serif text-lg text-[#aa9576]">
            Caricamento del Vangelo e della bozza di Domenica ({selectedRite === "ambrosiano" ? "Rito Ambrosiano" : "Rito Romano"})...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Colonna Sinistra: Editor e Controlli (7 colonne) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Box 1: Vangelo della Domenica (Read-only) */}
            <div className="rounded-3xl border border-[#e0d6c7] bg-white p-6 sm:p-7 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-[#f0e7dc] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📖</span>
                  <h3 className="font-serif font-bold text-base text-[#3f3933]">
                    Vangelo della Domenica (Non modificabile)
                  </h3>
                </div>
                <span className="rounded-full bg-[#f4efe6] px-2.5 py-0.5 text-[11px] font-bold text-[#6e5a45] border border-[#d9cdbf]">
                  {gospel?.gospelCitation || "Liturgia Festiva"}
                </span>
              </div>

              <div>
                <h4 className="font-serif text-lg font-bold text-[#443729] mb-1">
                  {gospel?.title}
                </h4>
                <p className="text-xs text-[#8a755d] italic mb-3">
                  {cycleInfo?.targetSundayLabel} · {selectedRite === "ambrosiano" ? "Chiesa di Milano" : "Martirologio CEI"}
                </p>
                <div className="max-h-56 overflow-y-auto rounded-2xl bg-[#fdfaf5] border border-[#ece2d5] p-4 text-xs font-serif leading-relaxed text-[#3f3933] text-justify space-y-2">
                  {gospel?.gospelText?.split("\n\n").map((p: string, i: number) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            </div>

            {/* Box 2: Prompt di Meditazione AI (Editabile) */}
            <div className="rounded-3xl border border-[#e0d6c7] bg-white p-6 sm:p-7 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-[#f0e7dc] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🧠</span>
                  <h3 className="font-serif font-bold text-base text-[#3f3933]">
                    Prompt di Meditazione AI (Gemini)
                  </h3>
                </div>
                <span className="text-[11px] text-[#8a755d] font-mono">Modificabile</span>
              </div>

              <p className="text-xs text-[#7d6b58]">
                Puoi personalizzare le istruzioni date all&apos;intelligenza artificiale per focalizzare la riflessione sui temi desiderati.
              </p>

              <textarea
                value={customPrompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                rows={6}
                className="w-full rounded-2xl border border-[#d9cdbf] bg-[#faf7f2] p-4 text-xs font-mono leading-relaxed text-[#3f3933] focus:border-[#aa9576] focus:bg-white focus:outline-none transition resize-y"
                placeholder="Inserisci il prompt per Gemini..."
              />

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    const { DEFAULT_SUNDAY_PROMPT_TEMPLATE } = await import("@/lib/daily-word-newsletter");
                    const restored = DEFAULT_SUNDAY_PROMPT_TEMPLATE
                      .replace(/{gospelTitle}/g, gospel?.title || "")
                      .replace(/{gospelCitation}/g, gospel?.gospelCitation || "")
                      .replace(/{gospelText}/g, gospel?.gospelText || "");
                    setCustomPrompt(restored);
                    scheduleAutoSave(restored, reflectionTitle, reflectionText, authorSignature, isEnabled);
                  }}
                  className="text-xs font-semibold text-[#8a755d] hover:text-[#5c4a37] hover:underline cursor-pointer"
                >
                  ↺ Ripristina prompt predefinito
                </button>

                <button
                  type="button"
                  onClick={handleGenerateAi}
                  disabled={generatingAi}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#5c4a37] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#4a3b2b] transition cursor-pointer disabled:opacity-50"
                >
                  {generatingAi ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>Generazione in corso...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>Genera Commento con AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Box 3: Titolo, Testo e Firma del Commento (Editabile con Auto-Save) */}
            <div className="rounded-3xl border border-[#e0d6c7] bg-white p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#f0e7dc] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">✍️</span>
                  <h3 className="font-serif font-bold text-base text-[#3f3933]">
                    Commento al Vangelo (Editabile con Salvataggio Continuo)
                  </h3>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                  Salvataggio automatico attivo
                </span>
              </div>

              {/* Titolo Personalizzabile */}
              <div>
                <label className="block text-xs font-bold text-[#5c4a37] mb-1.5 uppercase tracking-wider">
                  Titolo della Meditazione
                </label>
                <input
                  type="text"
                  value={reflectionTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full rounded-xl border border-[#d9cdbf] bg-[#faf7f2] px-3.5 py-2 text-xs font-serif font-bold text-[#3f3933] focus:border-[#aa9576] focus:bg-white focus:outline-none transition"
                  placeholder="Es. ✨ Commento al Vangelo della Domenica"
                />
              </div>

              {/* Testo del Commento */}
              <div>
                <label className="block text-xs font-bold text-[#5c4a37] mb-1.5 uppercase tracking-wider">
                  Testo della Riflessione (supporta **grassetto**)
                </label>
                <textarea
                  value={reflectionText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  rows={7}
                  className="w-full rounded-2xl border border-[#d9cdbf] bg-[#faf7f2] p-4 text-xs font-serif leading-relaxed text-[#3f3933] focus:border-[#aa9576] focus:bg-white focus:outline-none transition resize-y"
                  placeholder="Scrivi o genera il commento qui. Ogni modifica viene salvata automaticamente..."
                />
              </div>

              {/* Firma / Autore Personalizzabile */}
              <div>
                <label className="block text-xs font-bold text-[#5c4a37] mb-1.5 uppercase tracking-wider flex items-center justify-between">
                  <span>Firma / Autore del Commento</span>
                  <span className="text-[10px] font-normal text-[#8a755d] italic">Separata in calce alla riflessione</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs text-[#8a755d] font-serif font-bold">
                    —
                  </span>
                  <input
                    type="text"
                    value={authorSignature}
                    onChange={(e) => handleSignatureChange(e.target.value)}
                    className="w-full rounded-xl border border-[#d9cdbf] bg-[#faf7f2] pl-8 pr-3.5 py-2 text-xs font-serif font-bold text-[#3f3933] focus:border-[#aa9576] focus:bg-white focus:outline-none transition"
                    placeholder="Es. Dario, oppure a cura di Dario"
                  />
                </div>
              </div>
            </div>

            {/* Box 4: Switch di Congelamento ("Attiva per la Newsletter di Domenica") */}
            <div
              className={`rounded-3xl border p-6 transition-all shadow-sm ${
                isEnabled
                  ? "border-emerald-300 bg-emerald-50/70"
                  : "border-[#d9cdbf] bg-[#fbf8f4]"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{isEnabled ? "🔒" : "⚪"}</span>
                    <h4 className="font-serif font-bold text-sm text-[#3f3933]">
                      Congela per la Newsletter di Domenica ore 06:00
                    </h4>
                  </div>
                  <p className="text-xs text-[#7d6b58] leading-relaxed">
                    {isEnabled ? (
                      <span className="font-semibold text-emerald-900">
                        Bozza congelata: questa meditazione verrà inviata a tutta la comunità Domenica alle 06:00 del mattino (al posto della generazione automatica).
                      </span>
                    ) : (
                      <span>
                        Disattivata: Domenica alle 06:00 il sistema userà la normale generazione automatica quotidiana e questo testo verrà ignorato.
                      </span>
                    )}
                  </p>
                </div>

                {/* Switch Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleFreeze(!isEnabled)}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isEnabled ? "bg-emerald-600" : "bg-[#cfbeaa]"
                  }`}
                  role="switch"
                  aria-checked={isEnabled}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      isEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Box 5: Invia Test Personale dell'Anteprima */}
            <div className="flex items-center justify-between p-5 rounded-2xl border border-[#e0d6c7] bg-white shadow-2xs">
              <div className="text-xs text-[#7d6b58]">
                Vuoi ricevere questa bozza sul tuo smartphone prima di confermarla?
              </div>
              <button
                type="button"
                onClick={handleSendTest}
                disabled={sendingTest || !reflectionText}
                className="inline-flex items-center gap-2 rounded-xl border border-[#d9cdbf] bg-[#fbf8f4] px-4 py-2 text-xs font-bold text-[#5c4a37] shadow-2xs hover:bg-[#ede4d6] transition cursor-pointer disabled:opacity-40"
              >
                {sendingTest ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#5c4a37] border-t-transparent"></div>
                    <span>Invio in corso...</span>
                  </>
                ) : (
                  <>
                    <span>📤</span>
                    <span>Invia Test alla mia email</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Colonna Destra: Anteprima Grafica Live WYSIWYG (5 colonne) */}
          <div className="lg:col-span-5 sticky top-6 space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="text-base">📱</span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#aa9576]">
                  Anteprima Live dell&apos;Email
                </span>
              </div>
              <span className="text-[11px] text-[#8a755d] italic">Aggiornata in tempo reale</span>
            </div>

            {/* Container Email Simulato */}
            <div className="rounded-3xl border border-[#d9cdbf] bg-[#f7f3ec] p-3 sm:p-4 shadow-md max-h-[85vh] overflow-y-auto">
              <div className="rounded-2xl border border-[#e5dbcb] bg-[#fffdfa] shadow-xs overflow-hidden text-left">
                {/* Header Email */}
                <div className="bg-gradient-to-br from-[#443729] to-[#2f251a] p-6 text-center text-white">
                  <span className="text-2xl block mb-1">🕊️</span>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#f59e0b] mb-1">
                    Note di Fede · La Parola della Domenica ({selectedRite === "romano" ? "Rito Romano" : "Rito Ambrosiano"})
                  </div>
                  <h3 className="font-serif text-lg font-normal leading-snug text-white">
                    {gospel?.title || "Vangelo della Domenica"}
                  </h3>
                  <div className="text-[11px] text-[#d6cbbe] mt-1 capitalize font-serif">
                    {cycleInfo?.targetSundayLabel}
                  </div>
                </div>

                {/* 1. Box Vangelo della Domenica */}
                <div className="p-5 space-y-2 border-b border-[#f0e7dc]">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#aa9576]">
                    📖 Il Vangelo del Giorno
                  </div>
                  <div className="text-xs font-bold font-serif text-[#6b21a8]">
                    {gospel?.gospelCitation}
                  </div>
                  <div className="rounded-xl border border-[#f0e7dc] bg-white p-3.5 text-[11px] font-serif leading-relaxed text-[#2c251e] text-justify space-y-2 max-h-48 overflow-y-auto">
                    {gospel?.gospelText?.split("\n\n").map((p: string, i: number) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </div>

                {/* 2. Box Commento e 3. Firma */}
                <div className="p-5">
                  <div className="rounded-xl border border-[#ebdcc8] border-l-4 border-l-[#d97706] bg-[#fcf9f2] p-4 shadow-2xs">
                    <div className="text-xs font-bold font-serif text-[#92400e] mb-2">
                      {reflectionTitle || "✨ Commento al Vangelo della Domenica"}
                    </div>
                    {reflectionText ? (
                      <div>
                        <p
                          className="font-serif text-xs leading-relaxed text-[#3f2f1f] italic"
                          dangerouslySetInnerHTML={{
                            __html: `«${formatMarkdownToEmailHtml(reflectionText)}»`,
                          }}
                        />
                        {authorSignature && (
                          <div className="mt-3 pt-2.5 border-t border-dashed border-[#ebdcc8] text-right">
                            <span className="font-serif text-xs italic font-bold text-[#7c644d] tracking-wide">
                              — {authorSignature}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="font-serif text-xs leading-relaxed text-[#8a755d] italic">
                        (Nessun commento ancora presente. Scrivi nel box a sinistra o clicca &quot;Genera con AI&quot;).
                      </p>
                    )}
                  </div>
                </div>

                {/* Pulsante CTA */}
                <div className="px-5 pb-6 text-center">
                  <div className="inline-block rounded-xl bg-[#5c4a37] px-6 py-2.5 text-xs font-bold text-white shadow-sm">
                    Apri Liturgia e Audio su Note di Fede ↗
                  </div>
                </div>

                {/* Footer Email */}
                <div className="border-t border-[#e8decb] bg-[#f4eee4] p-4 text-center text-[10px] text-[#8a7863] space-y-1">
                  <p className="m-0">
                    Ricevi questa email perché sei iscritto a <strong>Note di Fede</strong>.
                  </p>
                  <p className="m-0 text-[#aa9781]">
                    Note di Fede · Archivio Musica Liturgica & Liturgia delle Ore
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
