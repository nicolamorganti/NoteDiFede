"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createSongAction,
  type CreateSongFormState,
} from "@/app/(dashboard)/canti/actions";
import type { MassMomentItem } from "@/lib/songs";

const initialCreateSongFormState: CreateSongFormState = {
  error: null,
  success: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full bg-[#5b4a3b] px-5 py-3 text-sm font-semibold text-[#fbf7f2] transition hover:bg-[#6d5946] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Salvataggio..." : "Salva canto"}
    </button>
  );
}

type SongCreateFormProps = {
  allMoments: MassMomentItem[];
};

export function SongCreateForm({ allMoments }: SongCreateFormProps) {
  const [state, formAction] = useActionState(
    createSongAction,
    initialCreateSongFormState,
  );

  return (
    <section className="rounded-3xl border border-[#ddd2c2] bg-[#fffdfa] p-5 shadow-sm sm:p-6">
      <div className="border-b border-[#e3d8c9] pb-4">
        <h2 className="text-lg font-semibold text-[#3f3933]">
          Inserisci un nuovo canto
        </h2>
        <p className="mt-1 text-xs leading-5 text-[#76695b]">
          Aggiungi un nuovo canto liturgico completando i dettagli qui sotto per arricchire il repertorio.
        </p>
      </div>

      <form action={formAction} className="mt-5 grid min-w-0 gap-4">
        <div className="grid min-w-0 gap-4 xl:grid-cols-[0.28fr_0.36fr_0.36fr]">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-[#5b5248]">Codice</span>
          <input
            type="text"
            name="code"
            placeholder="Es. 176/ex cd 150"
            className="rounded-2xl border border-[#d9cdbf] bg-white px-4 py-3 text-sm text-[#3f3933] outline-none transition focus:border-[#9b8361] focus:ring-4 focus:ring-[#efe4d2]"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-[#5b5248]">
            Titolo principale
          </span>
          <input
            type="text"
            name="title"
            required
            placeholder="Inserisci il titolo del canto"
            className="rounded-2xl border border-[#d9cdbf] bg-white px-4 py-3 text-sm text-[#3f3933] outline-none transition focus:border-[#9b8361] focus:ring-4 focus:ring-[#efe4d2]"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-[#5b5248]">
            Titolo alternativo
          </span>
          <input
            type="text"
            name="alternateTitle"
            placeholder="Secondo titolo o alias"
            className="rounded-2xl border border-[#d9cdbf] bg-white px-4 py-3 text-sm text-[#3f3933] outline-none transition focus:border-[#9b8361] focus:ring-4 focus:ring-[#efe4d2]"
          />
        </label>
        </div>

        <div className="grid gap-2 border-t border-[#e3d8c9] pt-4">
          <span className="text-sm font-semibold text-[#5b5248]">
            Momenti Liturgici Associati (Seleziona uno o più)
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
                  className="rounded border-[#d9cdbf] text-[#aa9576] focus:ring-[#aa9576] h-4 w-4"
                />
                <span className="font-medium text-[#4b3c2c]">{moment.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[#5b5248]">Note Liturgiche / Coro</span>
            <textarea
              name="notes"
              rows={6}
              placeholder="Informazioni aggiuntive, annotazioni liturgiche o appunti per il coro"
              className="rounded-2xl border border-[#d9cdbf] bg-white px-4 py-3 text-sm text-[#3f3933] outline-none transition focus:border-[#9b8361] focus:ring-4 focus:ring-[#efe4d2]"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[#5b5248]">Testo del Canto (Lyrics)</span>
            <textarea
              name="lyrics"
              rows={6}
              placeholder="Incolla il testo completo del canto liturgico..."
              className="rounded-2xl border border-[#d9cdbf] bg-white px-4 py-3 text-sm text-[#3f3933] outline-none transition focus:border-[#9b8361] focus:ring-4 focus:ring-[#efe4d2]"
            />
          </label>
        </div>

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

        <SubmitButton />
      </form>
    </section>
  );
}
