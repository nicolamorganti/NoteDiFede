"use client";

import React, { useState, useEffect, useRef } from "react";
import type { LiturgyMoment, LiturgyRite } from "@/components/liturgia-reader";

interface QuoteImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialText: string;
  moment: LiturgyMoment;
  rite: LiturgyRite;
  dateStr: string;
  liturgicalTitle?: string;
}

type AspectRatio = "banner" | "story" | "square";
type ThemeId = "dark" | "parchment" | "liturgical";

export function QuoteImageModal({
  isOpen,
  onClose,
  initialText,
  moment,
  rite,
  dateStr,
  liturgicalTitle,
}: QuoteImageModalProps) {
  const [text, setText] = useState("");
  const [citation, setCitation] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("banner");
  const [theme, setTheme] = useState<ThemeId>("dark");
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Calcola la citazione canonica automatica al caricamento
  useEffect(() => {
    if (!isOpen) return;

    // Pulisci il testo selezionato rimuovendo virgolette preesistenti
    let cleanText = initialText
      .replace(/^[«"'\s]+|[»"'\s]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();

    setText(cleanText);

    // Costruisci la citazione esatta in stile Dario
    const momentLabelMap: Record<LiturgyMoment, string> = {
      lodi: "Lodi",
      vespri: "Vespri",
      ora_media: "Ora Media",
      compieta: "Compieta",
      ufficio: "Ufficio delle Letture",
      messa: "Liturgia della Parola",
    };

    const momentName = momentLabelMap[moment] || "Liturgia";
    const riteName = rite === "ambrosiano" ? "Ambrosiane" : "Romane";
    
    // Es: "Lodi Ambrosiane" oppure "Vespri Ambrosiani"
    let defaultCitation = `${momentName} ${riteName}`;
    if (moment === "vespri" || moment === "ufficio") {
      defaultCitation = `${momentName} ${rite === "ambrosiano" ? "Ambrosiani" : "Romani"}`;
    } else if (moment === "compieta") {
      defaultCitation = `Compieta · ${rite === "ambrosiano" ? "Rito Ambrosiano" : "Rito Romano"}`;
    }

    setCitation(defaultCitation);
  }, [isOpen, initialText, moment, rite]);

  // Generatore su Canvas HD
  useEffect(() => {
    if (!isOpen || !text) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dimensioni in base al formato
    let width = 1200;
    let height = 630; // 16:9 banner / card

    if (aspectRatio === "story") {
      width = 1080;
      height = 1920; // 9:16 Verticale Story / Stato WhatsApp
    } else if (aspectRatio === "square") {
      width = 1080;
      height = 1080; // 1:1 Quadrato
    }

    canvas.width = width;
    canvas.height = height;

    // Sfondo e colori in base al tema
    let bgColor = "#1e1e1e";
    let textColor = "#fdfdfd";
    let citationColor = "#dcdcdc";
    let isSerif = false;

    if (theme === "dark") {
      // Stile esatto di Dario (dark matte con testo bianco bold)
      bgColor = "#1e1e1e";
      textColor = "#ffffff";
      citationColor = "#cccccc";
      isSerif = false;
    } else if (theme === "parchment") {
      bgColor = "#f9f5ed";
      textColor = "#2c241c";
      citationColor = "#6e5a45";
      isSerif = true;
    } else if (theme === "liturgical") {
      bgColor = "#281b22";
      textColor = "#fde047";
      citationColor = "#e5e7eb";
      isSerif = true;
    }

    // 1. Disegna Sfondo
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Sfondo sfumato leggero per profondità
    if (theme === "parchment") {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "#fbf8f3");
      grad.addColorStop(1, "#f3ebd8");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Bordo elegante
      ctx.strokeStyle = "#e2d5c4";
      ctx.lineWidth = width * 0.015;
      ctx.strokeRect(width * 0.025, height * 0.025, width * 0.95, height * 0.95);
    } else if (theme === "dark") {
      // Effetto vignetta molto sottile
      const grad = ctx.createRadialGradient(width / 2, height / 2, width * 0.2, width / 2, height / 2, width * 0.7);
      grad.addColorStop(0, "#252525");
      grad.addColorStop(1, "#181818");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Prepara il testo con le caporali « »
    const fullQuoteText = `«${text}»`;

    // 3. Calcola dimensione font e wrapping
    const paddingX = width * 0.08;
    const maxTextWidth = width - paddingX * 2;

    // Calcolo dinamico font size
    let fontSize = width * 0.055;
    if (aspectRatio === "story") fontSize = width * 0.065;
    if (text.length > 250) fontSize *= 0.8;
    if (text.length > 400) fontSize *= 0.7;

    const fontFamily = isSerif
      ? "'Merriweather', 'Georgia', serif"
      : "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    ctx.font = `700 ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = textColor;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    // Funzione wrapping righe
    const words = fullQuoteText.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTextWidth && currentLine) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineHeight = fontSize * 1.38;
    const totalTextHeight = lines.length * lineHeight;

    // Calcola posizione Y (centrato verticalmente o bilanciato)
    let startY = (height - totalTextHeight) / 2 - fontSize * 0.8;
    if (aspectRatio === "story") {
      startY = height * 0.38 - totalTextHeight / 2;
    }
    if (startY < height * 0.12) startY = height * 0.12;

    // Disegna le righe di testo
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], paddingX, startY + i * lineHeight);
    }

    // 4. Disegna la Citazione in Basso (Corsivo)
    const citationFontSize = fontSize * 0.65;
    ctx.font = `italic 600 ${citationFontSize}px ${fontFamily}`;
    ctx.fillStyle = citationColor;

    const citationY = startY + totalTextHeight + fontSize * 1.2;
    ctx.fillText(citation, paddingX, citationY);

    // 5. Genera Anteprima Data URL
    try {
      const dataUrl = canvas.toDataURL("image/png");
      setPreviewUrl(dataUrl);
    } catch (e) {
      console.error("Errore generazione anteprima canvas:", e);
    }
  }, [isOpen, text, citation, aspectRatio, theme]);

  if (!isOpen) return null;

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGenerating(true);
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], "stato-liturgico.png", { type: "image/png" });

        if (typeof navigator !== "undefined" && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: citation,
              text: `${text}\n\n— ${citation}`,
              files: [file],
            });
            setShareSuccess(true);
            setTimeout(() => setShareSuccess(false), 3000);
            return;
          } catch (err: any) {
            if (err.name !== "AbortError") {
              console.warn("Share API fallita, fallback al download:", err);
            }
          }
        }

        // Fallback: Download automatico
        handleDownload();
      }, "image/png");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `stato-${moment}-${rite}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 3000);
  };

  const handleCopy = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob || typeof navigator === "undefined" || !navigator.clipboard) return;
        // @ts-ignore
        const item = new ClipboardItem({ "image/png": blob });
        // @ts-ignore
        await navigator.clipboard.write([item]);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      });
    } catch (e) {
      console.warn("Copia fallita:", e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-5 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl rounded-3xl bg-[#fbf8f3] border border-[#ebdcc8] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modale */}
        <div className="p-4 sm:p-5 border-b border-[#ebdcc8] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#3f3123] text-[#ebdcc8] shadow-xs text-sm">
              📸
            </span>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-[#2c241c]">
                Crea Immagine per Stato WhatsApp
              </h3>
              <p className="text-[11px] text-[#8a755d]">
                Formattazione e citazione automatica per la condivisione
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 inline-flex items-center justify-center rounded-xl text-[#8a755d] hover:bg-[#f4ebd9] hover:text-[#2c241c] transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Canvas nascosto usato per il rendering */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Contenuto Scrollabile */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Anteprima Live */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#8a755d] uppercase tracking-wider">
              Anteprima Immagine
            </label>
            <div className="rounded-2xl overflow-hidden border border-[#d8c5ad] bg-black/5 flex items-center justify-center p-2 min-h-[160px] max-h-[280px]">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Anteprima Stato"
                  className="max-h-[260px] w-auto object-contain rounded-lg shadow-md"
                />
              ) : (
                <div className="animate-spin text-xl">⏳</div>
              )}
            </div>
          </div>

          {/* Opzioni Rapide: Formato e Tema */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Formato */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#8a755d] uppercase tracking-wider">
                Formato
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "banner", label: "Banner", hint: "16:9" },
                  { id: "story", label: "Stato/Story", hint: "9:16" },
                  { id: "square", label: "Quadrato", hint: "1:1" },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setAspectRatio(fmt.id as AspectRatio)}
                    className={`px-2 py-1.5 rounded-xl text-xs font-semibold transition border cursor-pointer flex flex-col items-center ${
                      aspectRatio === fmt.id
                        ? "bg-[#2c241c] text-white border-[#2c241c] shadow-xs"
                        : "bg-white text-[#5c4a37] border-[#d8c5ad] hover:bg-[#f7f2ea]"
                    }`}
                  >
                    <span>{fmt.label}</span>
                    <span className="text-[10px] opacity-70">{fmt.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tema */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#8a755d] uppercase tracking-wider">
                Stile & Colore
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "dark", label: "🖤 Dark", desc: "Come Dario" },
                  { id: "parchment", label: "📜 Avorio", desc: "Pergamena" },
                  { id: "liturgical", label: "✝️ Liturgico", desc: "Elegante" },
                ].map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setTheme(th.id as ThemeId)}
                    className={`px-2 py-1.5 rounded-xl text-xs font-semibold transition border cursor-pointer flex flex-col items-center ${
                      theme === th.id
                        ? "bg-[#2c241c] text-white border-[#2c241c] shadow-xs"
                        : "bg-white text-[#5c4e3f] border-[#d8c5ad] hover:bg-[#f7f2ea]"
                    }`}
                  >
                    <span>{th.label}</span>
                    <span className="text-[10px] opacity-70">{th.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Testo Citato Modificabile */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#8a755d] uppercase tracking-wider flex justify-between">
              <span>Testo del Versetto</span>
              <span className="text-[11px] font-normal lowercase">{text.length} caratteri</span>
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              className="w-full p-2.5 bg-white border border-[#d8c5ad] rounded-xl text-xs sm:text-sm text-[#2c241c] focus:outline-none focus:ring-2 focus:ring-[#8a755d]"
              placeholder="Inserisci il testo..."
            />
          </div>

          {/* Citazione Fonte Modificabile */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#8a755d] uppercase tracking-wider">
              Citazione / Firma in Basso
            </label>
            <input
              type="text"
              value={citation}
              onChange={(e) => setCitation(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#d8c5ad] rounded-xl text-xs sm:text-sm font-serif italic text-[#2c241c] focus:outline-none focus:ring-2 focus:ring-[#8a755d]"
              placeholder="Es. Lodi Ambrosiane"
            />
          </div>
        </div>

        {/* Footer Azioni */}
        <div className="p-4 sm:p-5 border-t border-[#ebdcc8] bg-white flex flex-wrap items-center justify-between gap-2">
          {shareSuccess ? (
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <span>✓</span> Operazione completata!
            </span>
          ) : (
            <span className="text-[11px] text-[#8a755d]">Pronto per WhatsApp</span>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              title="Copia immagine negli appunti"
              className="px-3 py-2 rounded-xl border border-[#d8c5ad] bg-white hover:bg-[#f7f2ea] text-[#4a3b2c] text-xs font-semibold transition cursor-pointer"
            >
              📋 Copia
            </button>

            <button
              type="button"
              onClick={handleDownload}
              title="Scarica file PNG"
              className="px-3 py-2 rounded-xl border border-[#d8c5ad] bg-white hover:bg-[#f7f2ea] text-[#4a3b2c] text-xs font-semibold transition cursor-pointer"
            >
              ⬇️ Salva PNG
            </button>

            <button
              type="button"
              onClick={handleShare}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>📱 Condividi Stato</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
