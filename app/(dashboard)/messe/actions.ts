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

    const prompt = `Sei un esperto di liturgia cattolica (rito ambrosiano) e canti liturgici. Analizza questa immagine di un foglietto liturgico manoscritto o stampato.
Estrai i dettagli della celebrazione nel seguente formato JSON:
{
  "title": "Titolo della celebrazione (es. IV dopo Pentecoste, Messa di Pasqua)",
  "liturgicalYear": "A" o "B" o "C" (anno liturgico, se indicato o deducibile, default "A"),
  "celebrationDate": "Data della celebrazione in formato YYYY-MM-DD (se indicata o deducibile, es. 2026-06-21)",
  "notes": "Eventuali annotazioni generali o avvisi per la celebrazione",
  "moments": [
    {
      "momentName": "Nome del momento liturgico standard",
      "songs": [
        {
          "title": "Titolo del canto (es. Lo Spirito di Dio, Chiesa di Dio)",
          "code": "Codice numerico associato se indicato (es. '207', '342', o null)",
          "alternateCode": "Codice alternativo se indicato (es. '114', '190', o null)",
          "notes": "Annotazioni specifiche sul canto per questo momento (es. '1^ strofa', 'come da foglietto', 'cantato inizio e fine')"
        }
      ]
    }
  ]
}

Regole importanti per i nomi dei momenti:
Mappa i momenti liturgici esattamente ai seguenti nomi standard della tabella mass_moments:
- 'Ingresso' (es. 'ALL\\'INGRESSO')
- 'Atto Penitenziale'
- 'Gloria'
- 'Salmo'
- 'Canto al Vangelo' (es. 'AL VANGELO')
- 'Offertorio'
- 'Santo'
- 'Memoriale' (mappa qui 'Mistero della Fede' o 'Annunciamo')
- 'Agnello di Dio' (mappa qui 'Spezzare del Pane')
- 'Comunione'
- 'Finale' (mappa qui 'Fine')

Se ci sono canti alternativi o molteplici per lo stesso momento (es. 'oppure', 'o'), inseriscili tutti come elementi separati nell'array 'songs' di quel momento.
Se un momento è vuoto o non ha canti, non includerlo oppure lascia l'array 'songs' vuoto.
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
      .select("id, name")
      .order("sort_order", { ascending: true });

    const momentsMap = new Map((dbMoments || []).map((m) => [m.name.toLowerCase(), m.id]));

    const processedMoments = [];

    if (parsedData.moments && Array.isArray(parsedData.moments)) {
      for (const rawMoment of parsedData.moments) {
        const momentName = rawMoment.momentName;
        const momentId = momentsMap.get(momentName.toLowerCase()) || null;

        if (!momentId) {
          // Se non mappato a un momento standard del DB, saltiamo
          continue;
        }

        const songsList = [];
        if (rawMoment.songs && Array.isArray(rawMoment.songs)) {
          for (const rawSong of rawMoment.songs) {
            let matchedSong = null;

            // 1. Cerca per codice
            if (rawSong.code) {
              const { data } = await adminSupabase
                .from("songs")
                .select("id, title, code")
                .ilike("code", `%${rawSong.code}%`)
                .limit(1);
              if (data && data.length > 0) {
                matchedSong = data[0];
              }
            }

            // 2. Cerca per titolo se non trovato
            if (!matchedSong && rawSong.title) {
              const { data } = await adminSupabase
                .from("songs")
                .select("id, title, code")
                .ilike("title", `%${rawSong.title}%`)
                .limit(1);
              if (data && data.length > 0) {
                matchedSong = data[0];
              }
            }

            // 3. Cerca per titolo alternativo se non trovato
            if (!matchedSong && rawSong.title) {
              const { data } = await adminSupabase
                .from("songs")
                .select("id, title, code")
                .ilike("alternate_title", `%${rawSong.title}%`)
                .limit(1);
              if (data && data.length > 0) {
                matchedSong = data[0];
              }
            }

            songsList.push({
              title: rawSong.title,
              code: rawSong.code || null,
              alternateCode: rawSong.alternateCode || null,
              notes: rawSong.notes || null,
              matchedSongId: matchedSong ? matchedSong.id : null,
              matchedTitle: matchedSong ? matchedSong.title : null,
              matchedCode: matchedSong ? matchedSong.code : null,
            });
          }
        }

        processedMoments.push({
          momentId,
          momentName,
          songs: songsList,
        });
      }
    }

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


