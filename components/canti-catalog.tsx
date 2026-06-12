"use client";

import { useState, useMemo, useRef, useEffect, useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { SongListItem, SongArrangementListItem, SongLinkListItem, MassMomentItem } from "@/lib/songs";
import { parseNotesAndLyrics } from "@/lib/songs";
import { createMassMomentAction, deleteMassMomentAction } from "@/app/(dashboard)/canti/actions";
import { SongCreateForm } from "./song-create-form";
import { supabase } from "@/lib/supabase/client";
import { SongEditForm } from "./song-edit-form";
import { SongArrangementForm } from "./song-arrangement-form";
import { SongFileForm } from "./song-file-form";
import { SongLinkForm } from "./song-link-form";
import { SongArrangementEditForm } from "./song-arrangement-edit-form";
import { SongLinkEditForm } from "./song-link-edit-form";
import { SongFileDeleteForm } from "./song-file-delete-form";

// Bottone di eliminazione con stato pending per la form
function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 disabled:opacity-60 transition"
      title="Elimina Momento"
    >
      {pending ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      )}
    </button>
  );
}

// Bottone di creazione con stato pending per la form
function CreateButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#5c4a37] px-4 py-2.5 text-xs font-semibold text-white shadow transition hover:bg-[#4b3c2c] disabled:opacity-60"
    >
      {pending ? "Aggiunta..." : "Aggiungi"}
    </button>
  );
}

type CantiCatalogProps = {
  initialSongs: SongListItem[];
  allMoments: MassMomentItem[];
};

type ActiveAudioTrack = {
  songTitle: string;
  partLabel: string;
  url: string;
};

type PreviewPdf = {
  title: string;
  url: string;
  fileName: string;
};

export function CantiCatalog({ initialSongs, allMoments }: CantiCatalogProps) {
  // Stati Auth
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
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
        }
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
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const isAdmin = currentUser !== null && (userRole === "maestro" || userRole === "responsabile");
  const isAuthorizedForRestrictedContent = currentUser !== null && (userRole === "cantore" || userRole === "maestro" || userRole === "responsabile");

  // Stati di ricerca e filtri
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKey, setSelectedKey] = useState("all");
  const [selectedMoment, setSelectedMoment] = useState("all");
  const [selectedAttachment, setSelectedAttachment] = useState("all");

  // Stati del Player Audio
  const [activeTrack, setActiveTrack] = useState<ActiveAudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  
  // State per l'espansione dei canti (accordion su mobile)
  const [expandedSongs, setExpandedSongs] = useState<Record<string, boolean>>({});

  // Stati delle Modali/Drawers dei Form
  const [modalCreateSong, setModalCreateSong] = useState(false);
  const [modalManageMoments, setModalManageMoments] = useState(false);
  const [modalEditSong, setModalEditSong] = useState<SongListItem | null>(null);
  const [modalCreateArrangement, setModalCreateArrangement] = useState<SongListItem | null>(null);
  const [modalEditArrangement, setModalEditArrangement] = useState<SongArrangementListItem | null>(null);
  const [modalCreateFile, setModalCreateFile] = useState<{ songId: string; arrangementId: string; songTitle: string } | null>(null);
  const [modalCreateLink, setModalCreateLink] = useState<SongListItem | null>(null);
  const [modalEditLink, setModalEditLink] = useState<SongLinkListItem | null>(null);

  // Riferimento form e stati delle azioni dei momenti liturgici
  const createFormRef = useRef<HTMLFormElement | null>(null);

  const [createState, createAction] = useActionState(
    createMassMomentAction,
    { error: null, success: null }
  );

  const [deleteState, deleteAction] = useActionState(
    deleteMassMomentAction,
    { error: null, success: null }
  );

  // Resetta la form di creazione al successo dell'azione
  useEffect(() => {
    if (createState.success && createFormRef.current) {
      createFormRef.current.reset();
    }
  }, [createState]);

  // Chiude la modale di modifica variante se la variante viene eliminata
  useEffect(() => {
    if (modalEditArrangement) {
      const exists = initialSongs.some((song) =>
        song.arrangements.some((arr) => arr.id === modalEditArrangement.id)
      );
      if (!exists) {
        setTimeout(() => {
          setModalEditArrangement(null);
        }, 0);
      }
    }
  }, [initialSongs, modalEditArrangement]);

  // Chiude la modale di modifica canto se il canto viene eliminato
  useEffect(() => {
    if (modalEditSong) {
      const exists = initialSongs.some((song) => song.id === modalEditSong.id);
      if (!exists) {
        setTimeout(() => {
          setModalEditSong(null);
        }, 0);
      }
    }
  }, [initialSongs, modalEditSong]);

  // Chiude la modale di modifica link se il link viene eliminato
  useEffect(() => {
    if (modalEditLink) {
      const exists = initialSongs.some((song) =>
        song.links.some((l) => l.id === modalEditLink.id)
      );
      if (!exists) {
        setTimeout(() => {
          setModalEditLink(null);
        }, 0);
      }
    }
  }, [initialSongs, modalEditLink]);

  // Stato per la Preview PDF
  const [previewPdf, setPreviewPdf] = useState<PreviewPdf | null>(null);

  // Riferimenti per l'audio HTML5
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Estrae dinamicamente tutte le tonalità musicali (musical key) per il filtro
  const allKeys = useMemo(() => {
    const keys = new Set<string>();
    initialSongs.forEach((song) => {
      song.arrangements.forEach((arr) => {
        if (arr.musicalKey && arr.musicalKey.trim()) {
          keys.add(arr.musicalKey.trim());
        }
      });
    });
    return Array.from(keys).sort();
  }, [initialSongs]);

  // Filtra la lista dei canti in base a ricerca e filtri
  const filteredSongs = useMemo(() => {
    return initialSongs.filter((song) => {
      // 1. Ricerca testuale
      const matchesSearch =
        searchTerm === "" ||
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.alternateTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.notes?.toLowerCase().includes(searchTerm.toLowerCase());

      // 2. Filtro Tonalità
      const matchesKey =
        selectedKey === "all" ||
        song.arrangements.some((arr) => arr.musicalKey === selectedKey);

      // 3. Filtro Momento Liturgico
      const matchesMoment =
        selectedMoment === "all" ||
        song.moments.some((moment) => moment.name === selectedMoment);

      // 4. Filtro Allegati
      let matchesAttachment = true;
      if (selectedAttachment !== "all") {
        const hasPdf = song.arrangements.some((arr) => arr.files.length > 0);
        const hasVocalParts = true; // Ogni arrangiamento ha sempre le tracce vocali mockate nel nostro frontend
        const hasExternalLinks = song.links.length > 0;

        if (selectedAttachment === "pdf") {
          matchesAttachment = hasPdf;
        } else if (selectedAttachment === "mp3") {
          matchesAttachment = hasVocalParts;
        } else if (selectedAttachment === "link") {
          matchesAttachment = hasExternalLinks;
        }
      }

      return matchesSearch && matchesKey && matchesMoment && matchesAttachment;
    });
  }, [initialSongs, searchTerm, selectedKey, selectedMoment, selectedAttachment]);

  // Gestione audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [activeTrack]);

  // Effetto per riprodurre o mettere in pausa l'audio
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, activeTrack]);

  // Gestisce la regolazione del volume
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleTrackSelect = (songTitle: string, part: { part: string; label: string; url: string }) => {
    if (!isAuthorizedForRestrictedContent) return;
    setActiveTrack({
      songTitle,
      partLabel: part.label,
      url: part.url,
    });
    setIsPlaying(true);
    setCurrentTime(0);
  };

  const toggleExpandSong = (songId: string) => {
    setExpandedSongs((prev) => ({
      ...prev,
      [songId]: !prev[songId],
    }));
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const freshEditSong = modalEditSong
    ? (initialSongs.find((s) => s.id === modalEditSong.id) || modalEditSong)
    : null;

  return (
    <div className="space-y-8 pb-32">
      {/* Intestazione Area Operativa */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-3xl font-normal text-[#3f3933]">
            Repertorio Canti Liturgici
          </h2>
          <p className="mt-1 text-sm text-[#736555]">
            Gestisci spartiti, accordi, link ed esercita le voci del coro per le celebrazioni.
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setModalManageMoments(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d9cdbf] bg-white px-5 py-3 text-sm font-semibold text-[#5c4a37] shadow-sm transition hover:bg-[#fdfbf7] hover:border-[#aa9576] active:scale-[0.98]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span>Gestisci Momenti</span>
            </button>

            <button
              onClick={() => setModalCreateSong(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#5c4a37] px-5 py-3 text-sm font-semibold text-[#fffdfa] shadow-lg shadow-[#5c4a37]/10 transition hover:bg-[#4b3c2c] hover:shadow-xl active:scale-[0.98]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Nuovo Canto</span>
            </button>
          </div>
        )}
      </div>

      {/* Pannello di Ricerca e Filtri */}
      <div className="rounded-3xl border border-[#e4dcce] bg-[#fffdfa] p-5 shadow-sm md:p-6">
        <div className="space-y-4">
          {/* Barra di ricerca principale */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#aa9e90]">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Cerca per titolo, codice o parole chiave delle note..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-[#d9cdbf] bg-white/70 py-3.5 pl-12 pr-4 text-sm text-[#3f3933] placeholder-[#aa9e90] outline-none transition duration-300 focus:border-[#aa9576] focus:bg-white focus:ring-4 focus:ring-[#f6eee0]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#aa9e90] hover:text-[#3f3933]"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Griglia dei filtri */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Filtro Tonalità */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#736555]">
                Tonalità Musicale
              </label>
              <select
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                className="w-full rounded-2xl border border-[#d9cdbf] bg-[#fffdfa] px-4 py-3 text-sm text-[#3f3933] outline-none transition focus:border-[#aa9576] focus:ring-4 focus:ring-[#f6eee0]"
              >
                <option value="all">Qualsiasi Tonalità</option>
                {allKeys.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Momento Liturgico */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#736555]">
                Momento Liturgico
              </label>
              <select
                value={selectedMoment}
                onChange={(e) => setSelectedMoment(e.target.value)}
                className="w-full rounded-2xl border border-[#d9cdbf] bg-[#fffdfa] px-4 py-3 text-sm text-[#3f3933] outline-none transition focus:border-[#aa9576] focus:ring-4 focus:ring-[#f6eee0]"
              >
                <option value="all">Tutti i Momenti</option>
                {allMoments.map((moment) => (
                  <option key={moment.id} value={moment.name}>
                    {moment.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Presenza Allegati */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#736555]">
                Allegati e Media
              </label>
              <select
                value={selectedAttachment}
                onChange={(e) => setSelectedAttachment(e.target.value)}
                className="w-full rounded-2xl border border-[#d9cdbf] bg-[#fffdfa] px-4 py-3 text-sm text-[#3f3933] outline-none transition focus:border-[#aa9576] focus:ring-4 focus:ring-[#f6eee0]"
              >
                <option value="all">Tutti i canti</option>
                <option value="pdf">Solo con Spartito/Accordi PDF</option>
                <option value="mp3">Solo con Tracce Vocali MP3</option>
                <option value="link">Solo con Link YouTube/Esterni</option>
              </select>
            </div>
          </div>

          {/* Contatore in tempo reale */}
          <div className="flex items-center justify-between border-t border-[#e4dcce]/60 pt-4 text-xs text-[#8a755d] font-medium uppercase tracking-wider">
            <span>
              Criteri selezionati: {searchTerm ? "Ricerca attiva" : "Nessuna ricerca"} • {selectedKey !== "all" ? `Tonalità ${selectedKey}` : "Tutte le tonalità"}
            </span>
            <span>
              {filteredSongs.length} {filteredSongs.length === 1 ? "canto trovato" : "canti trovati"}
            </span>
          </div>
        </div>
      </div>

      {/* Lista dei Canti */}
      {filteredSongs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#d9cdbf] bg-[#fffdfa]/50 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-[#aa9e90]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-4 font-serif text-lg font-medium text-[#4b3c2c]">Nessun canto trovato</h3>
          <p className="mt-2 text-sm text-[#8a755d]">
            Prova a modificare i termini di ricerca o i filtri inseriti in alto.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredSongs.map((song) => {
            const isExpanded = !!expandedSongs[song.id];

            return (
              <div
                key={song.id}
                className="group rounded-3xl border border-[#e4dcce] bg-[#fffdfa] p-5 shadow-sm transition-all duration-300 hover:border-[#aa9576] hover:shadow-md md:p-6"
              >
                {/* Header Canto */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Codice */}
                      {song.code && (
                        <span className="rounded-full bg-[#f4efe6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#7a6a58]">
                          Cod. {song.code}
                        </span>
                      )}
                      {/* Momenti Liturgici */}
                      {song.moments.length === 0 ? (
                        <span className="rounded-full border border-gray-200 bg-[#fdfbf7] px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                          Nessun momento
                        </span>
                      ) : (
                        song.moments.map((moment) => (
                          <span
                            key={moment.id}
                            className="rounded-full border border-[#aa9576]/20 bg-[#fdfbf7] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#aa9576]"
                          >
                            {moment.name}
                          </span>
                        ))
                      )}
                    </div>

                    <h3 className="font-serif text-2xl font-normal text-[#3f3933] group-hover:text-[#5c4a37] transition">
                      {song.title}
                    </h3>

                    {/* Titolo alternativo */}
                    {song.alternateTitle && (
                      <p className="text-sm font-medium text-[#7a6a58] italic">
                        Alias: {song.alternateTitle}
                      </p>
                    )}
                  </div>

                  {/* Azioni del canto */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {isAdmin && (
                      <button
                        onClick={() => setModalCreateArrangement(song)}
                        className="rounded-full border border-[#d9cdbf] bg-white px-4 py-2 text-xs font-semibold text-[#5c4a37] transition hover:bg-[#fdfbf7] hover:border-[#aa9576]"
                      >
                        + Variante
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => setModalEditSong(song)}
                        className="rounded-full p-2 text-[#aa9e90] transition hover:bg-[#fdfbf7] hover:text-[#5c4a37]"
                        title="Modifica o Elimina Canto"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                    {/* Pulsante Espandi su mobile */}
                    <button
                      onClick={() => toggleExpandSong(song.id)}
                      className="rounded-full p-2 text-[#aa9e90] transition hover:bg-[#fdfbf7] hover:text-[#3f3933] sm:hidden"
                    >
                      <svg
                        className={`h-5 w-5 transform transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Note e Testo del canto */}
                {(() => {
                  const { notes, lyrics } = parseNotesAndLyrics(song.notes);
                  if (!notes && !lyrics) return null;
                  return (
                    <div className="mt-3 space-y-3">
                      {notes && (
                        <p className="text-sm text-[#736555] leading-relaxed bg-[#fdfbf7] p-3 rounded-2xl border border-[#e4dcce]/30">
                          <span className="font-semibold text-[#8a755d] text-xs uppercase tracking-wider block mb-1">Appunti liturgici:</span>
                          {notes}
                        </p>
                      )}
                      {lyrics && (
                        <div className="text-xs text-[#736555] leading-relaxed bg-[#fbf9f5] p-3 rounded-2xl border border-[#e4dcce]/30 max-h-48 overflow-y-auto whitespace-pre-line">
                          <span className="font-semibold text-[#8a755d] text-xs uppercase tracking-wider block mb-1">Testo del canto:</span>
                          {lyrics}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Corpo del canto (Varianti, Link) - Sempre visibile su desktop, espandibile su mobile */}
                <div className={`mt-5 space-y-5 sm:block ${isExpanded ? "block" : "hidden"}`}>
                  {/* Sezione Varianti (Arrangiamenti) */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#aa9576]">
                      Arrangiamenti &amp; Spartiti ({song.arrangements.length})
                    </h4>

                    {song.arrangements.length === 0 ? (
                      <p className="text-xs text-[#8a755d] italic">
                        Nessuna variante inserita. Clicca &ldquo;+ Variante&rdquo; in alto a destra per creare una tonalità o una versione specifica per questo canto.
                      </p>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2">
                        {song.arrangements.map((arr) => (
                          <div
                            key={arr.id}
                            className="rounded-2xl border border-[#e4dcce]/70 bg-[#fdfbf7] p-4 space-y-3"
                          >
                            {/* Header Variante */}
                            <div className="flex items-center justify-between border-b border-[#e4dcce]/40 pb-2">
                              <div>
                                <h5 className="font-semibold text-sm text-[#3f3933]">
                                  {arr.arrangementName || "Versione base"}
                                </h5>
                                <div className="flex gap-2 text-xs text-[#736555] mt-0.5">
                                  {arr.musicalKey && (
                                    <span>Tonalità: <strong className="text-[#5c4a37]">{arr.musicalKey}</strong></span>
                                  )}
                                  {arr.instrumentation && (
                                    <span>• Strumento: <strong className="text-[#5c4a37]">{arr.instrumentation}</strong></span>
                                  )}
                                </div>
                              </div>
                              
                              {isAdmin && (
                                <button
                                  onClick={() => setModalEditArrangement(arr)}
                                  className="text-xs text-[#8a755d] hover:text-[#5c4a37] font-semibold"
                                >
                                  Modifica
                                </button>
                              )}
                            </div>

                            {/* Note Variante */}
                            {arr.notes && (
                              <p className="text-xs text-[#736555] italic bg-white/60 p-2 rounded-xl border border-[#e4dcce]/20">
                                {arr.notes}
                              </p>
                            )}

                            {/* Allegati PDF */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs font-semibold text-[#8a755d]">
                                <span>Spartiti ed Accordi:</span>
                                {isAdmin && (
                                  <button
                                    onClick={() => setModalCreateFile({ songId: song.id, arrangementId: arr.id, songTitle: song.title })}
                                    className="text-[11px] text-[#5c4a37] hover:underline"
                                  >
                                    + Aggiungi File
                                  </button>
                                )}
                              </div>

                              {arr.files.filter((f) => f.fileType.endsWith("_pdf")).length === 0 ? (
                                <p className="text-xs text-[#aa9e90] italic">Nessun file (spartito o accordi) allegato.</p>
                              ) : (
                                <div className="space-y-1.5">
                                  {arr.files.filter((f) => f.fileType.endsWith("_pdf")).map((file) => (
                                    <div
                                      key={file.id}
                                      className="flex items-center justify-between rounded-xl bg-white border border-[#e4dcce]/30 px-3 py-2 text-xs"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <svg className="h-4 w-4 shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                        <span className="font-medium text-[#3f3933] truncate" title={file.fileName}>
                                          {file.fileLabel} ({file.fileSizeLabel || "PDF"})
                                        </span>
                                      </div>
                                      
                                      <div className="flex items-center gap-2">
                                        {/* Visualizza PDF */}
                                        <button
                                          onClick={() => setPreviewPdf({ title: `${song.title} - ${file.fileLabel}`, url: file.previewHref, fileName: file.fileName })}
                                          className="text-[#5c4a37] hover:underline font-semibold"
                                        >
                                          Vedi
                                        </button>
                                        <span className="text-[#d9cdbf]">|</span>
                                        {/* Scarica PDF */}
                                        <a
                                          href={file.downloadHref}
                                          className="text-[#8a755d] hover:text-[#5c4a37] mr-1"
                                          title="Scarica PDF"
                                        >
                                          Scarica
                                        </a>
                                        {isAdmin && (
                                          <>
                                            <span className="text-[#d9cdbf]">|</span>
                                            <SongFileDeleteForm fileId={file.id} />
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Tracce Vocali MP3 */}
                            <div className="space-y-2 pt-1">
                              <div className="flex items-center justify-between text-xs font-semibold text-[#8a755d]">
                                <span>Tracce Vocali per lo Studio:</span>
                                {isAdmin && (
                                  <button
                                    onClick={() => setModalCreateFile({ songId: song.id, arrangementId: arr.id, songTitle: song.title })}
                                    className="text-[11px] text-[#5c4a37] hover:underline"
                                  >
                                    + Aggiungi Audio
                                  </button>
                                )}
                              </div>

                              {arr.files.filter((f) => f.fileType.startsWith("mp3_")).length === 0 ? (
                                <p className="text-xs text-[#aa9e90] italic">Nessuna traccia vocale allegata.</p>
                              ) : isAuthorizedForRestrictedContent ? (
                                <div className="space-y-1.5">
                                  {arr.files.filter((f) => f.fileType.startsWith("mp3_")).map((file) => {
                                    const isActive = activeTrack?.songTitle === song.title && activeTrack?.url === file.previewHref;
                                    return (
                                      <div
                                        key={file.id}
                                        className="flex items-center justify-between rounded-xl bg-white border border-[#e4dcce]/30 px-3 py-2 text-xs"
                                      >
                                        <button
                                          onClick={() => handleTrackSelect(song.title, { part: file.fileLabel, label: file.fileName, url: file.previewHref })}
                                          className={`flex items-center gap-2 text-left min-w-0 font-medium ${
                                            isActive ? "text-[#aa9576]" : "text-[#736555] hover:text-[#5c4a37]"
                                          }`}
                                        >
                                          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                          </svg>
                                          <span className="truncate" title={file.fileName}>
                                            {file.fileLabel} ({file.fileSizeLabel || "MP3"})
                                          </span>
                                        </button>
                                        
                                        {isAdmin && (
                                          <div className="flex items-center gap-2">
                                            <SongFileDeleteForm fileId={file.id} />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="space-y-1.5 opacity-60">
                                    {arr.files.filter((f) => f.fileType.startsWith("mp3_")).map((file) => (
                                      <div
                                        key={file.id}
                                        className="flex items-center gap-2 rounded-xl bg-white border border-[#e4dcce]/30 px-3 py-2 text-xs text-[#aa9e90] cursor-not-allowed"
                                      >
                                        <svg className="h-4 w-4 shrink-0 text-[#aa9e90]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        <span className="truncate">
                                          {file.fileLabel}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  <p className="text-[10px] text-[#b35959] italic font-semibold">
                                    {currentUser
                                      ? "🔒 Tracce riservate: il tuo account è in attesa di abilitazione come Cantore."
                                      : "🔒 Tracce riservate: effettua l'accesso per sbloccare il materiale di studio."}
                                  </p>
                                </div>
                              )}
                            </div>

                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sezione Link di Riferimento */}
                  <div className="border-t border-[#e4dcce]/40 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#aa9576]">
                        Riferimenti e Ascolto Esterno ({song.links.length})
                      </h4>
                      {isAdmin && (
                        <button
                          onClick={() => setModalCreateLink(song)}
                          className="text-xs font-semibold text-[#5c4a37] hover:underline"
                        >
                          + Aggiungi Link
                        </button>
                      )}
                    </div>

                    {song.links.length === 0 ? (
                      <p className="text-xs text-[#8a755d] italic">
                        Nessun link esterno configurato (es. YouTube o registrazione corale).
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {song.links.map((link) => (
                          <div
                            key={link.id}
                            className="inline-flex items-center gap-2 rounded-full border border-[#d9cdbf] bg-[#fdfbf7] px-3.5 py-1.5 text-xs text-[#3f3933]"
                          >
                            {/* Icona in base al provider */}
                            {link.provider === "youtube" ? (
                              <svg className="h-4 w-4 text-red-600 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                              </svg>
                            ) : (
                              <svg className="h-4 w-4 text-[#8a755d] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                            )}

                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium hover:underline text-[#3f3933] truncate max-w-[150px]"
                              title={link.label}
                            >
                              {link.label}
                            </a>

                            <span className="text-[10px] uppercase font-bold text-[#8a755d] bg-[#f4efe6] px-1.5 py-0.5 rounded-full shrink-0">
                              {link.linkType}
                            </span>

                            {isAdmin && (
                              <button
                                onClick={() => setModalEditLink(link)}
                                className="text-gray-400 hover:text-gray-700 ml-1 shrink-0"
                                title="Modifica link"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MOCK MP3 STICKY PLAYER BAR */}
      {/* ========================================================================= */}
      {activeTrack && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#fffdfa]/95 border-t border-[#e4dcce] px-4 py-3 shadow-2xl backdrop-blur-md transition-all duration-300 md:py-4">
          <div className="mx-auto max-w-6xl flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Tag audio nativo nascosto */}
            <audio ref={audioRef} src={activeTrack.url} />

            {/* Titolo e Traccia in riproduzione */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#5c4a37] text-white">
                <svg className={`h-5 w-5 ${isPlaying ? "animate-pulse" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#8a755d]">Esercitazione Parti</p>
                <p className="text-sm font-semibold text-[#3f3933] truncate max-w-[240px] md:max-w-[320px]" title={activeTrack.songTitle}>
                  {activeTrack.songTitle}
                </p>
                <p className="text-xs text-[#736555] truncate">{activeTrack.partLabel}</p>
              </div>
            </div>

            {/* Controlli di Riproduzione */}
            <div className="flex flex-col gap-2 flex-1 max-w-md md:mx-6">
              <div className="flex items-center justify-center gap-4">
                {/* Tempo Corrente */}
                <span className="text-[11px] font-mono text-[#736555] shrink-0">
                  {formatTime(currentTime)}
                </span>

                {/* Pulsante Play / Pausa */}
                <button
                  onClick={handlePlayPause}
                  className="h-9 w-9 flex items-center justify-center rounded-full bg-[#5c4a37] text-[#fffdfa] hover:bg-[#4b3c2c] transition shadow-md"
                >
                  {isPlaying ? (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 fill-current ml-0.5" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                {/* Tempo Totale */}
                <span className="text-[11px] font-mono text-[#736555] shrink-0">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Slider di Avanzamento */}
              <div className="relative group w-full flex items-center h-2">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => {
                    const time = parseFloat(e.target.value);
                    if (audioRef.current) audioRef.current.currentTime = time;
                    setCurrentTime(time);
                  }}
                  className="w-full h-1 bg-[#d9cdbf] rounded-lg appearance-none cursor-pointer accent-[#5c4a37]"
                />
              </div>
            </div>

            {/* Controlli di Regolazione (Volume e Chiusura) */}
            <div className="flex items-center justify-between md:justify-end gap-4 self-stretch md:self-auto border-t border-[#e4dcce]/40 pt-2.5 md:border-t-0 md:pt-0 shrink-0">
              {/* Regolazione Volume */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-[#736555] hover:text-[#3f3933] transition"
                >
                  {isMuted || volume === 0 ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => {
                    const vol = parseFloat(e.target.value);
                    setVolume(vol);
                    setIsMuted(false);
                  }}
                  className="w-16 h-1 bg-[#d9cdbf] rounded-lg appearance-none cursor-pointer accent-[#5c4a37]"
                />
              </div>

              <span className="hidden md:inline text-[#d9cdbf]">|</span>

              {/* Chiudi Player */}
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setActiveTrack(null);
                }}
                className="text-xs font-semibold text-[#8a755d] hover:text-red-700 transition"
              >
                Chiudi Player
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALE DI PREVIEW PDF (IFRAME E MOCK) */}
      {/* ========================================================================= */}
      {previewPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-[#e4dcce] bg-[#fffdfa] shadow-2xl">
            {/* Header Preview */}
            <div className="flex items-center justify-between border-b border-[#e4dcce] px-6 py-4">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#aa9576]">
                  {(() => {
                    const ext = previewPdf.fileName.substring(previewPdf.fileName.lastIndexOf(".")).toLowerCase();
                    if ([".png", ".jpg", ".jpeg", ".webp"].includes(ext)) return "Anteprima Immagine";
                    if ([".doc", ".docx", ".odt", ".rtf", ".txt"].includes(ext)) return "Anteprima Documento";
                    return "Anteprima PDF";
                  })()}
                </span>
                <h4 className="font-serif text-lg font-normal text-[#3f3933] truncate" title={previewPdf.title}>
                  {previewPdf.title}
                </h4>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={previewPdf.url}
                  download={previewPdf.fileName}
                  className="rounded-full border border-[#d9cdbf] bg-white px-4 py-2 text-xs font-semibold text-[#5c4a37] transition hover:bg-[#fdfbf7] hover:border-[#aa9576]"
                >
                  Scarica File
                </a>
                <button
                  onClick={() => setPreviewPdf(null)}
                  className="rounded-full bg-[#f4efe6] p-2 text-[#736555] hover:bg-[#eadcc8] hover:text-[#3f3933] transition"
                  title="Chiudi"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Area del Visualizzatore */}
            <div className="flex-1 bg-[#ede8df] relative p-4 flex items-center justify-center overflow-auto">
              {(() => {
                const ext = previewPdf.fileName.substring(previewPdf.fileName.lastIndexOf(".")).toLowerCase();
                
                // Immagini
                if ([".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
                  return (
                    <div className="max-w-full max-h-full overflow-auto flex items-center justify-center p-2 bg-white rounded-2xl border border-[#d9cdbf] shadow-inner">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewPdf.url}
                        alt={previewPdf.title}
                        className="max-w-full max-h-[70vh] object-contain rounded-lg"
                      />
                    </div>
                  );
                }
                
                // Documenti Word non visualizzabili nativamente
                if ([".doc", ".docx", ".odt", ".rtf"].includes(ext)) {
                  return (
                    <div className="bg-[#fffdfa] border border-[#e4dcce] rounded-3xl p-8 text-center max-w-md shadow-lg space-y-4">
                      <div className="mx-auto w-16 h-16 bg-[#efe4d2] text-[#8a755d] rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h5 className="font-serif text-lg text-[#3f3933]">Anteprima non disponibile</h5>
                      <p className="text-xs text-[#736555] leading-relaxed">
                        I documenti in formato Word o simili ({ext.toUpperCase()}) non possono essere aperti direttamente all&apos;interno del browser.
                      </p>
                      <a
                        href={previewPdf.url}
                        download={previewPdf.fileName}
                        className="inline-flex items-center gap-2 rounded-full bg-[#5c4a37] px-5 py-2.5 text-xs font-semibold text-white shadow transition hover:bg-[#4b3c2c]"
                      >
                        Scarica e Modifica
                      </a>
                    </div>
                  );
                }

                // File di testo
                if (ext === ".txt") {
                  return (
                    <iframe
                      src={previewPdf.url}
                      className="w-full h-full rounded-2xl border border-[#d9cdbf] shadow-inner bg-white p-4 font-mono text-xs"
                      title="Visualizzazione File di Testo"
                    />
                  );
                }

                // Default: PDF
                return (
                  <>
                    <iframe
                      src={`${previewPdf.url}#toolbar=0&navpanes=0`}
                      className="w-full h-full rounded-2xl border border-[#d9cdbf] shadow-inner bg-white"
                      title="Visualizzazione PDF"
                    />
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#fffdfa] border border-[#e4dcce] rounded-full px-4 py-2 text-xs text-[#736555] shadow-md pointer-events-none">
                      Se il file non viene visualizzato correttamente, clicca &ldquo;Scarica File&rdquo; in alto.
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALE: CREAZIONE CANTO */}
      {/* ========================================================================= */}
      {modalCreateSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl border border-[#e4dcce] bg-[#fffdfa] p-6 shadow-2xl my-8">
            <button
              onClick={() => setModalCreateSong(false)}
              className="absolute top-4 right-4 rounded-full bg-[#f4efe6] p-2 text-[#736555] hover:bg-[#eadcc8] transition"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="max-h-[80vh] overflow-y-auto pr-1">
              <SongCreateForm allMoments={allMoments} />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALE: MODIFICA CANTO */}
      {/* ========================================================================= */}
      {freshEditSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl border border-[#e4dcce] bg-[#fffdfa] p-6 shadow-2xl my-8">
            <button
              onClick={() => setModalEditSong(null)}
              className="absolute top-4 right-4 rounded-full bg-[#f4efe6] p-2 text-[#736555] hover:bg-[#eadcc8] transition"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="max-h-[80vh] overflow-y-auto pr-1 space-y-4">
              <div className="border-b border-[#e3d8c9] pb-3">
                <h3 className="text-lg font-serif text-[#3f3933]">Modifica Canto</h3>
                <p className="text-xs text-[#736555]">
                  Aggiorna i dettagli anagrafici del canto o eliminalo definitivamente.
                </p>
              </div>
              <SongEditForm song={freshEditSong} allMoments={allMoments} />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALE: CREAZIONE ARRANGIAMENTO (VARIANTE) */}
      {/* ========================================================================= */}
      {modalCreateArrangement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl border border-[#e4dcce] bg-[#fffdfa] p-6 shadow-2xl my-8">
            <button
              onClick={() => setModalCreateArrangement(null)}
              className="absolute top-4 right-4 rounded-full bg-[#f4efe6] p-2 text-[#736555] hover:bg-[#eadcc8] transition"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="max-h-[80vh] overflow-y-auto pr-1 space-y-4">
              <div className="border-b border-[#e3d8c9] pb-3">
                <h3 className="text-lg font-serif text-[#3f3933]">Aggiungi Arrangiamento / Variante</h3>
                <p className="text-xs text-[#736555]">
                  Inserisci una nuova variante del canto &ldquo;{modalCreateArrangement.title}&rdquo; (es. una tonalità o una strumentazione diversa).
                </p>
              </div>
              <SongArrangementForm songId={modalCreateArrangement.id} />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALE: MODIFICA ARRANGIAMENTO */}
      {/* ========================================================================= */}
      {modalEditArrangement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl border border-[#e4dcce] bg-[#fffdfa] p-6 shadow-2xl my-8">
            <button
              onClick={() => setModalEditArrangement(null)}
              className="absolute top-4 right-4 rounded-full bg-[#f4efe6] p-2 text-[#736555] hover:bg-[#eadcc8] transition"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="max-h-[80vh] overflow-y-auto pr-1 space-y-4">
              <div className="border-b border-[#e3d8c9] pb-3">
                <h3 className="text-lg font-serif text-[#3f3933]">Modifica Arrangiamento</h3>
                <p className="text-xs text-[#736555]">
                  Aggiorna i dettagli dell&apos;arrangiamento o eliminalo definitivamente.
                </p>
              </div>
              <SongArrangementEditForm arrangement={modalEditArrangement} />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALE: CARICAMENTO FILE PDF */}
      {/* ========================================================================= */}
      {modalCreateFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl border border-[#e4dcce] bg-[#fffdfa] p-6 shadow-2xl my-8">
            <button
              onClick={() => setModalCreateFile(null)}
              className="absolute top-4 right-4 rounded-full bg-[#f4efe6] p-2 text-[#736555] hover:bg-[#eadcc8] transition"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="max-h-[80vh] overflow-y-auto pr-1 space-y-4">
              <div className="border-b border-[#e3d8c9] pb-3">
                <h3 className="text-lg font-serif text-[#3f3933]">Carica Allegato</h3>
                <p className="text-xs text-[#736555]">
                  Carica uno spartito, accordi (PDF, immagine, Word) o traccia audio da associare a questa variante di &ldquo;{modalCreateFile.songTitle}&rdquo;.
                </p>
              </div>
              <SongFileForm arrangementId={modalCreateFile.arrangementId} songId={modalCreateFile.songId} />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALE: CREAZIONE LINK DI RIFERIMENTO */}
      {/* ========================================================================= */}
      {modalCreateLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl border border-[#e4dcce] bg-[#fffdfa] p-6 shadow-2xl my-8">
            <button
              onClick={() => setModalCreateLink(null)}
              className="absolute top-4 right-4 rounded-full bg-[#f4efe6] p-2 text-[#736555] hover:bg-[#eadcc8] transition"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="max-h-[80vh] overflow-y-auto pr-1 space-y-4">
              <div className="border-b border-[#e3d8c9] pb-3">
                <h3 className="text-lg font-serif text-[#3f3933]">Aggiungi Link Esterno</h3>
                <p className="text-xs text-[#736555]">
                  Aggiungi un link esterno (es. YouTube o registrazione corale) per &ldquo;{modalCreateLink.title}&rdquo;.
                </p>
              </div>
              <SongLinkForm songId={modalCreateLink.id} />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALE: MODIFICA LINK */}
      {/* ========================================================================= */}
      {modalEditLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl border border-[#e4dcce] bg-[#fffdfa] p-6 shadow-2xl my-8">
            <button
              onClick={() => setModalEditLink(null)}
              className="absolute top-4 right-4 rounded-full bg-[#f4efe6] p-2 text-[#736555] hover:bg-[#eadcc8] transition"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="max-h-[80vh] overflow-y-auto pr-1 space-y-4">
              <div className="border-b border-[#e3d8c9] pb-3">
                <h3 className="text-lg font-serif text-[#3f3933]">Modifica o Elimina Link</h3>
                <p className="text-xs text-[#736555]">
                  Aggiorna i dettagli del collegamento o eliminalo definitivamente.
                </p>
              </div>
              <SongLinkEditForm link={modalEditLink} />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALE: GESTIONE MOMENTI LITURGICI */}
      {/* ========================================================================= */}
      {modalManageMoments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl border border-[#e4dcce] bg-[#fffdfa] p-6 shadow-2xl my-8">
            <button
              onClick={() => setModalManageMoments(false)}
              className="absolute top-4 right-4 rounded-full bg-[#f4efe6] p-2 text-[#736555] hover:bg-[#eadcc8] transition"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="max-h-[80vh] overflow-y-auto pr-1 space-y-6">
              <div className="border-b border-[#e3d8c9] pb-3">
                <h3 className="text-lg font-serif text-[#3f3933]">Gestione Momenti Liturgici</h3>
                <p className="text-xs text-[#736555]">
                  Aggiungi o rimuovi momenti liturgici per la celebrazione (Rito Ambrosiano).
                </p>
              </div>

              {/* Messaggi di Stato Generali */}
              {createState.error && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs text-rose-700">
                  {createState.error}
                </p>
              )}
              {createState.success && (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs text-emerald-700">
                  {createState.success}
                </p>
              )}
              {deleteState.error && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs text-rose-700">
                  {deleteState.error}
                </p>
              )}
              {deleteState.success && (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs text-emerald-700">
                  {deleteState.success}
                </p>
              )}

              {/* Form di Inserimento */}
              <form ref={createFormRef} action={createAction} className="rounded-2xl border border-[#e4dcce] bg-[#fbf9f5] p-4 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#aa9576]">Aggiungi Nuovo Momento</h4>
                <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto] items-end">
                  <label className="grid gap-1">
                    <span className="text-xs font-semibold text-[#5b5248]">Nome Momento</span>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="Es. Aspersione, Dopo il Vangelo"
                      className="rounded-xl border border-[#d9cdbf] bg-white px-3 py-2 text-xs text-[#3f3933] outline-none transition focus:border-[#9b8361] focus:ring-4 focus:ring-[#efe4d2]"
                    />
                  </label>

                  <label className="grid gap-1">
                    <span className="text-xs font-semibold text-[#5b5248]">Ordinamento (Peso)</span>
                    <input
                      type="number"
                      name="sortOrder"
                      placeholder="Es. 16"
                      className="rounded-xl border border-[#d9cdbf] bg-white px-3 py-2 text-xs text-[#3f3933] outline-none transition focus:border-[#9b8361] focus:ring-4 focus:ring-[#efe4d2]"
                    />
                  </label>

                  <CreateButton />
                </div>
                <p className="text-[10px] text-[#8c7e6c] italic">
                  Lascia vuoto il peso di ordinamento per posizionare il momento automaticamente in coda alla celebrazione.
                </p>
              </form>

              {/* Lista Momenti Correnti */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#aa9576]">Momenti Liturgici Esistenti ({allMoments.length})</h4>
                <div className="divide-y divide-[#e4dcce] rounded-2xl border border-[#e4dcce] bg-white overflow-hidden shadow-sm">
                  {allMoments.map((moment) => (
                    <div key={moment.id} className="flex items-center justify-between p-3 hover:bg-[#fcfbf9] transition">
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f4efe6] text-xs font-bold text-[#736555] shadow-inner">
                          {moment.sortOrder}
                        </span>
                        <span className="text-xs font-semibold text-[#3f3933]">{moment.name}</span>
                      </div>

                      <form action={deleteAction}>
                        <input type="hidden" name="momentId" value={moment.id} />
                        <DeleteButton />
                      </form>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
