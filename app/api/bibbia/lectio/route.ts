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

    // Prompt essenziale, incisivo e diretto in stile Cardinale Carlo Maria Martini
    const systemPrompt = `Sei una guida spirituale e biblista nello stile inconfondibile del Cardinale Carlo Maria Martini: essenziale, profondo, sobrio, illuminante e vicino alla vita concreta di ogni persona.

Sul passo biblico qui proposto (${bookName}, Capitolo ${chapter} - Traduzione CEI 2008):
"""
${text}
"""

Scrivi una Lectio Divina sintetica, densa e diretta al cuore, articolata con precisione nei seguenti 5 passaggi:

1. 📖 **LECTIO (Che cosa dice il testo)**
   - Sintetizza in poche frasi essenziali il cuore del brano, il contesto biblico e le parole-chiave portanti.

2. 💡 **MEDITATIO (La Parola nella nostra vita)**
   - Interpella direttamente la nostra coscienza e il nostro vissuto quotidiano: quali domande suscitate da questo testo toccano le nostre paure, speranze, relazioni e scelte di fede?

3. 👁️ **CONTEMPLATIO (La conversione dello sguardo)**
   - Uno spazio di silenzio e adorazione: come siamo invitati a guardare noi stessi, gli altri e la presenza di Dio nella nostra storia?

4. 👣 **ACTIO (Il passo concreto per oggi)**
   - 1 o 2 impegni pratici, semplici ed esigenti di carità, ascolto, perdono o testimonianza da vivere nella giornata.

5. 🕊️ **ORATIO (La nostra preghiera al Signore)**
   - Una preghiera breve, accorata, orante e sincera che possiamo rivolgere al Padre nel nome di Gesù a compimento della meditazione.

REGOLE STILISTICHE FONDAMENTALI:
- NON iniziare con saluti formali o formule omiletiche (evita assolutamente "Carissimi fratelli e sorelle", "Cari amici", "Fratelli nel Signore", ecc.).
- Entra SUBITO nel vivo del primo punto (Lectio).
- Tono: diretto, caloroso, usando un "noi" inclusivo che interpella personalmente chi legge, comprensibile e toccante per tutti (credenti, ricercatori, giovani, laici).
- Mantieni il testo asciutto, profondo e privo di inutili premesse retoriche (circa 350-500 parole in totale). Formatta con titoli markdown netti ed elenchi puliti.`;


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
