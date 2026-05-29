"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  deleteSongLinkAction,
  type CatalogMutationFormState,
  updateSongLinkAction,
} from "@/app/(dashboard)/canti/actions";
import type { SongLinkListItem } from "@/lib/songs";

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
      {pending ? "Aggiornamento..." : "Aggiorna link"}
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
      {pending ? "Eliminazione..." : "Elimina link"}
    </button>
  );
}

type SongLinkEditFormProps = {
  link: SongLinkListItem;
};

export function SongLinkEditForm({ link }: SongLinkEditFormProps) {
  const [updateState, updateFormAction] = useActionState(
    updateSongLinkAction,
    initialCatalogMutationFormState,
  );
  const [deleteState, deleteFormAction] = useActionState(
    deleteSongLinkAction,
    initialCatalogMutationFormState,
  );

  return (
    <div className="mt-4 grid gap-3 border-t border-[#e3d8c9] pt-4">
      <form action={updateFormAction} className="grid gap-3">
        <input type="hidden" name="linkId" value={link.id} />

        <div className="grid min-w-0 gap-3 xl:grid-cols-[0.42fr_0.58fr]">
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a6a58]">
              Etichetta
            </span>
            <input
              type="text"
              name="label"
              required
              defaultValue={link.label}
              className="rounded-2xl border border-[#d9cdbf] bg-white px-4 py-3 text-sm text-[#3f3933] outline-none transition focus:border-[#9b8361] focus:ring-4 focus:ring-[#efe4d2]"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a6a58]">
              URL
            </span>
            <input
              type="url"
              name="url"
              required
              defaultValue={link.url}
              className="rounded-2xl border border-[#d9cdbf] bg-white px-4 py-3 text-sm text-[#3f3933] outline-none transition focus:border-[#9b8361] focus:ring-4 focus:ring-[#efe4d2]"
            />
          </label>
        </div>

        <div className="grid min-w-0 gap-3 xl:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a6a58]">
              Provider
            </span>
            <select
              name="provider"
              defaultValue={link.provider}
              className="rounded-2xl border border-[#d9cdbf] bg-white px-4 py-3 text-sm text-[#3f3933] outline-none transition focus:border-[#9b8361] focus:ring-4 focus:ring-[#efe4d2]"
            >
              <option value="youtube">YouTube</option>
              <option value="generic">Link generico</option>
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a6a58]">
              Tipo link
            </span>
            <select
              name="linkType"
              defaultValue={link.linkType}
              className="rounded-2xl border border-[#d9cdbf] bg-white px-4 py-3 text-sm text-[#3f3933] outline-none transition focus:border-[#9b8361] focus:ring-4 focus:ring-[#efe4d2]"
            >
              <option value="ascolto">Ascolto</option>
              <option value="tutorial">Tutorial</option>
              <option value="riferimento">Riferimento</option>
            </select>
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a6a58]">
            Note
          </span>
          <textarea
            name="notes"
            rows={3}
            defaultValue={link.notes ?? ""}
            className="rounded-2xl border border-[#d9cdbf] bg-white px-4 py-3 text-sm text-[#3f3933] outline-none transition focus:border-[#9b8361] focus:ring-4 focus:ring-[#efe4d2]"
          />
        </label>

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
        className="grid min-w-0 gap-3 xl:grid-cols-[1fr_auto]"
        onSubmit={(event) => {
          if (!window.confirm("Eliminare questo link esterno?")) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="linkId" value={link.id} />
        <p className="text-sm text-[#736556]">
          Rimuove solo questo riferimento esterno.
        </p>
        <DeleteButton />

        {deleteState.error ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:col-span-2">
            {deleteState.error}
          </p>
        ) : null}

        {deleteState.success ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 sm:col-span-2">
            {deleteState.success}
          </p>
        ) : null}
      </form>
    </div>
  );
}
