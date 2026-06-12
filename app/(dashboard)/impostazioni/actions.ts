"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { verifyUserRole } from "@/lib/supabase/server";

export type SettingsActionState<T = any> = {
  error: string | null;
  success: string | null;
  data?: T;
};

// 1. Aggiorna il profilo personale (visibile a Cantori e Maestri)
export async function updateUserProfile(
  token: string,
  fullName: string,
  vocalRegister: string,
): Promise<SettingsActionState> {
  if (!fullName) {
    return { error: "Il nome completo è obbligatorio.", success: null };
  }

  const { user, error: authError } = await verifyUserRole(token, ["ospite", "cantore", "maestro"]);
  if (authError || !user) {
    return { error: authError || "Non autorizzato.", success: null };
  }

  const adminClient = createAdminSupabaseClient();
  const { error: updateError } = await adminClient
    .from("profiles")
    .update({
      full_name: fullName,
      vocal_register: vocalRegister,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("Errore aggiornamento profilo:", updateError);
    return { error: "Impossibile aggiornare il profilo.", success: null };
  }

  return { error: null, success: "Profilo aggiornato con successo." };
}

// 2. Modifica/riordina l'elenco dei momenti liturgici (visibile solo ai Maestri)
export async function updateLiturgicalMomentsOrder(
  token: string,
  moments: { id: string; sort_order: number; name: string }[],
): Promise<SettingsActionState> {
  const { error: authError } = await verifyUserRole(token, ["maestro"]);
  if (authError) {
    return { error: authError, success: null };
  }

  const adminClient = createAdminSupabaseClient();

  try {
    // Per evitare violazioni temporanee del vincolo UNIQUE su sort_order,
    // alziamo temporaneamente tutti i sort_order a valori fuori scala (+10000)
    for (const m of moments) {
      const { error: tempErr } = await adminClient
        .from("mass_moments")
        .update({ sort_order: m.sort_order + 10000 })
        .eq("id", m.id);

      if (tempErr) throw tempErr;
    }

    // Applichiamo i valori definitivi di nome e ordinamento
    for (const m of moments) {
      const { error: finalErr } = await adminClient
        .from("mass_moments")
        .update({
          name: m.name,
          sort_order: m.sort_order,
          updated_at: new Date().toISOString(),
        })
        .eq("id", m.id);

      if (finalErr) throw finalErr;
    }

    revalidatePath("/messe");
    return { error: null, success: "Momenti liturgici aggiornati con successo." };
  } catch (err: any) {
    console.error("Errore durante il riordino dei momenti:", err);
    return { error: "Impossibile salvare l'ordinamento dei momenti liturgici. Verifica che i nomi non siano duplicati.", success: null };
  }
}

// 3. Aggiunge un momento liturgico (Maestro)
export async function addLiturgicalMoment(
  token: string,
  name: string,
): Promise<SettingsActionState> {
  if (!name || name.trim().length === 0) {
    return { error: "Il nome del momento non può essere vuoto.", success: null };
  }

  const { error: authError } = await verifyUserRole(token, ["maestro"]);
  if (authError) {
    return { error: authError, success: null };
  }

  const adminClient = createAdminSupabaseClient();

  // Trova il sort_order massimo corrente
  const { data: maxOrderData, error: maxOrderErr } = await adminClient
    .from("mass_moments")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);

  if (maxOrderErr) {
    console.error("Errore recupero sort_order massimo:", maxOrderErr);
    return { error: "Errore durante il calcolo dell'ordinamento.", success: null };
  }

  const nextOrder = maxOrderData && maxOrderData.length > 0 ? maxOrderData[0].sort_order + 1 : 1;

  const { error: insertErr } = await adminClient
    .from("mass_moments")
    .insert({
      name: name.trim(),
      sort_order: nextOrder,
    });

  if (insertErr) {
    console.error("Errore inserimento momento:", insertErr);
    return { error: "Impossibile aggiungere il momento liturgico. Verifica che non esista già.", success: null };
  }

  revalidatePath("/messe");
  return { error: null, success: `Momento liturgico "${name}" aggiunto.` };
}

// 4. Elimina un momento liturgico (Maestro)
export async function deleteLiturgicalMoment(
  token: string,
  id: string,
): Promise<SettingsActionState> {
  const { error: authError } = await verifyUserRole(token, ["maestro"]);
  if (authError) {
    return { error: authError, success: null };
  }

  const adminClient = createAdminSupabaseClient();

  // Verifica se è in uso in mass_songs
  const { count: massSongsCount, error: massSongsErr } = await adminClient
    .from("mass_songs")
    .select("*", { count: "exact", head: true })
    .eq("moment_id", id);

  if (massSongsErr) {
    console.error("Errore verifica dipendenze celebrazioni:", massSongsErr);
    return { error: "Errore durante la verifica delle dipendenze.", success: null };
  }

  if (massSongsCount && massSongsCount > 0) {
    return { error: "Impossibile eliminare: il momento è attualmente associato a dei canti all'interno di una o più Messe.", success: null };
  }

  // Verifica se è in uso in song_moments
  const { count: songMomentsCount, error: songMomentsErr } = await adminClient
    .from("song_moments")
    .select("*", { count: "exact", head: true })
    .eq("moment_id", id);

  if (songMomentsErr) {
    console.error("Errore verifica dipendenze canti:", songMomentsErr);
    return { error: "Errore durante la verifica delle dipendenze del catalogo.", success: null };
  }

  if (songMomentsCount && songMomentsCount > 0) {
    return { error: "Impossibile eliminare: il momento è associato a dei canti nel catalogo generale. Rimuovi le associazioni dai canti prima di procedere.", success: null };
  }

  const { error: deleteErr } = await adminClient
    .from("mass_moments")
    .delete()
    .eq("id", id);

  if (deleteErr) {
    console.error("Errore eliminazione momento:", deleteErr);
    return { error: "Impossibile eliminare il momento liturgico.", success: null };
  }

  revalidatePath("/messe");
  return { error: null, success: "Momento liturgico eliminato correttamente." };
}

// 5. Ripristina i 15 momenti Ambrosiani standard (Maestro)
const DEFAULT_AMBROSIAN_MOMENTS = [
  { name: "Ingresso", sort_order: 1 },
  { name: "Aspersione", sort_order: 2 },
  { name: "Gloria", sort_order: 3 },
  { name: "Salmo", sort_order: 4 },
  { name: "Canto al Vangelo", sort_order: 5 },
  { name: "Dopo il Vangelo", sort_order: 6 },
  { name: "Offertorio", sort_order: 7 },
  { name: "Santo", sort_order: 8 },
  { name: "Mistero della Fede", sort_order: 9 },
  { name: "Amen", sort_order: 10 },
  { name: "Spezzare del Pane", sort_order: 11 },
  { name: "Agnello di Dio (Agnus Dei)", sort_order: 12 },
  { name: "Padre Nostro", sort_order: 13 },
  { name: "Comunione", sort_order: 14 },
  { name: "Finale", sort_order: 15 },
];

export async function restoreDefaultMomentsAction(
  token: string,
): Promise<SettingsActionState> {
  const { error: authError } = await verifyUserRole(token, ["maestro"]);
  if (authError) {
    return { error: authError, success: null };
  }

  const adminClient = createAdminSupabaseClient();

  // Verifica se ci sono canti associati in celebrazioni (mass_songs)
  const { count: totalMassSongs, error: massSongsErr } = await adminClient
    .from("mass_songs")
    .select("*", { count: "exact", head: true });

  if (massSongsErr) {
    console.error("Errore verifica mass_songs:", massSongsErr);
    return { error: "Errore durante la verifica di integrità.", success: null };
  }

  if (totalMassSongs && totalMassSongs > 0) {
    return {
      error: "Impossibile ripristinare i momenti liturgici predefiniti poiché vi sono già dei canti assegnati alle Messe correnti. Rimuovi o svuota i canti dalle celebrazioni per poter reimpostare i momenti.",
      success: null
    };
  }

  // Verifica se ci sono canti associati nel catalogo (song_moments)
  const { count: totalSongMoments, error: songMomentsErr } = await adminClient
    .from("song_moments")
    .select("*", { count: "exact", head: true });

  if (songMomentsErr) {
    console.error("Errore verifica song_moments:", songMomentsErr);
    return { error: "Errore durante la verifica di integrità del catalogo.", success: null };
  }

  if (totalSongMoments && totalSongMoments > 0) {
    return {
      error: "Impossibile ripristinare i momenti: ci sono canti associati a dei momenti nel catalogo generale. Elimina o sposta le associazioni nel catalogo per consentire il ripristino.",
      success: null
    };
  }

  try {
    // Cancella tutti i momenti correnti
    const { error: deleteErr } = await adminClient
      .from("mass_moments")
      .delete()
      .neq("name", "DELETING_ALL_MOMENTS");

    if (deleteErr) throw deleteErr;

    // Reinserisce i momenti predefiniti
    const { error: insertErr } = await adminClient
      .from("mass_moments")
      .insert(DEFAULT_AMBROSIAN_MOMENTS);

    if (insertErr) throw insertErr;

    revalidatePath("/messe");
    return { error: null, success: "Momenti liturgici Ambrosiani di default ripristinati correttamente." };
  } catch (err: any) {
    console.error("Errore durante il ripristino dei momenti liturgici:", err);
    return { error: "Impossibile ripristinare i momenti predefiniti.", success: null };
  }
}

// 6. Aggiorna il ruolo e registro di un corista (Maestro)
export async function updateUserRoleAndRegister(
  token: string,
  targetUserId: string,
  role: "ospite" | "cantore" | "maestro",
  vocalRegister: string,
): Promise<SettingsActionState> {
  const { error: authError } = await verifyUserRole(token, ["maestro"]);
  if (authError) {
    return { error: authError, success: null };
  }

  if (role !== "ospite" && role !== "cantore" && role !== "maestro") {
    return { error: "Ruolo non valido.", success: null };
  }

  const adminClient = createAdminSupabaseClient();

  const { error: updateError } = await adminClient
    .from("profiles")
    .update({
      role,
      vocal_register: vocalRegister,
      updated_at: new Date().toISOString(),
    })
    .eq("id", targetUserId);

  if (updateError) {
    console.error("Errore aggiornamento ruolo utente:", updateError);
    return { error: "Impossibile aggiornare il ruolo e registro del corista.", success: null };
  }

  return { error: null, success: "Ruolo e registro aggiornati con successo." };
}
