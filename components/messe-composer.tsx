"use client";

import { useState, useActionState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import type { MassDetails } from "@/lib/masses";
import type { SongListItem } from "@/lib/songs";
import { addSongToMassAction, removeSongFromMassAction } from "@/app/(dashboard)/messe/actions";

type MesseComposerProps = {
  massDetails: MassDetails;
  allSongs: SongListItem[];
};

const initialFormState = {
  error: null,
  success: null,
};

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-xl bg-[#5c4a37] p-2.5 text-[#fffdfa] hover:bg-[#4b3c2c] disabled:opacity-60 transition"
      title="Aggiungi Canto"
    >
      {pending ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      )}
    </button>
  );
}

function RemoveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full p-1.5 text-[#a89070] hover:text-rose-600 hover:bg-rose-50 disabled:opacity-60 transition"
      title="Rimuovi Canto"
    >
      {pending ? (
        <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
    </button>
  );
}

const STANDARD_MOMENTS = [
  "Ingresso",
  "Gloria",
  "Salmo",
  "Canto al Vangelo",
  "Dopo il Vangelo",
  "Offertorio",
  "Santo",
  "Mistero della Fede",
  "Spezzare del Pane",
  "Comunione",
  "Finale"
];

export function MesseComposer({ massDetails, allSongs }: MesseComposerProps) {
  // Stati Auth
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("nDF_user_role");
    }
    return null;
  });
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUser(session.user);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        if (profile) {
          setUserRole(profile.role);
          localStorage.setItem("nDF_user_role", profile.role);
        }
      } else {
        setUserRole(null);
        localStorage.removeItem("nDF_user_role");
      }
      setAuthLoading(false);
    }
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setCurrentUser(session.user);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        if (profile) {
          setUserRole(profile.role);
          localStorage.setItem("nDF_user_role", profile.role);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
        localStorage.removeItem("nDF_user_role");
      }
      setAuthLoading(false);
    });

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "nDF_user_role") {
        setUserRole(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const isAdmin = currentUser !== null && (userRole === "maestro" || userRole === "responsabile");

  const [selectedSongs, setSelectedSongs] = useState<Record<string, string>>({});
  
  const [addState, addAction] = useActionState(addSongToMassAction, initialFormState);
  const [removeState, removeAction] = useActionState(removeSongFromMassAction, initialFormState);

  const [addedMoments, setAddedMoments] = useState<string[]>([]);

  const visibleMoments = massDetails.moments.filter(({ moment, songs }) => {
    return (
      STANDARD_MOMENTS.includes(moment.name) ||
      songs.length > 0 ||
      addedMoments.includes(moment.id)
    );
  });

  const hiddenMoments = massDetails.moments.filter(({ moment }) => {
    return !visibleMoments.some((vm) => vm.moment.id === moment.id);
  });

  // Formatta la data
  const formattedDate = new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(massDetails.celebrationDate));

  const handleSelectChange = (momentId: string, value: string) => {
    setSelectedSongs((prev) => ({
      ...prev,
      [momentId]: value,
    }));
  };

  if (authLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#aa9576]/20 border-t-[#5c4a37]" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-[#e4dcce] bg-[#fffdfa] p-12 text-center max-w-xl mx-auto my-12 shadow-sm">
        <svg className="h-12 w-12 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="mt-4 font-serif text-xl font-normal text-[#3f3933]">Accesso Negato</h3>
        <p className="mt-2 text-sm text-[#736555] leading-relaxed">
          La composizione e la modifica della scaletta dei canti è riservata ai Maestri e Responsabili della Liturgia.
        </p>
        <div className="mt-6">
          <Link
            href="/messe"
            className="inline-flex items-center gap-2 rounded-full bg-[#5c4a37] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#4b3c2c]"
          >
            Torna alle Messe
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32">
      {/* Intestazione */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e4dcce] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/messe"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#aa9576] hover:text-[#5c4a37] uppercase tracking-wider transition"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Elenco Messe</span>
            </Link>
            <span className="text-[#aa9576]/30">|</span>
            <span className="rounded-full bg-[#f4efe6] px-2 py-0.5 text-[10px] font-bold text-[#736555] uppercase tracking-wide">
              Anno {massDetails.liturgicalYear}
            </span>
          </div>

          <h2 className="font-serif text-3xl font-normal text-[#3f3933]">
            Compositore Liturgico: {massDetails.title}
          </h2>
          <p className="text-sm text-[#736555] capitalize">
            {formattedDate}
          </p>
        </div>

        <Link
          href={`/messe/${massDetails.id}`}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#5c4a37] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#5c4a37]/10 transition hover:bg-[#4b3c2c] active:scale-[0.98]"
        >
          <span>Visualizza elenco canti</span>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </Link>
      </div>

      {/* Messaggi di Errore ed Info Generici */}
      {addState.error && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {addState.error}
        </p>
      )}
      {removeState.error && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {removeState.error}
        </p>
      )}

      {/* Flusso dei Momenti Liturgici */}
      <div className="space-y-6 max-w-4xl">
        {visibleMoments.map(({ moment, songs }) => {
          const selectedValue = selectedSongs[moment.id] ?? "";

          return (
            <div
              key={moment.id}
              className="grid gap-4 rounded-3xl border border-[#e4dcce] bg-[#fffdfa] p-5 shadow-sm sm:p-6"
            >
              {/* Riga Intestazione Momento */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#e4dcce]/30 pb-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f4efe6] text-xs font-bold text-[#736555] shadow-inner">
                    {moment.sortOrder}
                  </span>
                  <h3 className="font-serif text-lg font-normal text-[#3f3933]">
                    {moment.name}
                  </h3>
                </div>

                {/* Selettore rapido canto */}
                <form action={addAction} className="flex items-center gap-2 max-w-md w-full sm:w-auto">
                  <input type="hidden" name="massId" value={massDetails.id} />
                  <input type="hidden" name="momentId" value={moment.id} />

                  <select
                    name="songId"
                    value={selectedValue}
                    onChange={(e) => handleSelectChange(moment.id, e.target.value)}
                    required
                    className="rounded-xl border border-[#d9cdbf] bg-white px-3 py-2 text-xs text-[#3f3933] outline-none transition focus:border-[#9b8361] w-full sm:w-64"
                  >
                    <option value="">Seleziona un canto...</option>
                    {allSongs
                      .filter(
                        (song) =>
                          song.moments.some((m) => m.id === moment.id) ||
                          song.moments.length === 0,
                      )
                      .map((song) => {
                        const codePrefix = song.code ? `[${song.code}] ` : "";
                        return (
                          <option key={song.id} value={song.id}>
                            {codePrefix}
                            {song.title}
                          </option>
                        );
                      })}
                  </select>

                  <AddButton />
                </form>
              </div>

              {/* Lista dei canti inseriti in questo momento */}
              {songs.length === 0 ? (
                <p className="text-xs text-[#aa9576] italic py-2">
                  Nessun canto assegnato a questo momento liturgico.
                </p>
              ) : (
                <div className="space-y-2">
                  {songs.map((massSong) => {
                    const song = massSong.song;
                    return (
                      <div
                        key={massSong.id}
                        className="flex items-center justify-between rounded-2xl border border-[#e4dcce]/50 bg-[#fdfbf7] px-4 py-3 shadow-inner hover:bg-[#fbf9f5] transition"
                      >
                        <div className="min-w-0 flex items-center gap-3">
                          {song.code && (
                            <span className="rounded-lg bg-[#efe4d2] px-2 py-0.5 text-[10px] font-bold text-[#8c7a65]">
                              {song.code}
                            </span>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-[#3f3933] truncate">
                              {song.title}
                            </h4>
                            {song.alternateTitle && (
                              <p className="text-xs text-[#736555] truncate italic">
                                {song.alternateTitle}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Modifica canto */}
                          <a
                            href={`/canti?cantoId=${song.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full p-1.5 text-[#a89070] hover:text-[#5c4a37] hover:bg-[#f4efe6] transition"
                            title="Modifica canto (apri in una nuova scheda per aggiornare spartiti, testi o audio)"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </a>

                          {/* Rimuovi canto */}
                          <form action={removeAction}>
                            <input type="hidden" name="massId" value={massDetails.id} />
                            <input type="hidden" name="massSongId" value={massSong.id} />
                            <RemoveButton />
                          </form>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {hiddenMoments.length > 0 && (
          <div className="rounded-3xl border border-dashed border-[#d9cdbf] bg-[#fffdfa]/50 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-[#5c4a37]">Aggiungi altri momenti liturgici</h4>
              <p className="text-xs text-[#736555] mt-1">
                Seleziona uno dei momenti liturgici non presenti nel template principale per aggiungerlo a questa celebrazione.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value=""
                onChange={(e) => {
                  const id = e.target.value;
                  if (id) {
                    setAddedMoments((prev) => [...prev, id]);
                  }
                }}
                className="rounded-xl border border-[#d9cdbf] bg-white px-3 py-2 text-xs text-[#3f3933] outline-none transition focus:border-[#9b8361] w-full sm:w-56"
              >
                <option value="">Scegli un momento...</option>
                {hiddenMoments.map(({ moment }) => (
                  <option key={moment.id} value={moment.id}>
                    {moment.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
