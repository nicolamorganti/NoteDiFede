"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import type { SongListItem } from "@/lib/songs";

type PsalmCollectionsManagerProps = {
  isOpen: boolean;
  onClose: () => void;
  songs: SongListItem[];
  onRefreshCatalog: () => void;
};

type StorageFile = {
  name: string;
  id: string;
  metadata?: {
    size: number;
    mimetype: string;
  };
  created_at: string;
};

type LinkedSongFile = {
  id: string;
  song_id: string;
  file_name: string;
  storage_path: string;
  song_title?: string;
  song_code?: string;
};

export function PsalmCollectionsManager({
  isOpen,
  onClose,
  songs,
  onRefreshCatalog,
}: PsalmCollectionsManagerProps) {
  const [collections, setCollections] = useState<StorageFile[]>([]);
  const [linkedFiles, setLinkedFiles] = useState<LinkedSongFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // States for linking songs
  const [selectedSongs, setSelectedSongs] = useState<Record<string, string>>({}); // file_name -> song_id
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      // 1. List PDF files from storage folder 'salmi_raccolte'
      const { data: storageFiles, error: storageError } = await supabase.storage
        .from("note-di-fede")
        .list("salmi_raccolte", {
          limit: 100,
          sortBy: { column: "name", order: "asc" },
        });

      if (storageError) throw storageError;

      // Filter to keep only PDFs
      const pdfs = (storageFiles || []).filter((f) =>
        f.name.toLowerCase().endsWith(".pdf")
      ) as unknown as StorageFile[];

      setCollections(pdfs);

      // 2. Fetch all linked song files from the DB that are in 'salmi_raccolte'
      const { data: dbFiles, error: dbError } = await supabase
        .from("song_files")
        .select("id, song_id, file_name, storage_path, songs(title, code)")
        .like("storage_path", "salmi_raccolte/%");

      if (dbError) throw dbError;

      const formattedLinks: LinkedSongFile[] = (dbFiles || []).map((dbFile: any) => ({
        id: dbFile.id,
        song_id: dbFile.song_id,
        file_name: dbFile.file_name,
        storage_path: dbFile.storage_path,
        song_title: dbFile.songs?.title,
        song_code: dbFile.songs?.code,
      }));

      setLinkedFiles(formattedLinks);
    } catch (err: any) {
      console.error("Errore recupero dati salmi:", err);
      setError("Impossibile caricare i dati delle raccolte salmi.");
    } finally {
      setLoading(false);
    }
  }

  // Handle file upload
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.name.toLowerCase().endsWith(".pdf")) {
          throw new Error("Sono consentiti solo file PDF per le raccolte dei salmi.");
        }

        // Normalize filename (e.g. Salmi 1.pdf, Salmi_3.pdf, etc.)
        let normalizedName = file.name.trim();
        // Capitalize 'Salmi' if needed
        if (normalizedName.toLowerCase().startsWith("salmi")) {
          normalizedName = "Salmi" + normalizedName.substring(5);
        }

        const storagePath = `salmi_raccolte/${normalizedName}`;

        const { error: uploadError } = await supabase.storage
          .from("note-di-fede")
          .upload(storagePath, file, {
            contentType: "application/pdf",
            upsert: true,
          });

        if (uploadError) throw uploadError;
      }

      setSuccess("Raccolta PDF caricata con successo.");
      await fetchData();
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      console.error("Errore caricamento raccolta:", err);
      setError(err.message || "Errore durante il caricamento del file.");
    } finally {
      setUploading(false);
    }
  }

  // Handle linking a song to a collection
  async function handleLinkSong(fileName: string) {
    const songId = selectedSongs[fileName];
    if (!songId) return;

    setError(null);
    setSuccess(null);

    try {
      const storagePath = `salmi_raccolte/${fileName}`;

      // Check if already linked
      const alreadyLinked = linkedFiles.some(
        (lf) => lf.song_id === songId && lf.storage_path === storagePath
      );
      if (alreadyLinked) {
        throw new Error("Questo canto è già associato a questa raccolta.");
      }

      // 1. Find or create a default arrangement for this song
      let arrangementId: string | null = null;
      const { data: arrangements, error: arrError } = await supabase
        .from("song_arrangements")
        .select("id")
        .eq("song_id", songId)
        .order("created_at", { ascending: true });

      if (arrError) throw arrError;

      if (arrangements && arrangements.length > 0) {
        arrangementId = arrangements[0].id;
      } else {
        // Create default arrangement
        const { data: newArr, error: createArrError } = await supabase
          .from("song_arrangements")
          .insert({
            song_id: songId,
            arrangement_name: "Originale",
          })
          .select("id")
          .single();

        if (createArrError) throw createArrError;
        arrangementId = newArr.id;
      }

      // 2. Insert the song_file record
      const { error: insertError } = await supabase.from("song_files").insert({
        song_id: songId,
        arrangement_id: arrangementId,
        file_type: "spartito_pdf",
        storage_bucket: "note-di-fede",
        storage_path: storagePath,
        file_name: fileName,
        mime_type: "application/pdf",
      });

      if (insertError) throw insertError;

      setSuccess(`Canto associato con successo a ${fileName}.`);
      setSelectedSongs((prev) => ({ ...prev, [fileName]: "" }));
      await fetchData();
      onRefreshCatalog(); // Refresh parent view
    } catch (err: any) {
      console.error("Errore associazione canto:", err);
      setError(err.message || "Errore durante l'associazione del canto.");
    }
  }

  // Handle unlinking a song
  async function handleUnlinkSong(linkId: string, songTitle: string) {
    if (!confirm(`Sei sicuro di voler scollegare il canto "${songTitle}" da questa raccolta?`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const { error: deleteError } = await supabase
        .from("song_files")
        .delete()
        .eq("id", linkId);

      if (deleteError) throw deleteError;

      setSuccess("Associazione rimossa con successo.");
      await fetchData();
      onRefreshCatalog(); // Refresh parent view
    } catch (err: any) {
      console.error("Errore rimozione associazione:", err);
      setError("Impossibile scollegare il canto.");
    }
  }

  // Handle deleting an entire PDF collection
  async function handleDeleteCollection(fileName: string) {
    const links = linkedFiles.filter((lf) => lf.file_name === fileName);
    const hasLinks = links.length > 0;
    
    const message = hasLinks
      ? `ATTENZIONE: Questa raccolta ha ${links.length} canti associati. Eliminando la raccolta, scollegherai tutti questi canti. Vuoi procedere all'eliminazione definitiva del file "${fileName}"?`
      : `Sei sicuro di voler eliminare definitivamente la raccolta "${fileName}"?`;

    if (!confirm(message)) return;

    setError(null);
    setSuccess(null);

    try {
      const storagePath = `salmi_raccolte/${fileName}`;

      // 1. Delete from Supabase Storage
      const { error: storageError } = await supabase.storage
        .from("note-di-fede")
        .remove([storagePath]);

      if (storageError) throw storageError;

      // 2. DB rows will be automatically updated or we delete them
      const { error: dbDeleteError } = await supabase
        .from("song_files")
        .delete()
        .eq("storage_path", storagePath);

      if (dbDeleteError) throw dbDeleteError;

      setSuccess(`Raccolta "${fileName}" eliminata con successo.`);
      await fetchData();
      onRefreshCatalog(); // Refresh parent view
    } catch (err: any) {
      console.error("Errore eliminazione raccolta:", err);
      setError("Impossibile eliminare la raccolta.");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl rounded-3xl border border-[#e4dcce] bg-[#fffdfa] p-6 shadow-2xl my-8 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e3d8c9] pb-4">
          <div>
            <h3 className="text-2xl font-serif text-[#3f3933] font-normal">
              Gestione Raccolte Salmi
            </h3>
            <p className="text-xs text-[#736555] mt-1">
              Visualizza le raccolte PDF dei salmi, carica nuovi spartiti multipli o associa i canti del catalogo ai file corrispondenti.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-[#f4efe6] p-2.5 text-[#736555] hover:bg-[#eadcc8] transition"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 pr-1 space-y-6">
          {error && (
            <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700 border border-rose-100 flex items-start gap-3">
              <svg className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700 border border-emerald-100 flex items-start gap-3">
              <svg className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {/* Upload Area */}
          <div className="rounded-2xl border border-dashed border-[#d9cdbf] bg-[#fdfbf7] p-5 text-center">
            <h4 className="text-sm font-semibold text-[#5c4a37] mb-2 font-serif">
              Carica Nuova Raccolta Salmi (PDF)
            </h4>
            <p className="text-xs text-[#736555] mb-4">
              I file verranno inseriti nella cartella condivisa dei salmi. Esempio nome file: <code className="bg-[#f4efe6] px-1 rounded text-neutral-800">Salmi 4.pdf</code> o <code className="bg-[#f4efe6] px-1 rounded text-neutral-800">Salmi 5.pdf</code>.
            </p>
            <div className="flex justify-center">
              <label className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold text-white shadow transition cursor-pointer ${uploading ? 'bg-[#736555] cursor-wait' : 'bg-[#5c4a37] hover:bg-[#4b3c2c]'}`}>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>{uploading ? "Caricamento in corso..." : "Seleziona file PDF"}</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="application/pdf"
                  multiple
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Collections List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#736555]">
              <svg className="animate-spin h-8 w-8 text-[#5c4a37] mb-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm">Caricamento delle raccolte in corso...</span>
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-12 border border-[#e4dcce] rounded-3xl bg-[#fdfbf8]">
              <svg className="h-12 w-12 text-[#d0c2b2] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h5 className="font-serif text-base text-[#5c4a37] font-semibold">Nessuna raccolta trovata</h5>
              <p className="text-xs text-[#736555] mt-1">Carica un file PDF per iniziare a gestire le raccolte dei salmi.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {collections.map((file) => {
                const associatedSongs = linkedFiles.filter(
                  (lf) => lf.file_name === file.name
                );

                return (
                  <div
                    key={file.name}
                    className="rounded-2xl border border-[#e4dcce] bg-[#fffdfa] p-5 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition duration-300"
                  >
                    <div className="space-y-3">
                      {/* Header della card */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="rounded-lg bg-[#f4efe6] p-2 text-[#5c4a37]">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <h5 className="font-serif font-semibold text-sm text-[#3f3933]">
                              {file.name.replace(".pdf", "")}
                            </h5>
                            <p className="text-[10px] text-[#aa9e90]">
                              File: {file.name}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteCollection(file.name)}
                          className="rounded-full bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 transition"
                          title="Elimina Raccolta"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      {/* Lista canti associati */}
                      <div className="space-y-1.5">
                        <h6 className="text-[10px] font-semibold uppercase tracking-wider text-[#736555]">
                          Canti Associati ({associatedSongs.length})
                        </h6>
                        {associatedSongs.length === 0 ? (
                          <p className="text-xs italic text-[#aa9e90]">Nessun canto associato.</p>
                        ) : (
                          <div className="space-y-1">
                            {associatedSongs.map((song) => (
                              <div
                                key={song.id}
                                className="flex items-center justify-between gap-2 bg-[#fcf9f4] border border-[#e4dcce]/60 rounded-xl px-3 py-2 text-xs text-[#3f3933]"
                              >
                                <span className="font-medium truncate">
                                  {song.song_code ? `[${song.song_code}] ` : ""}{song.song_title}
                                </span>
                                <button
                                  onClick={() => handleUnlinkSong(song.id, song.song_title || "")}
                                  className="text-[#aa9e90] hover:text-rose-600 p-0.5 rounded transition"
                                  title="Scollega"
                                >
                                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Dropdown associazione */}
                    <div className="pt-3 border-t border-[#e4dcce]/40 flex items-center gap-2">
                      <select
                        value={selectedSongs[file.name] || ""}
                        onChange={(e) =>
                          setSelectedSongs((prev) => ({
                            ...prev,
                            [file.name]: e.target.value,
                          }))
                        }
                        className="flex-1 rounded-xl border border-[#d9cdbf] bg-[#fffdfa] px-3 py-2 text-xs text-[#3f3933] outline-none focus:border-[#aa9576] transition"
                      >
                        <option value="">Associa un canto...</option>
                        {songs.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.code ? `[${s.code}] ` : ""}{s.title}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleLinkSong(file.name)}
                        disabled={!selectedSongs[file.name]}
                        className="rounded-xl bg-[#5c4a37] px-3.5 py-2 text-xs font-semibold text-white shadow hover:bg-[#4b3c2c] disabled:opacity-50 transition shrink-0"
                      >
                        Collega
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#e3d8c9] pt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-full bg-[#5c4a37] px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#4b3c2c] transition"
          >
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
}
