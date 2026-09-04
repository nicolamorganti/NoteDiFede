"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { verifyUserRole } from "@/lib/supabase/server";

export type SettingsActionState<T = any> = {
  error: string | null;
  success: string | null;
  data?: T;
};

// 1. Aggiorna il profilo personale (visibile a tutti i ruoli)
export async function updateUserProfile(
  fullName: string,
  vocalRegister: string,
  preferredRite: "ambrosiano" | "romano" = "ambrosiano",
  newsletterEnabled: boolean = true,
): Promise<SettingsActionState> {
  if (!fullName) {
    return { error: "Il nome completo è obbligatorio.", success: null };
  }

  const { user, error: authError } = await verifyUserRole(["ospite", "cantore", "maestro", "responsabile"]);
  if (authError || !user) {
    return { error: authError || "Non autorizzato.", success: null };
  }

  const adminClient = createAdminSupabaseClient();
  const updatePayload: Record<string, any> = {
    full_name: fullName,
    vocal_register: vocalRegister,
    preferred_rite: preferredRite,
    newsletter_enabled: newsletterEnabled,
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await adminClient
    .from("profiles")
    .update(updatePayload)
    .eq("id", user.id);

  if (updateError) {
    // Se la colonna preferred_rite o newsletter_enabled non dovesse esistere nello schema DB, prova senza
    const { error: retryError } = await adminClient
      .from("profiles")
      .update({
        full_name: fullName,
        vocal_register: vocalRegister,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (retryError) {
      console.error("Errore aggiornamento profilo:", retryError);
      return { error: "Impossibile aggiornare il profilo.", success: null };
    }
  }

  return { error: null, success: "Profilo aggiornato con successo." };
}



// 2. Modifica/riordina l'elenco dei momenti liturgici (visibile solo ai Maestri)
export async function updateLiturgicalMomentsOrder(
  moments: { id: string; sort_order: number; name: string }[],
): Promise<SettingsActionState> {
  const { error: authError } = await verifyUserRole(["maestro", "responsabile"]);
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
  name: string,
): Promise<SettingsActionState> {
  if (!name || name.trim().length === 0) {
    return { error: "Il nome del momento non può essere vuoto.", success: null };
  }

  const { error: authError } = await verifyUserRole(["maestro", "responsabile"]);
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
  id: string,
): Promise<SettingsActionState> {
  const { error: authError } = await verifyUserRole(["maestro", "responsabile"]);
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

export async function restoreDefaultMomentsAction(): Promise<SettingsActionState> {
  const { error: authError } = await verifyUserRole(["maestro", "responsabile"]);
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
  targetUserId: string,
  role: "ospite" | "cantore" | "maestro" | "responsabile",
  vocalRegister: string,
): Promise<SettingsActionState> {
  const { error: authError } = await verifyUserRole(["maestro", "responsabile"]);
  if (authError) {
    return { error: authError, success: null };
  }

  if (role !== "ospite" && role !== "cantore" && role !== "maestro" && role !== "responsabile") {
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

// 7. Test manuale Newsletter "La Parola del Giorno" (Invia ESCLUSIVAMENTE all'email dell'account autenticato con il Rito specificato)
export async function testDailyWordNewsletterAction(
  rite: "ambrosiano" | "romano" = "ambrosiano"
): Promise<
  SettingsActionState<{ reflection: string; title: string; citation: string; usedModel: string; rite: string }>
> {
  const { user, error: authError } = await verifyUserRole(["maestro", "responsabile"]);
  if (authError || !user || !user.email) {
    return { error: authError || "Non autorizzato o email account non trovata.", success: null };
  }

  const emailToSend = user.email.trim();

  try {
    const { sendDailyWordNewsletter } = await import("@/lib/daily-word-newsletter");
    const result = await sendDailyWordNewsletter({ testEmail: emailToSend, rite });

    if (!result.success) {
      return { error: result.error || "Errore durante l'invio del test della newsletter.", success: null };
    }

    const riteName = rite === "romano" ? "Rito Romano" : "Rito Ambrosiano";

    return {
      error: null,
      success: `Email di test (${riteName}) inviata con successo al tuo indirizzo (${emailToSend})!`,
      data: {
        title: result.gospel.title,
        citation: result.gospel.gospelCitation,
        reflection: result.reflection,
        usedModel: result.usedModel,
        rite,
      },
    };
  } catch (err: any) {
    console.error("Errore test newsletter:", err);
    return { error: err.message || "Errore sconosciuto.", success: null };
  }
}

// 8. Recupera la bozza e i dati della newsletter per la Domenica successiva
export async function getSundayNewsletterDraftAction(
  rite: "ambrosiano" | "romano" = "ambrosiano"
): Promise<{
  error: string | null;
  cycleInfo: any;
  gospel: any;
  draft: {
    id: string;
    sunday_date: string;
    rite: "ambrosiano" | "romano";
    custom_prompt: string;
    reflection_title: string;
    reflection_text: string;
    is_enabled: boolean;
    last_edited_by_name: string | null;
    updated_at: string | null;
  };
  tableMissing?: boolean;
}> {
  const { user, error: authError } = await verifyUserRole(["maestro", "responsabile"]);
  if (authError || !user) {
    throw new Error(authError || "Non autorizzato.");
  }

  const {
    getSundayCycleInfo,
    fetchDailyGospel,
    DEFAULT_SUNDAY_PROMPT_TEMPLATE,
  } = await import("@/lib/daily-word-newsletter");

  const cycleInfo = getSundayCycleInfo();
  const gospel = await fetchDailyGospel(cycleInfo.targetSundayIso, rite);

  const defaultPrompt = DEFAULT_SUNDAY_PROMPT_TEMPLATE
    .replace(/{gospelTitle}/g, gospel.title)
    .replace(/{gospelCitation}/g, gospel.gospelCitation)
    .replace(/{gospelText}/g, gospel.gospelText);

  let draft = {
    id: `${cycleInfo.targetSundayIso}_${rite}`,
    sunday_date: cycleInfo.targetSundayIso,
    rite,
    custom_prompt: defaultPrompt,
    reflection_title: "✨ Commento al Vangelo della Domenica",
    reflection_text: "",
    is_enabled: false,
    last_edited_by_name: null as string | null,
    updated_at: null as string | null,
  };

  let tableMissing = false;

  try {
    const adminClient = createAdminSupabaseClient();
    const { data, error } = await adminClient
      .from("sunday_newsletter_drafts")
      .select("*")
      .eq("sunday_date", cycleInfo.targetSundayIso)
      .eq("rite", rite)
      .maybeSingle();

    if (error) {
      if (error.code === "42P01" || error.message?.includes("does not exist") || error.message?.includes("schema cache")) {
        tableMissing = true;
      } else {
        console.warn("Errore recupero sunday_newsletter_drafts:", error);
      }
    } else if (data) {
      const isOutdatedFallbackPrompt =
        data.custom_prompt &&
        data.custom_prompt.includes("In quel tempo Gesù parlava alle folle del Regno di Dio.");

      draft = {
        id: data.id,
        sunday_date: data.sunday_date,
        rite: data.rite,
        custom_prompt: isOutdatedFallbackPrompt ? defaultPrompt : (data.custom_prompt || defaultPrompt),
        reflection_title: data.reflection_title || "✨ Commento al Vangelo della Domenica",
        reflection_text: data.reflection_text || "",
        is_enabled: Boolean(data.is_enabled),
        last_edited_by_name: data.last_edited_by_name || null,
        updated_at: data.updated_at || null,
      };
    }
  } catch (err: any) {
    console.error("Errore fetch bozza domenicale:", err);
  }

  return {
    error: null,
    cycleInfo,
    gospel,
    draft,
    tableMissing,
  };
}

// 9. Genera la meditazione AI per la Domenica dato il prompt e il Vangelo festivo
export async function generateSundayReflectionAIAction(
  rite: "ambrosiano" | "romano",
  prompt: string
): Promise<{ error: string | null; reflection: string; usedModel: string }> {
  const { user, error: authError } = await verifyUserRole(["maestro", "responsabile"]);
  if (authError || !user) {
    return { error: authError || "Non autorizzato.", reflection: "", usedModel: "" };
  }

  try {
    const {
      getSundayCycleInfo,
      fetchDailyGospel,
      generateChristianPosture,
    } = await import("@/lib/daily-word-newsletter");

    const cycleInfo = getSundayCycleInfo();
    const gospel = await fetchDailyGospel(cycleInfo.targetSundayIso, rite);
    const { reflection, usedModel } = await generateChristianPosture(gospel, prompt);

    return { error: null, reflection, usedModel };
  } catch (err: any) {
    console.error("Errore generazione AI domenicale:", err);
    return { error: err.message || "Errore durante la generazione con AI.", reflection: "", usedModel: "" };
  }
}

// 10. Salva automaticamente la bozza della newsletter domenicale
export async function saveSundayNewsletterDraftAction(payload: {
  rite: "ambrosiano" | "romano";
  custom_prompt: string;
  reflection_title: string;
  reflection_text: string;
  is_enabled: boolean;
}): Promise<{ error: string | null; success: boolean; savedAt: string; author: string }> {
  const { user, profile, error: authError } = await verifyUserRole(["maestro", "responsabile"]);
  if (authError || !user) {
    return { error: authError || "Non autorizzato.", success: false, savedAt: "", author: "" };
  }

  const { getSundayCycleInfo } = await import("@/lib/daily-word-newsletter");
  const cycleInfo = getSundayCycleInfo();

  const authorName = (profile as any)?.full_name || (profile as any)?.username || user.email?.split("@")[0] || "Amministratore";
  const nowIso = new Date().toISOString();

  const record = {
    id: `${cycleInfo.targetSundayIso}_${payload.rite}`,
    sunday_date: cycleInfo.targetSundayIso,
    rite: payload.rite,
    custom_prompt: payload.custom_prompt,
    reflection_title: payload.reflection_title || "✨ Commento al Vangelo della Domenica",
    reflection_text: payload.reflection_text,
    is_enabled: payload.is_enabled,
    last_edited_by: user.id,
    last_edited_by_name: authorName,
    updated_at: nowIso,
  };

  try {
    const adminClient = createAdminSupabaseClient();
    const { error } = await adminClient
      .from("sunday_newsletter_drafts")
      .upsert(record, { onConflict: "id" });

    if (error) {
      if (error.code === "42P01" || error.message?.includes("does not exist") || error.message?.includes("schema cache")) {
        return {
          error: "Tabella database 'sunday_newsletter_drafts' non trovata. Esegui la migrazione SQL in Supabase.",
          success: false,
          savedAt: "",
          author: authorName,
        };
      }
      throw error;
    }

    return {
      error: null,
      success: true,
      savedAt: nowIso,
      author: authorName,
    };
  } catch (err: any) {
    console.error("Errore salvataggio bozza domenicale:", err);
    return {
      error: err.message || "Impossibile salvare la bozza.",
      success: false,
      savedAt: "",
      author: authorName,
    };
  }
}

// 11. Invia email di test per la bozza domenicale personalizzata
export async function testSundayNewsletterDraftAction(payload: {
  rite: "ambrosiano" | "romano";
  reflection_text: string;
  reflection_title: string;
}): Promise<SettingsActionState> {
  const { user, error: authError } = await verifyUserRole(["maestro", "responsabile"]);
  if (authError || !user || !user.email) {
    return { error: authError || "Non autorizzato o email account non trovata.", success: null };
  }

  try {
    const { getSundayCycleInfo, sendDailyWordNewsletter } = await import("@/lib/daily-word-newsletter");
    const cycleInfo = getSundayCycleInfo();

    const result = await sendDailyWordNewsletter({
      testEmail: user.email.trim(),
      rite: payload.rite,
      dateStr: cycleInfo.targetSundayIso,
      customReflection: payload.reflection_text,
      customTitle: payload.reflection_title,
    });

    if (!result.success) {
      return { error: result.error || "Errore durante l'invio dell'anteprima di test.", success: null };
    }

    const riteName = payload.rite === "romano" ? "Rito Romano" : "Rito Ambrosiano";
    return {
      error: null,
      success: `Email di test della Domenica (${riteName}) inviata con successo a ${user.email}!`,
    };
  } catch (err: any) {
    console.error("Errore test anteprima domenicale:", err);
    return { error: err.message || "Errore sconosciuto.", success: null };
  }
}



