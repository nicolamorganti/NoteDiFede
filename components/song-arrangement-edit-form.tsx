"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  deleteArrangementAction,
  type CatalogMutationFormState,
  updateArrangementAction,
} from "@/app/(dashboard)/canti/actions";
import type { SongArrangementListItem } from "@/lib/songs";

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
      {pending ? "Aggiornamento..." : "Aggiorna variante"}
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
      {pending ? "Eliminazione..." : "Elimina variante"}
    </button>
  );
}

type SongArrangementEditFormProps = {
  arrangement: SongArrangementListItem;
};

export function SongArrangementEditForm({
  arrangement,
}: SongArrangementEditFormProps) {
  const [updateState, updateFormAction] = useActionState(
    updateArrangementAction,
    initialCatalogMutationFormState,
  );
  const [deleteState, deleteFormAction] = useActionState(
    deleteArrangementAction,
    initialCatalogMutationFormState,
  );

  return (
    <div className="mt-4 grid gap-3 border border-[#e3d8c9] bg-[#f7f2ea] p-4">
      <form action={updateFormAction} className="grid gap-3">
        <input type="hidden" name="arrangementId" value={arrangement.id} />

        <div className="grid min-w-0 gap-3 xl:grid-cols-3">
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a6a58]">
              Nome variante
            </span>
            <input
              type="text"
              name="arrangementName"
              defaultValue={arrangement.arrangementName ?? ""}
              className="rounded-2xl border border-[#d9cdbf] bg-white px-4 py-3 text-sm text-[#3f3933] outline-none transition focus:border-[#9b8361] focus:ring-4 focus:ring-[#efe4d2]"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a6a58]">
              Tonalita&apos;
            </span>
            <input
              type="text"
              name="musicalKey"
              defaultValue={arrangement.musicalKey ?? ""}
              className="rounded-2xl border border-[#d9cdbf] bg-white px-4 py-3 text-sm text-[#3f3933] outline-none transition focus:border-[#9b8361] focus:ring-4 focus:ring-[#efe4d2]"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a6a58]">
              Strumentazione
            </span>
            <input
              type="text"
              name="instrumentation"
              defaultValue={arrangement.instrumentation ?? ""}
              className="rounded-2xl border border-[#d9cdbf] bg-white px-4 py-3 text-sm text-[#3f3933] outline-none transition focus:border-[#9b8361] focus:ring-4 focus:ring-[#efe4d2]"
            />
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a6a58]">
            Note variante
          </span>
          <textarea
            name="notes"
            rows={3}
            defaultValue={arrangement.notes ?? ""}
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
        className="border-t border-[#e3d8c9] pt-3"
        onSubmit={(event) => {
          if (
            !window.confirm(
              "Eliminare questa variante con spartiti e accordi collegati?",
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="arrangementId" value={arrangement.id} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#736556]">
            Elimina anche spartiti e accordi collegati a questa variante.
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
