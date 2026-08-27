import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, liturgicalInfo, rite, date } = body;

    if (!text || text.trim().length < 20) {
      return NextResponse.json(
        { error: "Testo del Vangelo non disponibile o insufficiente per generare la riflessione." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Chiave API di Gemini non configurata. Aggiungi GEMINI_API_KEY nelle variabili d'ambiente di Vercel.",
        },
        { status: 500 }
      );
    }

    // Prompt omiletico e di comprensione in stile Cardinale Carlo Maria Martini
    const systemPrompt = `Sei un maestro spirituale, biblista e predicatore nello stile inconfondibile del Cardinale Carlo Maria Martini (grande arcivescovo di Milano e biblista): limpido, profondo, essenziale, sapienziale e capace di toccare direttamente la vita di ogni persona.

Sul brano del Santo Vangelo del giorno${liturgicalInfo ? ` (${liturgicalInfo})` : ""}:
"""
${text}
"""

Scrivi una breve riflessione strutturata e profonda ("Supporto alla Comprensione") in perfetto stile omelia del Cardinale Carlo Maria Martini.

REGOLE FONDAMENTALI:
- Lunghezza: massimo 200-300 parole (sintetica, densa e luminosa).
- NON iniziare con saluti formali o convenevoli (evita "Fratelli e sorelle", "Cari amici", ecc.). Entra subito nel vivo.
- Tono: sobrio, caloroso, evangelico, usando un "noi" accogliente che interpella la libertà e la speranza di chi ascolta.
- Articolazione essenziale in 3 brevi nuclei:
  1. 📖 **Il cuore del Vangelo**: la parola-chiave o l'incontro centrale del testo.
  2. 💡 **La luce per la nostra vita**: una domanda viva per la nostra quotidianità, il discernimento e le relazioni.
  3. 🕊️ **Una parola di speranza**: un breve affidamento orante conclusivo.

Formatta la risposta in chiaro Markdown con paragrafi puliti.`;

    // Catena completa dei modelli Gemini (gemini-flash-latest come primo)
    const candidateModels = [
      process.env.GEMINI_MODEL,
      "gemini-flash-latest",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash",
      "gemini-1.5-flash-8b",
      "gemini-2.5-pro",
      "gemini-1.5-pro-latest",
      "gemini-1.5-pro",
    ].filter(Boolean) as string[];

    const geminiPayload = {
      contents: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.65,
        maxOutputTokens: 2048,
      },
    };

    let lastError = "";
    let generatedText: string | null = null;
    let usedModel = "";

    for (const model of candidateModels) {
      const controller = new AbortController();
      // 20 secondi di timeout per modello
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const apiResponse = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(geminiPayload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (apiResponse.ok) {
          const data = await apiResponse.json();
          generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || null;
          if (generatedText) {
            usedModel = model;
            break;
          }
        } else {
          const errBody = await apiResponse.text();
          lastError = `[${model}] HTTP ${apiResponse.status}: ${errBody}`;
          console.warn(`Tentativo modello ${model} fallito per omelia, passo al successivo:`, lastError);
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === "AbortError") {
          lastError = `[${model}] Timeout 20s superato`;
        } else {
          lastError = `[${model}] ${err.message || String(err)}`;
        }
        console.warn(`Eccezione modello ${model} per omelia, passo al successivo:`, lastError);
      }
    }

    if (!generatedText) {
      return NextResponse.json(
        {
          error:
            "Impossibile generare il supporto alla comprensione al momento. Riprova tra poco.",
          details: lastError,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      liturgicalInfo,
      date,
      rite,
      omelia: generatedText,
      model: usedModel,
    });
  } catch (error: any) {
    console.error("Errore server Omelia/Comprensione Vangelo:", error);
    return NextResponse.json(
      { error: error.message || "Errore interno durante l'elaborazione del supporto alla comprensione." },
      { status: 500 }
    );
  }
}
