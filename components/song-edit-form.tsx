"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  deleteSongAction,
  type CatalogMutationFormState,
  updateSongAction,
} from "@/app/(dashboard)/canti/actions";
import type { SongListItem, MassMomentItem } from "@/lib/songs";
import { parseNotesAndLyrics } from "@/lib/songs";

const initialCatalogMutationFormState: CatalogMutationFormState = {
  error: null,
  success: null,
};

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full border border-[#b9c7b9] bg-white px-4 py-2 text-sm font-semibold text-[#596b61] transition hover:bg-[#eef4ef] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Aggiornamento..." : "Aggiorna canto"}
    </button>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Eliminazione..." : "Elimina canto"}
    </button>
  );
}

type SongEditFormProps = {
  song: SongListItem;
  allMoments: MassMomentItem[];
};

export function SongEditForm({ song, allMoments }: SongEditFormProps) {
  const [updateState, updateFormAction] = useActionState(
    updateSongAction,
    initialCatalogMutationFormState,
  );
  const [deleteState, deleteFormAction] = useActionState(
    deleteSongAction,
    initialCatalogMutationFormState,
  );

  const currentMomentIds = new Set(song.moments.map((m) => m.id));
  const parsed = parseNotesAndLyrics(song.notes);

  return (
    <div className="grid gap-3 border border-[#ddd2c2] bg-[#fffdfa] p-4">
      <form action={updateFormAction} className="grid gap-3">
        <input type="hidden" name="songId" value={song.id} />

        <div className="grid min-w-0 gap-3 xl:grid-cols-[0.22fr_0.39fr_0.39fr]">
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a6a58]">
              Codice
            </span>
            <input
              type="text"
              name="code"
              defaultValue={song.code ?? ""}
              className="rounded-2xl border border-[#d9cdbf] bg-white px-4 py-3 text-sm text-[#3f3933] outline-none transition focus:border-[#9b8361] focus:ring-4 focus:ring-[#efe4d2]"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a6a58]">
              Titolo
            </span>
            <input
              type="text"
              name="title"
              required
              defaultValue={song.title}
              className="rounded-2xl border border-[#d9cdbf] bg-white px-4 py-3 text-sm text-[#3f3933] outline-none transition focus:border-[#9b8361] focus:ring-4 focus:ring-[#efe4d2]"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a6a58]">
              Titolo alternativo
            </span>
            <input
              type="text"
              name="alternateTitle"
              defaultValue={song.alternateTitle ?? ""}
              className="rounded-2xl border border-[#d9cdbf] bg-white px-4 py-3 text-sm text-[#3f3933] outline-none transition focus:border-[#9b8361] focus:ring-4 focus:ring-[#efe4d2]"
            />
          </label>
        </div>

        <div className="grid gap-2 border-t border-[#e3d8c9] pt-4">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a6a58]">
            Momenti Liturgici Associati
          </span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 mt-1">
            {allMoments.map((moment) => (
              <label
                key={moment.id}
                className="flex items-center gap-2 rounded-xl border border-[#d9cdbf] bg-[#fdfbf7] p-2.5 text-xs text-[#3f3933] cursor-pointer hover:bg-[#f6eee0] transition"
              >
                <input
                  type="checkbox"
                  name="momentIds"
                  value={moment.id}
                  defaultChecked={currentMomentIds.has(moment.id)}
                  className="rounded border-[#d9cdbf] text-[#aa9576] focus:ring-[#aa9576] h-4 w-4"
                />
                <span className="font-medium text-[#4b3c2c]">{moment.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a6a58]">
              Note Liturgiche / Coro
            </span>
            <textarea
              name="notes"
              rows={5}
              defaultValue={parsed.notes}
              className="rounded-2xl border border-[#d9cdbf] bg-white px-4 py-3 text-sm text-[#3f3933] outline-none transition focus:border-[#9b8361] focus:ring-4 focus:ring-[#efe4d2]"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a6a58]">
              Testo del Canto (Lyrics)
            </span>
            <textarea
              name="lyrics"
              rows={5}
              defaultValue={parsed.lyrics}
              className="rounded-2xl border border-[#d9cdbf] bg-white px-4 py-3 text-sm text-[#3f3933] outline-none transition focus:border-[#9b8361] focus:ring-4 focus:ring-[#efe4d2]"
            />
          </label>
        </div>

        {updateState.error ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {updateState.error}
          </p>
        ) : null}

        {updateState.success ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {updateState.success}
          </p>
        ) : null}

        <SaveButton />
      </form>

      <form
        action={deleteFormAction}
        className="border-t border-[#e3d8c9] pt-3"
        onSubmit={(event) => {
          if (
            !window.confirm(
              "Eliminare questo canto con varianti, file e link collegati?",
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="songId" value={song.id} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#736556]">
            Elimina anche varianti, file caricati e link collegati.
          </p>
          <DeleteButton />
        </div>

        {deleteState.error ? (
          <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {deleteState.error}
          </p>
        ) : null}

        {deleteState.success ? (
          <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {deleteState.success}
          </p>
        ) : null}
      </form>
    </div>
  );
}
