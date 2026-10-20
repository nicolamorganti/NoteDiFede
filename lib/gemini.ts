/**
 * Configurazione centralizzata e risoluzione dinamica dei modelli Google Gemini API per Note di Fede.
 *
 * Architettura della catena di fallback:
 * 1. Auto-discovery periodica (cache 6 ore) tramite GET /v1beta/models per rilevare automaticamente
 *    i nuovi modelli stabili della famiglia Flash (es. 3.8, 3.9, 4.x) ed escludere quelli ritirati.
 * 2. 'gemini-flash-latest' sempre in prima posizione per puntare al modello Flash di punta aggiornato.
 * 3. Subito dietro, i modelli 'gemini-X.Y-flash' chiamati singolarmente in ordine decrescente di versione,
 *    seguiti da 'gemini-flash-lite-latest' e dai modelli 'flash-lite' (ottimi durante picchi 503).
 * 4. Modelli deprecati o legacy (1.5, 2.0, 2.5) rigorosamente esclusi.
 * 5. Gestione anti-503: se 'gemini-flash-latest' fallisce per 503 (high demand) o timeout, il chiamante
 *    può saltare o posticipare il modello numerato corrispondente al latest per non bloccarsi due volte
 *    sullo stesso pool saturo.
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
];

const MODEL_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 ore

let cachedDynamicModels: string[] | null = null;
let lastModelsFetchTimestamp = 0;

interface GeminiApiModelEntry {
  name?: string;
  supportedGenerationMethods?: string[];
}

/**
 * Estrae il numero di versione (major * 100 + minor) da un nome modello come "gemini-3.8-flash"
 */
function parseFlashVersionScore(modelId: string): number {
  const match = modelId.match(/^gemini-(\d+)(?:\.(\d+))?-flash/);
  if (!match) return 0;
  const major = parseInt(match[1], 10);
  const minor = match[2] ? parseInt(match[2], 10) : 0;
  return major * 100 + minor;
}

/**
 * Verifica se un ID modello appartiene alla famiglia testuale/multimodale Gemini Flash (versione >= 3.0),
 * escludendo modelli specializzati (tts, image, live, transcribe, omni, embedding) o preview/exp instabili.
 */
function isEligibleStandardFlashModel(modelId: string): boolean {
  // Accetta esclusivamente gemini-<major>(.<minor>)-flash o gemini-<major>(.<minor>)-flash-lite
  const match = modelId.match(/^gemini-(\d+)(?:\.(\d+))?-flash(-lite)?$/);
  if (!match) return false;
  const major = parseInt(match[1], 10);
  // Escludi modelli legacy 1.x e 2.x (deprecati o ad accesso limitato)
  return major >= 3;
}

/**
 * Costruisce la catena ordinata a partire da una lista di ID modello scoperti:
 * 1. Eventuale GEMINI_MODEL custom da env
 * 2. 'gemini-flash-latest'
 * 3. Tutti i modelli 'gemini-X.Y-flash' standard in ordine decrescente di versione
 * 4. 'gemini-flash-lite-latest'
 * 5. Tutti i modelli 'gemini-X.Y-flash-lite' in ordine decrescente di versione
 */
function buildOrderedFlashChain(discoveredIds: string[]): string[] {
  const standardFlash: string[] = [];
  const liteFlash: string[] = [];

  for (const id of discoveredIds) {
    if (!isEligibleStandardFlashModel(id)) continue;
    if (id.endsWith("-flash-lite")) {
      liteFlash.push(id);
    } else {
      standardFlash.push(id);
    }
  }

  // Unisci anche i modelli statici noti (>= 3.x) nel caso non fossero paginati nella prima pagina
  for (const fallbackId of DEFAULT_GEMINI_CANDIDATE_MODELS) {
    if (!isEligibleStandardFlashModel(fallbackId)) continue;
    if (fallbackId.endsWith("-flash-lite")) {
      if (!liteFlash.includes(fallbackId)) liteFlash.push(fallbackId);
    } else {
      if (!standardFlash.includes(fallbackId)) standardFlash.push(fallbackId);
    }
  }

  standardFlash.sort((a, b) => parseFlashVersionScore(b) - parseFlashVersionScore(a));
  liteFlash.sort((a, b) => parseFlashVersionScore(b) - parseFlashVersionScore(a));

  const customModel = process.env.GEMINI_MODEL?.trim();
  const chain: string[] = [
    ...(customModel ? [customModel] : []),
    "gemini-flash-latest",
    ...standardFlash,
    "gemini-flash-lite-latest",
    ...liteFlash,
  ];

  return Array.from(new Set(chain.filter(Boolean)));
}

/**
 * Restituisce in modo sincrono la catena dei modelli (usando la cache dinamica se già popolata,
 * altrimenti il fallback statico aggiornato).
 */
export function getGeminiCandidateModels(): string[] {
  if (cachedDynamicModels && cachedDynamicModels.length > 0) {
    const customModel = process.env.GEMINI_MODEL?.trim();
    const list = customModel
      ? [customModel, ...cachedDynamicModels]
      : [...cachedDynamicModels];
    return Array.from(new Set(list.filter(Boolean)));
  }

  const customModel = process.env.GEMINI_MODEL?.trim();
  const list = customModel
    ? [customModel, ...DEFAULT_GEMINI_CANDIDATE_MODELS]
    : [...DEFAULT_GEMINI_CANDIDATE_MODELS];

  return Array.from(new Set(list.filter(Boolean)));
}

/**
 * Risolve dinamicamente la catena dei modelli interrogando l'API ufficiale Google Gemini (`models.list`)
 * con cache di 6 ore. Mantiene sempre `gemini-flash-latest` come primo modello, seguito dai singoli
 * modelli Flash attivi ordinati dal più recente al meno recente e dai modelli Flash-Lite.
 */
export async function resolveGeminiCandidateModels(apiKey?: string): Promise<string[]> {
  const key = apiKey || process.env.GEMINI_API_KEY;
  const now = Date.now();

  if (cachedDynamicModels && now - lastModelsFetchTimestamp < MODEL_CACHE_TTL_MS) {
    return getGeminiCandidateModels();
  }

  if (!key) {
    return getGeminiCandidateModels();
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?pageSize=100&key=${key}`,
      {
        method: "GET",
        next: { revalidate: 21600 }, // 6 ore di cache Next.js Data Cache
        signal: AbortSignal.timeout(3500),
      }
    );

    if (res.ok) {
      const data = (await res.json()) as { models?: GeminiApiModelEntry[] };
      if (Array.isArray(data.models) && data.models.length > 0) {
        const discoveredIds = data.models
          .filter(
            (m) =>
              typeof m.name === "string" &&
              (!Array.isArray(m.supportedGenerationMethods) ||
                m.supportedGenerationMethods.includes("generateContent"))
          )
          .map((m) => (m.name as string).replace(/^models\//, ""));

        const ordered = buildOrderedFlashChain(discoveredIds);
        if (ordered.length >= 3) {
          cachedDynamicModels = ordered;
          lastModelsFetchTimestamp = now;
          return getGeminiCandidateModels();
        }
      }
    }
  } catch {
    // In caso di timeout o errore di rete su models.list, usa silenziosamente la catena di fallback
  }

  return getGeminiCandidateModels();
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
 * generate dai modelli con capacità di thinking (Gemini 3.x).
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
