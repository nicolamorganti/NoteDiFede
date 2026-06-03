"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  deleteSongFileAction,
  type CatalogMutationFormState,
} from "@/app/(dashboard)/canti/actions";

const initialCatalogMutationFormState: CatalogMutationFormState = {
  error: null,
  success: null,
};

function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Eliminazione..." : "Elimina"}
    </button>
  );
}

type SongFileDeleteFormProps = {
  fileId: string;
};

export function SongFileDeleteForm({ fileId }: SongFileDeleteFormProps) {
  const [state, formAction] = useActionState(
    deleteSongFileAction,
    initialCatalogMutationFormState,
  );

  return (
    <form
      action={formAction}
      className="grid gap-2"
      onSubmit={(event) => {
        if (!window.confirm("Eliminare definitivamente questo allegato?")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="fileId" value={fileId} />
      <DeleteButton />

      {state.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {state.success}
        </p>
      ) : null}
    </form>
  );
}
