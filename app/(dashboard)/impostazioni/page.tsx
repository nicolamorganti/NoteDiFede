"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import {
  updateUserProfile,
  updateLiturgicalMomentsOrder,
  addLiturgicalMoment,
  deleteLiturgicalMoment,
  restoreDefaultMomentsAction,
  updateUserRoleAndRegister,
  testDailyWordNewsletterAction,
} from "./actions";

type Profile = {
  id: string;
  username: string;
  full_name: string;
  role: "ospite" | "cantore" | "maestro" | "responsabile";
  vocal_register: string;
  preferred_rite?: "ambrosiano" | "romano";
  newsletter_enabled?: boolean;
  created_at?: string;
};

type Moment = {
  id: string;
  name: string;
  sort_order: number;
};

export default function ImpostazioniPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<"profilo" | "liturgia" | "coristi" | "newsletter">("profilo");
  const [loading, setLoading] = useState(true);

  // States for Profile Tab
  const [fullNameInput, setFullNameInput] = useState("");
  const [vocalRegisterInput, setVocalRegisterInput] = useState("nessuno");
  const [preferredRiteInput, setPreferredRiteInput] = useState<"ambrosiano" | "romano">("ambrosiano");
  const [newsletterEnabledInput, setNewsletterEnabledInput] = useState(true);
  const [profileMessage, setProfileMessage] = useState<{ error?: string; success?: string } | null>(null);
  const [profileUpdating, setProfileUpdating] = useState(false);

  // States for Liturgical Moments Tab
  const [moments, setMoments] = useState<Moment[]>([]);
  const [newMomentName, setNewMomentName] = useState("");
  const [momentsMessage, setMomentsMessage] = useState<{ error?: string; success?: string } | null>(null);
  const [momentsUpdating, setMomentsUpdating] = useState(false);
  const [hasMomentsChanges, setHasMomentsChanges] = useState(false);

  // States for Members Management Tab
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [membersMessage, setMembersMessage] = useState<{ error?: string; success?: string } | null>(null);

  // States for Newsletter Tab
  const [selectedTestRite, setSelectedTestRite] = useState<"ambrosiano" | "romano">("ambrosiano");
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState<{ error?: string; success?: string; preview?: any } | null>(null);

  // Load session and profiles
  useEffect(() => {
    async function loadSessionAndProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/");
          return;
        }

        // Nessun token manuale necessario grazie a SSR
        setCurrentUser(session.user);

        // Fetch my profile
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (error || !profile) {
          throw new Error("Impossibile caricare il profilo personale.");
        }

        setMyProfile(profile as Profile);
        setFullNameInput(profile.full_name || "");
        setVocalRegisterInput(profile.vocal_register || "nessuno");
        setNewsletterEnabledInput(profile.newsletter_enabled !== false);

        const savedRite = (profile.preferred_rite || (typeof window !== "undefined" ? localStorage.getItem("preferred_rite") : "ambrosiano") || "ambrosiano") as "ambrosiano" | "romano";
        setPreferredRiteInput(savedRite);
        setSelectedTestRite(savedRite);

        // If maestro or responsabile, load all data
        if (profile.role === "maestro" || profile.role === "responsabile") {
          await refreshAdminData();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadSessionAndProfile();
  }, [router]);


  async function refreshAdminData() {
    // 1. Fetch moments ordered by sort_order
    const { data: momentsData } = await supabase
      .from("mass_moments")
      .select("*")
      .order("sort_order", { ascending: true });
    
    if (momentsData) {
      setMoments(momentsData as Moment[]);
      setHasMomentsChanges(false);
    }

    // 2. Fetch all profiles for role management
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name", { ascending: true });

    if (profilesData) {
      setAllProfiles(profilesData as Profile[]);
    }
  }

  // --- Profile actions ---
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setProfileMessage(null);
    setProfileUpdating(true);

    try {
      const res = await updateUserProfile(fullNameInput, vocalRegisterInput, preferredRiteInput, newsletterEnabledInput);
      if (res.error) {
        setProfileMessage({ error: res.error });
      } else {
        setProfileMessage({ success: res.success || "Profilo modificato con successo." });
        setMyProfile((prev) =>
          prev
            ? { ...prev, full_name: fullNameInput, vocal_register: vocalRegisterInput, preferred_rite: preferredRiteInput, newsletter_enabled: newsletterEnabledInput }
            : null
        );
        if (typeof window !== "undefined") {
          localStorage.setItem("preferred_rite", preferredRiteInput);
        }
      }
    } catch (err) {
      setProfileMessage({ error: "Errore durante il salvataggio." });
    } finally {
      setProfileUpdating(false);
    }
  };


  // --- Moments actions ---
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newMoments = [...moments];
    const temp = newMoments[index].sort_order;
    newMoments[index].sort_order = newMoments[index - 1].sort_order;
    newMoments[index - 1].sort_order = temp;
    [newMoments[index], newMoments[index - 1]] = [newMoments[index - 1], newMoments[index]];
    setMoments(newMoments);
    setHasMomentsChanges(true);
  };

  const handleMoveDown = (index: number) => {
    if (index === moments.length - 1) return;
    const newMoments = [...moments];
    const temp = newMoments[index].sort_order;
    newMoments[index].sort_order = newMoments[index + 1].sort_order;
    newMoments[index + 1].sort_order = temp;
    [newMoments[index], newMoments[index + 1]] = [newMoments[index + 1], newMoments[index]];
    setMoments(newMoments);
    setHasMomentsChanges(true);
  };

  const handleMomentRename = (index: number, newName: string) => {
    const newMoments = [...moments];
    newMoments[index].name = newName;
    setMoments(newMoments);
    setHasMomentsChanges(true);
  };

  const handleSaveMomentsOrder = async () => {
    if (!currentUser) return;
    setMomentsMessage(null);
    setMomentsUpdating(true);

    try {
      const res = await updateLiturgicalMomentsOrder(moments);
      if (res.error) {
        setMomentsMessage({ error: res.error });
      } else {
        setMomentsMessage({ success: res.success || "Ordinamento salvato." });
        await refreshAdminData();
      }
    } catch (err) {
      setMomentsMessage({ error: "Errore durante il salvataggio dei momenti." });
    } finally {
      setMomentsUpdating(false);
    }
  };

  const handleAddMoment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newMomentName.trim()) return;
    setMomentsMessage(null);

    try {
      const res = await addLiturgicalMoment(newMomentName);
      if (res.error) {
        setMomentsMessage({ error: res.error });
      } else {
        setMomentsMessage({ success: res.success || "Momento aggiunto." });
        setNewMomentName("");
        await refreshAdminData();
      }
    } catch (err) {
      setMomentsMessage({ error: "Errore durante l'inserimento." });
    }
  };

  const handleDeleteMoment = async (id: string) => {
    if (!currentUser) return;
    if (!confirm("Sei sicuro di voler eliminare questo momento liturgico? L'operazione non può essere annullata.")) return;
    setMomentsMessage(null);

    try {
      const res = await deleteLiturgicalMoment(id);
      if (res.error) {
        setMomentsMessage({ error: res.error });
      } else {
        setMomentsMessage({ success: res.success || "Momento rimosso." });
        await refreshAdminData();
      }
    } catch (err) {
      setMomentsMessage({ error: "Errore durante l'eliminazione." });
    }
  };

  const handleRestoreDefaults = async () => {
    if (!currentUser) return;
    if (!confirm("Attenzione: questo eliminerà TUTTI i momenti liturgici correnti e ripristinerà i 15 momenti standard Ambrosiani. Questa azione fallirà se vi sono canti associati alle celebrazioni. Vuoi procedere?")) return;
    setMomentsMessage(null);

    try {
      const res = await restoreDefaultMomentsAction();
      if (res.error) {
        setMomentsMessage({ error: res.error });
      } else {
        setMomentsMessage({ success: res.success || "Default ripristinati." });
        await refreshAdminData();
      }
    } catch (err) {
      setMomentsMessage({ error: "Errore durante il ripristino." });
    }
  };

  // --- Members actions ---
  const handleUserChange = async (targetUserId: string, field: "role" | "register", value: string) => {
    if (!currentUser) return;
    setMembersMessage(null);

    const targetUser = allProfiles.find((p) => p.id === targetUserId);
    if (!targetUser) return;

    const updatedRole = field === "role" ? (value as any) : targetUser.role;
    const updatedRegister = field === "register" ? value : targetUser.vocal_register;

    // Aggiornamento ottimistico dell'UI
    setAllProfiles((prev) =>
      prev.map((p) =>
        p.id === targetUserId
          ? { ...p, role: updatedRole, vocal_register: updatedRegister }
          : p
      )
    );

    try {
      const res = await updateUserRoleAndRegister(targetUserId, updatedRole, updatedRegister);
      if (res.error) {
        setMembersMessage({ error: res.error });
        // Ripristina stato precedente ricaricando i dati
        await refreshAdminData();
      } else {
        setMembersMessage({ success: `Utente "${targetUser.full_name || targetUser.username}" aggiornato con successo.` });
      }
    } catch (err) {
      setMembersMessage({ error: "Errore durante l'aggiornamento dell'utente." });
      await refreshAdminData();
    }
  };

  // --- Newsletter actions ---
  const handleTestNewsletter = async (overrideRite?: "ambrosiano" | "romano") => {
    setNewsletterLoading(true);
    setNewsletterMessage(null);
    const riteToTest = overrideRite || selectedTestRite;

    try {
      const res = await testDailyWordNewsletterAction(riteToTest);
      if (res.error) {
        setNewsletterMessage({ error: res.error });
      } else {
        setNewsletterMessage({
          success: res.success || `Email inviata con successo al tuo indirizzo (${currentUser?.email})!`,
          preview: res.data,
        });
      }
    } catch (err: any) {
      setNewsletterMessage({ error: err.message || "Errore durante l'invio del test." });
    } finally {
      setNewsletterLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#aa9576] border-t-transparent" />
        <p className="text-sm font-medium text-[#736555] animate-pulse">Caricamento delle impostazioni...</p>
      </div>
    );
  }

  const isMaestro = myProfile?.role === "maestro" || myProfile?.role === "responsabile";

  if (!isMaestro) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-[#e4dcce] bg-[#fffdfa] p-12 text-center max-w-xl mx-auto my-12 shadow-sm">
        <svg className="h-12 w-12 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="mt-4 font-serif text-xl font-normal text-[#3f3933]">Accesso Negato</h3>
        <p className="mt-2 text-sm text-[#736555] leading-relaxed">
          Questa pagina è riservata esclusivamente ai Maestri e Responsabili della Liturgia.
        </p>
        <div className="mt-6">
          <Link
            href="/canti"
            className="inline-flex items-center gap-2 rounded-full bg-[#5c4a37] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#4b3c2c]"
          >
            Torna al Catalogo Canti
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      {/* Header Intestazione */}
      <div>
        <h2 className="font-serif text-2xl font-normal text-[#3f3933] sm:text-3xl">
          Impostazioni Generali
        </h2>
        <p className="text-sm text-[#736555] mt-1">
          Gestisci il tuo profilo vocale e configura le regole del coro liturgico.
        </p>
      </div>

      {/* Tabs di navigazione */}
      <div className="flex border-b border-[#ddd2c2] pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab("profilo")}
          className={`pb-3 text-sm font-semibold uppercase tracking-wider transition ${
            activeTab === "profilo"
              ? "border-b-2 border-[#5c4a37] text-[#5c4a37]"
              : "text-[#736555] hover:text-[#3f3933]"
          } mr-6 shrink-0`}
        >
          Profilo Personale
        </button>

        {isMaestro && (
          <>
            <button
              onClick={() => setActiveTab("liturgia")}
              className={`pb-3 text-sm font-semibold uppercase tracking-wider transition ${
                activeTab === "liturgia"
                  ? "border-b-2 border-[#5c4a37] text-[#5c4a37]"
                  : "text-[#736555] hover:text-[#3f3933]"
              } mr-6 shrink-0`}
            >
              Liturgia e Momenti
            </button>
            <button
              onClick={() => setActiveTab("coristi")}
              className={`pb-3 text-sm font-semibold uppercase tracking-wider transition ${
                activeTab === "coristi"
                  ? "border-b-2 border-[#5c4a37] text-[#5c4a37]"
                  : "text-[#736555] hover:text-[#3f3933]"
              } mr-6 shrink-0`}
            >
              Gestione Coristi
            </button>
            <button
              onClick={() => setActiveTab("newsletter")}
              className={`pb-3 text-sm font-semibold uppercase tracking-wider transition ${
                activeTab === "newsletter"
                  ? "border-b-2 border-[#5c4a37] text-[#5c4a37]"
                  : "text-[#736555] hover:text-[#3f3933]"
              } shrink-0`}
            >
              📬 Newsletter
            </button>
          </>
        )}
      </div>


      {/* 1. Tab Profilo Personale */}
      {activeTab === "profilo" && myProfile && (
        <div className="rounded-3xl border border-[#e4dcce] bg-[#fffdfa] p-6 shadow-md md:p-8">
          <h3 className="font-serif text-lg font-normal text-[#3f3933] mb-6">Il Mio Profilo</h3>
          
          <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-md">
            {profileMessage?.error && (
              <div className="rounded-2xl border border-red-200 bg-red-50/50 px-4 py-3 text-sm text-red-700">
                {profileMessage.error}
              </div>
            )}
            {profileMessage?.success && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-700">
                {profileMessage.success}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#6b5d4e]">
                Indirizzo Email / Account
              </label>
              <input
                type="text"
                disabled
                value={currentUser?.email || ""}
                className="w-full rounded-2xl border border-[#d9cdbf] bg-[#ede4d8]/40 px-4 py-3 text-sm text-[#736555] cursor-not-allowed outline-none"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="profile-fullname" className="text-xs font-semibold uppercase tracking-wider text-[#6b5d4e]">
                Nome e Cognome
              </label>
              <input
                id="profile-fullname"
                type="text"
                required
                value={fullNameInput}
                onChange={(e) => setFullNameInput(e.target.value)}
                className="w-full rounded-2xl border border-[#d9cdbf] bg-white px-4 py-3 text-sm text-[#3f3933] placeholder-[#aa9e90] outline-none focus:border-[#aa9576] focus:ring-4 focus:ring-[#f6eee0] transition duration-200"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="profile-register" className="text-xs font-semibold uppercase tracking-wider text-[#6b5d4e]">
                Sezione Vocale (Registro)
              </label>
              <select
                id="profile-register"
                value={vocalRegisterInput}
                onChange={(e) => setVocalRegisterInput(e.target.value)}
                className="w-full rounded-2xl border border-[#d9cdbf] bg-white px-4 py-3 text-sm text-[#3f3933] outline-none focus:border-[#aa9576] transition duration-200"
              >
                <option value="nessuno">Nessuno / Strumentista</option>
                <option value="soprano">Soprano</option>
                <option value="contralto">Contralto</option>
                <option value="tenore">Tenore</option>
                <option value="basso">Basso</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="profile-rite" className="text-xs font-semibold uppercase tracking-wider text-[#6b5d4e]">
                Rito Liturgico Predefinito
              </label>
              <select
                id="profile-rite"
                value={preferredRiteInput}
                onChange={(e) => setPreferredRiteInput(e.target.value as "ambrosiano" | "romano")}
                className="w-full rounded-2xl border border-[#d9cdbf] bg-white px-4 py-3 text-sm text-[#3f3933] outline-none focus:border-[#aa9576] transition duration-200"
              >
                <option value="ambrosiano">🕊️ Rito Ambrosiano (Diocesi di Milano)</option>
                <option value="romano">🏛️ Rito Romano (CEI Nazionale)</option>
              </select>
              <p className="text-[11px] text-[#8a755d]">
                Determina il rito per la Liturgia delle Ore e l&apos;edizione della newsletter quotidiana ricevuta al mattino.
              </p>
            </div>

            {/* Preferenze Newsletter */}
            <div className="p-4 rounded-2xl border border-[#ebdcc8] bg-[#fbf9f4] flex items-center justify-between gap-4">
              <div className="space-y-0.5 pr-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#6b5d4e] flex items-center gap-1.5">
                  <span>📬</span> Newsletter Quotidiana
                </span>
                <p className="text-xs text-[#3f3933] font-medium">
                  La Parola del Giorno
                </p>
                <p className="text-[11px] text-[#8a755d] leading-relaxed">
                  Ricevi ogni mattina alle ore 06:00 il Vangelo e la postura cristiana per oggi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNewsletterEnabledInput(!newsletterEnabledInput)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  newsletterEnabledInput ? "bg-[#5c4a37]" : "bg-[#d9cdbf]"
                }`}
                aria-label="Attiva o disattiva la newsletter quotidiana"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    newsletterEnabledInput ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>


            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#6b5d4e] block">
                Ruolo Corale Attivo
              </span>

              <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider border ${
                myProfile.role === "maestro" || myProfile.role === "responsabile"
                  ? "bg-amber-100 text-amber-800 border-amber-200"
                  : myProfile.role === "cantore"
                  ? "bg-blue-100 text-blue-800 border-blue-200"
                  : "bg-gray-100 text-gray-800 border-gray-200"
              }`}>
                {myProfile.role === "maestro" 
                  ? "Maestro Direttore" 
                  : myProfile.role === "responsabile"
                  ? "Responsabile Liturgia"
                  : myProfile.role === "cantore" 
                  ? "Cantore Corista" 
                  : "Ospite in Attesa di Abilitazione"}
              </span>
              {myProfile.role === "ospite" && (
                <p className="text-xs text-[#a04e4e] mt-2 italic">
                  * Nota: Come Ospite Generico non puoi ancora visualizzare le tracce di studio vocalizzate e scaricare i PDF unificati (Binder). Il Maestro ti abiliterà a breve.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={profileUpdating}
              className="rounded-2xl bg-[#5c4a37] px-6 py-3 text-sm font-semibold text-white shadow hover:bg-[#4b3c2c] transition duration-200 disabled:opacity-60"
            >
              {profileUpdating ? "Salvataggio..." : "Salva Profilo"}
            </button>
          </form>
        </div>
      )}

      {/* 2. Tab Liturgia e Momenti (Maestro) */}
      {activeTab === "liturgia" && isMaestro && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#e4dcce] bg-[#fffdfa] p-6 shadow-md md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-serif text-lg font-normal text-[#3f3933]">Configurazione Momenti Liturgici</h3>
                <p className="text-xs text-[#736555] mt-0.5">
                  Modifica l'ordinamento o rinomina inline i vari momenti della celebrazione.
                </p>
              </div>
              <button
                onClick={handleRestoreDefaults}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
              >
                Ripristina default Ambrosiani
              </button>
            </div>

            {momentsMessage?.error && (
              <div className="rounded-2xl border border-red-200 bg-red-50/50 px-4 py-3 text-sm text-red-700">
                {momentsMessage.error}
              </div>
            )}
            {momentsMessage?.success && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-700">
                {momentsMessage.success}
              </div>
            )}

            {/* Tabella Momenti */}
            <div className="overflow-hidden rounded-2xl border border-[#e4dcce] bg-white">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#fcfaf7] border-b border-[#e4dcce] text-xs font-bold uppercase tracking-wider text-[#736555]">
                    <th className="px-4 py-3 w-16 text-center">Ordine</th>
                    <th className="px-4 py-3">Nome Momento Liturgico</th>
                    <th className="px-4 py-3 w-28 text-center">Sposta</th>
                    <th className="px-4 py-3 w-16 text-center">Azione</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e4dcce]/40">
                  {moments.map((moment, index) => (
                    <tr key={moment.id} className="hover:bg-[#fcfaf7]/50 transition">
                      <td className="px-4 py-3 font-semibold text-[#8a755d] text-center">
                        {moment.sort_order}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={moment.name}
                          onChange={(e) => handleMomentRename(index, e.target.value)}
                          className="w-full border-b border-transparent hover:border-[#d9cdbf] focus:border-[#aa9576] bg-transparent py-1 text-[#3f3933] outline-none font-medium transition duration-150"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className="p-1.5 rounded-lg border border-[#d9cdbf] hover:bg-[#f6eee0] text-[#736555] disabled:opacity-30 disabled:hover:bg-transparent transition"
                            title="Sposta su"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleMoveDown(index)}
                            disabled={index === moments.length - 1}
                            className="p-1.5 rounded-lg border border-[#d9cdbf] hover:bg-[#f6eee0] text-[#736555] disabled:opacity-30 disabled:hover:bg-transparent transition"
                            title="Sposta giù"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDeleteMoment(moment.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Elimina momento"
                        >
                          <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {hasMomentsChanges && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveMomentsOrder}
                  disabled={momentsUpdating}
                  className="rounded-2xl bg-[#5c4a37] px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#4b3c2c] transition duration-200"
                >
                  {momentsUpdating ? "Salvataggio..." : "Salva Ordinamento e Nomi"}
                </button>
                <button
                  onClick={refreshAdminData}
                  className="rounded-2xl border border-[#d9cdbf] bg-white px-5 py-2.5 text-sm font-semibold text-[#736555] hover:bg-[#fdfbf7] transition"
                >
                  Annulla modifiche
                </button>
              </div>
            )}
          </div>

          {/* Form per aggiungere un momento */}
          <div className="rounded-3xl border border-[#e4dcce] bg-[#fffdfa] p-6 shadow-md max-w-md">
            <h4 className="font-serif text-base font-normal text-[#3f3933] mb-4">Nuovo Momento Liturgico</h4>
            <form onSubmit={handleAddMoment} className="space-y-4">
              <div className="space-y-1">
                <input
                  type="text"
                  required
                  placeholder="Es. Aspersione"
                  value={newMomentName}
                  onChange={(e) => setNewMomentName(e.target.value)}
                  className="w-full rounded-2xl border border-[#d9cdbf] bg-white px-4 py-3 text-sm text-[#3f3933] placeholder-[#aa9e90] outline-none focus:border-[#aa9576] focus:ring-4 focus:ring-[#f6eee0] transition duration-200"
                />
              </div>
              <button
                type="submit"
                className="rounded-2xl bg-[#5c4a37] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#4b3c2c] transition"
              >
                Aggiungi Momento
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Tab Gestione Coristi (Maestro) */}
      {activeTab === "coristi" && isMaestro && (
        <div className="rounded-3xl border border-[#e4dcce] bg-[#fffdfa] p-6 shadow-md md:p-8 space-y-6">
          <div>
            <h3 className="font-serif text-lg font-normal text-[#3f3933]">Amministrazione Coristi</h3>
            <p className="text-xs text-[#736555] mt-0.5">
              Promuovi gli utenti registrati e imposta la loro sezione vocale per consentire la riproduzione audio e i download.
            </p>
          </div>

          {membersMessage?.error && (
            <div className="rounded-2xl border border-red-200 bg-red-50/50 px-4 py-3 text-sm text-red-700">
              {membersMessage.error}
            </div>
          )}
          {membersMessage?.success && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-700">
              {membersMessage.success}
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-[#e4dcce] bg-white">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#fcfaf7] border-b border-[#e4dcce] text-xs font-bold uppercase tracking-wider text-[#736555]">
                  <th className="px-4 py-3">Nome Completo</th>
                  <th className="px-4 py-3">Username / Email</th>
                  <th className="px-4 py-3">Ruolo Corale</th>
                  <th className="px-4 py-3">Registro Vocale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e4dcce]/40">
                {allProfiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-[#fcfaf7]/50 transition">
                    <td className="px-4 py-3 font-semibold text-[#3f3933]">
                      {profile.full_name || <span className="text-[#aa9e90] italic">Senza nome</span>}
                    </td>
                    <td className="px-4 py-3 text-[#736555] font-mono text-xs">
                      {profile.username}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={profile.role}
                        onChange={(e) => handleUserChange(profile.id, "role", e.target.value)}
                        className={`rounded-xl border border-[#d9cdbf] bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#453e37] outline-none focus:border-[#aa9576] transition ${
                          profile.role === "maestro" || profile.role === "responsabile"
                            ? "text-amber-800 bg-amber-50 border-amber-200"
                            : profile.role === "cantore"
                            ? "text-blue-800 bg-blue-50 border-blue-200"
                            : "text-gray-800 bg-gray-50 border-gray-200"
                        }`}
                      >
                        <option value="ospite">Ospite (Bloccato)</option>
                        <option value="cantore">Cantore</option>
                        <option value="maestro">Maestro</option>
                        <option value="responsabile">Responsabile Liturgia</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={profile.vocal_register || "nessuno"}
                        onChange={(e) => handleUserChange(profile.id, "register", e.target.value)}
                        className="rounded-xl border border-[#d9cdbf] bg-white px-3 py-1.5 text-xs text-[#453e37] outline-none focus:border-[#aa9576] transition"
                      >
                        <option value="nessuno">Nessuno / Strumentista</option>
                        <option value="soprano">Soprano</option>
                        <option value="contralto">Contralto</option>
                        <option value="tenore">Tenore</option>
                        <option value="basso">Basso</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Tab Newsletter: La Parola del Giorno */}
      {activeTab === "newsletter" && isMaestro && (
        <div className="space-y-6">
          {/* Card Descrittiva */}
          <div className="rounded-3xl border border-[#e4dcce] bg-[#fffdfa] p-6 shadow-md md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ebdcc8] pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🕊️</span>
                  <h3 className="font-serif text-xl font-normal text-[#3f3933]">
                    La Parola del Giorno
                  </h3>
                </div>
                <p className="text-xs text-[#736555]">
                  Newsletter spirituale quotidiana inviata automaticamente a tutta la comunità registrata.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 shrink-0">
                <span>⏰</span>
                <span>Ogni mattina alle ore 06:00</span>
              </span>
            </div>

            {/* Indicatori di Funzionamento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border border-[#e8decb] bg-[#fbf8f4] space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#8a755d]">Vangelo Liturgico</span>
                <p className="text-xs text-[#3f3933] font-medium">
                  Estratto dalla Messa Ambrosiana / Liturgia delle Ore del giorno corrente.
                </p>
              </div>
              <div className="p-4 rounded-2xl border border-[#e8decb] bg-[#fbf8f4] space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#8a755d]">Postura Cristiana (AI)</span>
                <p className="text-xs text-[#3f3933] font-medium">
                  Sintesi incisiva di 50-100 parole: come impostare pensieri, scelte e sguardo al prossimo oggi.
                </p>
              </div>
              <div className="p-4 rounded-2xl border border-[#e8decb] bg-[#fbf8f4] space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#8a755d]">Canale di Consegna</span>
                <p className="text-xs text-[#3f3933] font-medium">
                  Invio affidabile tramite Resend API con grafica pergamena responsive.
                </p>
              </div>
            </div>

            {/* Modulo di Invio Test Manuale */}
            <div className="mt-8 pt-6 border-t border-[#ebdcc8] space-y-4">
              <div className="space-y-1">
                <h4 className="font-serif text-base font-bold text-[#5c4a37]">
                  🧪 Test di Invio Personale
                </h4>
                <p className="text-xs text-[#736555]">
                  Genera la postura cristiana con Gemini e invia l&apos;anteprima dell&apos;email di oggi <strong>esclusivamente al tuo account</strong> (<span className="font-mono text-[#5c4a37] font-semibold">{currentUser?.email}</span>).
                </p>
              </div>

              {/* Selettore Rito da Testare */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-[#e4dcce] bg-[#fbf8f4]">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-[#5c4a37]">Rito da Testare</span>
                  <p className="text-[11px] text-[#736555]">
                    Scegli se testare l&apos;edizione Ambrosiana o Romana per verificarne il Vangelo e la riflessione.
                  </p>
                </div>
                <div className="inline-flex rounded-xl bg-[#eee4d6] p-1 shrink-0 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedTestRite("ambrosiano")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      selectedTestRite === "ambrosiano"
                        ? "bg-[#5c4a37] text-white shadow-xs"
                        : "text-[#6b5d4e] hover:text-[#3f3933]"
                    }`}
                  >
                    🕊️ Ambrosiano
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTestRite("romano")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      selectedTestRite === "romano"
                        ? "bg-[#5c4a37] text-white shadow-xs"
                        : "text-[#6b5d4e] hover:text-[#3f3933]"
                    }`}
                  >
                    🏛️ Romano
                  </button>
                </div>
              </div>

              {newsletterMessage?.error && (
                <div className="rounded-2xl border border-red-200 bg-red-50/50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{newsletterMessage.error}</span>
                </div>
              )}

              {newsletterMessage?.success && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
                  <span>✅</span>
                  <span>{newsletterMessage.success}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <div className="flex-1 rounded-2xl border border-[#e4dcce] bg-[#fbf8f4] px-4 py-2.5 text-xs text-[#736555] flex items-center gap-2">
                  <span>👤</span>
                  <span>
                    Destinatario test: <strong className="text-[#3f3933]">{currentUser?.email}</strong> ({selectedTestRite === "romano" ? "Rito Romano" : "Rito Ambrosiano"})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleTestNewsletter(selectedTestRite)}
                  disabled={newsletterLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#5c4a37] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#4b3c2c] disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {newsletterLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Elaborazione e Invio...</span>
                    </>
                  ) : (
                    <>
                      <span>📨</span>
                      <span>Invia Test ({selectedTestRite === "romano" ? "Romano" : "Ambrosiano"}) a Me Stesso</span>
                    </>
                  )}
                </button>
              </div>
            </div>


            {/* Anteprima Contenuto Generato (se disponibile) */}
            {newsletterMessage?.preview && (
              <div className="mt-6 p-5 rounded-2xl border border-[#ebdcc8] bg-[#fbf9f4] space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-[#ebdcc8] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#92400e]">
                      Anteprima Testo Elaborato
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                      {newsletterMessage.preview.rite === "romano" ? "🏛️ Rito Romano" : "🕊️ Rito Ambrosiano"}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#8a755d]">
                    Modello: {newsletterMessage.preview.usedModel}
                  </span>
                </div>
                <div>
                  <h5 className="font-serif font-bold text-sm text-[#443729]">
                    {newsletterMessage.preview.title}
                  </h5>
                  <p className="text-xs text-[#8a755d] italic">
                    {newsletterMessage.preview.citation}
                  </p>
                </div>
                <div
                  className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/60 text-xs text-[#3f2f1f] leading-relaxed italic"
                  dangerouslySetInnerHTML={{
                    __html: `«${newsletterMessage.preview.reflection
                      .replace(/^«\s*/, "")
                      .replace(/\s*»$/, "")
                      .replace(
                        /\*\*(.*?)\*\*/g,
                        '<strong class="font-bold not-italic text-amber-900">$1</strong>'
                      )}»`,
                  }}
                />

              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

