"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { serializeNotesAndLyrics } from "@/lib/songs";

export type CreateSongFormState = {
  error: string | null;
  success: string | null;
};

export type CatalogMutationFormState = {
  error: string | null;
  success: string | null;
};

type StorageFileRow = {
  storage_bucket: string;
  storage_path: string;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableString(value: string) {
  return value.length > 0 ? value : null;
}

function validateUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

async function removeStorageFiles(
  adminSupabase: ReturnType<typeof createAdminSupabaseClient>,
  files: StorageFileRow[],
) {
  const filesByBucket = files.reduce<Record<string, string[]>>(
    (accumulator, file) => {
      const paths = accumulator[file.storage_bucket] ?? [];
      paths.push(file.storage_path);
      accumulator[file.storage_bucket] = paths;
      return accumulator;
    },
    {},
  );

  for (const [bucket, paths] of Object.entries(filesByBucket)) {
    const { error } = await adminSupabase.storage.from(bucket).remove(paths);

    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function createSongAction(
  _previousState: CreateSongFormState,
  formData: FormData,
): Promise<CreateSongFormState> {
  const code = readString(formData, "code");
  const title = readString(formData, "title");
  const alternateTitle = readString(formData, "alternateTitle");
  const notesField = readString(formData, "notes");
  const lyricsField = readString(formData, "lyrics");
  const notes = serializeNotesAndLyrics(notesField, lyricsField);

  if (!title) {
    return {
      error: "Il titolo del canto e' obbligatorio.",
      success: null,
    };
  }

  const supabase = createServerSupabaseClient();
  const payload = {
    code: nullableString(code),
    title,
    alternate_title: nullableString(alternateTitle),
    notes: nullableString(notes),
  };

  const { data: newSong, error } = await supabase
    .from("songs")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    const duplicateCode =
      error.code === "23505" && code.length > 0
        ? "Esiste gia' un canto con questo codice."
        : null;

    return {
      error:
        duplicateCode ??
        "Non sono riuscito a salvare il canto su Supabase. Riprova.",
      success: null,
    };
  }

  // Aggiunta dei momenti associati
  const momentIds = formData.getAll("momentIds") as string[];
  if (newSong && momentIds && momentIds.length > 0) {
    const momentPayload = momentIds.map((momentId) => ({
      song_id: newSong.id,
      moment_id: momentId,
    }));

    const { error: momentsError } = await supabase
      .from("song_moments")
      .insert(momentPayload);

    if (momentsError) {
      console.error("Errore salvataggio momenti", momentsError);
    }
  }

  revalidatePath("/canti");

  return {
    error: null,
    success: `Canto "${title}" creato correttamente.`,
  };
}


export type CreateArrangementFormState = {
  error: string | null;
  success: string | null;
};

const supportedFileTypes = new Set([
  "spartito_pdf",
  "accordi_pdf",
  "mp3_completo",
  "mp3_soprano",
  "mp3_contralto",
  "mp3_tenore",
  "mp3_basso",
  "mp3_organo",
]);

function sanitizeFileName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-");
}

export async function createArrangementAction(
  _previousState: CreateArrangementFormState,
  formData: FormData,
): Promise<CreateArrangementFormState> {
  const songId = readString(formData, "songId");
  const arrangementName = readString(formData, "arrangementName");
  const musicalKey = readString(formData, "musicalKey");
  const instrumentation = readString(formData, "instrumentation");
  const notes = readString(formData, "notes");

  if (!songId) {
    return {
      error: "Canto non valido per la creazione della variante.",
      success: null,
    };
  }

  if (!arrangementName && !musicalKey && !instrumentation) {
    return {
      error:
        "Inserisci almeno un nome variante, una tonalita' o una strumentazione.",
      success: null,
    };
  }

  const supabase = createServerSupabaseClient();
  const payload = {
    song_id: songId,
    arrangement_name: nullableString(arrangementName),
    musical_key: nullableString(musicalKey),
    instrumentation: nullableString(instrumentation),
    notes: nullableString(notes),
  };

  const { error } = await supabase.from("song_arrangements").insert(payload);

  if (error) {
    return {
      error:
        "Non sono riuscito a salvare la variante del canto su Supabase. Riprova.",
      success: null,
    };
  }

  revalidatePath("/canti");

  return {
    error: null,
    success: "Variante del canto creata correttamente.",
  };
}

export type CreateSongFileFormState = {
  error: string | null;
  success: string | null;
};

export async function createSongFileAction(
  _previousState: CreateSongFileFormState,
  formData: FormData,
): Promise<CreateSongFileFormState> {
  const fileValue = formData.get("file");

  const songId = readString(formData, "songId");
  const arrangementId = readString(formData, "arrangementId");
  const fileType = readString(formData, "fileType");

  if (!songId || !arrangementId) {
    return {
      error: "Variante non valida per l'associazione del file.",
      success: null,
    };
  }

  if (!supportedFileTypes.has(fileType)) {
    return {
      error: "Tipo file non supportato.",
      success: null,
    };
  }

  if (!(fileValue instanceof File) || fileValue.size === 0) {
    return {
      error: "Seleziona un file valido da caricare.",
      success: null,
    };
  }

  const isPdf = fileType.endsWith("_pdf");
  const isMp3 = fileType.startsWith("mp3_");

  if (isPdf && fileValue.type !== "application/pdf" && !fileValue.name.toLowerCase().endsWith(".pdf")) {
    return {
      error: "Per questo tipo di file è supportato solo il formato PDF.",
      success: null,
    };
  }

  if (isMp3 && !["audio/mpeg", "audio/mp3", "audio/x-mpeg", "audio/x-mp3"].includes(fileValue.type) && !fileValue.name.toLowerCase().endsWith(".mp3")) {
    return {
      error: "Per questo tipo di file è supportato solo il formato MP3.",
      success: null,
    };
  }

  if (fileValue.size > 50 * 1024 * 1024) {
    return {
      error: "Il file supera il limite di 50 MB consentito.",
      success: null,
    };
  }

  let adminSupabase;

  try {
    adminSupabase = createAdminSupabaseClient();
  } catch {
    return {
      error:
        "Upload storage non configurato. Aggiungi SUPABASE_SERVICE_ROLE_KEY per caricare file su Supabase Storage.",
      success: null,
    };
  }

  const mimeType = isPdf ? "application/pdf" : "audio/mpeg";
  const safeFileName = sanitizeFileName(fileValue.name);
  const storagePath = `songs/${songId}/${arrangementId}/${Date.now()}-${safeFileName}`;
  const fileBuffer = Buffer.from(await fileValue.arrayBuffer());

  const { error: uploadError } = await adminSupabase.storage
    .from("note-di-fede")
    .upload(storagePath, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    return {
      error:
        "Caricamento del file su Supabase Storage non riuscito. Controlla bucket e permessi.",
      success: null,
    };
  }

  const { error: insertError } = await adminSupabase.from("song_files").insert({
    song_id: songId,
    arrangement_id: arrangementId,
    file_type: fileType,
    storage_bucket: "note-di-fede",
    storage_path: storagePath,
    public_url: null,
    file_name: fileValue.name,
    file_size_bytes: fileValue.size,
    mime_type: mimeType,
  });

  if (insertError) {
    await adminSupabase.storage.from("note-di-fede").remove([storagePath]);

    return {
      error:
        "Il file e' stato caricato ma non sono riuscito a salvarne i metadati nel database.",
      success: null,
    };
  }

  revalidatePath("/canti");

  return {
    error: null,
    success:
      fileType === "spartito_pdf"
        ? "Spartito caricato e associato correttamente."
        : fileType === "accordi_pdf"
        ? "Accordi caricati e associati correttamente."
        : "File audio caricato e associato correttamente.",
  };
}

export type CreateSongLinkFormState = {
  error: string | null;
  success: string | null;
};

export async function createSongLinkAction(
  _previousState: CreateSongLinkFormState,
  formData: FormData,
): Promise<CreateSongLinkFormState> {
  const songId = readString(formData, "songId");
  const label = readString(formData, "label");
  const url = readString(formData, "url");
  const provider = readString(formData, "provider") || "generic";
  const linkType = readString(formData, "linkType") || "ascolto";
  const notes = readString(formData, "notes");

  if (!songId) {
    return {
      error: "Canto non valido per il collegamento del link.",
      success: null,
    };
  }

  if (!label || !url) {
    return {
      error: "Inserisci almeno un'etichetta e un URL valido.",
      success: null,
    };
  }

  if (!validateUrl(url)) {
    return {
      error: "L'URL inserito non e' valido.",
      success: null,
    };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("song_links").insert({
    song_id: songId,
    label,
    url,
    provider: provider === "youtube" ? "youtube" : "generic",
    link_type:
      linkType === "tutorial" || linkType === "riferimento"
        ? linkType
        : "ascolto",
    notes: nullableString(notes),
  });

  if (error) {
    return {
      error:
        "Non sono riuscito a salvare il link esterno per questo canto. Riprova.",
      success: null,
    };
  }

  revalidatePath("/canti");

  return {
    error: null,
    success: "Link esterno collegato correttamente al canto.",
  };
}

export async function updateSongAction(
  _previousState: CatalogMutationFormState,
  formData: FormData,
): Promise<CatalogMutationFormState> {
  const songId = readString(formData, "songId");
  const code = readString(formData, "code");
  const title = readString(formData, "title");
  const alternateTitle = readString(formData, "alternateTitle");
  const notesField = readString(formData, "notes");
  const lyricsField = readString(formData, "lyrics");
  const notes = serializeNotesAndLyrics(notesField, lyricsField);

  if (!songId || !title) {
    return {
      error: "Per aggiornare il canto servono ID e titolo.",
      success: null,
    };
  }

  const adminSupabase = createAdminSupabaseClient();
  const { error } = await adminSupabase
    .from("songs")
    .update({
      code: nullableString(code),
      title,
      alternate_title: nullableString(alternateTitle),
      notes: nullableString(notes),
    })
    .eq("id", songId);

  if (error) {
    const duplicateCode =
      error.code === "23505" && code.length > 0
        ? "Esiste gia' un canto con questo codice."
        : null;

    return {
      error: duplicateCode ?? "Non sono riuscito ad aggiornare il canto.",
      success: null,
    };
  }

  // Aggiornamento momenti associati
  const momentIds = formData.getAll("momentIds") as string[];

  // Cancella i momenti esistenti per questo canto
  const { error: deleteMomentsError } = await adminSupabase
    .from("song_moments")
    .delete()
    .eq("song_id", songId);

  if (deleteMomentsError) {
    console.error("Errore cancellazione momenti", deleteMomentsError);
  }

  // Inserisci i nuovi momenti
  if (momentIds && momentIds.length > 0) {
    const momentPayload = momentIds.map((momentId) => ({
      song_id: songId,
      moment_id: momentId,
    }));

    const { error: insertMomentsError } = await adminSupabase
      .from("song_moments")
      .insert(momentPayload);

    if (insertMomentsError) {
      console.error("Errore inserimento momenti", insertMomentsError);
    }
  }

  revalidatePath("/canti");

  return {
    error: null,
    success: "Canto aggiornato correttamente.",
  };
}


export async function deleteSongAction(
  _previousState: CatalogMutationFormState,
  formData: FormData,
): Promise<CatalogMutationFormState> {
  const songId = readString(formData, "songId");

  if (!songId) {
    return {
      error: "Canto non valido per l'eliminazione.",
      success: null,
    };
  }

  const adminSupabase = createAdminSupabaseClient();
  const { data: files, error: filesError } = await adminSupabase
    .from("song_files")
    .select("storage_bucket, storage_path")
    .eq("song_id", songId);

  if (filesError) {
    return {
      error: "Non sono riuscito a recuperare i file collegati al canto.",
      success: null,
    };
  }

  try {
    await removeStorageFiles(adminSupabase, (files ?? []) satisfies StorageFileRow[]);
  } catch {
    return {
      error: "Non sono riuscito a rimuovere i file dal Supabase Storage.",
      success: null,
    };
  }

  const { error } = await adminSupabase.from("songs").delete().eq("id", songId);

  if (error) {
    return {
      error: "Non sono riuscito a eliminare il canto dal database.",
      success: null,
    };
  }

  revalidatePath("/canti");

  return {
    error: null,
    success: "Canto eliminato correttamente.",
  };
}

export async function updateArrangementAction(
  _previousState: CatalogMutationFormState,
  formData: FormData,
): Promise<CatalogMutationFormState> {
  const arrangementId = readString(formData, "arrangementId");
  const arrangementName = readString(formData, "arrangementName");
  const musicalKey = readString(formData, "musicalKey");
  const instrumentation = readString(formData, "instrumentation");
  const notes = readString(formData, "notes");

  if (!arrangementId) {
    return {
      error: "Variante non valida per l'aggiornamento.",
      success: null,
    };
  }

  if (!arrangementName && !musicalKey && !instrumentation) {
    return {
      error:
        "Lascia almeno un nome variante, una tonalita' o una strumentazione.",
      success: null,
    };
  }

  const adminSupabase = createAdminSupabaseClient();
  const { error } = await adminSupabase
    .from("song_arrangements")
    .update({
      arrangement_name: nullableString(arrangementName),
      musical_key: nullableString(musicalKey),
      instrumentation: nullableString(instrumentation),
      notes: nullableString(notes),
    })
    .eq("id", arrangementId);

  if (error) {
    return {
      error: "Non sono riuscito ad aggiornare la variante.",
      success: null,
    };
  }

  revalidatePath("/canti");

  return {
    error: null,
    success: "Variante aggiornata correttamente.",
  };
}

export async function deleteArrangementAction(
  _previousState: CatalogMutationFormState,
  formData: FormData,
): Promise<CatalogMutationFormState> {
  const arrangementId = readString(formData, "arrangementId");

  if (!arrangementId) {
    return {
      error: "Variante non valida per l'eliminazione.",
      success: null,
    };
  }

  const adminSupabase = createAdminSupabaseClient();
  const { data: files, error: filesError } = await adminSupabase
    .from("song_files")
    .select("storage_bucket, storage_path")
    .eq("arrangement_id", arrangementId);

  if (filesError) {
    return {
      error: "Non sono riuscito a recuperare i file collegati alla variante.",
      success: null,
    };
  }

  try {
    await removeStorageFiles(adminSupabase, (files ?? []) satisfies StorageFileRow[]);
  } catch {
    return {
      error: "Non sono riuscito a rimuovere i file dal Supabase Storage.",
      success: null,
    };
  }

  const { error } = await adminSupabase
    .from("song_arrangements")
    .delete()
    .eq("id", arrangementId);

  if (error) {
    return {
      error: "Non sono riuscito a eliminare la variante dal database.",
      success: null,
    };
  }

  revalidatePath("/canti");

  return {
    error: null,
    success: "Variante eliminata correttamente.",
  };
}

export async function updateSongLinkAction(
  _previousState: CatalogMutationFormState,
  formData: FormData,
): Promise<CatalogMutationFormState> {
  const linkId = readString(formData, "linkId");
  const label = readString(formData, "label");
  const url = readString(formData, "url");
  const provider = readString(formData, "provider") || "generic";
  const linkType = readString(formData, "linkType") || "ascolto";
  const notes = readString(formData, "notes");

  if (!linkId || !label || !url) {
    return {
      error: "Per aggiornare il link servono etichetta e URL.",
      success: null,
    };
  }

  if (!validateUrl(url)) {
    return {
      error: "L'URL inserito non e' valido.",
      success: null,
    };
  }

  const adminSupabase = createAdminSupabaseClient();
  const { error } = await adminSupabase
    .from("song_links")
    .update({
      label,
      url,
      provider: provider === "youtube" ? "youtube" : "generic",
      link_type:
        linkType === "tutorial" || linkType === "riferimento"
          ? linkType
          : "ascolto",
      notes: nullableString(notes),
    })
    .eq("id", linkId);

  if (error) {
    return {
      error: "Non sono riuscito ad aggiornare il link.",
      success: null,
    };
  }

  revalidatePath("/canti");

  return {
    error: null,
    success: "Link aggiornato correttamente.",
  };
}

export async function deleteSongLinkAction(
  _previousState: CatalogMutationFormState,
  formData: FormData,
): Promise<CatalogMutationFormState> {
  const linkId = readString(formData, "linkId");

  if (!linkId) {
    return {
      error: "Link non valido per l'eliminazione.",
      success: null,
    };
  }

  const adminSupabase = createAdminSupabaseClient();
  const { error } = await adminSupabase
    .from("song_links")
    .delete()
    .eq("id", linkId);

  if (error) {
    return {
      error: "Non sono riuscito a eliminare il link.",
      success: null,
    };
  }

  revalidatePath("/canti");

  return {
    error: null,
    success: "Link eliminato correttamente.",
  };
}

export async function deleteSongFileAction(
  _previousState: CatalogMutationFormState,
  formData: FormData,
): Promise<CatalogMutationFormState> {
  const fileId = readString(formData, "fileId");

  if (!fileId) {
    return {
      error: "File non valido per l'eliminazione.",
      success: null,
    };
  }

  const adminSupabase = createAdminSupabaseClient();
  const { data: file, error: fileError } = await adminSupabase
    .from("song_files")
    .select("storage_bucket, storage_path")
    .eq("id", fileId)
    .single<StorageFileRow>();

  if (fileError || !file) {
    return {
      error: "Non sono riuscito a recuperare il file da eliminare.",
      success: null,
    };
  }

  try {
    await removeStorageFiles(adminSupabase, [file]);
  } catch {
    return {
      error: "Non sono riuscito a rimuovere il file dal Supabase Storage.",
      success: null,
    };
  }

  const { error } = await adminSupabase
    .from("song_files")
    .delete()
    .eq("id", fileId);

  if (error) {
    return {
      error: "Il file e' stato rimosso dallo storage ma non dal database.",
      success: null,
    };
  }

  revalidatePath("/canti");

  return {
    error: null,
    success: "File eliminato correttamente.",
  };
}

export async function createMassMomentAction(
  _previousState: CatalogMutationFormState,
  formData: FormData,
): Promise<CatalogMutationFormState> {
  const name = readString(formData, "name");
  const sortOrderStr = readString(formData, "sortOrder");

  if (!name) {
    return {
      error: "Il nome del momento è obbligatorio.",
      success: null,
    };
  }

  const adminSupabase = createAdminSupabaseClient();
  let sortOrder: number;

  if (sortOrderStr) {
    sortOrder = parseInt(sortOrderStr, 10);
    if (isNaN(sortOrder)) {
      return {
        error: "L'ordinamento deve essere un numero valido.",
        success: null,
      };
    }
  } else {
    // Calcola il sort_order massimo corrente e aggiungi 1
    const { data, error: maxError } = await adminSupabase
      .from("mass_moments")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1);

    if (maxError) {
      return {
        error: "Non è stato possibile calcolare l'ordinamento automatico.",
        success: null,
      };
    }

    const maxOrder = data && data.length > 0 ? data[0].sort_order : 0;
    sortOrder = maxOrder + 1;
  }

  // Verifica se il nome esiste già
  const { data: existingName } = await adminSupabase
    .from("mass_moments")
    .select("id")
    .eq("name", name)
    .maybeSingle();

  if (existingName) {
    return {
      error: `Il momento "${name}" esiste già.`,
      success: null,
    };
  }

  // Verifica se il sort_order esiste già (poiché è UNIQUE)
  const { data: existingOrder } = await adminSupabase
    .from("mass_moments")
    .select("id")
    .eq("sort_order", sortOrder)
    .maybeSingle();

  if (existingOrder) {
    return {
      error: `La posizione di ordinamento (${sortOrder}) è già occupata da un altro momento.`,
      success: null,
    };
  }

  const { error: insertError } = await adminSupabase
    .from("mass_moments")
    .insert({
      name,
      sort_order: sortOrder,
    });

  if (insertError) {
    console.error("Errore nell'inserimento del momento liturgico:", insertError);
    return {
      error: "Impossibile salvare il nuovo momento liturgico nel database.",
      success: null,
    };
  }

  revalidatePath("/canti");

  return {
    error: null,
    success: `Momento liturgico "${name}" aggiunto correttamente.`,
  };
}

export async function deleteMassMomentAction(
  _previousState: CatalogMutationFormState,
  formData: FormData,
): Promise<CatalogMutationFormState> {
  const momentId = readString(formData, "momentId");

  if (!momentId) {
    return {
      error: "ID momento non valido per l'eliminazione.",
      success: null,
    };
  }

  const adminSupabase = createAdminSupabaseClient();

  // Verifica se è in uso in mass_songs (on delete restrict)
  const { count, error: checkError } = await adminSupabase
    .from("mass_songs")
    .select("id", { count: "exact", head: true })
    .eq("moment_id", momentId);

  if (checkError) {
    console.error("Errore verifica utilizzo momento:", checkError);
  }

  if (count && count > 0) {
    return {
      error: "Impossibile eliminare questo momento perché è attualmente associato ad uno o più canti all'interno di una celebrazione programmata.",
      success: null,
    };
  }

  // Se passa la verifica, procediamo all'eliminazione (i song_moments collegati verranno eliminati in cascata)
  const { error: deleteError } = await adminSupabase
    .from("mass_moments")
    .delete()
    .eq("id", momentId);

  if (deleteError) {
    console.error("Errore cancellazione momento:", deleteError);
    return {
      error: "Impossibile rimuovere il momento liturgico dal database.",
      success: null,
    };
  }

  revalidatePath("/canti");

  return {
    error: null,
    success: "Momento liturgico eliminato correttamente.",
  };
}
