"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { verifyUserRole } from "@/lib/supabase/server";
import { autoLinkPsalmFile } from "@/app/(dashboard)/canti/actions";

export type MassFormState = {
  error: string | null;
  success: string | null;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableString(value: string) {
  return value.length > 0 ? value : null;
}

// 1. Crea una nuova messa
export async function createMassAction(
  _previousState: MassFormState,
  formData: FormData,
): Promise<MassFormState> {
  const { error: authError } = await verifyUserRole(["maestro", "responsabile"]);
  if (authError) {
    return { error: authError, success: null };
  }

  const title = readString(formData, "title");
  const liturgicalYear = readString(formData, "liturgicalYear");
  const celebrationDate = readString(formData, "celebrationDate");
  const notes = readString(formData, "notes");


  if (!title || !liturgicalYear || !celebrationDate) {
    return {
      error: "Titolo, Anno Liturgico e Data Celebrazione sono obbligatori.",
      success: null,
    };
  }

  const adminSupabase = createAdminSupabaseClient();
  const { error } = await adminSupabase.from("masses").insert({
    title,
    liturgical_year: liturgicalYear,
    celebration_date: celebrationDate,
    notes: nullableString(notes),
  });

  if (error) {
    console.error("Errore salvataggio Messa:", error);
    return {
      error: "Impossibile salvare la celebrazione liturgica su Supabase.",
      success: null,
    };
  }

  revalidatePath("/messe");

  return {
    error: null,
    success: `Celebrazione "${title}" creata con successo!`,
  };
}

// 2. Modifica una messa
export async function updateMassAction(
  _previousState: MassFormState,
  formData: FormData,
): Promise<MassFormState> {
  const { error: authError } = await verifyUserRole(["maestro", "responsabile"]);
  if (authError) {
    return { error: authError, success: null };
  }

  const id = readString(formData, "massId");
  const title = readString(formData, "title");
  const liturgicalYear = readString(formData, "liturgicalYear");
  const celebrationDate = readString(formData, "celebrationDate");
  const notes = readString(formData, "notes");

  if (!id || !title || !liturgicalYear || !celebrationDate) {
    return {
      error: "Tutti i campi principali sono richiesti per la modifica.",
      success: null,
    };
  }

  const adminSupabase = createAdminSupabaseClient();
  const { error } = await adminSupabase
    .from("masses")
    .update({
      title,
      liturgical_year: liturgicalYear,
      celebration_date: celebrationDate,
      notes: nullableString(notes),
    })
    .eq("id", id);

  if (error) {
    console.error("Errore aggiornamento Messa:", error);
    return {
      error: "Impossibile salvare le modifiche su Supabase.",
      success: null,
    };
  }

  revalidatePath("/messe");
  revalidatePath(`/messe/${id}`);

  return {
    error: null,
    success: "Celebrazione liturgica modificata correttamente.",
  };
}

// 3. Elimina una messa
export async function deleteMassAction(
  _previousState: MassFormState,
  formData: FormData,
): Promise<MassFormState> {
  const { error: authError } = await verifyUserRole(["maestro", "responsabile"]);
  if (authError) {
    return { error: authError, success: null };
  }

  const id = readString(formData, "massId");

  if (!id) {
    return {
      error: "ID della celebrazione non valido per l'eliminazione.",
      success: null,
    };
  }

  const adminSupabase = createAdminSupabaseClient();
  const { error } = await adminSupabase.from("masses").delete().eq("id", id);

  if (error) {
    console.error("Errore eliminazione Messa:", error);
    return {
      error: "Impossibile eliminare la celebrazione dal database.",
      success: null,
    };
  }

  revalidatePath("/messe");

  return {
    error: null,
    success: "Celebrazione liturgica eliminata correttamente.",
  };
}

// 4. Associa un canto a un momento della messa
export async function addSongToMassAction(
  _previousState: MassFormState,
  formData: FormData,
): Promise<MassFormState> {
  const { error: authError } = await verifyUserRole(["maestro", "responsabile"]);
  if (authError) {
    return { error: authError, success: null };
  }

  const massId = readString(formData, "massId");
  const songId = readString(formData, "songId");
  const momentId = readString(formData, "momentId");

  if (!massId || !songId || !momentId) {
    return {
      error: "Dati incompleti per associare il canto alla celebrazione.",
      success: null,
    };
  }

  const adminSupabase = createAdminSupabaseClient();

  // Verifica se il canto è già associato a questo specifico momento della messa
  const { data: existingAssociation } = await adminSupabase
    .from("mass_songs")
    .select("id")
    .eq("mass_id", massId)
    .eq("moment_id", momentId)
    .eq("song_id", songId)
    .maybeSingle();

  if (existingAssociation) {
    return {
      error: "Questo canto è già presente in questo momento liturgico.",
      success: null,
    };
  }

  // Trova la posizione massima corrente per questo momento per inserire in coda
  const { data: positionData } = await adminSupabase
    .from("mass_songs")
    .select("position")
    .eq("mass_id", massId)
    .eq("moment_id", momentId)
    .order("position", { ascending: false })
    .limit(1);

  const maxPosition = positionData && positionData.length > 0 ? positionData[0].position : 0;
  const newPosition = maxPosition + 1;

  const { error } = await adminSupabase.from("mass_songs").insert({
    mass_id: massId,
    song_id: songId,
    moment_id: momentId,
    position: newPosition,
  });

  if (error) {
    console.error("Errore inserimento mass_song:", error);
    return {
      error: "Impossibile associare il canto a questo momento. Controlla che la posizione sia libera.",
      success: null,
    };
  }

  revalidatePath(`/messe/${massId}`);
  revalidatePath(`/messe/${massId}/modifica`);

  return {
    error: null,
    success: "Canto associato correttamente.",
  };
}

// 5. Rimuove un canto associato alla messa
export async function removeSongFromMassAction(
  _previousState: MassFormState,
  formData: FormData,
): Promise<MassFormState> {
  const { error: authError } = await verifyUserRole(["maestro", "responsabile"]);
  if (authError) {
    return { error: authError, success: null };
  }

  const massSongId = readString(formData, "massSongId");
  const massId = readString(formData, "massId");


  if (!massSongId || !massId) {
    return {
      error: "Informazioni insufficienti per rimuovere il canto.",
      success: null,
    };
  }

  const adminSupabase = createAdminSupabaseClient();
  const { error } = await adminSupabase
    .from("mass_songs")
    .delete()
    .eq("id", massSongId);

  if (error) {
    console.error("Errore eliminazione mass_song:", error);
    return {
      error: "Impossibile rimuovere il canto da questo momento.",
      success: null,
    };
  }

  revalidatePath(`/messe/${massId}`);
  revalidatePath(`/messe/${massId}/modifica`);

  return {
    error: null,
    success: "Canto rimosso correttamente dalla celebrazione.",
  };
}

// 6. Analizza l'immagine di una celebrazione tramite Gemini API
export async function parseMassImageAction(formData: FormData) {
  const { error: authError } = await verifyUserRole(["maestro", "responsabile"]);
  if (authError) {
    return { error: authError, data: null };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { error: "Nessun file immagine caricato.", data: null };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { error: "Chiave API di Gemini non configurata. Aggiungi GEMINI_API_KEY in .env.local", data: null };
  }

  try {
    // Leggi il file come arrayBuffer e converti in base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const prompt = `Sei un esperto di liturgia cattolica (rito ambrosiano) e canti liturgici. Analizza con massima precisione questa immagine di un foglietto liturgico manoscritto o stampato.
Estrai i dettagli della celebrazione nel seguente formato JSON:
{
  "title": "Titolo della celebrazione (es. III dopo il Martirio di San Giovanni, IV dopo Pentecoste, Messa di Pasqua)",
  "liturgicalYear": "A" o "B" o "C" (anno liturgico, se indicato o deducibile, default "A"),
  "celebrationDate": "Data della celebrazione in formato YYYY-MM-DD (se indicata o deducibile, es. 2026-09-13)",
  "notes": "Eventuali annotazioni generali o avvisi per la celebrazione",
  "moments": [
    {
      "momentName": "Nome del momento liturgico standard",
      "songs": [
        {
          "title": "Titolo del canto (es. Grandi Cose, Pane Vivo, Cantiamo Te)",
          "code": "Codice numerico del catalogo/foglietto se indicato (es. '135/74', '7/22', '15', '283', o null)",
          "alternateCode": "Codice alternativo se indicato (es. '114', o null)",
          "notes": "Annotazioni specifiche (es. 'Cantato inizio e fine', 'Strofa letta', 'Come da foglietto', 'Si parte dalla strofa')"
        }
      ]
    }
  ]
}

Regole importanti per i nomi dei momenti liturgici (Rito Ambrosiano):
Mappa i momenti liturgici presenti nel foglietto esattamente ai seguenti nomi standard della tabella mass_moments:
- 'Ingresso' (su foglietto: 'ALL\\'INGRESSO', 'INGRESSO')
- 'Gloria' (su foglietto: 'GLORIA')
- 'Salmo' (su foglietto: 'SALMO', 'SALMO RESPONSORIALE')
- 'Canto al Vangelo' (su foglietto: 'AL VANGELO', 'ALLELUIA')
- 'Dopo il Vangelo' (su foglietto: 'DOPO VANGELO', 'DOPO IL VANGELO' - se indicato 'LETTO' o vuoto, lascia l'array songs vuoto [])
- 'Offertorio' (su foglietto: 'OFFERTORIO')
- 'Santo' (su foglietto: 'SANTO' - se vuoto, barrato con '/' o non specificato, indica titolo 'Santo (Belli)')
- 'Mistero della Fede' (su foglietto: 'MISTERO DELLA FEDE', 'ANNUNCIAMO')
- 'Spezzare del Pane' (su foglietto: 'SPEZZARE DEL PANE', 'FRAZIONE DEL PANE')
- 'Comunione' (su foglietto: 'COMUNIONE')
- 'Finale' (su foglietto: 'FINE', 'FINALE')
(Altri momenti opzionali se presenti: 'Aspersione', 'Atto Penitenziale', 'Amen', 'Agnello di Dio (Agnus Dei)', 'Padre Nostro', 'Canto al Battesimo').

Regole speciali di trascrizione per canti e note:
1. GLORIA: se trovi scritto 'Cantato inizio e fine' (o simile), il titolo del canto è 'Gloria Zanella' e la nota è 'Cantato inizio e fine'.
2. SANTO: se vuoto, barrato con '/' o assente, il titolo del canto è 'Santo (Belli)'.
3. MISTERO DELLA FEDE: se trovi scritto 'ANNUNCIAMO', estrai titolo 'Annunciamo'.
4. SPEZZARE DEL PANE: se trovi scritto ad es. 'COME DA FOGLIETTO "CANTIAMO TE"', estrai titolo 'Cantiamo Te' e nota 'Come da foglietto'.
5. COMUNIONE: se trovi ad es. 'PANE VIVO - COME DA FOGLIETTO', estrai titolo 'Pane Vivo' e nota 'Come da foglietto'.
6. Non confondere le note di esecuzione ('Come da foglietto', 'Strofa letta', 'Si parte dalla strofa') con il titolo del canto.
7. Se ci sono canti alternativi o molteplici per lo stesso momento (es. 'oppure', 'o'), inseriscili come elementi separati nell'array 'songs'.
Restituisci esclusivamente il JSON valido senza markdown aggiuntivo.`;

    // Catena aggiornata e verificata dei modelli Gemini con supporto multimodale Vision per OCR
    const candidateModels = [
      process.env.GEMINI_MODEL,
      "gemini-flash-latest",
      "gemini-3.7-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash",
      "gemini-2.5-flash",
      "gemini-flash-lite-latest",
      "gemini-3.1-flash-lite",
    ].filter(Boolean) as string[];




    let textOutput: string | null = null;
    let lastError = "";

    for (const model of candidateModels) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      try {
        const apiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    {
                      inlineData: {
                        mimeType: file.type || "image/jpeg",
                        data: base64,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: "application/json",
              },
            }),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (apiResponse.ok) {
          const resJson = await apiResponse.json();
          textOutput = resJson.candidates?.[0]?.content?.parts?.[0]?.text || null;
          if (textOutput) {
            break;
          }
        } else {
          const errBody = await apiResponse.text();
          lastError = `[${model}] HTTP ${apiResponse.status}: ${errBody}`;
          console.warn(`Tentativo modello ${model} fallito per OCR messa, passo al successivo:`, lastError);
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === "AbortError") {
          lastError = `[${model}] Timeout 25s superato`;
        } else {
          lastError = `[${model}] ${err.message || String(err)}`;
        }
        console.warn(`Eccezione modello ${model} per OCR messa, passo al successivo:`, lastError);
      }
    }

    if (!textOutput) {
      return { error: `Impossibile elaborare l'immagine con i modelli Gemini al momento. Riprova tra poco. (Dettagli: ${lastError})`, data: null };
    }

    const parsedData = JSON.parse(textOutput.trim());


    // Riconciliamo i canti con il database
    const adminSupabase = createAdminSupabaseClient();
    
    // Recuperiamo i momenti standard per validazione
    const { data: dbMoments } = await adminSupabase
      .from("mass_moments")
      .select("id, name, sort_order")
      .order("sort_order", { ascending: true });

    // Recuperiamo il catalogo dei canti per un matching rapido ed efficace
    const { data: allSongs } = await adminSupabase
      .from("songs")
      .select("id, title, code, alternate_title");

    const songsCatalog = allSongs || [];
    const validMoments = dbMoments || [];

    // Troviamo i canti di default richiesti
    const gloriaZanellaSong = songsCatalog.find((s) => s.title.toLowerCase().includes("zanella"));
    const santoBelliSong = songsCatalog.find((s) => {
      const t = s.title.toLowerCase();
      return t.includes("santo") && t.includes("belli");
    });

    // Mappatore/normalizzatore robusto dei momenti per il Rito Ambrosiano
    const findMatchingMoment = (rawMomentName: string) => {
      if (!rawMomentName) return null;
      const clean = rawMomentName.trim().toLowerCase();

      const exact = validMoments.find((m) => m.name.toLowerCase() === clean);
      if (exact) return exact;

      if (clean.includes("ingresso")) return validMoments.find((m) => m.name.toLowerCase() === "ingresso") || null;
      if (clean.includes("aspersione")) return validMoments.find((m) => m.name.toLowerCase() === "aspersione") || null;
      if (clean.includes("gloria")) return validMoments.find((m) => m.name.toLowerCase() === "gloria") || null;
      if (clean.includes("salmo")) return validMoments.find((m) => m.name.toLowerCase() === "salmo") || null;
      if (clean.includes("dopo vangelo") || clean.includes("dopo il vangelo")) {
        return validMoments.find((m) => m.name.toLowerCase() === "dopo il vangelo") || null;
      }
      if (clean.includes("vangelo") || clean.includes("alleluia")) {
        return validMoments.find((m) => m.name.toLowerCase() === "canto al vangelo") || null;
      }
      if (clean.includes("offertorio")) return validMoments.find((m) => m.name.toLowerCase() === "offertorio") || null;
      if (clean.includes("santo")) return validMoments.find((m) => m.name.toLowerCase() === "santo") || null;
      if (clean.includes("mistero") || clean.includes("fede") || clean.includes("memoriale") || clean.includes("annunciamo")) {
        return validMoments.find((m) => m.name.toLowerCase() === "mistero della fede") || null;
      }
      if (clean.includes("amen") || clean.includes("dossologia")) {
        return validMoments.find((m) => m.name.toLowerCase() === "amen") || null;
      }
      if (clean.includes("spezzare") || clean.includes("frazione")) {
        return validMoments.find((m) => m.name.toLowerCase() === "spezzare del pane") || null;
      }
      if (clean.includes("agnello") || clean.includes("agnus")) {
        return validMoments.find((m) => m.name.toLowerCase().includes("agnello")) || null;
      }
      if (clean.includes("padre nostro")) return validMoments.find((m) => m.name.toLowerCase() === "padre nostro") || null;
      if (clean.includes("comunione")) return validMoments.find((m) => m.name.toLowerCase() === "comunione") || null;
      if (clean.includes("fine") || clean.includes("finale") || clean.includes("congedo")) {
        return validMoments.find((m) => m.name.toLowerCase() === "finale") || null;
      }
      if (clean.includes("battesimo")) return validMoments.find((m) => m.name.toLowerCase().includes("battesimo")) || null;

      return null;
    };

    // Funzione intelligente di matching del canto nel catalogo
    const matchSongInCatalog = (
      rawTitle: string,
      rawCode: string | null,
      rawNotes: string | null,
      momentName: string
    ) => {
      const norm = (str: string | null | undefined) =>
        (str || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

      const cleanTitle = norm(rawTitle);
      const cleanNotes = norm(rawNotes);
      const cleanMoment = norm(momentName);

      // Regola 1: Gloria Zanella
      if (
        cleanMoment.includes("gloria") &&
        (cleanNotes.includes("inizio e fine") || cleanTitle.includes("inizio e fine") || cleanTitle.includes("zanella"))
      ) {
        if (gloriaZanellaSong) return gloriaZanellaSong;
      }

      // Regola 2: Santo (Belli)
      if (
        cleanMoment.includes("santo") &&
        (!cleanTitle || cleanTitle === "letto" || cleanTitle === "santo" || cleanTitle.includes("belli"))
      ) {
        if (santoBelliSong) return santoBelliSong;
      }

      if (!cleanTitle && !rawCode) return null;

      // 1. Titolo esatto
      if (cleanTitle) {
        const exact = songsCatalog.find(
          (s) => norm(s.title) === cleanTitle || (s.alternate_title && norm(s.alternate_title) === cleanTitle)
        );
        if (exact) return exact;
      }

      const codeNum = rawCode ? rawCode.match(/\d+/)?.[0] : null;

      // 2. Sia codice che parole del titolo corrispondono
      if (codeNum && cleanTitle) {
        const both = songsCatalog.find((s) => {
          const sNum = (s.code || "").match(/\d+/)?.[0];
          return sNum === codeNum && (norm(s.title).includes(cleanTitle) || cleanTitle.includes(norm(s.title)));
        });
        if (both) return both;
      }

      // 3. Corrispondenza codice numerico
      if (codeNum) {
        const codeMatches = songsCatalog.filter((s) => (s.code || "").match(/\d+/)?.[0] === codeNum);
        if (codeMatches.length === 1) return codeMatches[0];
        if (codeMatches.length > 1 && cleanTitle) {
          const withTitle = codeMatches.find(
            (s) => norm(s.title).includes(cleanTitle) || cleanTitle.includes(norm(s.title))
          );
          if (withTitle) return withTitle;
        }
      }

      // 4. Prefisso del titolo
      if (cleanTitle && cleanTitle.length >= 3) {
        const starts = songsCatalog.find((s) => norm(s.title).startsWith(cleanTitle));
        if (starts) return starts;
      }

      // 5. Sottostringa del titolo
      if (cleanTitle && cleanTitle.length >= 4) {
        const sub = songsCatalog.find(
          (s) => norm(s.title).includes(cleanTitle) || (cleanTitle.length > 5 && cleanTitle.includes(norm(s.title)))
        );
        if (sub) return sub;
      }

      // 6. Sottostringa in alternate_title
      if (cleanTitle && cleanTitle.length >= 4) {
        const alt = songsCatalog.find((s) => s.alternate_title && norm(s.alternate_title).includes(cleanTitle));
        if (alt) return alt;
      }

      return null;
    };

    const processedMomentsMap = new Map<string, {
      momentId: string;
      momentName: string;
      sortOrder: number;
      songs: any[];
    }>();

    if (parsedData.moments && Array.isArray(parsedData.moments)) {
      for (const rawMoment of parsedData.moments) {
        const matchedMoment = findMatchingMoment(rawMoment.momentName);
        if (!matchedMoment) {
          continue;
        }

        const songsList: any[] = [];
        if (rawMoment.songs && Array.isArray(rawMoment.songs)) {
          for (const rawSong of rawMoment.songs) {
            let songTitle = rawSong.title || "";
            let songNotes = rawSong.notes || null;

            // Se Gloria contiene "Cantato inizio e fine" nel titolo o nelle note
            const isGloria = matchedMoment.name.toLowerCase() === "gloria";
            if (
              isGloria &&
              ((songTitle && songTitle.toLowerCase().includes("inizio e fine")) ||
                (songNotes && songNotes.toLowerCase().includes("inizio e fine")))
            ) {
              songTitle = gloriaZanellaSong ? gloriaZanellaSong.title : "Gloria Zanella";
              if (!songNotes || !songNotes.toLowerCase().includes("inizio e fine")) {
                songNotes = "Cantato inizio e fine";
              }
            }

            const matched = matchSongInCatalog(songTitle, rawSong.code, songNotes, matchedMoment.name);

            songsList.push({
              title: matched ? matched.title : songTitle,
              code: rawSong.code || (matched ? matched.code : null),
              alternateCode: rawSong.alternateCode || null,
              notes: songNotes,
              matchedSongId: matched ? matched.id : null,
              matchedTitle: matched ? matched.title : null,
              matchedCode: matched ? matched.code : null,
            });
          }
        }

        processedMomentsMap.set(matchedMoment.id, {
          momentId: matchedMoment.id,
          momentName: matchedMoment.name,
          sortOrder: matchedMoment.sort_order,
          songs: songsList,
        });
      }
    }

    // Regola Santo di default se vuoto, assente o barrato
    const santoDb = validMoments.find((m) => m.name.toLowerCase() === "santo");
    if (santoDb) {
      const existingSanto = processedMomentsMap.get(santoDb.id);
      const isSantoEmpty =
        !existingSanto ||
        existingSanto.songs.length === 0 ||
        (existingSanto.songs.length === 1 &&
          (!existingSanto.songs[0].title ||
            ["/", "-", "letto", "santo"].includes(existingSanto.songs[0].title.trim().toLowerCase())));

      if (isSantoEmpty) {
        processedMomentsMap.set(santoDb.id, {
          momentId: santoDb.id,
          momentName: santoDb.name,
          sortOrder: santoDb.sort_order,
          songs: [
            {
              title: santoBelliSong ? santoBelliSong.title : "Santo (Belli)",
              code: santoBelliSong ? santoBelliSong.code : null,
              alternateCode: null,
              notes: null,
              matchedSongId: santoBelliSong ? santoBelliSong.id : null,
              matchedTitle: santoBelliSong ? santoBelliSong.title : null,
              matchedCode: santoBelliSong ? santoBelliSong.code : null,
            },
          ],
        });
      }
    }

    // Ordina i momenti processati secondo il sort_order liturgico
    const processedMoments = Array.from(processedMomentsMap.values())
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(({ sortOrder, ...rest }) => rest);

    return {
      error: null,
      data: {
        title: parsedData.title || "Nuova Celebrazione da Foto",
        liturgicalYear: parsedData.liturgicalYear || "A",
        celebrationDate: parsedData.celebrationDate || new Date().toISOString().split("T")[0],
        notes: parsedData.notes || null,
        moments: processedMoments,
      },
    };
  } catch (err: any) {
    console.error("Errore durante parseMassImageAction:", err);
    return { error: `Errore di elaborazione: ${err.message}`, data: null };
  }
}

// 7. Salva definitivamente una messa importata e riconciliata
export async function saveImportedMassAction(
  massData: {
    title: string;
    liturgicalYear: "A" | "B" | "C";
    celebrationDate: string;
    notes: string | null;
    moments: {
      momentId: string;
      songs: {
        title: string;
        code: string | null;
        notes: string | null;
        matchedSongId: string | null;
        createNew?: boolean;
      }[];
    }[];
  }
) {
  const { error: authError } = await verifyUserRole(["maestro", "responsabile"]);
  if (authError) {
    return { error: authError };
  }

  if (!massData.title || !massData.liturgicalYear || !massData.celebrationDate) {
    return { error: "Titolo, anno liturgico e data della celebrazione sono richiesti." };
  }

  const adminSupabase = createAdminSupabaseClient();

  try {
    // 1. Crea la Messa
    const { data: newMass, error: massErr } = await adminSupabase
      .from("masses")
      .insert({
        title: massData.title,
        liturgical_year: massData.liturgicalYear,
        celebration_date: massData.celebrationDate,
        notes: nullableString(massData.notes || ""),
      })
      .select("id")
      .single();

    if (massErr || !newMass) {
      throw new Error(`Impossibile creare la celebrazione: ${massErr?.message}`);
    }

    const massId = newMass.id;

    // 2. Loop sui momenti per inserire i canti
    for (const moment of massData.moments) {
      let position = 1;
      for (const song of moment.songs) {
        let songId = song.matchedSongId;

        // Se l'utente ha scelto di creare il canto a catalogo
        if (!songId && song.createNew) {
          const { data: newSong, error: songErr } = await adminSupabase
            .from("songs")
            .insert({
              title: song.title,
              code: nullableString(song.code || ""),
              notes: song.notes ? `[TESTO]\n${song.title}` : null,
            })
            .select("id")
            .single();

          if (songErr || !newSong) {
            console.error(`Errore creazione canto "${song.title}":`, songErr);
            // Continua con gli altri, non bloccare tutto
            continue;
          }
          songId = newSong.id;

          // Associazione automatica dell'eventuale raccolta salmi
          await autoLinkPsalmFile(newSong.id, song.title, song.notes, song.code);
        }

        if (songId) {
          // Inserisci l'associazione
          const { error: linkErr } = await adminSupabase
            .from("mass_songs")
            .insert({
              mass_id: massId,
              song_id: songId,
              moment_id: moment.momentId,
              position: position++,
              notes: nullableString(song.notes || ""),
            });

          if (linkErr) {
            console.error(`Errore associazione canto a messa:`, linkErr);
          }
        }
      }
    }

    revalidatePath("/messe");
    return { success: `Celebrazione "${massData.title}" importata con successo!` };
  } catch (err: any) {
    console.error("Errore durante saveImportedMassAction:", err);
    return { error: err.message || "Errore nel salvataggio della celebrazione." };
  }
}

// Aggiorna la nota specifica di un canto in una messa
export async function updateMassSongNoteAction(
  massSongId: string,
  notes: string | null,
): Promise<{ success: boolean; error?: string }> {
  const { error: authError } = await verifyUserRole(["maestro", "responsabile"]);
  if (authError) {
    return { success: false, error: authError };
  }

  if (!massSongId) {
    return { success: false, error: "ID Associazione mancante." };
  }

  const adminSupabase = createAdminSupabaseClient();
  const { error } = await adminSupabase
    .from("mass_songs")
    .update({ notes })
    .eq("id", massSongId);

  if (error) {
    console.error("Errore aggiornamento nota canto:", error);
    return { success: false, error: "Errore durante il salvataggio della nota." };
  }

  revalidatePath("/messe");
  revalidatePath(`/messe/[id]/modifica`, "page");
  
  return { success: true };
}

// 7. Duplica una celebrazione esistente con tutti i suoi canti
export async function duplicateMassAction(
  sourceMassId: string,
  newTitle: string,
  newCelebrationDate: string,
): Promise<{ success: boolean; newMassId?: string; error?: string }> {
  const { error: authError } = await verifyUserRole(["maestro", "responsabile"]);
  if (authError) {
    return { success: false, error: authError };
  }

  if (!sourceMassId || !newTitle || !newCelebrationDate) {
    return { success: false, error: "Tutti i campi obbligatori devono essere compilati." };
  }

  const adminSupabase = createAdminSupabaseClient();

  // 1. Recupera la messa originale
  const { data: sourceMass, error: sourceMassError } = await adminSupabase
    .from("masses")
    .select("title, liturgical_year, notes")
    .eq("id", sourceMassId)
    .single();

  if (sourceMassError || !sourceMass) {
    return { success: false, error: "Celebrazione originale non trovata." };
  }

  // 2. Crea la nuova messa
  const { data: newMass, error: newMassError } = await adminSupabase
    .from("masses")
    .insert({
      title: newTitle,
      liturgical_year: sourceMass.liturgical_year,
      celebration_date: newCelebrationDate,
      notes: sourceMass.notes,
    })
    .select("id")
    .single();

  if (newMassError || !newMass) {
    console.error("Errore creazione messa duplicata:", newMassError);
    return { success: false, error: "Impossibile creare la celebrazione duplicata." };
  }

  // 3. Recupera tutti i canti associati alla messa originale
  const { data: sourceSongs } = await adminSupabase
    .from("mass_songs")
    .select("song_id, moment_id, position, notes")
    .eq("mass_id", sourceMassId);

  if (sourceSongs && sourceSongs.length > 0) {
    const songsToInsert = sourceSongs.map((s) => ({
      mass_id: newMass.id,
      song_id: s.song_id,
      moment_id: s.moment_id,
      position: s.position,
      notes: s.notes,
    }));

    const { error: insertSongsError } = await adminSupabase
      .from("mass_songs")
      .insert(songsToInsert);

    if (insertSongsError) {
      console.error("Errore inserimento canti duplicati:", insertSongsError);
    }
  }

  revalidatePath("/messe");
  return { success: true, newMassId: newMass.id };
}


