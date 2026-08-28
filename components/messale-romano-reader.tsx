"use client";

import { useState } from "react";
import { PreghieraNav } from "@/components/preghiera-nav";

interface MessaleRomanoSection {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  icon: string;
  pdfUrl: string;
  sizeLabel: string;
  startPage: number;
  endPage: number;
  pageRangeLabel: string;
  highlights: string[];
}

const MESSALE_ROMANO_SECTIONS: MessaleRomanoSection[] = [
  {
    id: "ogmr",
    title: "Ordinamento Generale del Messale Romano (OGMR)",
    subtitle: "Principi teologici, norme liturgiche e compiti ministeriali",
    description:
      "Il testo fondamentale che guida la teologia, la celebrazione, i ruoli dei ministri, i gesti, le posture e l'arte liturgica della Santa Messa secondo il Rito Romano rinnovato.",
    category: "Norme Liturgiche",
    icon: "📑",
    pdfUrl: "https://DriveCEI.glauco.it/invitations?share=a500c08633002063713d&dl=1",
    sizeLabel: "Pagine 1 - 92",
    startPage: 1,
    endPage: 92,
    pageRangeLabel: "Pagine 1 - 92",
    highlights: [
      "Importanza e dignità della celebrazione eucaristica",
      "Struttura della Messa, suoi elementi e sue parti",
      "Uffici e ministeri nella celebrazione della Messa",
      "Disposizione e decoro della chiesa per la liturgia",
    ],
  },
  {
    id: "anno-liturgico",
    title: "Proprio del Tempo (Avvento, Natale, Quaresima, Pasqua)",
    subtitle: "Formulari rinnovati dei tempi forti dell'Anno Liturgico",
    description:
      "Tutti i formulari delle domeniche e delle ferie dell'Avvento, del Tempo di Natale, della Quaresima, della Settimana Santa, del Triduo Pasquale e dei 50 giorni di Pasqua.",
    category: "Anno Liturgico",
    icon: "🕯️",
    pdfUrl: "https://DriveCEI.glauco.it/invitations?share=a500c08633002063713d&dl=1",
    sizeLabel: "Pagine 93 - 378",
    startPage: 93,
    endPage: 378,
    pageRangeLabel: "Pagine 93 - 378",
    highlights: [
      "Formulari dell'Avvento e del Tempo Natalizio",
      "Quaresima, Mercoledì delle Ceneri e Settimana Santa",
      "Veglia Pasquale e Domenica di Risurrezione",
      "Tempo di Pasqua fino a Pentecoste",
    ],
  },
  {
    id: "ordinario-preghiere",
    title: "Ordinario della Messa & Preghiere Eucaristiche",
    subtitle: "Riti di Introduzione, Canone Romano, Canoni II-IV e Riconciliazione",
    description:
      "Il cuore della celebrazione: l'Atto Penitenziale con 'Signore, pietà (Kyrie eleison)', il Gloria con 'pace in terra agli uomini, amati dal Signore', il Padre Nostro ('non abbandonarci alla tentazione'), i Prefazi e le grandi Preghiere Eucaristiche.",
    category: "Ordinario",
    icon: "🍞",
    pdfUrl: "https://DriveCEI.glauco.it/invitations?share=a500c08633002063713d&dl=1",
    sizeLabel: "Pagine 379 - 680",
    startPage: 379,
    endPage: 680,
    pageRangeLabel: "Pagine 379 - 680",
    highlights: [
      "Nuova formula del 'Confesso a Dio onnipotente' (fratelli e sorelle)",
      "Canone Romano (Preghiera Eucaristica I)",
      "Preghiere Eucaristiche II, III e IV",
      "Preghiere Eucaristiche della Riconciliazione e per Varie Necessità",
    ],
  },
  {
    id: "tempo-ordinario",
    title: "Tempo Ordinario (34 Settimane)",
    subtitle: "Le orazioni, collette e preghiere per tutto l'anno liturgico",
    description:
      "I formulari completi per le 34 domeniche del Tempo Ordinario e per le ferie del tempo per annum.",
    category: "Anno Liturgico",
    icon: "🌿",
    pdfUrl: "https://DriveCEI.glauco.it/invitations?share=a500c08633002063713d&dl=1",
    sizeLabel: "Pagine 681 - 790",
    startPage: 681,
    endPage: 790,
    pageRangeLabel: "Pagine 681 - 790",
    highlights: [
      "Orazioni collette rinnovate per le 34 domeniche",
      "Orazioni sulle offerte e dopo la comunione",
      "Formulari per le ferie del Tempo Ordinario",
    ],
  },
  {
    id: "santorale",
    title: "Proprio e Comune dei Santi (CEI)",
    subtitle: "Solennità, feste e memorie dei santi d'Italia e universali",
    description:
      "Il calendario dei santi secondo il calendario universale e i patroni d'Italia (San Francesco d'Assisi, Santa Caterina da Siena, San Benedetto) e i nuovi santi canonizzati inseriti nella terza edizione.",
    category: "Santorale",
    icon: "👑",
    pdfUrl: "https://DriveCEI.glauco.it/invitations?share=a500c08633002063713d&dl=1",
    sizeLabel: "Pagine 791 - 1050",
    startPage: 791,
    endPage: 1050,
    pageRangeLabel: "Pagine 791 - 1050",
    highlights: [
      "San Francesco d'Assisi e Santa Caterina da Siena (Patroni d'Italia)",
      "San Benedetto abate (Patrono d'Europa)",
      "Memoria di Santa Maria Maddalena (elevata a festa)",
      "Comune della Beata Vergine Maria e dei Martiri",
    ],
  },
  {
    id: "rituali-defunti",
    title: "Messe Rituali, ad diversa, Votive e dei Defunti",
    subtitle: "Sacramenti, grandi intenzioni ecclesiali, suffragio ed esequie",
    description:
      "I formulari completi per la celebrazione dei Sacramenti, le intenzioni per la Chiesa, la società e la pace, le Messe votive e il rito esequiale per i fedeli defunti.",
    category: "Sacramenti & Suffragio",
    icon: "🕯️",
    pdfUrl: "https://DriveCEI.glauco.it/invitations?share=a500c08633002063713d&dl=1",
    sizeLabel: "Pagine 1051 - 1278",
    startPage: 1051,
    endPage: 1278,
    pageRangeLabel: "Pagine 1051 - 1278",
    highlights: [
      "Iniziazione Cristiana, Matrimonio e Ordinazioni",
      "Messe per la pace, la giustizia e i bisogni civili",
      "Messe votive della SS. Trinità, Spirito Santo e Maria",
      "Liturgia delle esequie e suffragio per i defunti",
    ],
  },
];

export function MessaleRomanoReader() {
  const [selectedSection, setSelectedSection] = useState<MessaleRomanoSection | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredSections = MESSALE_ROMANO_SECTIONS.filter((sec) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        sec.title.toLowerCase().includes(q) ||
        sec.subtitle.toLowerCase().includes(q) ||
        sec.description.toLowerCase().includes(q) ||
        sec.highlights.some((h) => h.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Sottomenu Navigazione Sezione Preghiera */}
      <PreghieraNav />

      {/* Intestazione */}
      <div className="border-b border-[#e4dcce] pb-6 space-y-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#5c4a37] text-white shadow-sm">
            📘
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#aa9576]">
            Conferenza Episcopale Italiana · Terza Edizione Ufficiale
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-serif text-3xl font-normal text-[#3f3933]">
            Messale Romano
          </h2>
          <span className="rounded-full bg-[#ebdcc8] border border-[#d9c5ac] px-2.5 py-0.5 text-xs font-bold text-[#5c4a37]">
            Terza Edizione Italiana
          </span>
        </div>
        <p className="text-sm text-[#736555] max-w-3xl leading-relaxed">
          La presente versione digitale della <strong>terza edizione italiana del Messale Romano</strong> contiene i file e i documenti previsti per il rito della Messa (inclusi i canti e le melodie ufficiali), al fine di favorirne l&apos;ascolto, l&apos;apprendimento, lo studio e la preghiera personale.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* DISCLAIMER UFFICIALE FONDAZIONE SANTI FRANCESCO E CATERINA / CEI (OBBLIGATORIO) */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-3xl border border-[#decbb8] bg-[#f9f4ec] shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-base">⚖️</span>
          <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#7e6955]">
            Disclaimer & Diritti d&apos;Autore
          </h4>
        </div>
        <div className="space-y-1.5 text-xs leading-relaxed text-[#6d5d4d] font-sans">
          <p>
            Tutti i diritti d&apos;autore relativi alla terza edizione italiana del Messale Romano, comprese le immagini che corredano l&apos;opera, sono riservati all&apos;editore <strong>Fondazione di Religione Santi Francesco d&apos;Assisi e Caterina da Siena (© 2020)</strong>.
          </p>
          <p>
            È vietata l&apos;utilizzazione, la riproduzione, l&apos;elaborazione, la diffusione e la stampa anche parziale senza autorizzazione scritta dell&apos;editore, essendo consentita esclusivamente la <strong>consultazione on-line per uso personale e senza finalità di lucro</strong>.
          </p>
        </div>
      </div>

      {/* Box Download Volumi Completi CEI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Volume con Canti */}
        <div className="p-5 rounded-3xl bg-[#f4ece0] border border-[#dac7b0] flex flex-col justify-between space-y-3 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎼</span>
              <h5 className="font-serif font-bold text-sm text-[#5c4a37]">
                Messale Completo con Canti & Melodie
              </h5>
            </div>
            <p className="text-xs text-[#736555] leading-relaxed">
              Volume integrale con notazione musicale e spartiti gregoriani (PDF 175 MB).
            </p>
          </div>
          <a
            href="https://DriveCEI.glauco.it/invitations?share=3a89d1b28d96eb2ddc32&dl=1"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#5c4a37] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#4a3c2c] transition"
          >
            <span>Scarica con Spartiti (175 MB)</span>
          </a>
        </div>

        {/* Volume Testo */}
        <div className="p-5 rounded-3xl bg-[#f4ece0] border border-[#dac7b0] flex flex-col justify-between space-y-3 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">📖</span>
              <h5 className="font-serif font-bold text-sm text-[#5c4a37]">
                Messale Completo solo Testo
              </h5>
            </div>
            <p className="text-xs text-[#736555] leading-relaxed">
              Versione testuale rapida e leggera per lettura e studio (PDF 24 MB · 1278 pagine).
            </p>
          </div>
          <a
            href="https://DriveCEI.glauco.it/invitations?share=a500c08633002063713d&dl=1"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#5c4a37] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#4a3c2c] transition"
          >
            <span>Scarica solo Testo (24 MB)</span>
          </a>
        </div>
      </div>

      {/* Se è selezionata una sezione per la lettura/consultazione */}
      {selectedSection ? (
        <div className="rounded-3xl border border-[#e0d6c7] bg-[#fefdfb] p-6 sm:p-8 shadow-lg space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ebdcc8] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedSection.icon}</span>
                <span className="text-xs uppercase tracking-widest font-sans font-bold text-[#aa9576]">
                  {selectedSection.category} · {selectedSection.pageRangeLabel}
                </span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-[#5c4a37]">
                {selectedSection.title}
              </h3>
              <p className="text-sm text-[#8a755d]">{selectedSection.subtitle}</p>
            </div>

            <button
              onClick={() => setSelectedSection(null)}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#d8c6b1] bg-[#f5ede0] px-4 py-2 text-xs font-semibold text-[#5c4a37] hover:bg-[#ebdcc8] transition self-start sm:self-auto"
            >
              <span>← Torna all&apos;Indice dei Volumi</span>
            </button>
          </div>

          <p className="text-sm leading-relaxed text-[#4a3e30] font-serif">
            {selectedSection.description}
          </p>

          <div className="space-y-2">
            <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-[#aa9576]">
              Contenuti Principali di Questa Sezione:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectedSection.highlights.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-[#f8f3eb] border border-[#e8dccf] text-xs text-[#5c4a37]"
                >
                  <span className="text-amber-700">✦</span>
                  <span className="font-sans font-medium">{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Azioni PDF Estratto */}
          <div className="p-5 rounded-2xl bg-[#f8f4ec] border border-[#decbb8] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-base">📑</span>
                <h5 className="font-serif font-bold text-sm text-[#5c4a37]">
                  PDF Estratto della Sezione ({selectedSection.pageRangeLabel})
                </h5>
              </div>
              <p className="text-xs text-[#736555]">
                Scarica o consulta solo le pagine di questa specifica sezione in un PDF compatto.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5">
              <a
                href={`/api/pdf/extract?doc=messale-romano&from=${selectedSection.startPage}&to=${selectedSection.endPage}&name=${encodeURIComponent(
                  selectedSection.title.replace(/[^a-zA-Z0-9_-]/g, "_") + ".pdf"
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#5c4a37] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#4a3c2c] transition hover:scale-105"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Scarica PDF Estratto</span>
              </a>
            </div>
          </div>

          {/* Viewer Incorporato On-line */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-[#aa9576]">
                Anteprima e Consultazione On-line ({selectedSection.pageRangeLabel}):
              </h4>
              <span className="text-[11px] font-sans text-[#8a755d]">
                Streaming estratto leggero ⚡
              </span>
            </div>
            <div className="w-full h-[700px] rounded-2xl overflow-hidden border border-[#decbb8] bg-[#ede5d8] shadow-inner">
              <iframe
                src={`/api/pdf/extract?doc=messale-romano&from=${selectedSection.startPage}&to=${selectedSection.endPage}&name=${encodeURIComponent(
                  selectedSection.title.replace(/[^a-zA-Z0-9_-]/g, "_") + ".pdf"
                )}#toolbar=1&navpanes=0`}
                className="w-full h-full border-0"
                title={`Messale Romano - ${selectedSection.title}`}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Griglia delle Sezioni */
        <div className="space-y-6">
          {/* Barra di Ricerca */}
          <div className="flex items-center gap-3 p-4 rounded-3xl border border-[#e4dcce] bg-[#fffdfa] shadow-xs">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Cerca formulari, canti, ordinario o prefazi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-[#dac8b1] bg-[#fdfbf7] py-2 pl-9 pr-4 text-xs text-[#3f3933] placeholder-[#8a755d] focus:border-[#aa9576] focus:outline-none"
              />
              <span className="absolute left-3 top-2.5 text-xs text-[#8a755d]">🔍</span>
            </div>
          </div>

          {/* Griglia delle Sezioni */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSections.map((sec) => (
              <div
                key={sec.id}
                onClick={() => setSelectedSection(sec)}
                className="group flex flex-col justify-between p-5 rounded-3xl border border-[#e0d6c7] bg-[#fffdfa] hover:bg-[#fbf7f0] hover:border-[#aa9576] transition shadow-sm hover:shadow-md cursor-pointer space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl group-hover:scale-110 transition-transform">
                        {sec.icon}
                      </span>
                      <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#aa9576] bg-[#f4ece0] px-2 py-0.5 rounded-md">
                        {sec.pageRangeLabel}
                      </span>
                    </div>
                    <span className="text-xs text-[#8a755d] font-semibold group-hover:translate-x-1 transition-transform">
                      Esplora →
                    </span>
                  </div>

                  <h3 className="font-serif text-lg font-bold text-[#3f3933] group-hover:text-[#5c4a37] transition-colors">
                    {sec.title}
                  </h3>
                  <p className="text-xs font-sans text-[#8a755d] font-medium leading-relaxed">
                    {sec.subtitle}
                  </p>
                  <p className="text-xs text-[#6e5f52] line-clamp-2 leading-relaxed">
                    {sec.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#f0e6d9] flex items-center justify-between text-[11px] text-[#8a755d]">
                  <span className="font-sans font-medium text-emerald-700">✓ Visualizzatore integrato</span>
                  <span className="font-bold text-[#5c4a37]">Apri Sezione 📖</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
