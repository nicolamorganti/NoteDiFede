import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookName, chapter, text } = body;

    if (!bookName || !text) {
      return NextResponse.json(
        { error: "Testo biblico o informazioni sul libro mancanti." },
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

    // Prompt raffinato in stile Cardinale Carlo Maria Martini
    const systemPrompt = `Sei un maestro spirituale e biblista cattolico, profondo conoscitore della Sacra Scrittura e della tradizione ecclesiale, nello stile sobrio, profondo, accogliente e contemplativo del Cardinale Carlo Maria Martini (grande arcivescovo di Milano e biblista).

Sul passo della Sacra Bibbia qui proposto (${bookName}, Capitolo ${chapter} - Traduzione CEI 2008):
"""
${text}
"""

Scrivi una Lectio Divina completa, profonda e accessibile a tutti, articolata con chiarezza nell'ordine esatto dei seguenti 5 momenti:

1. 📖 **LECTIO (Che cosa dice il testo in sé?)**:
   - Spiegazione essenziale del contesto, delle parole-chiave e dei passaggi fondamentali del brano.

2. 💡 **MEDITATIO (Che cosa dice il testo a noi oggi?)**:
   - Riflessione per la nostra vita, le domande del cuore, il discernimento quotidiano, la fiducia e il rapporto con Dio e i fratelli.

3. 👁️ **CONTEMPLATIO (Quale conversione dello sguardo ci dona il Signore?)**:
   - Uno spazio di silenzio interiore, adorazione e contemplazione dell'opera di Dio nella nostra storia.

4. 👣 **ACTIO (Quale passo concreto siamo chiamati a compiere?)**:
   - Un'indicazione pratica di carità, speranza, riconciliazione o testimonianza per la giornata.

5. 🕊️ **ORATIO (Che cosa diciamo noi al Signore in risposta alla sua Parola?)**:
   - Una preghiera accorata, calda, orante e filiale da rivolgere a Dio Padre nel nome di Gesù a compimento del cammino.

Usa uno stile caldo, evangelico, limpido e meditativo in perfetto stile Cardinale Carlo Maria Martini. Formatta la risposta in chiaro Markdown con titoli e paragrafi ben scanditi.`;

    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const geminiPayload = {
      contents: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.65,
        maxOutputTokens: 8192,
      },
    };

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    // Timeout di 15 secondi per la chiamata a Google
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000);

    const apiResponse = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      console.error(`Errore API Gemini (${apiResponse.status}):`, errText);

      if (apiResponse.status === 429) {
        return NextResponse.json(
          {
            error:
              "Limite temporaneo di richieste Google raggiunto (Too Many Requests / Quota 429). Attendi 20-30 secondi e riprova.",
          },
          { status: 429 }
        );
      }

      if (apiResponse.status === 403 || apiResponse.status === 401) {
        return NextResponse.json(
          {
            error:
              "Chiave API di Gemini non autorizzata o non valida. Verifica la configurazione su Google AI Studio.",
          },
          { status: 403 }
        );
      }

      if (apiResponse.status === 404) {
        return NextResponse.json(
          {
            error: `Il modello ${modelName} non è disponibile con questa chiave API. Prova con gemini-2.5-flash.`,
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: `Errore dalle API di Gemini: ${apiResponse.status} ${apiResponse.statusText}` },
        { status: 502 }
      );
    }

    const data = await apiResponse.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || null;

    if (!generatedText) {
      return NextResponse.json(
        { error: "Nessun testo generato dal modello Gemini per questo capitolo." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      bookName,
      chapter,
      lectio: generatedText,
      model: modelName,
    });
  } catch (error: any) {
    console.error("Errore server Lectio Divina:", error);
    if (error.name === "AbortError") {
      return NextResponse.json(
        { error: "La richiesta ha impiegato troppo tempo (timeout 18s). Riprova tra poco." },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Errore interno durante la generazione della Lectio Divina." },
      { status: 500 }
    );
  }
}
