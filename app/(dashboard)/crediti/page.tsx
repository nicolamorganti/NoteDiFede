import { Metadata } from "next";
import Link from "next/link";
import { APP_VERSION, APP_BUILD_DATE } from "@/lib/version";

export const metadata: Metadata = {
  title: "Crediti & Progetto | Note di Fede",
  description:
    "Curatori, finalità no-profit, libri liturgici e fonti del progetto Note di Fede per la musica sacra e la preghiera.",
};

export default function CreditiPage() {
  return (
    <div className="container mx-auto px-3 sm:px-6 py-6 sm:py-10 max-w-4xl space-y-8 pb-20">
      {/* Intestazione Principale */}
      <div className="rounded-3xl bg-gradient-to-br from-[#fbf8f3] via-[#f7f2ea] to-[#ebdcc8] border border-[#e2d5c4] p-6 sm:p-10 shadow-sm text-center sm:text-left space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f3ebd8] text-[#8a755d] text-xs font-semibold uppercase tracking-wider border border-[#e2d5c4]">
          <svg className="w-3.5 h-3.5 text-[#8a755d]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6.4-4.8-6.4 4.8 2.4-7.2-6-4.8h7.6z" />
          </svg>
          <span>Progetto Pastorale Open & No-Profit</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[#2c241c] tracking-tight">
              Note di Fede
            </h1>
            <p className="text-sm sm:text-base text-[#6b5d4e] mt-1 font-serif italic">
              Al servizio della Liturgia, della Preghiera e del Canto Sacro
            </p>
          </div>

          <div className="self-center sm:self-auto flex flex-col items-center sm:items-end">
            <span className="inline-flex items-center px-3 py-1 rounded-xl bg-[#2c241c] text-[#f7f2ea] text-xs font-mono font-semibold shadow-xs">
              {APP_VERSION}
            </span>
            <span className="text-[11px] text-[#8a755d] mt-1">Aggiornato al {APP_BUILD_DATE}</span>
          </div>
        </div>
      </div>

      {/* 1. Spirito e Finalità del Progetto (No-Profit) */}
      <div className="rounded-3xl bg-[#fbf8f3] border border-[#ebdcc8] p-6 sm:p-8 space-y-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f4ebd9] border border-[#d8c5ad] text-[#5c4a37] shadow-2xs shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </span>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#2c241c]">
              Spirito e Finalità del Progetto (No-Profit)
            </h2>
            <p className="text-xs text-[#8a755d]">Una missione pastorale gratuita e condivisa</p>
          </div>
        </div>

        <div className="space-y-3 text-sm sm:text-[15px] text-[#5c4e3f] leading-relaxed">
          <p>
            <strong>Note di Fede</strong> è un’iniziativa pastorale totalmente <strong>gratuita, libera e priva di qualsiasi scopo di lucro</strong>.
            Nasce dal desiderio concreto di sostenere la vita delle comunità cristiane: offrire ai cori, agli animatori dell’assemblea,
            ai ministri straordinari dell'Eucaristia, ai lettori e a tutti i fedeli uno strumento moderno, accessibile, curato e dignitoso
            per pregare, celebrare e cantare insieme.
          </p>
          <p>
            L’applicazione non ospita pubblicità, non prevede abbonamenti o funzioni a pagamento e non monetizza in alcun modo
            i contenuti offerti, ponendosi come puro sussidio a servizio del culto divino e dell’evangelizzazione.
          </p>
        </div>
      </div>

      {/* 2. Sezione Curatori dell’Opera */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5 px-1">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#f4ebd9] border border-[#d8c5ad] text-[#5c4a37] shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#2c241c]">
            Curatori dell’Opera
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Curatore Musicale & Tecnico: Nicola Morganti */}
          <div className="bg-white rounded-3xl border border-[#ebdcc8] p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#d8c5ad] transition">
            <div className="space-y-3.5">
              <div className="flex items-center gap-3.5">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4ebd9] border border-[#d8c5ad] text-[#4a3b2c] shadow-2xs shrink-0">
                  <svg className="w-6 h-6 text-[#5c4a37]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-lg font-bold font-serif text-[#2c241c]">Nicola Morganti</h3>
                  <p className="text-xs font-semibold text-[#8a755d] uppercase tracking-wider">
                    Curatore Parte Musicale & Sviluppo Tecnologico
                  </p>
                </div>
              </div>
              <p className="text-sm text-[#5c4e3f] leading-relaxed">
                Ideazione e sviluppo dell’architettura software, digitalizzazione del repertorio canti,
                gestione delle partiture, trasposizione automatica degli accordi, audio guide corali per registri vocali e sintesi vocale liturgica.
              </p>
              <p className="text-xs text-[#786653] leading-relaxed pt-1.5 border-t border-[#f7f2ea]">
                Fonti dei testi a cura del <strong>Coro della Beata Vergine del Rosario di Mombretto di Mediglia</strong>. Un ringraziamento speciale ad <strong>Alessandro Bellotto</strong>, per gli spartiti condivisi e per la cura di una raccolta costruita negli anni.
              </p>
            </div>
            <div className="pt-3 border-t border-[#f3ebd8] text-xs text-[#786653] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8a755d]" />
              <span>Animazione musicale & Informatica liturgica</span>
            </div>
          </div>

          {/* Curatore Liturgico & Teologico: Dario Cantoro */}
          <div className="bg-white rounded-3xl border border-[#ebdcc8] p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#d8c5ad] transition">
            <div className="space-y-3.5">
              <div className="flex items-center gap-3.5">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4ebd9] border border-[#d8c5ad] text-[#4a3b2c] shadow-2xs shrink-0">
                  <svg className="w-6 h-6 text-[#5c4a37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </span>
                <div>
                  <h3 className="text-lg font-bold font-serif text-[#2c241c]">Dario Cantoro</h3>
                  <p className="text-xs font-semibold text-[#8a755d] uppercase tracking-wider">
                    Curatore Parte Liturgica & Consulenza Teologica
                  </p>
                </div>
              </div>
              <p className="text-sm text-[#5c4e3f] leading-relaxed">
                Supervisione e accuratezza dei testi liturgici, sincronizzazione del calendario canonico
                (Rito Ambrosiano e Romano), Liturgia delle Ore, Messale, Benedizionale e cura dell’apparato rubricale.
              </p>
            </div>
            <div className="pt-3 border-t border-[#f3ebd8] text-xs text-[#786653] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8a755d]" />
              <span>Cura teologica & Rigore canonico</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Libri Liturgici & Testi Sacri di Riferimento */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5 px-1">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#f4ebd9] border border-[#d8c5ad] text-[#5c4a37] shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#2c241c]">
            Libri Liturgici & Testi Sacri di Riferimento
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs sm:text-sm">
          {/* Sacra Scrittura */}
          <div className="bg-white rounded-2xl border border-[#ebdcc8] p-4 space-y-2 shadow-2xs">
            <div className="text-xs font-bold text-[#8a755d] uppercase tracking-wider flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#f4ebd9] text-[#5c4a37] shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </span>
              <span>Sacra Scrittura</span>
            </div>
            <h4 className="font-bold text-[#2c241c]">Bibbia CEI 2008</h4>
            <p className="text-xs text-[#6b5d4e] leading-relaxed">
              Testo ufficiale della Conferenza Episcopale Italiana per la proclamazione liturgica e la preghiera.
            </p>
          </div>

          {/* Celebrazione Eucaristica */}
          <div className="bg-white rounded-2xl border border-[#ebdcc8] p-4 space-y-2 shadow-2xs">
            <div className="text-xs font-bold text-[#8a755d] uppercase tracking-wider flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#f4ebd9] text-[#5c4a37] shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
              <span>Celebrazione Eucaristica</span>
            </div>
            <h4 className="font-bold text-[#2c241c]">Messale Romano & Ambrosiano</h4>
            <p className="text-xs text-[#6b5d4e] leading-relaxed">
              Messale Romano (3ª Ed. Italiana 2020) e Messale Ambrosiano con lezionari festivi e feriali.
            </p>
          </div>

          {/* Ufficio Divino */}
          <div className="bg-white rounded-2xl border border-[#ebdcc8] p-4 space-y-2 shadow-2xs">
            <div className="text-xs font-bold text-[#8a755d] uppercase tracking-wider flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#f4ebd9] text-[#5c4a37] shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343a7.975 7.975 0 010 11.314z" />
                </svg>
              </span>
              <span>Ufficio Divino</span>
            </div>
            <h4 className="font-bold text-[#2c241c]">Liturgia delle Ore</h4>
            <p className="text-xs text-[#6b5d4e] leading-relaxed">
              Breviario Romano e Diurna Laus Ambrosiana: Lodi, Ora Media, Vespri, Compieta e Ufficio delle Letture.
            </p>
          </div>

          {/* Rituale dei Sacramenti */}
          <div className="bg-white rounded-2xl border border-[#ebdcc8] p-4 space-y-2 shadow-2xs">
            <div className="text-xs font-bold text-[#8a755d] uppercase tracking-wider flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#f4ebd9] text-[#5c4a37] shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </span>
              <span>Rituale dei Sacramenti</span>
            </div>
            <h4 className="font-bold text-[#2c241c]">Benedizionale & Cura Infermi</h4>
            <p className="text-xs text-[#6b5d4e] leading-relaxed">
              Formulari per benedizioni, sacramenti, visite agli ammalati e sussidi per ministri straordinari.
            </p>
          </div>

          {/* Repertorio Musicale */}
          <div className="bg-white rounded-2xl border border-[#ebdcc8] p-4 space-y-2 shadow-2xs">
            <div className="text-xs font-bold text-[#8a755d] uppercase tracking-wider flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#f4ebd9] text-[#5c4a37] shrink-0">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </span>
              <span>Repertorio Musicale</span>
            </div>
            <h4 className="font-bold text-[#2c241c]">Repertorio Nazionale Canti</h4>
            <p className="text-xs text-[#6b5d4e] leading-relaxed">
              Canti approvati dalla CEI e dagli Uffici Liturgici Diocesani per l'animazione dell'assemblea e del coro.
            </p>
          </div>

          {/* Tradizione Ecclesiale */}
          <div className="bg-white rounded-2xl border border-[#ebdcc8] p-4 space-y-2 shadow-2xs">
            <div className="text-xs font-bold text-[#8a755d] uppercase tracking-wider flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#f4ebd9] text-[#5c4a37] shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
              </span>
              <span>Tradizione Ecclesiale</span>
            </div>
            <h4 className="font-bold text-[#2c241c]">Preghiere della Tradizione</h4>
            <p className="text-xs text-[#6b5d4e] leading-relaxed">
              Santo Rosario, Coroncine, Litanie lauretane, Inni patristici e devozioni secolari della Chiesa.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Fonti Istituzionali & Piattaforme Integrate */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5 px-1">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#f4ebd9] border border-[#d8c5ad] text-[#5c4a37] shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </span>
          <h2 className="text-xl font-bold font-serif text-[#2c241c]">
            Fonti Istituzionali & Piattaforme Integrate
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          {/* Milano */}
          <a
            href="https://www.chiesadimilano.it"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-2xl border border-[#ebdcc8] p-4 space-y-2 shadow-2xs hover:shadow-xs hover:border-[#cbb397] transition group block"
          >
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-bold text-[#2c241c] group-hover:text-[#8a755d] transition flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#f4ebd9] text-[#5c4a37] shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </span>
                <span>Diocesi di Milano</span>
              </h4>
              <span className="text-[11px] text-[#8a755d] font-mono group-hover:underline flex items-center gap-0.5 shrink-0">
                <span>chiesadimilano.it</span>
                <span>↗</span>
              </span>
            </div>
            <p className="text-[#6b5d4e] leading-relaxed text-xs">
              Per la Liturgia delle Ore Ambrosiana, il lezionario delle Messe, l'Almanacco diocesano e i feed di cronaca pastorale.
            </p>
          </a>

          {/* Vaticano */}
          <a
            href="https://www.vaticannews.va/it.html"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-2xl border border-[#ebdcc8] p-4 space-y-2 shadow-2xs hover:shadow-xs hover:border-[#cbb397] transition group block"
          >
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-bold text-[#2c241c] group-hover:text-[#8a755d] transition flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#f4ebd9] text-[#5c4a37] shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <span>Santa Sede & Vatican News</span>
              </h4>
              <span className="text-[11px] text-[#8a755d] font-mono group-hover:underline flex items-center gap-0.5 shrink-0">
                <span>vaticannews.va</span>
                <span>↗</span>
              </span>
            </div>
            <p className="text-[#6b5d4e] leading-relaxed text-xs">
              Per i testi del Magistero pontificio, le letture del Rito Romano e l’informazione ecclesiale universale.
            </p>
          </a>

          {/* CEI */}
          <a
            href="https://www.chiesacattolica.it"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-2xl border border-[#ebdcc8] p-4 space-y-2 shadow-2xs hover:shadow-xs hover:border-[#cbb397] transition group block"
          >
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-bold text-[#2c241c] group-hover:text-[#8a755d] transition flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#f4ebd9] text-[#5c4a37] shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </span>
                <span>Chiesa Cattolica Italiana (CEI)</span>
              </h4>
              <span className="text-[11px] text-[#8a755d] font-mono group-hover:underline flex items-center gap-0.5 shrink-0">
                <span>chiesacattolica.it</span>
                <span>↗</span>
              </span>
            </div>
            <p className="text-[#6b5d4e] leading-relaxed text-xs">
              Per i testi della Bibbia CEI 2008, il Messale Romano, il Benedizionale e le comunicazioni della Chiesa in Italia.
            </p>
          </a>

          {/* Roma */}
          <a
            href="https://www.romasette.it"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-2xl border border-[#ebdcc8] p-4 space-y-2 shadow-2xs hover:shadow-xs hover:border-[#cbb397] transition group block"
          >
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-bold text-[#2c241c] group-hover:text-[#8a755d] transition flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#f4ebd9] text-[#5c4a37] shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                  </svg>
                </span>
                <span>Diocesi di Roma</span>
              </h4>
              <span className="text-[11px] text-[#8a755d] font-mono group-hover:underline flex items-center gap-0.5 shrink-0">
                <span>romasette.it</span>
                <span>↗</span>
              </span>
            </div>
            <p className="text-[#6b5d4e] leading-relaxed text-xs">
              Per l’attualità, gli eventi e la vita ecclesiale della Diocesi del Santo Padre.
            </p>
          </a>
        </div>

      </div>

      {/* 5. Tutela dei Diritti & Fair Use */}
      <div className="rounded-2xl border border-[#e2d5c4] bg-[#f7f2ea] p-5 text-xs text-[#786653] space-y-2 leading-relaxed">
        <p className="font-semibold text-[#4a3b2c] flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#f4ebd9] text-[#5c4a37] shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </span>
          <span>Nota sui Diritti d'Autore e Utilizzo Pastorale</span>
        </p>
        <p>
          I testi della Sacra Scrittura e della Liturgia appartengono ai rispettivi detentori dei diritti morali e canonici
          (Fondazione di Religione Santi Francesco d'Assisi e Caterina da Siena / CEI / Arcidiocesi di Milano).
          Vengono qui resi fruibili in regime di <em>fair use</em> a esclusivo uso pastorale, formativo, privato e di preghiera comunitaria.
        </p>
        <p>
          I canti e gli spartiti presenti nel repertorio sono inseriti nel rispetto delle finalità di animazione liturgica delle comunità parrocchiali.
        </p>
      </div>

      {/* Tasto Ritorno */}
      <div className="text-center pt-2">
        <Link
          href="/liturgia"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#2c241c] hover:bg-[#4a3b2c] text-[#f7f2ea] text-xs sm:text-sm font-semibold transition shadow-xs"
        >
          <span>← Torna alla Liturgia & Preghiera</span>
        </Link>
      </div>
    </div>
  );
}
