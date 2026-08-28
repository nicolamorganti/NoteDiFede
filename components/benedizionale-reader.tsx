"use client";

import { useState } from "react";
import { PreghieraNav } from "@/components/preghiera-nav";

interface BenedizioneSection {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  icon: string;
  startPage: number;
  endPage: number;
  pageRangeLabel: string;
  highlights: string[];
}

const BENEDIZIONALE_SECTIONS: BenedizioneSection[] = [
  {
    id: "premesse-generali",
    title: "Premesse Generali (Praenotanda)",
    subtitle: "Teologia, significato, struttura e ministri delle benedizioni",
    description:
      "La natura delle benedizioni nella storia della salvezza, il sacerdozio comune dei fedeli e il ministero ordinato, la struttura liturgica della celebrazione (Parola di Dio, preghiera di benedizione, segni) e l'adattamento pastorale.",
    category: "Norme Liturgiche",
    icon: "📑",
    startPage: 1,
    endPage: 40,
    pageRangeLabel: "Pagine 1 - 40",
    highlights: [
      "Natura e significato delle benedizioni ecclesiali",
      "Uffici e ministeri (Vescovo, Presbitero, Diacono, Ministri laici e Genitori)",
      "Struttura celebrativa fondamentale (Riti d'inizio, Parola, Lode e Congedo)",
      "Uso dell'acqua benedetta, imposizione delle mani e segno di croce",
    ],
  },
  {
    id: "persone",
    title: "Parte I: Benedizioni delle Persone",
    subtitle: "Famiglie, sposi, fanciulli, fidanzati, anziani e malati",
    description:
      "Formulari per la santificazione della vita umana: famiglie e case, sposi negli anniversari di matrimonio, fidanzati, gestanti, bambini e fanciulli, anziani, infermi, missionari, catechisti e volontari della carità.",
    category: "Persone & Famiglia",
    icon: "👨‍👩‍👧‍👦",
    startPage: 41,
    endPage: 364,
    pageRangeLabel: "Pagine 41 - 364",

    highlights: [
      "Benedizione della famiglia e della mensa quotidiana",
      "Fidanzati e anniversari di Matrimonio (25°, 50°, 60°)",
      "Madri in attesa, bambini, adolescenti e giovani",
      "Anziani, infermi e operatori sanitari / caritativi",
    ],
  },
  {
    id: "edifici-lavoro",
    title: "Parte II: Benedizioni di Luoghi, Case ed Edifici",
    subtitle: "Abitazioni, scuole, luoghi di lavoro, ospedali e campi",
    description:
      "Formulari per le nuove abitazioni, gli edifici scolastici, le biblioteche, gli ospedali, i luoghi di cura, le aziende, le officine, i campi coltivati, i raccolti e gli animali.",
    category: "Luoghi & Lavoro",
    icon: "🏡",
    startPage: 365,
    endPage: 634,
    pageRangeLabel: "Pagine 365 - 634",
    highlights: [
      "Benedizione annuale delle famiglie nelle loro case",
      "Nuove case, edifici e ambienti di convivenza",
      "Scuole, università, biblioteche e centri educativi",
      "Ospedali, case di riposo e luoghi di sofferenza",
      "Campi, sementi, raccolti, bestiame e animali domestici",
    ],
  },
  {
    id: "arredi-oggetti-sacri",
    title: "Parte III: Benedizioni degli Arredi e Strumenti Sacri",
    subtitle: "Chiese, altari, fonti battesimali, croci, icone e campane",
    description:
      "Riti per la benedizione di quanto è destinato al culto divino: la nuova croce da esporre alla pubblica venerazione, le immagini sacre della Beata Vergine e dei Santi, le campane, l'organo a canne, i vasi sacri (calice, patena) e i paramenti liturgici.",
    category: "Culto & Liturgia",
    icon: "⛪",
    startPage: 635,
    endPage: 884,
    pageRangeLabel: "Pagine 635 - 884",
    highlights: [
      "Nuova croce, crocifissi e immagini di Cristo Signore",
      "Icone e statue della B.V. Maria e dei Santi",
      "Campane, organi a canne e strumenti musicali liturgici",
      "Calici, patene, cibori, ostensori e paramenti sacri",
    ],
  },
  {
    id: "devozione-circostanze",
    title: "Parte IV: Benedizioni di Cose di Devozione e Varie Circostanze",
    subtitle: "Acqua benedetta, rosari, veicoli, viaggiatori e pellegrini",
    description:
      "Formulari per l'aspersione dell'acqua lustrale, la benedizione delle corone del Rosario, delle medaglie e oggetti di pietà, dei veicoli e mezzi di trasporto, dei pellegrini e dei viaggiatori prima della partenza.",
    category: "Pietà & Viaggio",
    icon: "🕊️",
    startPage: 885,
    endPage: 1180,
    pageRangeLabel: "Pagine 885 - 1180",
    highlights: [
      "Benedizione e aspersione dell'acqua domenicale",
      "Corone del Santo Rosario e medaglie devozionali",
      "Veicoli, automobili, imbarcazioni e mezzi di trasporto",
      "Pellegrini, viaggiatori ed eventi comunitari",
    ],
  },
];

const PDF_URL = "https://liturgico.chiesacattolica.it/wp-content/uploads/sites/8/2022/04/08/Benedizionale-DEFINITIVO-.pdf";

export function BenedizionaleReader() {
  const [selectedSection, setSelectedSection] = useState<BenedizioneSection | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredSections = BENEDIZIONALE_SECTIONS.filter((sec) => {
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
            ✨
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#aa9576]">
            Rituale Romano · Conferenza Episcopale Italiana
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-serif text-3xl font-normal text-[#3f3933]">
            Benedizionale
          </h2>
          <span className="rounded-full bg-[#ebdcc8] border border-[#d9c5ac] px-2.5 py-0.5 text-xs font-bold text-[#5c4a37]">
            Edizione Tipica Ufficiale CEI
          </span>
        </div>
        <p className="text-xs font-serif font-bold uppercase tracking-wider text-[#8a755d]">
          RITUALE ROMANO · RIFORMATO A NORMA DEI DECRETI DEL CONCILIO ECUMENICO VATICANO II E PROMULGATO DA PAPA GIOVANNI PAOLO II · 1992
        </p>
      </div>

      {/* ========================================================================= */}
      {/* DECRETO UFFICIALE DI APPROVAZIONE CEI */}
      {/* ========================================================================= */}
      <div className="p-5 rounded-3xl border border-[#decbb8] bg-[#f9f4ec] shadow-xs space-y-2.5">
        <div className="flex items-center justify-between gap-2 border-b border-[#ebdcc8] pb-2">
          <span className="font-serif font-bold text-xs uppercase tracking-wider text-[#7e6955]">
            Decreto di Approvazione & Promulgazione (Prot. n. 604/92)
          </span>
          <span className="text-[11px] font-sans font-semibold text-[#8a755d]">
            Roma, 3 luglio 1992
          </span>
        </div>
        <p className="text-xs leading-relaxed text-[#6d5d4d] font-sans">
          Questa versione italiana del «De benedictionibus» è stata approvata secondo le delibere dell&apos;Episcopato e ha ricevuto la conferma della Congregazione per la Disciplina dei Sacramenti e il Culto divino, con decreto Prot. n. CD 620/90 del 9 giugno 1992. La presente edizione deve essere considerata «tipica» per la lingua italiana, ufficiale per l&apos;uso liturgico.
        </p>
      </div>

      {/* Card Principale Download / Accesso al PDF Integrale */}
      <div className="p-6 rounded-3xl bg-[#f4ece0] border border-[#dac7b0] space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">📚</span>
              <h4 className="font-serif font-bold text-base text-[#5c4a37]">
                Benedizionale Completo Ufficiale CEI (1237 Pagine · PDF 29.5 MB)
              </h4>
            </div>
            <p className="text-xs text-[#736555] max-w-xl leading-relaxed">
              Il testo integrale del Benedizionale in formato PDF ad alta definizione, comprensivo di tutte le formule di benedizione per persone, famiglie, luoghi e oggetti sacri.
            </p>
          </div>

          <a
            href={PDF_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#5c4a37] px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-[#4a3c2c] transition hover:scale-105 shrink-0"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Scarica / Apri Volume Completo (PDF 29.5 MB)</span>
          </a>
        </div>

        <div className="pt-3 border-t border-[#e2d3c1] flex flex-wrap items-center justify-between gap-3 text-xs text-[#8a755d]">
          <span>Conferenza Episcopale Italiana · Ufficio Liturgico Nazionale</span>
          <a
            href="https://liturgico.chiesacattolica.it/benedizionale/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#5c4a37] hover:underline flex items-center gap-1"
          >
            <span>Visita la pagina ufficiale CEI</span>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Dettaglio Sezione Selezionata con Estratto Leggero */}
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
              <span>← Torna all&apos;Indice dei Formulari</span>
            </button>
          </div>

          <p className="text-sm leading-relaxed text-[#4a3e30] font-serif">
            {selectedSection.description}
          </p>

          <div className="space-y-2">
            <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-[#aa9576]">
              Riti e Benedizioni Contenute in Questa Sezione:
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

          {/* Azioni PDF Estratto Leggero */}
          <div className="p-5 rounded-2xl bg-[#f8f4ec] border border-[#decbb8] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-base">📑</span>
                <h5 className="font-serif font-bold text-sm text-[#5c4a37]">
                  PDF Estratto della Sezione ({selectedSection.pageRangeLabel})
                </h5>
              </div>
              <p className="text-xs text-[#736555]">
                Scarica o consulta solo le pagine relative a questa sezione specifica in un file PDF leggero e compatto.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5">
              <a
                href={`/api/pdf/extract?doc=benedizionale&from=${selectedSection.startPage}&to=${selectedSection.endPage}&name=${encodeURIComponent(
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

              <a
                href={`${PDF_URL}#page=${selectedSection.startPage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#d8c6b1] bg-[#fbf8f4] px-4 py-2.5 text-xs font-semibold text-[#5c4a37] hover:bg-[#ebdcc8] transition"
              >
                <span>Apri a Pagina {selectedSection.startPage} ↗</span>
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
                Caricamento estratto leggero ⚡
              </span>
            </div>
            <div className="w-full h-[700px] rounded-2xl overflow-hidden border border-[#decbb8] bg-[#ede5d8] shadow-inner">
              <iframe
                src={`/api/pdf/extract?doc=benedizionale&from=${selectedSection.startPage}&to=${selectedSection.endPage}&name=${encodeURIComponent(
                  selectedSection.title.replace(/[^a-zA-Z0-9_-]/g, "_") + ".pdf"
                )}#toolbar=1&navpanes=0`}
                className="w-full h-full border-0"
                title={`Benedizionale - ${selectedSection.title}`}
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
                placeholder="Cerca benedizione (es. casa, sposi, malati, bambini, acqua, animali, veicoli)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-[#dac8b1] bg-[#fdfbf7] py-2 pl-9 pr-4 text-xs text-[#3f3933] placeholder-[#8a755d] focus:border-[#aa9576] focus:outline-none"
              />
              <span className="absolute left-3 top-2.5 text-xs text-[#8a755d]">🔍</span>
            </div>
          </div>

          {/* Griglia delle 5 Parti */}
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
                  <span className="font-sans font-medium text-emerald-700">✓ PDF Estratto disponibile</span>
                  <span className="font-bold text-[#5c4a37]">Apri Sezione ✨</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
