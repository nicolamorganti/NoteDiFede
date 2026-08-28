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
          <span>✨</span> Progetto Pastorale Open & No-Profit
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

      {/* Sezione Curatori */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <span className="text-lg">👥</span>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#2c241c]">
            Curatori dell’Opera
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Curatore Musicale & Tecnico */}
          <div className="bg-white rounded-3xl border border-[#ebdcc8] p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#d8c5ad] transition">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6e5a45] text-white text-xl shadow-xs shrink-0">
                  🎵
                </span>
                <div>
                  <h3 className="text-lg font-bold font-serif text-[#2c241c]">Nicola Morganti</h3>
                  <p className="text-xs font-semibold text-[#8a755d] uppercase tracking-wider">
                    Curatore Parte Musicale & Sviluppo Tecnologico
                  </p>
                </div>
              </div>
              <p className="text-sm text-[#5c4e3f] leading-relaxed">
                Ideazione e sviluppo dell’architettura software, digitalizzazione del catalogo canti,
                gestione delle partiture, trasposizione degli accordi, audio guide corali e sintesi vocale.
              </p>
            </div>
            <div className="pt-3 border-t border-[#f3ebd8] text-xs text-[#8a755d] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Animazione musicale & Informatica liturgica</span>
            </div>
          </div>

          {/* Curatore Liturgico & Teologico */}
          <div className="bg-white rounded-3xl border border-[#ebdcc8] p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#d8c5ad] transition">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2c241c] text-white text-xl shadow-xs shrink-0">
                  📖
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
                (Rito Ambrosiano e Romano), Liturgia delle Ore, Messale, Benedizionale e apparato rubricale.
              </p>
            </div>
            <div className="pt-3 border-t border-[#f3ebd8] text-xs text-[#8a755d] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Cura teologica & Rigore canonico</span>
            </div>
          </div>
        </div>
      </div>

      {/* Finalità e Valori No-Profit */}
      <div className="rounded-3xl bg-[#fbf8f3] border border-[#ebdcc8] p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🕊️</span>
          <h2 className="text-xl font-bold font-serif text-[#2c241c]">
            Spirito e Finalità del Progetto (No-Profit)
          </h2>
        </div>

        <div className="space-y-3 text-sm text-[#5c4e3f] leading-relaxed">
          <p>
            <strong>Note di Fede</strong> è un’iniziativa pastorale totalmente <strong>gratuita, libera e priva di qualsiasi scopo di lucro</strong>.
            Nasce per rispondere a un bisogno reale e concreto vissuto nelle comunità cristiane: offrire ai cori, agli animatori dell’assemblea,
            ai ministri straordinari, ai lettori e a tutti i fedeli uno strumento moderno, accessibile e dignitoso per pregare e cantare insieme.
          </p>
          <p>
            L’applicazione non ospita annunci pubblicitari, non richiede abbonamenti a pagamento e non monetizza in alcun modo
            i contenuti offerti, configurandosi come puro sussidio a servizio del culto e dell’evangelizzazione.
          </p>
        </div>
      </div>

      {/* Libri Liturgici & Testi Sacri di Riferimento */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <span className="text-lg">📜</span>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#2c241c]">
            Libri Liturgici & Testi Sacri di Riferimento
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs sm:text-sm">
          <div className="bg-white rounded-2xl border border-[#ebdcc8] p-4 space-y-1.5 shadow-2xs">
            <div className="text-xs font-bold text-[#8a755d] uppercase tracking-wider flex items-center gap-1">
              <span>📖</span> Sacra Scrittura
            </div>
            <h4 className="font-bold text-[#2c241c]">Bibbia CEI 2008</h4>
            <p className="text-xs text-[#6b5d4e] leading-relaxed">
              Testo ufficiale della Conferenza Episcopale Italiana per la proclamazione liturgica e la preghiera.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#ebdcc8] p-4 space-y-1.5 shadow-2xs">
            <div className="text-xs font-bold text-[#8a755d] uppercase tracking-wider flex items-center gap-1">
              <span>⛪</span> Celebrazione Eucaristica
            </div>
            <h4 className="font-bold text-[#2c241c]">Messale Romano & Ambrosiano</h4>
            <p className="text-xs text-[#6b5d4e] leading-relaxed">
              Messale Romano (3ª Ed. Italiana 2020) e Messale Ambrosiano con lezionari festivi e feriali.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#ebdcc8] p-4 space-y-1.5 shadow-2xs">
            <div className="text-xs font-bold text-[#8a755d] uppercase tracking-wider flex items-center gap-1">
              <span>🕯️</span> Ufficio Divino
            </div>
            <h4 className="font-bold text-[#2c241c]">Liturgia delle Ore</h4>
            <p className="text-xs text-[#6b5d4e] leading-relaxed">
              Breviario Romano e Diurna Laus Ambrosiana: Lodi, Ora Media, Vespri, Compieta e Ufficio delle Letture.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#ebdcc8] p-4 space-y-1.5 shadow-2xs">
            <div className="text-xs font-bold text-[#8a755d] uppercase tracking-wider flex items-center gap-1">
              <span>✝️</span> Rituale dei Sacramenti
            </div>
            <h4 className="font-bold text-[#2c241c]">Benedizionale & Cura Infermi</h4>
            <p className="text-xs text-[#6b5d4e] leading-relaxed">
              Formulari per benedizioni, sacramenti, visite agli ammalati e sussidi per ministri straordinari.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#ebdcc8] p-4 space-y-1.5 shadow-2xs">
            <div className="text-xs font-bold text-[#8a755d] uppercase tracking-wider flex items-center gap-1">
              <span>🎵</span> Repertorio Musicale
            </div>
            <h4 className="font-bold text-[#2c241c]">Repertorio Nazionale Canti</h4>
            <p className="text-xs text-[#6b5d4e] leading-relaxed">
              Canti approvati dalla CEI e dagli Uffici Liturgici Diocesani per l'animazione dell'assemblea e del coro.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#ebdcc8] p-4 space-y-1.5 shadow-2xs">
            <div className="text-xs font-bold text-[#8a755d] uppercase tracking-wider flex items-center gap-1">
              <span>🏛️</span> Tradizione Ecclesiale
            </div>
            <h4 className="font-bold text-[#2c241c]">Preghiere della Tradizione</h4>
            <p className="text-xs text-[#6b5d4e] leading-relaxed">
              Santo Rosario, Coroncine, Litanie lauretane, Inni patristici e devozioni secolari della Chiesa.
            </p>
          </div>
        </div>
      </div>

      {/* Fonti Istituzionali & Ringraziamenti */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <span className="text-lg">🏛️</span>
          <h2 className="text-xl font-bold font-serif text-[#2c241c]">
            Fonti Istituzionali & Piattaforme Integrate
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div className="bg-white rounded-2xl border border-[#ebdcc8] p-4 space-y-2 shadow-2xs">
            <h4 className="font-bold text-[#2c241c] flex items-center gap-1.5">
              <span>⛪</span> Diocesi di Milano (chiesadimilano.it)
            </h4>
            <p className="text-[#6b5d4e] leading-relaxed">
              Per la Liturgia delle Ore Ambrosiana, il lezionario delle Messe, l'Almanacco diocesano e i feed di cronaca pastorale.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#ebdcc8] p-4 space-y-2 shadow-2xs">
            <h4 className="font-bold text-[#2c241c] flex items-center gap-1.5">
              <span>📡</span> Santa Sede & Vatican News (vatican.va)
            </h4>
            <p className="text-[#6b5d4e] leading-relaxed">
              Per i testi del Magistero pontificio, le letture del Rito Romano e l’informazione ecclesiale universale.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#ebdcc8] p-4 space-y-2 shadow-2xs">
            <h4 className="font-bold text-[#2c241c] flex items-center gap-1.5">
              <span>📰</span> Conferenza Episcopale Italiana (chiesacattolica.it)
            </h4>
            <p className="text-[#6b5d4e] leading-relaxed">
              Per i testi della Bibbia CEI 2008, il Messale Romano, il Benedizionale e le comunicazioni della Chiesa in Italia.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#ebdcc8] p-4 space-y-2 shadow-2xs">
            <h4 className="font-bold text-[#2c241c] flex items-center gap-1.5">
              <span>🏛️</span> Diocesi di Roma (romasette.it)
            </h4>
            <p className="text-[#6b5d4e] leading-relaxed">
              Per l’attualità, gli eventi e la vita ecclesiale della Diocesi del Santo Padre.
            </p>
          </div>
        </div>
      </div>

      {/* Tutela dei Diritti & Fair Use */}
      <div className="rounded-2xl border border-[#e2d5c4] bg-[#f7f2ea] p-5 text-xs text-[#786653] space-y-2 leading-relaxed">
        <p className="font-semibold text-[#4a3b2c]">
          ⚖️ Nota sui Diritti d'Autore e Utilizzo Pastorale
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
