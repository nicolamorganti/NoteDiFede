import { Metadata } from "next";
import Link from "next/link";
import { APP_VERSION } from "@/lib/version";

export const metadata: Metadata = {
  title: "Informativa sulla Privacy | Note di Fede",
  description:
    "Informativa sul trattamento dei dati personali e tutela della privacy per la piattaforma liturgica Note di Fede.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(155,131,97,0.12),_transparent_50%),linear-gradient(180deg,_#fdfbf7_0%,_#f6eee0_60%,_#ebdcb9_100%)] px-4 py-12 text-[#3f3933] font-sans antialiased">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Intestazione */}
        <div className="flex items-center justify-between border-b border-[#d8c5ad] pb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-[#d8c5ad] bg-white/70 px-4 py-2 text-xs font-semibold text-[#5c4a37] shadow-xs transition hover:bg-white hover:border-[#aa9576] active:scale-95"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Torna alla Home
          </Link>

          <span className="rounded-full bg-[#f4ebd9] border border-[#d8c5ad] px-3 py-1 text-[11px] font-mono font-bold text-[#5c4a37]">
            Note di Fede • {APP_VERSION}
          </span>
        </div>

        {/* Titolo Principale */}
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8a755d]">
            Tutela dei Dati & Trasparenza
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#2c241c] tracking-tight">
            Informativa sul Trattamento dei Dati Personali
          </h1>
          <p className="text-sm font-serif italic text-[#6b5d4e]">
            Ai sensi degli artt. 13 e 14 del Regolamento Generale sulla Protezione dei Dati (GDPR - UE 2016/679)
          </p>
          <div className="h-[1px] w-24 bg-gradient-to-r from-[#aa9576] to-transparent mt-2" />
        </div>

        {/* Contenuto Informativa */}
        <div className="rounded-3xl border border-[#e4dcce] bg-[#fffdfa]/95 p-6 sm:p-10 shadow-xl shadow-[#8a755d]/10 backdrop-blur-sm space-y-8 leading-relaxed text-sm text-[#4a3e30]">
          {/* 1. Premessa e Finalità Pastorale */}
          <section className="space-y-2">
            <h2 className="font-serif text-lg font-bold text-[#2c241c] flex items-center gap-2">
              <span className="text-[#8a755d]">1.</span> Finalità del Progetto e Titolare del Trattamento
            </h2>
            <p>
              <strong>Note di Fede</strong> è una piattaforma web comunitaria, pastorale e no-profit ideata per il servizio
              liturgico, la preghiera quotidiana e la catalogazione dei canti sacri a supporto dei cori e dei fedeli.
            </p>
            <p>
              Il trattamento dei dati personali avviene nel rispetto dei principi di correttezza, liceità, trasparenza e di
              tutela della riservatezza e dei diritti degli iscritti.
            </p>
          </section>

          {/* 2. Dati Raccolti */}
          <section className="space-y-2">
            <h2 className="font-serif text-lg font-bold text-[#2c241c] flex items-center gap-2">
              <span className="text-[#8a755d]">2.</span> Quali Dati Raccogliamo
            </h2>
            <p>Raccogliamo unicamente i dati strettamente necessari all&apos;erogazione del servizio:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>
                <strong>Dati identificativi di base:</strong> Nome e cognome, indirizzo email e password (cifrata in modo
                irreversibile). Nel caso di accesso con Google, riceviamo da Google esclusivamente l&apos;indirizzo email e il
                nome associato al profilo.
              </li>
              <li>
                <strong>Dati per il servizio corale e liturgico:</strong> Ruolo nel coro (ospite, cantore, maestro,
                responsabile), registro vocale (soprano, contralto, tenore, basso, organo) e rito liturgico preferito
                (Ambrosiano o Romano).
              </li>
              <li>
                <strong>Iscrizione alla meditazione quotidiana:</strong> Solo se richiesta esplicitamente dall&apos;utente,
                l&apos;indirizzo email viene utilizzato per recapitare ogni mattina la riflessione evangelica de <em>&quot;La Parola del Giorno&quot;</em>.
              </li>
            </ul>
          </section>

          {/* 3. Nessuna Commercializzazione né Profilazione */}
          <section className="space-y-2">
            <h2 className="font-serif text-lg font-bold text-[#2c241c] flex items-center gap-2">
              <span className="text-[#8a755d]">3.</span> Nessuna Cessione a Terzi né Profilazione
            </h2>
            <p>
              I tuoi dati personali <strong>non saranno mai venduti, ceduti, affittati o comunicati a terzi per scopi commerciali o pubblicitari</strong>.
              L&apos;applicazione è interamente priva di annunci pubblicitari, tracker di profilazione commerciale o strumenti di monetizzazione.
            </p>
          </section>

          {/* 4. Infrastruttura e Conservazione */}
          <section className="space-y-2">
            <h2 className="font-serif text-lg font-bold text-[#2c241c] flex items-center gap-2">
              <span className="text-[#8a755d]">4.</span> Conservazione e Sicurezza dei Dati
            </h2>
            <p>
              I dati sono conservati su database PostgreSQL gestiti tramite il provider cloud <strong>Supabase</strong>,
              ospitati in data center situati all&apos;interno dell&apos;Unione Europea.
            </p>
            <p>
              L&apos;accesso ai dati è protetto da criteri avanzati di <strong>Row Level Security (RLS)</strong>, connessioni
              cifrate HTTPS/TLS e controlli di autenticazione a più livelli.
            </p>
          </section>

          {/* 5. Diritto all'Oblio e Cancellazione */}
          <section className="space-y-2">
            <h2 className="font-serif text-lg font-bold text-[#2c241c] flex items-center gap-2">
              <span className="text-[#8a755d]">5.</span> I tuoi Diritti e la Cancellazione dell&apos;Account (Diritto all&apos;Oblio)
            </h2>
            <p>
              In conformità agli articoli 15-22 del GDPR, puoi esercitare in qualunque momento i seguenti diritti:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>
                <strong>Modifica e aggiornamento:</strong> puoi aggiornare i tuoi dati (nome, registro vocale, preferenze) in
                qualunque istante nella sezione <em>Il mio Profilo / Impostazioni</em>.
              </li>
              <li>
                <strong>Disiscrizione dalla newsletter:</strong> con un solo clic tramite il link apposito presente in calce a
                ogni email ricevuta, oppure disattivando l&apos;opzione dal profilo.
              </li>
              <li>
                <strong>Cancellazione totale dell&apos;account:</strong> puoi richiedere la cancellazione immediata e
                irreversibile del tuo account direttamente dalla pagina <em>Impostazioni &gt; Zona Riservata</em>. Con questa
                operazione tutti i tuoi dati anagrafici, credenziali e preferenze vengono definitivamente eliminati.
              </li>
            </ul>
          </section>

          {/* 6. Contatti */}
          <section className="space-y-2 border-t border-[#e4dcce] pt-6">
            <h2 className="font-serif text-lg font-bold text-[#2c241c] flex items-center gap-2">
              <span className="text-[#8a755d]">6.</span> Contatti per la Privacy
            </h2>
            <p>
              Per qualsiasi chiarimento o richiesta relativa ai tuoi dati personali, puoi fare riferimento ai curatori del
              progetto Note di Fede indicati nella pagina{" "}
              <Link href="/crediti" className="text-[#5c4a37] font-semibold underline hover:text-[#2c241c]">
                Crediti & Progetto
              </Link>
              .
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="text-center pt-4">
          <p className="text-xs text-[#8a755d]">
            Note di Fede • Progetto Pastorale Liturgico No-Profit
          </p>
        </div>
      </div>
    </main>
  );
}
