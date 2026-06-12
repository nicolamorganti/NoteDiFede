"use client";

import { useState, useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import type { MassListItem } from "@/lib/masses";
import { createMassAction, deleteMassAction, updateMassAction } from "@/app/(dashboard)/messe/actions";
import { supabase } from "@/lib/supabase/client";

type MesseListProps = {
  initialMasses: MassListItem[];
};

const initialFormState = {
  error: null,
  success: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full bg-[#5c4a37] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#5c4a37]/10 transition hover:bg-[#4b3c2c] disabled:opacity-60"
    >
      {pending ? "Salvataggio..." : "Salva Celebrazione"}
    </button>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 disabled:opacity-60 transition"
      title="Elimina Celebrazione"
    >
      {pending ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      )}
    </button>
  );
}

export function MesseList({ initialMasses }: MesseListProps) {
  const [modalCreate, setModalCreate] = useState(false);
  const [modalEdit, setModalEdit] = useState<MassListItem | null>(null);
  
  const createFormRef = useRef<HTMLFormElement | null>(null);
  const editFormRef = useRef<HTMLFormElement | null>(null);

  // Stati Auth
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUser(session.user);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        if (profile) {
          setUserRole(profile.role);
        }
      }
      setAuthLoading(false);
    }
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setCurrentUser(session.user);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        if (profile) {
          setUserRole(profile.role);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const isAdmin = currentUser !== null && (userRole === "maestro" || userRole === "responsabile");

  const [createState, createAction] = useActionState(createMassAction, initialFormState);
  const [updateState, updateAction] = useActionState(updateMassAction, initialFormState);
  const [deleteState, deleteAction] = useActionState(deleteMassAction, initialFormState);

  // Resetta le form al successo delle azioni
  useEffect(() => {
    if (createState.success) {
      setTimeout(() => {
        setModalCreate(false);
      }, 0);
      createFormRef.current?.reset();
    }
  }, [createState]);

  useEffect(() => {
    if (updateState.success) {
      setTimeout(() => {
        setModalEdit(null);
      }, 0);
      editFormRef.current?.reset();
    }
  }, [updateState]);

  return (
    <div className="space-y-8 pb-32">
      {/* Intestazione */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-3xl font-normal text-[#3f3933]">
            Celebrazioni e Messe
          </h2>
          <p className="mt-1 text-sm text-[#736555]">
            Prepara le celebrazioni liturgiche, componi la scaletta dei canti e genera i foglietti per il coro.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setModalCreate(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#5c4a37] px-5 py-3 text-sm font-semibold text-[#fffdfa] shadow-lg shadow-[#5c4a37]/10 transition hover:bg-[#4b3c2c] hover:shadow-xl active:scale-[0.98]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Prepara Celebrazione</span>
          </button>
        )}
      </div>

      {/* Messaggi di Stato Eliminazione */}
      {deleteState.error && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {deleteState.error}
        </p>
      )}
      {deleteState.success && (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {deleteState.success}
        </p>
      )}

      {/* Griglia delle Messe */}
      {initialMasses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#d9cdbf] bg-[#fffdfa] p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-[#aa9576]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-4 font-serif text-lg font-normal text-[#3f3933]">Nessuna celebrazione preparata</h3>
          <p className="mt-2 text-sm text-[#736555] max-w-sm">
            Inizia preparando una nuova celebrazione (es. la Messa domenicale) per poi associarvi i canti.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {initialMasses.map((mass) => (
            <div
              key={mass.id}
              className="flex flex-col justify-between rounded-3xl border border-[#e4dcce] bg-[#fffdfa] p-6 shadow-sm transition hover:shadow-md hover:border-[#aa9576]/50"
            >
              <div className="space-y-4">
                {/* Data e Anno Liturgico */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#aa9576] tracking-wider uppercase">
                    {mass.createdAtLabel}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#f4efe6] px-2.5 py-0.5 text-[10px] font-bold text-[#736555] uppercase tracking-wide">
                      Anno {mass.liturgicalYear}
                    </span>
                    <span className="rounded-full bg-[#efece6] px-2 py-0.5 text-[10px] font-bold text-[#5c4a37]">
                      {mass.songCount} {mass.songCount === 1 ? "canto" : "canti"}
                    </span>
                  </div>
                </div>

                {/* Titolo e Note */}
                <div className="space-y-2">
                  <h3 className="font-serif text-xl font-normal text-[#3f3933] leading-snug">
                    {mass.title}
                  </h3>
                  {mass.notes && (
                    <p className="text-xs text-[#736555] line-clamp-3 leading-relaxed">
                      {mass.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Bottoni Azioni */}
              <div className="mt-6 flex items-center justify-between border-t border-[#e4dcce]/50 pt-4">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/messe/${mass.id}`}
                    className="inline-flex items-center justify-center gap-1 rounded-full bg-[#f4efe6] px-4 py-2 text-xs font-semibold text-[#5c4a37] transition hover:bg-[#eadcc8]"
                  >
                    <span>Apri elenco</span>
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>

                  {isAdmin && (
                    <Link
                      href={`/messe/${mass.id}/modifica`}
                      className="inline-flex items-center justify-center gap-1 rounded-full border border-[#d9cdbf] bg-white px-4 py-2 text-xs font-semibold text-[#736555] transition hover:bg-[#fdfbf7]"
                    >
                      <span>Componi</span>
                    </Link>
                  )}
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setModalEdit(mass)}
                      className="rounded-full bg-white border border-[#d9cdbf] p-2 text-[#736555] hover:bg-[#f4efe6] transition"
                      title="Modifica Celebrazione"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>

                    <form
                      action={deleteAction}
                      onSubmit={(e) => {
                        if (!window.confirm("Eliminare definitivamente questa celebrazione?")) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <input type="hidden" name="massId" value={mass.id} />
                      <DeleteButton />
                    </form>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALE: PREPARA CELEBRAZIONE */}
      {/* ========================================================================= */}
      {modalCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-3xl border border-[#e4dcce] bg-[#fffdfa] p-6 shadow-2xl my-8">
            <button
              onClick={() => setModalCreate(false)}
              className="absolute top-4 right-4 rounded-full bg-[#f4efe6] p-2 text-[#736555] hover:bg-[#eadcc8] transition"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <form ref={createFormRef} action={createAction} className="space-y-4">
              <div className="border-b border-[#e3d8c9] pb-3">
                <h3 className="text-lg font-serif text-[#3f3933]">Prepara Nuova Celebrazione</h3>
                <p className="text-xs text-[#736555]">
                  Inserisci i dettagli liturgici di base. Potrai comporre la scaletta subito dopo.
                </p>
              </div>

              {createState.error && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs text-rose-700">
                  {createState.error}
                </p>
              )}

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-[#5b5248]">Titolo Celebrazione</span>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="Es. Domenica delle Palme, Messa di Pasqua"
                  className="rounded-xl border border-[#d9cdbf] bg-white px-3.5 py-2.5 text-sm text-[#3f3933] outline-none transition focus:border-[#9b8361]"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-[#5b5248]">Anno Liturgico</span>
                  <select
                    name="liturgicalYear"
                    required
                    className="rounded-xl border border-[#d9cdbf] bg-white px-3.5 py-2.5 text-sm text-[#3f3933] outline-none transition focus:border-[#9b8361]"
                  >
                    <option value="A">Anno A</option>
                    <option value="B">Anno B</option>
                    <option value="C">Anno C</option>
                  </select>
                </label>

                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-[#5b5248]">Data della Celebrazione</span>
                  <input
                    type="date"
                    name="celebrationDate"
                    required
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="rounded-xl border border-[#d9cdbf] bg-white px-3.5 py-2.5 text-sm text-[#3f3933] outline-none transition focus:border-[#9b8361]"
                  />
                </label>
              </div>

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-[#5b5248]">Note Liturgiche / Avvisi Celebrazione</span>
                <textarea
                  name="notes"
                  rows={4}
                  placeholder="Annotazioni specifiche per la celebrazione..."
                  className="rounded-xl border border-[#d9cdbf] bg-white px-3.5 py-2.5 text-sm text-[#3f3933] outline-none transition focus:border-[#9b8361]"
                />
              </label>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#e3d8c9]">
                <button
                  type="button"
                  onClick={() => setModalCreate(false)}
                  className="rounded-full border border-[#d9cdbf] bg-white px-4 py-2 text-xs font-semibold text-[#5c4a37] hover:bg-[#fdfbf7]"
                >
                  Annulla
                </button>
                <SubmitButton />
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALE: MODIFICA MESSA */}
      {/* ========================================================================= */}
      {modalEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-3xl border border-[#e4dcce] bg-[#fffdfa] p-6 shadow-2xl my-8">
            <button
              onClick={() => setModalEdit(null)}
              className="absolute top-4 right-4 rounded-full bg-[#f4efe6] p-2 text-[#736555] hover:bg-[#eadcc8] transition"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <form ref={editFormRef} action={updateAction} className="space-y-4">
              <input type="hidden" name="massId" value={modalEdit.id} />

              <div className="border-b border-[#e3d8c9] pb-3">
                <h3 className="text-lg font-serif text-[#3f3933]">Modifica Celebrazione</h3>
                <p className="text-xs text-[#736555]">
                  Aggiorna i dettagli anagrafici della celebrazione liturgica.
                </p>
              </div>

              {updateState.error && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs text-rose-700">
                  {updateState.error}
                </p>
              )}

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-[#5b5248]">Titolo Celebrazione</span>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={modalEdit.title}
                  placeholder="Es. Domenica delle Palme, Messa di Pasqua"
                  className="rounded-xl border border-[#d9cdbf] bg-white px-3.5 py-2.5 text-sm text-[#3f3933] outline-none transition focus:border-[#9b8361]"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-[#5b5248]">Anno Liturgico</span>
                  <select
                    name="liturgicalYear"
                    required
                    defaultValue={modalEdit.liturgicalYear}
                    className="rounded-xl border border-[#d9cdbf] bg-white px-3.5 py-2.5 text-sm text-[#3f3933] outline-none transition focus:border-[#9b8361]"
                  >
                    <option value="A">Anno A</option>
                    <option value="B">Anno B</option>
                    <option value="C">Anno C</option>
                  </select>
                </label>

                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-[#5b5248]">Data della Celebrazione</span>
                  <input
                    type="date"
                    name="celebrationDate"
                    required
                    defaultValue={modalEdit.celebrationDate}
                    className="rounded-xl border border-[#d9cdbf] bg-white px-3.5 py-2.5 text-sm text-[#3f3933] outline-none transition focus:border-[#9b8361]"
                  />
                </label>
              </div>

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-[#5b5248]">Note Liturgiche / Avvisi Celebrazione</span>
                <textarea
                  name="notes"
                  rows={4}
                  defaultValue={modalEdit.notes ?? ""}
                  placeholder="Annotazioni specifiche per la celebrazione..."
                  className="rounded-xl border border-[#d9cdbf] bg-white px-3.5 py-2.5 text-sm text-[#3f3933] outline-none transition focus:border-[#9b8361]"
                />
              </label>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#e3d8c9]">
                <button
                  type="button"
                  onClick={() => setModalEdit(null)}
                  className="rounded-full border border-[#d9cdbf] bg-white px-4 py-2 text-xs font-semibold text-[#5c4a37] hover:bg-[#fdfbf7]"
                >
                  Annulla
                </button>
                <SubmitButton />
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
