"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

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
