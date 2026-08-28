import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Audio-Cache in memoria (per servire all'istante lo stesso audio a tutta la comunità)
const audioCache: Record<string, { audioBase64: string; timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 60 * 48; // 48 ore

// Monitoraggio mensile dei crediti gratuiti (soglia di sicurezza: 950.000 caratteri rispetto al milione gratuito di Google)
const MONTHLY_FREE_CHAR_LIMIT = 950000;
let monthlyCharsUsed = 0;
let currentMonth = new Date().getMonth();

function resetMonthlyQuotaIfNewMonth() {
  const nowMonth = new Date().getMonth();
  if (nowMonth !== currentMonth) {
    currentMonth = nowMonth;
    monthlyCharsUsed = 0;
  }
}

// Mappatura voci neurali realistiche per lingua
const VOICE_MAP: Record<string, { languageCode: string; name: string; ssmlGender: string }> = {
  it: { languageCode: "it-IT", name: "it-IT-Neural2-C", ssmlGender: "MALE" },
  la: { languageCode: "it-IT", name: "it-IT-Neural2-C", ssmlGender: "MALE" }, // Pronuncia latina ecclesiastica perfetta
  en: { languageCode: "en-US", name: "en-US-Neural2-D", ssmlGender: "MALE" },
  es: { languageCode: "es-ES", name: "es-ES-Neural2-B", ssmlGender: "MALE" },
  fr: { languageCode: "fr-FR", name: "fr-FR-Neural2-B", ssmlGender: "MALE" },
  pt: { languageCode: "pt-PT", name: "pt-PT-Neural2-B", ssmlGender: "MALE" },
  ro: { languageCode: "ro-RO", name: "ro-RO-Wavenet-A", ssmlGender: "FEMALE" },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, lang = "it" } = body;

    if (!text || typeof text !== "string" || text.trim().length < 5) {
      return NextResponse.json({ fallback: true, message: "Testo non valido o troppo breve" });
    }

    const cleanText = text.trim();
    const voiceConfig = VOICE_MAP[lang] || VOICE_MAP.it;

    // Genera Hash univoco del testo per l'Audio-Cache
    const hashKey = crypto
      .createHash("sha256")
      .update(`${cleanText}_${voiceConfig.name}`)
      .digest("hex");

    // 1. Controlla se è già presente in Cache
    const cached = audioCache[hashKey];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        source: "cache",
        audioBase64: cached.audioBase64,
      });
    }

    // 2. Controlla crediti gratuiti mensili
    resetMonthlyQuotaIfNewMonth();
    if (monthlyCharsUsed + cleanText.length > MONTHLY_FREE_CHAR_LIMIT) {
      console.warn("Limite crediti gratuiti mensili raggiunto, fallback su voce del dispositivo.");
      return NextResponse.json({
        fallback: true,
        reason: "quota_exceeded",
        message: "Soglia mensile gratuita raggiunta. Utilizzo voce del dispositivo.",
      });
    }

    // 3. Verifica Chiave API (Google TTS o Gemini)
    const apiKey =
      process.env.GOOGLE_TTS_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        fallback: true,
        reason: "no_api_key",
        message: "Nessuna API Key Google TTS configurata. Utilizzo voce del dispositivo.",
      });
    }

    // 4. Chiamata a Google Cloud Text-to-Speech API
    const googleTtsUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
    const payload = {
      input: { text: cleanText },
      voice: voiceConfig,
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 0.95,
        pitch: -1.0,
      },
    };

    const res = await fetch(googleTtsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn("Google TTS API non disponibile o quota esaurita:", err);
      return NextResponse.json({
        fallback: true,
        reason: "api_error",
        message: "Fallback su voce del dispositivo.",
      });
    }

    const data = await res.json();
    if (!data.audioContent) {
      return NextResponse.json({ fallback: true });
    }

    // 5. Salva in Audio-Cache e aggiorna il contatore dei caratteri
    monthlyCharsUsed += cleanText.length;
    audioCache[hashKey] = {
      audioBase64: data.audioContent,
      timestamp: Date.now(),
    };

    return NextResponse.json({
      success: true,
      source: "google_neural",
      audioBase64: data.audioContent,
    });
  } catch (error: any) {
    console.error("Errore /api/tts:", error);
    return NextResponse.json({ fallback: true, error: error?.message });
  }
}
