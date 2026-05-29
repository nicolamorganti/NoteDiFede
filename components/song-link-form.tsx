"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createSongLinkAction,
  type CreateSongLinkFormState,
} from "@/app/(dashboard)/canti/actions";

const initialCreateSongLinkFormState: CreateSongLinkFormState = {
  error: null,
  success: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full bg-[#5b4a3b] px-4 py-2 text-sm font-semibold text-[#fbf7f2] transition hover:bg-[#6d5946] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Salvataggio..." : "Aggiungi link"}
    </button>
  );
}

type SongLinkFormProps = {
  songId: string;
};

export function SongLinkForm({ songId }: SongLinkFormProps) {
  const [state, formAction] = useActionState(
    createSongLinkAction,
    initialCreateSongLinkFormState,
  );

  return (
    <form
      action={formAction}
      className="grid gap-3 rounded-2xl border border-[#ddd2c2] bg-[#f7f2ea] p-4"
    >
      <input type="hidden" name="songId" value={songId} />

      <div className="grid min-w-0 gap-3 xl:grid-cols-[0.42fr_0.58fr]">
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a6a58]">
            Etichetta
          </span>
          <input
            type="text"
            name="label"
            placeholder="Es. Esempio coro su YouTube"
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
            placeholder="https://www.youtube.com/watch?v=..."
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
            defaultValue="youtube"
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
            defaultValue="ascolto"
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
          placeholder="Per esempio: versione vicina alla nostra tonalita', ritmo o stile"
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
          Utile quando non hai un MP3 interno ma vuoi tenere un esempio di
          ascolto, tutorial o riferimento.
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}
