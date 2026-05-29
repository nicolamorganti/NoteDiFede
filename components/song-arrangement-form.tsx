"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createArrangementAction,
  type CreateArrangementFormState,
} from "@/app/(dashboard)/canti/actions";

const initialCreateArrangementFormState: CreateArrangementFormState = {
  error: null,
  success: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full bg-[#d8c4a5] px-4 py-2 text-sm font-semibold text-[#4d4136] transition hover:bg-[#ccb592] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Salvataggio..." : "Aggiungi variante"}
    </button>
  );
}

type SongArrangementFormProps = {
  songId: string;
};

export function SongArrangementForm({ songId }: SongArrangementFormProps) {
  const [state, formAction] = useActionState(
    createArrangementAction,
    initialCreateArrangementFormState,
  );

  return (
    <form
      action={formAction}
      className="grid gap-3 rounded-2xl border border-[#ddd2c2] bg-[#f7f2ea] p-4"
    >
      <input type="hidden" name="songId" value={songId} />

      <div className="grid min-w-0 gap-3 xl:grid-cols-3">
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a6a58]">
            Nome variante
          </span>
          <input
            type="text"
            name="arrangementName"
            placeholder="Es. Versione coro"
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
            placeholder="Es. Do / Re / Mi bemolle"
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
            placeholder="Es. Organo / Chitarra"
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
          placeholder="Indicazioni utili per questa versione del brano"
          className="rounded-2xl border border-[#d9cdbf] bg-white px-4 py-3 text-sm text-[#3f3933] outline-none transition focus:border-[#9b8361] focus:ring-4 focus:ring-[#efe4d2]"
        />
      </label>

      {state.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.success}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#736556]">
          Questa variante sara&apos; il contenitore corretto per spartiti,
          accordi e file media in tonalita&apos; specifiche.
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}
