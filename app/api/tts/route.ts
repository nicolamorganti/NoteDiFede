import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { Communicate } from "edge-tts-universal";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Audio-Cache controllata in memoria (LRU con massimo 60 tracce per proteggere la memoria RAM)
const MAX_AUDIO_CACHE = 60;
const audioCache = new Map<string, { audioBase64: string; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 48; // 48 ore

function getCachedAudio(key: string): { audioBase64: string; timestamp: number } | undefined {
  return audioCache.get(key);
}

function setCachedAudio(key: string, audioBase64: string) {
  if (audioCache.has(key)) {
    audioCache.delete(key);
  } else if (audioCache.size >= MAX_AUDIO_CACHE) {
    const oldestKey = audioCache.keys().next().value;
    if (oldestKey) audioCache.delete(oldestKey);
  }
  audioCache.set(key, { audioBase64, timestamp: Date.now() });
}

// Mappatura voci neurali realistiche Microsoft Azure (Voce 100% nativa italiana pura, senza cambio di accento)
const VOICE_MAP: Record<string, { voice: string; rate: string; pitch: string }> = {
  it: { voice: "it-IT-DiegoNeural", rate: "-10%", pitch: "-6Hz" }, // 100% Italiano puro, tono basso, profondo e calmo
  la: { voice: "it-IT-DiegoNeural", rate: "-12%", pitch: "-6Hz" }, // Pronuncia latina ecclesiastica con dizione italiana perfetta
  en: { voice: "en-US-BrianNeural", rate: "-8%", pitch: "-4Hz" },
  es: { voice: "es-ES-AlvaroNeural", rate: "-8%", pitch: "-4Hz" },
  fr: { voice: "fr-FR-HenriNeural", rate: "-8%", pitch: "-4Hz" },
  pt: { voice: "pt-PT-DuarteNeural", rate: "-8%", pitch: "-4Hz" },
  ro: { voice: "ro-RO-EmilNeural", rate: "-8%", pitch: "-4Hz" },
};

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { allowed } = checkRateLimit(`${ip}:tts`, 30, 60000);
    if (!allowed) {
      return NextResponse.json(
        { fallback: true, message: "Troppe richieste vocali inviate. Attendi qualche istante." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { text, lang = "it" } = body;

    if (!text || typeof text !== "string" || text.trim().length < 5) {
      return NextResponse.json({ fallback: true, message: "Testo non valido o troppo breve" });
    }

    let cleanText = text
      .replace(/[*†☩#_~^=|\/\\<>]/g, " ")
      .replace(/\s*[-–—]{1,}\s*/g, ", ")
      .replace(/\s+/g, " ")
      .trim();

    if (cleanText.length < 5) {
      return NextResponse.json({ fallback: true, message: "Testo non valido o troppo breve" });
    }

    // Limite proporzionato alla liturgia (max 30.000 caratteri per letture liturgiche estese)
    if (cleanText.length > 30000) {
      return NextResponse.json(
        { fallback: true, message: "Testo troppo lungo per la sintesi vocale continua (massimo 30.000 caratteri)." },
        { status: 400 }
      );
    }

    const voiceConfig = VOICE_MAP[lang] || VOICE_MAP.it;

    // Genera Hash univoco del testo per l'Audio-Cache
    const hashKey = crypto
      .createHash("sha256")
      .update(`${cleanText}_${voiceConfig.voice}_${voiceConfig.rate}_${voiceConfig.pitch}`)
      .digest("hex");

    // 1. Controlla se è già presente in Cache Condivisa
    const cached = getCachedAudio(hashKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        source: "cache",
        voice: voiceConfig.voice,
        audioBase64: cached.audioBase64,
      });
    }

    // 2. Sintetizza con Voci Neurali HD di Microsoft Edge / Azure (Qualità Studio, zero costi)
    const communicate = new Communicate(cleanText, {
      voice: voiceConfig.voice,
      rate: voiceConfig.rate,
      pitch: voiceConfig.pitch,
    });

    const chunks: Buffer[] = [];
    for await (const chunk of communicate.stream()) {
      if (chunk.type === "audio" && chunk.data) {
        chunks.push(chunk.data);
      }
    }

    if (chunks.length === 0) {
      console.warn("Nessun chunk audio ricevuto da EdgeTTS, fallback su dispositivo.");
      return NextResponse.json({ fallback: true });
    }

    const fullAudioBuffer = Buffer.concat(chunks);
    const audioBase64 = fullAudioBuffer.toString("base64");

    // 3. Salva in Audio-Cache (LRU)
    setCachedAudio(hashKey, audioBase64);


    return NextResponse.json({
      success: true,
      source: "neural_hd",
      voice: voiceConfig.voice,
      audioBase64,
    });
  } catch (error: any) {
    console.error("Errore sintesi vocale neurale in /api/tts:", error);
    return NextResponse.json({ fallback: true, error: error?.message });
  }
}
