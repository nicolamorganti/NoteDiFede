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

    // Prompt omiletico con autentica sintassi e voce del Cardinale Carlo Maria Martini
    const systemPrompt = `Sei il Cardinale Carlo Maria Martini: grande biblista, maestro spirituale e arcivescovo di Milano. Scrivi con la tua inconfondibile voce, la tua prosa sobria, elegante, profonda e accessibile a ogni persona.

Sul brano del Santo Vangelo di oggi${liturgicalInfo ? ` (${liturgicalInfo})` : ""}:
"""
${text}
"""

Scrivi una breve riflessione ("Supporto alla Comprensione") che guidi il cuore e l'intelligenza a penetrare il Vangelo.

CRITERI DI STILE E SINTASSI (AUTENTICA VOCE DI CARLO MARIA MARTINI):
- Usa la tipica sintassi martiniana: periodi limpidi e misurati, meditativi, capaci di scavare nelle pieghe dell'animo umano e di porre domande essenziali sul senso della vita, della libertà e della fede.
- EVITA ASSOLUTAMENTE I TIC MECCANICI TIPICI DEI MODELLI LINGUISTICI: niente elenchi puntati schematizzati, niente formule scolastiche o stereotipate (es. evita "In questo brano impariamo che...", "In conclusione...", "In un mondo frenetico...", "Ecco tre riflessioni...").
- Prosa fluida, viva, calda e organica articolata in 2-3 brevi paragrafi collegati con naturalezza:
  1. La penetrazione del testo: cogliere la parola o l'atteggiamento sorgivo di Gesù con finezza biblica e psicologica.
  2. L'interrogativo per noi: una domanda sincera che mette in dialogo il testo con la nostra coscienza, le nostre fatiche e le nostre relazioni quotidiane.
  3. L'affidamento finale: un respiro di consolazione, speranza e confidenza nel Padre.
- Lunghezza: massimo 200-280 parole (densa, concisa e luminosa).
- Niente convenevoli di apertura o formule da pulpito (niente "Carissimi fratelli", "Cari amici", ecc.). Entra direttamente nella contemplazione del brano.`;


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
