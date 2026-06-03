"use client";

import { useState, useActionState } from "react";
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

export function MesseComposer({ massDetails, allSongs }: MesseComposerProps) {
  const [selectedSongs, setSelectedSongs] = useState<Record<string, string>>({});
  
  const [addState, addAction] = useActionState(addSongToMassAction, initialFormState);
  const [removeState, removeAction] = useActionState(removeSongFromMassAction, initialFormState);

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
          <span>Visualizza Cruscotto Coro</span>
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
        {massDetails.moments.map(({ moment, songs }) => {
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
                    {allSongs.map((song) => {
                      const codePrefix = song.code ? `[${song.code}] ` : "";
                      return (
                        <option key={song.id} value={song.id}>
                          {codePrefix}{song.title}
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

                        {/* Rimuovi canto */}
                        <form action={removeAction}>
                          <input type="hidden" name="massId" value={massDetails.id} />
                          <input type="hidden" name="massSongId" value={massSong.id} />
                          <RemoveButton />
                        </form>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
