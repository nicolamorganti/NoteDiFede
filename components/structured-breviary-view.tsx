"use client";

import React, { useState } from "react";

export interface ParsedBreviaryData {
  invitatorio: {
    introHtml: string;
    psalms: { id: string; label: string; subtitle: string; html: string }[];
  } | null;
  innoHtml: string;
  salmodia: { id: string; label: string; html: string }[];
  parolaHtml: string;
  canticoEvangelicoHtml: string;
  preghiereHtml: string;
  isParsed: boolean;
}

export function parseIBreviaryHours(rawHtml: string): ParsedBreviaryData {
  if (!rawHtml) {
    return {
      invitatorio: null,
      innoHtml: "",
      salmodia: [],
      parolaHtml: "",
      canticoEvangelicoHtml: "",
      preghiereHtml: "",
      isParsed: false,
    };
  }

  // 1. Sanifichiamo link menu e link sponsor
  const html = rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<p[^>]*>(?:(?!<\/p>)[\s\S])*?(?:per sostenere lo sviluppo di|alla nostra Newsletter|ibreviary|donazione|-\s*Menu\s*-|\*{3,})(?:(?!<\/p>)[\s\S])*?<\/p>/gi, "")
    .replace(/<a[^>]*href=["'][^"']*(?:donazione|newsletter|#menu|ibreviary\.com)[^"']*["'][^>]*>[\s\S]*?<\/a>/gi, "")
    .replace(/per sostenere lo sviluppo di\s*iBreviary/gi, "")
    .replace(/(?:ISCRIVITI\s*)?alla nostra Newsletter/gi, "")
    .replace(/-\s*Menu\s*-/gi, "");

  // 1. Invitatorio
  let invitatorio = null;
  const invIdx = html.search(/INVITATORIO/i);
  const innoIdx = html.search(/<span class="rubrica">\s*INNO\s*<\/span>|<strong[^>]*>\s*INNO\s*<\/strong>/i);

  if (invIdx !== -1 && innoIdx !== -1) {
    const invBlock = html.slice(invIdx, innoIdx);
    
    // Inizio versetti
    const introMatch = invBlock.match(/INVITATORIO[\s\S]*?(?=<br \/>\s*SALMO\s*94|SALMO\s*94)/i);
    const introHtml = introMatch ? introMatch[0] : "";

    // Estrai i 4 salmi invitatori
    const psalms: { id: string; label: string; subtitle: string; html: string }[] = [];
    const p94Match = html.match(/(?:<br \/>\s*)?SALMO\s*94[\s\S]*?(?=<span class="rubrica">\s*INNO\s*<\/span>|SALMO\s*99|$)/i);
    if (p94Match) psalms.push({ id: "ps94", label: "Salmo 94", subtitle: "Invito a lodare Dio (Predefinito)", html: p94Match[0] });

    const p99Match = html.match(/(?:<br \/>\s*)?SALMO\s*99[\s\S]*?(?=SALMO\s*66|SALMO\s*23|<span class="rubrica">\s*INNO\s*<\/span>|$)/i);
    if (p99Match) psalms.push({ id: "ps99", label: "Salmo 99", subtitle: "La gioia nel tempio", html: p99Match[0] });

    const p66Match = html.match(/(?:<br \/>\s*)?SALMO\s*66[\s\S]*?(?=SALMO\s*23|SALMO\s*99|<span class="rubrica">\s*INNO\s*<\/span>|$)/i);
    if (p66Match) psalms.push({ id: "ps66", label: "Salmo 66", subtitle: "I popoli glorifichino Dio", html: p66Match[0] });

    const p23Match = html.match(/(?:<br \/>\s*)?SALMO\s*23[\s\S]*?(?=<span class="rubrica">\s*INNO\s*<\/span>|SALMO\s*94|$)/i);
    if (p23Match) psalms.push({ id: "ps23", label: "Salmo 23", subtitle: "Il Signore entra nel tempio", html: p23Match[0] });

    invitatorio = {
      introHtml,
      psalms,
    };
  }

  // 2. Inno
  let innoHtml = "";
  if (innoIdx !== -1) {
    const nextAfterInno = html.slice(innoIdx).search(/<span class="rubrica">\s*1\s*ant\.|<strong[^>]*>\s*1\s*ant\./i);
    if (nextAfterInno !== -1) {
      innoHtml = html.slice(innoIdx, innoIdx + nextAfterInno);
    }
  }

  // 3. Salmodia (3 salmi/cantici)
  const salmodia: { id: string; label: string; html: string }[] = [];
  const s1Match = html.match(/<span class="rubrica">\s*1\s*ant\.[\s\S]*?(?=<span class="rubrica">\s*2\s*ant\.)/i);
  if (s1Match) salmodia.push({ id: "s1", label: "1° Salmo", html: s1Match[0] });

  const s2Match = html.match(/<span class="rubrica">\s*2\s*ant\.[\s\S]*?(?=<span class="rubrica">\s*3\s*ant\.)/i);
  if (s2Match) salmodia.push({ id: "s2", label: "Cantico AT", html: s2Match[0] });

  const s3Match = html.match(/<span class="rubrica">\s*3\s*ant\.[\s\S]*?(?=<span class="rubrica">\s*LETTURA BREVE)/i);
  if (s3Match) salmodia.push({ id: "s3", label: "2° Salmo (Lode)", html: s3Match[0] });

  // 4. Lettura Breve & Responsorio
  let parolaHtml = "";
  const letIdx = html.search(/LETTURA BREVE/i);
  const benIdx = html.search(/CANTICO DI ZACCARIA|CANTICO DELLA BEATA VERGINE|CANTICO DI SIMEONE/i);
  if (letIdx !== -1 && benIdx !== -1) {
    parolaHtml = html.slice(letIdx, benIdx);
  }

  // 5. Cantico Evangelico
  let canticoEvangelicoHtml = "";
  const invocaIdx = html.search(/(?:INVOCAZIONI|INTERCESSIONI)/i);
  if (benIdx !== -1 && invocaIdx !== -1) {
    canticoEvangelicoHtml = html.slice(benIdx, invocaIdx);
  }

  // 6. Invocazioni & Conclusione
  let preghiereHtml = "";
  if (invocaIdx !== -1) {
    preghiereHtml = html.slice(invocaIdx);
  }

  const isParsed = !!(innoHtml && salmodia.length > 0);

  return {
    invitatorio,
    innoHtml,
    salmodia,
    parolaHtml,
    canticoEvangelicoHtml,
    preghiereHtml,
    isParsed,
  };
}

/**
 * Estrae il testo pulito per la sintesi vocale (TTS) rispettando la selezione attiva senza ripetere salmi invitatori
 */
export function extractCleanSpeechFromParsedBreviary(data: ParsedBreviaryData, selectedInvIndex = 0, selectedPsalmIndex = 0): string {
  if (!data.isParsed) return "";

  const parts: string[] = [];

  // Invitatorio
  if (data.invitatorio) {
    parts.push(data.invitatorio.introHtml);
    if (data.invitatorio.psalms[selectedInvIndex]) {
      parts.push(data.invitatorio.psalms[selectedInvIndex].html);
    }
  }

  // Inno
  if (data.innoHtml) parts.push(data.innoHtml);

  // Tutta la salmodia in sequenza liturgica
  data.salmodia.forEach((s) => parts.push(s.html));

  // Parola di Dio
  if (data.parolaHtml) parts.push(data.parolaHtml);

  // Cantico Evangelico
  if (data.canticoEvangelicoHtml) parts.push(data.canticoEvangelicoHtml);

  // Preghiere e Orazione
  if (data.preghiereHtml) parts.push(data.preghiereHtml);

  return parts
    .join("\n\n")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

interface Props {
  data: ParsedBreviaryData;
  isChurchMode: boolean;
  fontSize: number;
  lineHeightValue: number | string;
  renderSupportoComprensione: () => React.ReactNode;
}


export function StructuredBreviaryView({
  data,
  isChurchMode,
  fontSize,
  lineHeightValue,
  renderSupportoComprensione,
}: Props) {
  const [selectedInvIndex, setSelectedInvIndex] = useState(0);
  const [selectedPsalmIndex, setSelectedPsalmIndex] = useState(0);
  const [isCompactView, setIsCompactView] = useState(true);

  const cardBg = isChurchMode ? "#201c19" : "#fdfbf7";
  const cardBorder = isChurchMode ? "#3f3a36" : "#e8decb";
  const activeTabBg = isChurchMode ? "#5c4a37" : "#5c4a37";
  const activeTabText = "#ffffff";
  const inactiveTabBg = isChurchMode ? "#2c2622" : "#ede4d8";
  const inactiveTabText = isChurchMode ? "#d6cbbe" : "#5c4a37";

  return (
    <div className="space-y-8">
      {/* Selettore Modalità Vista (Compatta a Schede vs Continua) */}
      <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: cardBorder }}>
        <span className="text-xs font-serif italic text-[#8a755d]">
          Liturgia delle Ore · Rito Romano Ufficiale
        </span>
        <button
          type="button"
          onClick={() => setIsCompactView(!isCompactView)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs"
          style={{
            backgroundColor: inactiveTabBg,
            color: inactiveTabText,
            border: `1px solid ${cardBorder}`,
          }}
        >
          <span>{isCompactView ? "📑 Vista a Schede" : "📜 Vista Continua"}</span>
          <span className="text-[10px] opacity-75">(cambia)</span>
        </button>
      </div>

      {/* 1. INVITATORIO */}
      {data.invitatorio && (
        <section className="space-y-4 rounded-3xl p-5 sm:p-6 border shadow-xs" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <div className="flex items-center justify-between gap-2 border-b pb-2" style={{ borderColor: cardBorder }}>
            <h3 className="font-serif font-bold text-base text-[#8c6d3f] flex items-center gap-2">
              <span>📿</span> INVITATORIO
            </h3>
            <span className="text-[11px] font-mono text-[#8a755d]">
              Inizio della preghiera
            </span>
          </div>

          <div
            className="liturgia-content prose max-w-none font-serif"
            style={{ fontSize: `${fontSize}px`, lineHeight: lineHeightValue }}
            dangerouslySetInnerHTML={{ __html: data.invitatorio.introHtml }}
          />

          {/* Selettore Salmo Invitatorio (Pillole) */}
          {data.invitatorio.psalms.length > 1 && (
            <div className="space-y-3 pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#aa9576] block">
                Scegli il Salmo Invitatorio:
              </span>
              <div className="flex flex-wrap gap-2">
                {data.invitatorio.psalms.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedInvIndex(idx)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
                    style={{
                      backgroundColor: selectedInvIndex === idx ? activeTabBg : inactiveTabBg,
                      color: selectedInvIndex === idx ? activeTabText : inactiveTabText,
                      border: `1px solid ${cardBorder}`,
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Testo del Salmo Invitatorio Scelto */}
              <div
                className="mt-3 p-4 rounded-2xl border transition"
                style={{
                  backgroundColor: isChurchMode ? "#181614" : "#fefefe",
                  borderColor: cardBorder,
                }}
              >
                <div
                  className="liturgia-content prose max-w-none font-serif"
                  style={{ fontSize: `${fontSize}px`, lineHeight: lineHeightValue }}
                  dangerouslySetInnerHTML={{
                    __html: data.invitatorio.psalms[selectedInvIndex]?.html || "",
                  }}
                />
              </div>
            </div>
          )}
        </section>
      )}

      {/* 2. INNO */}
      {data.innoHtml && (
        <section className="space-y-3 rounded-3xl p-5 sm:p-6 border shadow-xs" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <h3 className="font-serif font-bold text-base text-[#8c6d3f] border-b pb-2 flex items-center gap-2" style={{ borderColor: cardBorder }}>
            <span>🎵</span> INNO DEL GIORNO
          </h3>
          <div
            className="liturgia-content prose max-w-none font-serif"
            style={{ fontSize: `${fontSize}px`, lineHeight: lineHeightValue }}
            dangerouslySetInnerHTML={{ __html: data.innoHtml }}
          />
        </section>
      )}

      {/* 3. SALMODIA */}
      {data.salmodia.length > 0 && (
        <section className="space-y-4 rounded-3xl p-5 sm:p-6 border shadow-xs" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3" style={{ borderColor: cardBorder }}>
            <h3 className="font-serif font-bold text-base text-[#8c6d3f] flex items-center gap-2">
              <span>📖</span> SALMODIA DELLE LODI
            </h3>
            {isCompactView && (
              <span className="text-xs font-mono text-[#8a755d]">
                Salmo {selectedPsalmIndex + 1} di {data.salmodia.length}
              </span>
            )}
          </div>

          {isCompactView ? (
            /* Vista Compatta a Schede */
            <div className="space-y-4">
              {/* Schede Salmi */}
              <div className="flex flex-wrap gap-2">
                {data.salmodia.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedPsalmIndex(idx)}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer shadow-2xs"
                    style={{
                      backgroundColor: selectedPsalmIndex === idx ? activeTabBg : inactiveTabBg,
                      color: selectedPsalmIndex === idx ? activeTabText : inactiveTabText,
                      border: `1px solid ${cardBorder}`,
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Contenuto Salmo Selezionato */}
              <div
                className="p-4 sm:p-6 rounded-2xl border transition"
                style={{
                  backgroundColor: isChurchMode ? "#181614" : "#fefefe",
                  borderColor: cardBorder,
                }}
              >
                <div
                  className="liturgia-content prose max-w-none font-serif"
                  style={{ fontSize: `${fontSize}px`, lineHeight: lineHeightValue }}
                  dangerouslySetInnerHTML={{
                    __html: data.salmodia[selectedPsalmIndex]?.html || "",
                  }}
                />

                {/* Pulsante Navigazione Salmo Successivo */}
                {selectedPsalmIndex < data.salmodia.length - 1 && (
                  <div className="mt-6 pt-4 border-t flex justify-end" style={{ borderColor: cardBorder }}>
                    <button
                      type="button"
                      onClick={() => setSelectedPsalmIndex(selectedPsalmIndex + 1)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#5c4a37] hover:bg-[#4b3c2c] transition shadow-xs flex items-center gap-2 cursor-pointer"
                    >
                      <span>Prosegui al {data.salmodia[selectedPsalmIndex + 1]?.label}</span>
                      <span>➔</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Vista Continua Estesa */
            <div className="space-y-6">
              {data.salmodia.map((s) => (
                <div
                  key={s.id}
                  className="p-4 sm:p-5 rounded-2xl border"
                  style={{
                    backgroundColor: isChurchMode ? "#181614" : "#fefefe",
                    borderColor: cardBorder,
                  }}
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-[#aa9576] block mb-2">
                    {s.label}
                  </span>
                  <div
                    className="liturgia-content prose max-w-none font-serif"
                    style={{ fontSize: `${fontSize}px`, lineHeight: lineHeightValue }}
                    dangerouslySetInnerHTML={{ __html: s.html }}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Supporto alla Comprensione (Omelia/Meditazione AI) */}
      {renderSupportoComprensione()}

      {/* 4. PAROLA DI DIO: LETTURA BREVE & RESPONSORIO */}
      {data.parolaHtml && (
        <section className="space-y-3 rounded-3xl p-5 sm:p-6 border shadow-xs" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <h3 className="font-serif font-bold text-base text-[#8c6d3f] border-b pb-2 flex items-center gap-2" style={{ borderColor: cardBorder }}>
            <span>📜</span> PAROLA DI DIO & RESPONSORIO
          </h3>
          <div
            className="liturgia-content prose max-w-none font-serif"
            style={{ fontSize: `${fontSize}px`, lineHeight: lineHeightValue }}
            dangerouslySetInnerHTML={{ __html: data.parolaHtml }}
          />
        </section>
      )}

      {/* 5. CANTICO EVANGELICO (BENEDICTUS / MAGNIFICAT) */}
      {data.canticoEvangelicoHtml && (
        <section className="space-y-3 rounded-3xl p-5 sm:p-6 border shadow-xs" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <h3 className="font-serif font-bold text-base text-[#8c6d3f] border-b pb-2 flex items-center gap-2" style={{ borderColor: cardBorder }}>
            <span>🕊️</span> CANTICO EVANGELICO (BENEDICTUS)
          </h3>
          <div
            className="liturgia-content prose max-w-none font-serif"
            style={{ fontSize: `${fontSize}px`, lineHeight: lineHeightValue }}
            dangerouslySetInnerHTML={{ __html: data.canticoEvangelicoHtml }}
          />
        </section>
      )}

      {/* 6. INVOCAZIONI, PADRE NOSTRO E ORAZIONE FINALE */}
      {data.preghiereHtml && (
        <section className="space-y-3 rounded-3xl p-5 sm:p-6 border shadow-xs" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <h3 className="font-serif font-bold text-base text-[#8c6d3f] border-b pb-2 flex items-center gap-2" style={{ borderColor: cardBorder }}>
            <span>🙏</span> INVOCAZIONI & ORAZIONE CONCLUSIVA
          </h3>
          <div
            className="liturgia-content prose max-w-none font-serif"
            style={{ fontSize: `${fontSize}px`, lineHeight: lineHeightValue }}
            dangerouslySetInnerHTML={{ __html: data.preghiereHtml }}
          />
        </section>
      )}
    </div>
  );
}
