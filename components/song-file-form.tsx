"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  createSongFileAction,
  type CreateSongFileFormState,
} from "@/app/(dashboard)/canti/actions";

const initialCreateSongFileFormState: CreateSongFileFormState = {
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
      {pending ? "Caricamento..." : "Carica file"}
    </button>
  );
}

type SongFileFormProps = {
  arrangementId: string;
  songId: string;
};

export function SongFileForm({ arrangementId, songId }: SongFileFormProps) {
  const [state, formAction] = useActionState(
    createSongFileAction,
    initialCreateSongFileFormState,
  );
  const [selectedType, setSelectedType] = useState("spartito_pdf");

  const isPdf = selectedType.endsWith("_pdf");
  const acceptMime = isPdf 
    ? "application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.oasis.opendocument.text,text/plain,application/rtf" 
    : "audio/*";
  const fileLabel = isPdf ? "Documento o Immagine" : "Traccia Audio (MP3, M4A, ecc.)";

  return (
    <form
      action={formAction}
      className="grid gap-3 rounded-2xl border border-[#ddd2c2] bg-[#f7f2ea] p-4"
    >
      <input type="hidden" name="arrangementId" value={arrangementId} />
      <input type="hidden" name="songId" value={songId} />

      <div className="grid min-w-0 gap-3 xl:grid-cols-[0.4fr_0.6fr]">
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a6a58]">
            Tipo file
          </span>
          <select
            name="fileType"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-2xl border border-[#d9cdbf] bg-white px-4 py-3 text-sm text-[#3f3933] outline-none transition focus:border-[#9b8361] focus:ring-4 focus:ring-[#efe4d2]"
          >
            <option value="spartito_pdf">Spartito PDF</option>
            <option value="accordi_pdf">Accordi PDF</option>
            <option value="mp3_completo">Traccia Completa MP3</option>
            <option value="mp3_soprano">Soprano MP3</option>
            <option value="mp3_contralto">Contralto MP3</option>
            <option value="mp3_tenore">Tenore MP3</option>
            <option value="mp3_basso">Basso MP3</option>
            <option value="mp3_organo">Organo MP3</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a6a58]">
            {fileLabel}
          </span>
          <input
            type="file"
            name="file"
            accept={acceptMime}
            className="rounded-2xl border border-[#d9cdbf] bg-white px-4 py-3 text-sm text-[#3f3933] outline-none transition file:mr-3 file:rounded-full file:border-0 file:bg-[#eadcc8] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#6e5a45] focus:border-[#9b8361] focus:ring-4 focus:ring-[#efe4d2]"
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#736556]">
          Supportiamo file PDF e tracce audio (MP3, M4A, ecc.) fino a 50MB per l&apos;archiviazione di spartiti e lo studio delle parti vocali.
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}
