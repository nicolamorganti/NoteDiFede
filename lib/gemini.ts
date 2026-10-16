/**
 * Configurazione centralizzata dei modelli Google Gemini API per Note di Fede.
 * 
 * Regole applicate:
 * 1. Modelli deprecati rimossi (es. gemini-1.5-flash, gemini-2.0-flash non sono più supportati/attivi).
 * 2. 'gemini-flash-latest' sempre in prima posizione per garantire l'uso del modello più performante e aggiornato.
 * 3. Fallback a catena sui modelli stabili della serie Gemini 3 (3.8, 3.7, 3.6, 3.5), seguiti dai modelli Flash-Lite
 *    e dai modelli 2.5 mantenuti come compatibilità legacy.
 */

export const DEFAULT_GEMINI_CANDIDATE_MODELS: readonly string[] = [
  "gemini-flash-latest",
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-flash-lite-latest",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
];

/**
 * Restituisce l'elenco ordinato dei modelli Gemini da tentare per la generazione di contenuti.
 * Se è impostata la variabile d'ambiente GEMINI_MODEL, questa viene anteposta come prima scelta assoluta,
 * seguita immediatamente da 'gemini-flash-latest' e dagli altri modelli stabili.
 */
export function getGeminiCandidateModels(): string[] {
  const customModel = process.env.GEMINI_MODEL?.trim();
  const list = customModel
    ? [customModel, ...DEFAULT_GEMINI_CANDIDATE_MODELS]
    : [...DEFAULT_GEMINI_CANDIDATE_MODELS];

  // Rimozione duplicati mantenendo l'ordine di priorità
  return Array.from(new Set(list.filter(Boolean)));
}

export interface GeminiPart {
  text?: string;
  thought?: boolean;
  [key: string]: unknown;
}

export interface GeminiCandidate {
  content?: {
    parts?: GeminiPart[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Estrae il testo generato da un candidate Gemini scartando le parti di pensiero (reasoning/thought tokens)
 * generate dai modelli con capacità di thinking (Gemini 2.5 e Gemini 3.x).
 */
export function extractGeminiCandidateText(candidate: GeminiCandidate | null | undefined): string | null {
  if (!candidate || !candidate.content || !Array.isArray(candidate.content.parts)) {
    return null;
  }

  // Concatena tutte le parti testuali non marcate come thought/reasoning
  const nonThoughtParts = candidate.content.parts
    .filter((p): p is GeminiPart & { text: string } => !p.thought && typeof p.text === "string")
    .map((p) => p.text)
    .join("");

  if (nonThoughtParts && nonThoughtParts.trim().length > 0) {
    return nonThoughtParts.trim();
  }

  // Fallback di sicurezza su prima parte testuale se disponibile
  const firstText = candidate.content.parts.find((p) => typeof p.text === "string")?.text;
  return firstText?.trim() || null;
}
