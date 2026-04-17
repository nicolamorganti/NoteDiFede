export default function Home() {
  return (
    <main className="min-h-screen bg-stone-950 text-stone-50">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-5 py-16 sm:px-8 lg:px-12">
        <div className="inline-flex w-fit items-center rounded-full border border-amber-200/20 bg-amber-300/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-amber-200">
          Nuova Architettura
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="space-y-6">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-stone-400">
              Note di Fede
            </p>

            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Note di Fede - Nuova Versione
            </h1>

            <p className="max-w-2xl text-base leading-7 text-stone-300 sm:text-lg sm:leading-8">
              Una web app moderna per gestire canti, messe, spartiti e file
              audio con un&apos;esperienza mobile-first, veloce e pronta per il
              nuovo stack Next.js + Supabase.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur">
            <p className="text-sm font-medium text-amber-200">
              Stato del progetto
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-stone-300">
              <li>Next.js App Router inizializzato</li>
              <li>TypeScript, ESLint e Tailwind CSS configurati</li>
              <li>Archivio legacy separato e preservato</li>
              <li>Base pronta per integrazione con Supabase</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
