"use client";

import React, { useState, useEffect, useRef } from "react";
import type { LiturgyMoment, LiturgyRite } from "@/components/liturgia-reader";

export interface QuoteImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialText: string;
  moment?: LiturgyMoment;
  rite?: LiturgyRite;
  dateStr?: string;
  liturgicalTitle?: string;
  defaultCitation?: string;
  sourceSection?: string;
}


type AspectRatio = "banner" | "story" | "square";
type ThemeId = "dark" | "parchment" | "porpora" | "liturgical_dynamic";

export interface LiturgicalColorDetails {
  colorKey: "bianco" | "rosso" | "viola" | "verde" | "rosa";
  colorName: string;
  icon: string;
  bgColor: string;
  gradientStart: string;
  gradientEnd: string;
  textColor: string;
  citationColor: string;
  isWhiteBg?: boolean;
}

export const LITURGICAL_COLORS: Record<string, LiturgicalColorDetails> = {
  bianco: {
    colorKey: "bianco",
    colorName: "Bianco",
    icon: "⚪",
    bgColor: "#ffffff",
    gradientStart: "#ffffff",
    gradientEnd: "#f4ede2",
    textColor: "#1a1510",
    citationColor: "#7a5c3e",
    isWhiteBg: true,
  },
  rosso: {
    colorKey: "rosso",
    colorName: "Rosso Scarlatto",
    icon: "🔴",
    bgColor: "#881320",
    gradientStart: "#a11827",
    gradientEnd: "#6b0a13",
    textColor: "#ffffff",
    citationColor: "#fef08a",
    isWhiteBg: false,
  },
  viola: {
    colorKey: "viola",
    colorName: "Viola",
    icon: "🟣",
    bgColor: "#3b1a59",
    gradientStart: "#4c2173",
    gradientEnd: "#2c1143",
    textColor: "#ffffff",
    citationColor: "#fef08a",
    isWhiteBg: false,
  },
  rosa: {
    colorKey: "rosa",
    colorName: "Rosa Liturgico",
    icon: "🌸",
    bgColor: "#831843",
    gradientStart: "#9d174d",
    gradientEnd: "#701a3c",
    textColor: "#ffffff",
    citationColor: "#fbcfe8",
    isWhiteBg: false,
  },
  verde: {
    colorKey: "verde",
    colorName: "Verde",
    icon: "🟢",
    bgColor: "#14532d",
    gradientStart: "#166534",
    gradientEnd: "#0f3d21",
    textColor: "#ffffff",
    citationColor: "#fef08a",
    isWhiteBg: false,
  },
};

function resolveLiturgicalColor(liturgicalTitle?: string, text?: string, dateStr?: string): LiturgicalColorDetails {
  const combined = `${liturgicalTitle || ""} ${text || ""}`.toLowerCase();

  // 1. Riconoscimento PRIORITARIO del colore esplicito ("colore: bianco", "colore: rosso", ecc.)
  if (
    combined.includes("colore: bianco") ||
    combined.includes("colore:bianco") ||
    combined.includes("(colore: bianco)") ||
    /\bbianco\b/i.test(liturgicalTitle || "")
  ) {
    return LITURGICAL_COLORS.bianco;
  }

  if (
    combined.includes("colore: rosso") ||
    combined.includes("colore:rosso") ||
    combined.includes("(colore: rosso)") ||
    /\brosso\b/i.test(liturgicalTitle || "")
  ) {
    return LITURGICAL_COLORS.rosso;
  }

  if (
    combined.includes("colore: viola") ||
    combined.includes("colore:viola") ||
    combined.includes("(colore: viola)") ||
    /\bviola\b/i.test(liturgicalTitle || "")
  ) {
    return LITURGICAL_COLORS.viola;
  }

  if (
    combined.includes("colore: rosa") ||
    combined.includes("colore:rosa") ||
    combined.includes("(colore: rosa)") ||
    /\brosa\b/i.test(liturgicalTitle || "")
  ) {
    return LITURGICAL_COLORS.rosa;
  }

  if (
    combined.includes("colore: verde") ||
    combined.includes("colore:verde") ||
    combined.includes("(colore: verde)")
  ) {
    return LITURGICAL_COLORS.verde;
  }

  // 2. Controllo su data solenne o sanctorale fissa (MM-DD)
  if (dateStr) {
    const md = dateStr.slice(5); // "MM-DD"
    const fixedColors: Record<string, keyof typeof LITURGICAL_COLORS> = {
      "01-25": "bianco",
      "02-02": "bianco",
      "02-22": "bianco",
      "03-19": "bianco",
      "03-25": "bianco",
      "04-25": "rosso",
      "05-01": "bianco",
      "05-03": "rosso",
      "05-14": "rosso",
      "05-31": "bianco",
      "06-11": "rosso",
      "06-24": "bianco",
      "06-29": "rosso",
      "07-03": "rosso",
      "07-22": "bianco",
      "07-25": "rosso",
      "07-29": "bianco",
      "08-06": "bianco",
      "08-10": "rosso",
      "08-15": "bianco",
      "08-24": "rosso",
      "08-27": "bianco",
      "08-28": "bianco",
      "08-29": "rosso",
      "09-03": "bianco", // San Gregorio Magno
      "09-08": "bianco",
      "09-14": "rosso",
      "09-15": "bianco",
      "09-21": "rosso",
      "09-29": "bianco",
      "09-30": "bianco",
      "10-01": "bianco",
      "10-02": "bianco",
      "10-04": "bianco",
      "10-15": "bianco",
      "10-18": "rosso",
      "10-28": "rosso",
      "11-01": "bianco",
      "11-02": "viola",
      "11-09": "bianco",
      "11-30": "rosso",
      "12-07": "bianco",
      "12-08": "bianco",
      "12-13": "rosso",
      "12-14": "bianco",
      "12-26": "rosso",
      "12-27": "bianco",
      "12-28": "rosso",
    };
    if (fixedColors[md]) {
      return LITURGICAL_COLORS[fixedColors[md]];
    }
  }

  // 3. Regole su parole chiave liturgiche e agiografiche
  // Rosso Scarlatto: Martiri, Decollazione, Pentecoste, Passione, Croce, Precursore, Apostoli, Evangelisti
  if (
    combined.includes("martir") ||
    combined.includes("decollaz") ||
    combined.includes("pentecoste") ||
    combined.includes("passione") ||
    combined.includes("palme") ||
    combined.includes("croce") ||
    combined.includes("precursore") ||
    combined.includes("apostol") ||
    combined.includes("evangelist")
  ) {
    return LITURGICAL_COLORS.rosso;
  }

  // Rosa: Domenica Gaudete e Laetare
  if (combined.includes("gaudete") || combined.includes("laetare") || combined.includes("rosa")) {
    return LITURGICAL_COLORS.rosa;
  }

  // Viola: Avvento, Quaresima, Defunti, Ceneri, Penitenziale
  if (
    combined.includes("avvento") ||
    combined.includes("quaresima") ||
    combined.includes("ceneri") ||
    combined.includes("defunt") ||
    combined.includes("penitenz")
  ) {
    return LITURGICAL_COLORS.viola;
  }

  // Bianco / Oro: Solennità, Pasqua, Natale, Vergine Maria, Santi (es. Gregorio, Agostino, Tommaso, Dottori, Pastori, Memorie)
  if (
    combined.includes("san ") ||
    combined.includes("santa ") ||
    combined.includes("santi ") ||
    combined.includes("s. ") ||
    combined.includes("memoria") ||
    combined.includes("festa") ||
    combined.includes("solennit") ||
    combined.includes("pasqua") ||
    combined.includes("natal") ||
    combined.includes("epifania") ||
    combined.includes("battesimo") ||
    combined.includes("assunzion") ||
    combined.includes("immacolata") ||
    combined.includes("tutti i santi") ||
    combined.includes("trinit") ||
    combined.includes("sacro cuore") ||
    combined.includes("agostino") ||
    combined.includes("gregorio") ||
    combined.includes("vergine") ||
    combined.includes("maria") ||
    combined.includes("dottore") ||
    combined.includes("confessore") ||
    combined.includes("abate") ||
    combined.includes("vescovo") ||
    combined.includes("papa")
  ) {
    return LITURGICAL_COLORS.bianco;
  }

  // Verde: Tempo Ordinario / Per Annum predefinito
  return LITURGICAL_COLORS.verde;
}

export function QuoteImageModal({
  isOpen,
  onClose,
  initialText,
  moment,
  rite,
  dateStr,
  liturgicalTitle,
  defaultCitation,
  sourceSection,
}: QuoteImageModalProps) {

  const [text, setText] = useState("");
  const [citation, setCitation] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("banner");
  const [theme, setTheme] = useState<ThemeId>("dark");
  const [textSizeDelta, setTextSizeDelta] = useState<number>(0);
  const [citationSizeDelta, setCitationSizeDelta] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedColorKey, setSelectedColorKey] = useState<string | null>(null);

  // Calcola dettagli del colore liturgico dinamico con priorità all'override manuale o all'auto-rilevamento
  const autoLiturgicalColor = resolveLiturgicalColor(liturgicalTitle, text || initialText, dateStr);
  const dynamicColor = (selectedColorKey && LITURGICAL_COLORS[selectedColorKey]) || autoLiturgicalColor;

  // Calcola la citazione canonica automatica al caricamento
  useEffect(() => {
    if (!isOpen) return;

    // Reimposta l'eventuale override manuale per ogni nuova apertura
    setSelectedColorKey(null);

    // Pulisci il testo selezionato rimuovendo virgolette preesistenti
    let cleanText = initialText
      .replace(/^[«"'\s]+|[»"'\s]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();

    setText(cleanText);

    if (defaultCitation) {
      setCitation(defaultCitation);
      return;
    }

    // Costruisci la citazione canonica esatta e concordata
    if (moment && rite) {
      if (moment === "messa") {
        if (
          sourceSection === "vangelo" ||
          /in quel tempo|disse ai suoi discepoli|simone rispose|prendi il largo|pescatori|barche|disse a simone|gettate le reti/i.test(cleanText)
        ) {
          setCitation("Vangelo del Giorno");
          return;
        } else if (sourceSection === "salmo") {
          setCitation("Salmo Responsoriale · Messa del Giorno");
          return;
        } else {
          setCitation("Messa del Giorno");
          return;
        }
      }

      const citationMap: Record<LiturgyMoment, { ambrosiano: string; romano: string }> = {
        lodi: { ambrosiano: "Lodi Ambrosiane", romano: "Lodi Romane" },
        vespri: { ambrosiano: "Vespri Ambrosiani", romano: "Vespri Romani" },
        ora_media: { ambrosiano: "Ora Media Ambrosiana", romano: "Ora Media Romana" },
        compieta: { ambrosiano: "Compieta Ambrosiana", romano: "Compieta Romana" },
        ufficio: { ambrosiano: "Ufficio delle Letture Ambrosiano", romano: "Ufficio delle Letture Romano" },
        messa: { ambrosiano: "Messa del Giorno", romano: "Messa del Giorno" },
      };

      const def = citationMap[moment]?.[rite] || (rite === "ambrosiano" ? "Rito Ambrosiano" : "Rito Romano");
      setCitation(def);
    } else {
      setCitation(liturgicalTitle || "Note di Fede");
    }
  }, [isOpen, initialText, moment, rite, defaultCitation, liturgicalTitle, sourceSection]);

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
    let textColor = "#fdfdfd";
    let citationColor = "#dcdcdc";
    let isSerif = false;

    if (theme === "dark") {
      textColor = "#ffffff";
      citationColor = "#cccccc";
      isSerif = false;

      const grad = ctx.createRadialGradient(width / 2, height / 2, width * 0.2, width / 2, height / 2, width * 0.7);
      grad.addColorStop(0, "#2a2a2a");
      grad.addColorStop(1, "#141414");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else if (theme === "parchment") {
      textColor = "#2c241c";
      citationColor = "#6e5a45";
      isSerif = true;

      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "#fbf8f3");
      grad.addColorStop(1, "#f3ebd8");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Bordo elegante
      ctx.strokeStyle = "#e2d5c4";
      ctx.lineWidth = width * 0.015;
      ctx.strokeRect(width * 0.025, height * 0.025, width * 0.95, height * 0.95);
    } else if (theme === "porpora") {
      // Autentica Porpora Cardinale / Amaranto Solenne
      textColor = "#fef08a"; // Oro caldo
      citationColor = "#ffffff";
      isSerif = true;

      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "#6b1745");
      grad.addColorStop(1, "#430a2a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Bordo oro solenne
      ctx.strokeStyle = "rgba(253, 224, 71, 0.35)";
      ctx.lineWidth = width * 0.01;
      ctx.strokeRect(width * 0.025, height * 0.025, width * 0.95, height * 0.95);
    } else if (theme === "liturgical_dynamic") {
      textColor = dynamicColor.textColor;
      citationColor = dynamicColor.citationColor;
      isSerif = true;

      if (dynamicColor.isWhiteBg) {
        // Sfondo Bianco Festivo Luminoso (Seta Avorio / Bianco con cornice oro brillante)
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.5, "#faf7f1");
        grad.addColorStop(1, "#f4ede2");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Cornice dorata festiva
        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = width * 0.012;
        ctx.strokeRect(width * 0.028, height * 0.028, width * 0.944, height * 0.944);
      } else {
        // Sfondi liturgici vividi e autentici (Rosso Scarlatto, Verde Smeraldo, Viola Vescovile)
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, dynamicColor.gradientStart);
        grad.addColorStop(1, dynamicColor.gradientEnd);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Bordo sottile di luce
        ctx.strokeStyle = "rgba(255, 255, 255, 0.20)";
        ctx.lineWidth = width * 0.008;
        ctx.strokeRect(width * 0.025, height * 0.025, width * 0.95, height * 0.95);
      }
    }


    // 2. Prepara il testo con le caporali « »
    const fullQuoteText = `«${text}»`;

    // 3. Calcola dimensione font e wrapping
    const paddingX = width * 0.08;
    const maxTextWidth = width - paddingX * 2;

    // Calcolo dinamico font size di base + delta utente
    let baseFontSize = width * 0.052;
    if (aspectRatio === "story") baseFontSize = width * 0.062;
    if (text.length > 180) baseFontSize *= 0.88;
    if (text.length > 300) baseFontSize *= 0.78;
    if (text.length > 450) baseFontSize *= 0.68;

    let fontSize = Math.max(20, Math.round(baseFontSize + textSizeDelta));

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

    const lineHeight = fontSize * 1.34;
    const totalTextHeight = lines.length * lineHeight;

    // Dimensione Citazione (calcolata + delta utente)
    const baseCitationFontSize = Math.round(fontSize * 0.62);
    const citationFontSize = Math.max(16, Math.round(baseCitationFontSize + citationSizeDelta));

    // Calcola posizione Y garantendo che non esca MAI dal bordo inferiore
    const bottomSafetyMargin = height * 0.08;
    const availableContentHeight = totalTextHeight + citationFontSize + Math.max(20, fontSize * 0.7);

    let startY = (height - availableContentHeight) / 2;
    if (aspectRatio === "story") {
      startY = height * 0.35 - totalTextHeight / 2;
    }

    if (startY < height * 0.08) {
      startY = height * 0.08;
    }

    // Disegna le righe del testo
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], paddingX, startY + i * lineHeight);
    }

    // 4. Disegna la Citazione in Basso (Corsivo)
    ctx.font = `italic 600 ${citationFontSize}px ${fontFamily}`;
    ctx.fillStyle = citationColor;

    let citationY = startY + totalTextHeight + Math.max(24, fontSize * 0.75);
    if (citationY + citationFontSize > height - bottomSafetyMargin) {
      citationY = height - bottomSafetyMargin - citationFontSize;
    }

    ctx.fillText(citation, paddingX, citationY);

    // 5. Genera Anteprima Data URL
    try {
      const dataUrl = canvas.toDataURL("image/png");
      setPreviewUrl(dataUrl);
    } catch (e) {
      console.error("Errore generazione anteprima canvas:", e);
    }
  }, [isOpen, text, citation, aspectRatio, theme, textSizeDelta, citationSizeDelta, dynamicColor]);

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

            {/* Tema (4 opzioni: Notturno, Avorio, Porpora, Dinamico) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#8a755d] uppercase tracking-wider">
                Stile & Colore
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: "dark", label: "🌙 Notturno", desc: "Minimale" },
                  { id: "parchment", label: "📜 Avorio", desc: "Pergamena" },
                  { id: "porpora", label: "👑 Oro & Porpora", desc: "Solenne" },
                  { id: "liturgical_dynamic", label: `✝️ ${dynamicColor.icon} ${dynamicColor.colorName}`, desc: "Tempo del Giorno" },
                ].map((th) => {
                  const isSelected = theme === th.id;
                  let selectedBg = "#2c241c";
                  let selectedText = "#ffffff";
                  let selectedBorder = "#2c241c";

                  if (isSelected) {
                    if (th.id === "liturgical_dynamic") {
                      if (dynamicColor.isWhiteBg) {
                        selectedBg = "#fdfbf7";
                        selectedText = "#1a1510";
                        selectedBorder = "#d4af37";
                      } else {
                        selectedBg = dynamicColor.bgColor;
                        selectedText = "#ffffff";
                        selectedBorder = dynamicColor.gradientStart;
                      }
                    } else if (th.id === "porpora") {
                      selectedBg = "#581238";
                      selectedText = "#fef08a";
                      selectedBorder = "#6b1745";
                    }
                  }

                  return (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => setTheme(th.id as ThemeId)}
                      style={
                        isSelected
                          ? { backgroundColor: selectedBg, color: selectedText, borderColor: selectedBorder }
                          : undefined
                      }
                      className={`px-2 py-1.5 rounded-xl text-xs font-semibold transition border cursor-pointer flex flex-col items-center text-center ${
                        isSelected
                          ? "shadow-sm font-bold"
                          : "bg-white text-[#5c4e3f] border-[#d8c5ad] hover:bg-[#f7f2ea]"
                      }`}
                    >
                      <span className="truncate w-full">{th.label}</span>
                      <span className="text-[10px] opacity-75 truncate w-full">{th.desc}</span>
                    </button>
                  );
                })}
              </div>


              {/* Selettore rapido della tonalità liturgica */}
              {theme === "liturgical_dynamic" && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1.5 px-0.5">
                  <span className="text-[11px] text-[#8a755d] font-semibold">Tonalità:</span>
                  {(["bianco", "verde", "rosso", "viola", "rosa"] as const).map((ckey) => {
                    const c = LITURGICAL_COLORS[ckey];
                    const isCurrent = dynamicColor.colorKey === ckey;
                    return (
                      <button
                        key={ckey}
                        type="button"
                        onClick={() => setSelectedColorKey(ckey)}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition cursor-pointer flex items-center gap-1 border ${
                          isCurrent
                            ? "bg-[#2c241c] text-white border-[#2c241c] font-bold shadow-xs"
                            : "bg-white text-[#5c4e3f] border-[#d8c5ad] hover:bg-[#f7f2ea]"
                        }`}
                      >
                        <span>{c.icon}</span>
                        <span>{c.colorName}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>


          {/* Testo Citato Modificabile + Regolazione Pixel */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#8a755d] uppercase tracking-wider">
                Testo del Versetto
              </label>
              <div className="flex items-center gap-1 bg-[#f0e4d2] px-2 py-0.5 rounded-lg border border-[#d8c5ad]">
                <span className="text-[10px] text-[#6e5a45] font-semibold mr-1">Dim. testo:</span>
                <button
                  type="button"
                  onClick={() => setTextSizeDelta((p) => Math.max(-20, p - 3))}
                  className="px-1.5 py-0.5 text-xs font-bold text-[#2c241c] hover:bg-white rounded cursor-pointer"
                  title="Riduci dimensione testo"
                >
                  A-
                </button>
                <span className="text-[10px] font-mono font-bold text-[#2c241c] min-w-[24px] text-center">
                  {textSizeDelta >= 0 ? `+${textSizeDelta}` : textSizeDelta}px
                </span>
                <button
                  type="button"
                  onClick={() => setTextSizeDelta((p) => Math.min(25, p + 3))}
                  className="px-1.5 py-0.5 text-xs font-bold text-[#2c241c] hover:bg-white rounded cursor-pointer"
                  title="Aumenta dimensione testo"
                >
                  A+
                </button>
                {textSizeDelta !== 0 && (
                  <button
                    type="button"
                    onClick={() => setTextSizeDelta(0)}
                    className="text-[10px] text-[#8a755d] hover:text-[#2c241c] ml-1 cursor-pointer"
                    title="Ripristina dimensione predefinita"
                  >
                    ↺
                  </button>
                )}
              </div>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              className="w-full p-2.5 bg-white border border-[#d8c5ad] rounded-xl text-xs sm:text-sm text-[#2c241c] focus:outline-none focus:ring-2 focus:ring-[#8a755d]"
              placeholder="Inserisci il testo..."
            />
          </div>

          {/* Citazione Fonte Modificabile + Regolazione Pixel Citazione */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#8a755d] uppercase tracking-wider">
                Citazione / Firma in Basso
              </label>
              <div className="flex items-center gap-1 bg-[#f0e4d2] px-2 py-0.5 rounded-lg border border-[#d8c5ad]">
                <span className="text-[10px] text-[#6e5a45] font-semibold mr-1">Dim. citazione:</span>
                <button
                  type="button"
                  onClick={() => setCitationSizeDelta((p) => Math.max(-15, p - 2))}
                  className="px-1.5 py-0.5 text-xs font-bold text-[#2c241c] hover:bg-white rounded cursor-pointer"
                  title="Riduci dimensione citazione"
                >
                  A-
                </button>
                <span className="text-[10px] font-mono font-bold text-[#2c241c] min-w-[24px] text-center">
                  {citationSizeDelta >= 0 ? `+${citationSizeDelta}` : citationSizeDelta}px
                </span>
                <button
                  type="button"
                  onClick={() => setCitationSizeDelta((p) => Math.min(20, p + 2))}
                  className="px-1.5 py-0.5 text-xs font-bold text-[#2c241c] hover:bg-white rounded cursor-pointer"
                  title="Aumenta dimensione citazione"
                >
                  A+
                </button>
                {citationSizeDelta !== 0 && (
                  <button
                    type="button"
                    onClick={() => setCitationSizeDelta(0)}
                    className="text-[10px] text-[#8a755d] hover:text-[#2c241c] ml-1 cursor-pointer"
                    title="Ripristina dimensione predefinita"
                  >
                    ↺
                  </button>
                )}
              </div>
            </div>
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
