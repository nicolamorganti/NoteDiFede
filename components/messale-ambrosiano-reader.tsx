"use client";

import { useState } from "react";
import { PreghieraNav } from "@/components/preghiera-nav";

interface MessaleSection {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  icon: string;
  pdfUrl: string;
  highlights: string[];
}

const MESSALE_SECTIONS: MessaleSection[] = [
  {
    id: "premesse",
    title: "Premesse e Praenotanda",
    subtitle: "Principi teologici, norme universali e ordinamento",
    description:
      "La Costituzione apostolica, i decreti di promulgazione, i principi teologici e le norme generali per la celebrazione dell'Eucaristia nel Rito Ambrosiano e la tabella dei giorni liturgici.",
    category: "Norme & Principi",
    icon: "📑",
    pdfUrl:
      "https://www.chiesadimilano.it/wp-content/uploads/sites/83/2024/11/Premesse_praenotanda_portale.pdf",
    highlights: [
      "Principi e norme per l'uso del Messale Ambrosiano",
      "Struttura dell'anno liturgico e calendario ambrosiano",
      "Disposizioni per la Santa Messa con e senza il popolo",
      "Norme sulla concelebrazione e sui ministeri liturgici",
    ],
  },
  {
    id: "incarnazione",
    title: "Mistero dell'Incarnazione",
    subtitle: "Tempo di Avvento (6 domeniche), Natale ed Epifania",
    description:
      "Formulari completi per le 6 domeniche dell'Avvento ambrosiano, le ferie dell'Avvento, la solennità dell'Incarnazione (Divina Maternità di Maria), la Notte e il Giorno di Natale, l'Ottava, l'Epifania e il Tempo dopo l'Epifania.",
    category: "Anno Liturgico",
    icon: "🕯️",
    pdfUrl:
      "https://www.chiesadimilano.it/wp-content/uploads/sites/83/2024/11/I-Mistero_Incarnazione_portale.pdf",
    highlights: [
      "6 Domeniche di Avvento Ambrosiano",
      "Solennità dell'Incarnazione (Divina Maternità di Maria)",
      "Formulari della Notte, Aurora e Giorno di Natale",
      "Epifania del Signore e Domeniche dopo l'Epifania",
    ],
  },
  {
    id: "pasqua",
    title: "Mistero della Pasqua del Signore",
    subtitle: "Quaresima, Settimana Santa, Triduo e Tempo Pasquale",
    description:
      "Dalla I Domenica di Quaresima (all'Inizio di Quaresima) alla Domenica delle Palme, i Venerdì aneucaristici, la Settimana Autentica, la Veglia Pasquale, la Risurrezione del Signore e le 7 settimane del Tempo di Pasqua fino a Pentecoste.",
    category: "Anno Liturgico",
    icon: "✝️",
    pdfUrl:
      "https://www.chiesadimilano.it/wp-content/uploads/sites/83/2024/11/II-Mistero_della_Pasqua_del_Signore_portale.pdf",
    highlights: [
      "Quaresima ambrosiana (inizio alla I Domenica)",
      "Venerdì di Quaresima senza celebrazione eucaristica (aneucaristici)",
      "Settimana Autentica e Triduo Pasquale",
      "50 giorni di Pasqua fino a Pentecoste",
    ],
  },
  {
    id: "pentecoste",
    title: "Mistero della Pentecoste",
    subtitle: "Dopo Pentecoste, dopo il Martirio e dopo la Dedicazione",
    description:
      "La solennità della Santissima Trinità, del Corpus Domini, del Sacro Cuore, le domeniche dopo Pentecoste, il Martirio di San Giovanni il Precursore, le domeniche dopo il Martirio e la Solennità della Dedicazione del Duomo di Milano.",
    category: "Anno Liturgico",
    icon: "🔥",
    pdfUrl:
      "https://www.chiesadimilano.it/wp-content/uploads/sites/83/2024/11/III-Mistero_della_Pentecoste_portale.pdf",
    highlights: [
      "Santissima Trinità, Corpus Domini e Sacro Cuore",
      "Domeniche del Tempo dopo Pentecoste",
      "Martirio di San Giovanni Battista (29 agosto) e domeniche successive",
      "Dedicazione del Duomo di Milano (terza domenica di ottobre)",
    ],
  },
  {
    id: "ordinario",
    title: "Ordinario della Messa con il Popolo",
    subtitle: "Rito della Messa, prefazi e preghiere eucaristiche",
    description:
      "I riti di introduzione con il Canto all'Ingresso e all'Inizio Assemblea, l'Atto Penitenziale, la Liturgia della Parola, i Riti Offertoriali con lo Scambio della Pace e il Lavabo, i Prefazi propri, le Preghiere Eucaristiche (I-VI) e i Riti di Comunione.",
    category: "Ordinario",
    icon: "🍞",
    pdfUrl:
      "https://www.chiesadimilano.it/wp-content/uploads/sites/83/2024/11/Messa_col_popoloappendice_portale.pdf",
    highlights: [
      "Riti d'ingresso con canto All'Inizio dell'Assemblea",
      "Scambio della Pace all'Offertorio prima dei Doni",
      "Tutti i Prefazi ambrosiani e Canoni Eucaristici I-VI",
      "Riti di Comunione e congedo con triplice 'Kyrie eleison'",
    ],
  },
  {
    id: "proprio-santi",
    title: "Proprio dei Santi",
    subtitle: "Solennità, feste e memorie dei santi ambrosiani",
    description:
      "Tutte le celebrazioni del calendario diocesano ambrosiano da Gennaio a Dicembre: Sant'Ambrogio (7 dicembre), San Carlo Borromeo (4 novembre), Santa Tecla, San Galdino, San Vittore, San Dionigi e tutti i compatroni.",
    category: "Santorale",
    icon: "👑",
    pdfUrl:
      "https://www.chiesadimilano.it/wp-content/uploads/sites/83/2024/11/Proprio_dei_santi_portale.pdf",
    highlights: [
      "Sant'Ambrogio Vescovo e Dottore (7 dicembre)",
      "San Carlo Borromeo Vescovo (4 novembre)",
      "Santa Tecla, San Galdino, San Vittore",
      "Feste della Beata Vergine Maria nel Rito Ambrosiano",
    ],
  },
  {
    id: "comune-santi",
    title: "Comune dei Santi",
    subtitle: "Formulari per la Beata Vergine Maria, Martiri e Pastori",
    description:
      "Formulari comuni per le memorie dei santi prive di formulario proprio: Comune della B.V. Maria, Comune dei Martiri (uno o più martiri), Comune dei Pastori (papi e vescovi), Comune dei Dottori della Chiesa, Comune delle Vergini e dei Religiosi.",
    category: "Santorale",
    icon: "🌟",
    pdfUrl:
      "https://www.chiesadimilano.it/wp-content/uploads/sites/83/2024/11/Comune_dei_santi_portale.pdf",
    highlights: [
      "Comune della Beata Vergine Maria",
      "Comune dei Martiri e dei Pastori",
      "Comune dei Dottori della Chiesa",
      "Comune delle Vergini e dei Religiosi",
    ],
  },
  {
    id: "rituali",
    title: "Messe Rituali",
    subtitle: "Celebrazione dei Sacramenti e Sacramentali",
    description:
      "Formulari per l'Iniziazione Cristiana (Battesimo e Cresima), Ordinazioni Sacre (Diaconato, Presbiterato, Episcopato), Istituzione dei Ministri, Celebrazione del Matrimonio, Consacrazione delle Vergini e Professione Religiosa.",
    category: "Sacramenti",
    icon: "💍",
    pdfUrl:
      "https://www.chiesadimilano.it/wp-content/uploads/sites/83/2024/11/Messe_rituali_portale.pdf",
    highlights: [
      "Battesimo e Confermazione",
      "Celebrazione del Matrimonio cristiano",
      "Ordinazioni sacre e Istituzione dei Ministri",
      "Professione religiosa e benedizioni solenni",
    ],
  },
  {
    id: "necessita",
    title: "Messe per Varie Necessità (ad diversa)",
    subtitle: "Preghiere per la Chiesa, la società, la pace e i malati",
    description:
      "Formulari e orazioni per il Papa, il Vescovo, l'unità dei cristiani, i governanti, la pace e la giustizia, il tempo di semina e raccolto, i malati, i sofferenti, la famiglia e il lavoro.",
    category: "Necessità",
    icon: "🌿",
    pdfUrl:
      "https://www.chiesadimilano.it/wp-content/uploads/sites/83/2024/11/Messe_e_orazioni_per_varie_necessita_portale.pdf",
    highlights: [
      "Per il Papa, il Vescovo e la Chiesa diocesana",
      "Per la pace, la concordia e la giustizia fra i popoli",
      "Per i malati, i sofferenti e in tempo di calamità",
      "Per il lavoro, la semina e il raccolto",
    ],
  },
  {
    id: "votive",
    title: "Messe Votive",
    subtitle: "Celebrazioni dei misteri del Signore, dello Spirito e di Maria",
    description:
      "Messe in onore della Santissima Trinità, della Divina Misericordia, della Santa Croce, dello Spirito Santo, della Beata Vergine Maria Madre della Chiesa e di San Giuseppe.",
    category: "Votive",
    icon: "🕊️",
    pdfUrl:
      "https://www.chiesadimilano.it/wp-content/uploads/sites/83/2024/11/Messe_votive_portale.pdf",
    highlights: [
      "Santissima Trinità e Santa Croce",
      "Spirito Santo e Divina Misericordia",
      "Beata Vergine Maria e San Giuseppe",
      "Santi Angeli Custodi e Apostoli",
    ],
  },
  {
    id: "defunti",
    title: "Messe dei Defunti",
    subtitle: "Liturgia esequiale, sepoltura e anniversari",
    description:
      "Formulari completi per le Esequie (nella morte e nella sepoltura), nell'anniversario della morte, nelle diverse commemorazioni dei fedeli defunti e orazioni specifiche per parenti, benefattori, vescovi e sacerdoti.",
    category: "Esequie",
    icon: "🕯️",
    pdfUrl:
      "https://www.chiesadimilano.it/wp-content/uploads/sites/83/2024/11/Messe_dei_defunti_portale.pdf",
    highlights: [
      "Messa esequiale nel giorno della morte e sepoltura",
      "Commemorazione di tutti i fedeli defunti (2 novembre)",
      "Messe di anniversario e orazioni per i sacerdoti defunti",
      "Prefazi ambrosiani dei defunti",
    ],
  },
  {
    id: "appendici",
    title: "Appendici e Indici",
    subtitle: "Preghiere dei fedeli, melodie e indici generali",
    description:
      "Formulari per la preghiera universale dei fedeli, formule di benedizione solenne, melodie liturgiche ambrosiane per il sacerdote e l'assemblea, indici analitici e alfabetici del Messale.",
    category: "Appendici",
    icon: "🎼",
    pdfUrl:
      "https://www.chiesadimilano.it/wp-content/uploads/sites/83/2024/11/Appendiciindici_portale.pdf",
    highlights: [
      "Schemi per la Preghiera Universale dei fedeli",
      "Benedizioni solenni dell'anno liturgico",
      "Melodie e spartiti per i canti del celebrante",
      "Indice alfabetico e analitico completo",
    ],
  },
];

export function MessaleAmbrosianoReader() {
  const [selectedSection, setSelectedSection] = useState<MessaleSection | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("Tutti");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = ["Tutti", "Norme & Principi", "Anno Liturgico", "Ordinario", "Santorale", "Sacramenti", "Necessità", "Votive", "Esequie", "Appendici"];

  const filteredSections = MESSALE_SECTIONS.filter((sec) => {
    if (filterCategory !== "Tutti" && sec.category !== filterCategory) return false;
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
            📕
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#aa9576]">
            Diocesi di Milano · Seconda Edizione Ufficiale
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-serif text-3xl font-normal text-[#3f3933]">
            Messale Ambrosiano
          </h2>
          <span className="rounded-full bg-[#ebdcc8] border border-[#d9c5ac] px-2.5 py-0.5 text-xs font-bold text-[#5c4a37]">
            Nuova Edizione 2024
          </span>
        </div>
        <p className="text-sm text-[#736555] max-w-3xl leading-relaxed">
          La seconda edizione del Messale Ambrosiano, in vigore dal 17 novembre 2024, diventa obbligatoria per tutte le parrocchie ambrosiane. Presenta una struttura aggiornata, un nuovo calendario liturgico, testi rinnovati, Messe per nuovi santi e una veste grafica moderna. Riportiamo qui i file PDF per la consultazione, lo studio e la preghiera personale.
        </p>
      </div>


      {/* ========================================================================= */}
      {/* DISCLAIMER UFFICIALE ITL / CHIESA DI MILANO (OBBLIGATORIO) */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-3xl border border-[#decbb8] bg-[#f9f4ec] shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-base">⚖️</span>
          <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#7e6955]">
            Disclaimer & Diritti d&apos;Autore
          </h4>
        </div>
        <p className="text-xs leading-relaxed text-[#6d5d4d] font-sans">
          Tutti i diritti d&apos;autore relativi alla seconda edizione italiana del Messale Ambrosiano, comprese le immagini che corredano l&apos;opera, sono riservati all&apos;editore <strong>ITL - Impresa Tecnoeditoriale Lombarda srl a socio unico (© 2024)</strong>. È vietata l&apos;utilizzazione, la riproduzione, l&apos;elaborazione, la diffusione e la stampa anche parziale senza autorizzazione scritta dell&apos;editore, essendo consentita esclusivamente la <strong>consultazione on-line per uso personale e senza finalità di lucro</strong>.
        </p>
      </div>

      {/* Se è selezionata una sezione per la lettura/consultazione */}
      {selectedSection ? (
        <div className="rounded-3xl border border-[#e0d6c7] bg-[#fefdfb] p-6 sm:p-8 shadow-lg space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ebdcc8] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedSection.icon}</span>
                <span className="text-xs uppercase tracking-widest font-sans font-bold text-[#aa9576]">
                  {selectedSection.category} · Messale Ambrosiano 2024
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
              Contenuti Principali del Volume:
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

          {/* Azioni PDF Ufficiale */}
          <div className="p-5 rounded-2xl bg-[#f4ece0] border border-[#dac7b0] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h5 className="font-serif font-bold text-sm text-[#5c4a37]">
                Documento Ufficiale Diocesano (PDF)
              </h5>
              <p className="text-xs text-[#736555]">
                Consulta il testo integrale della seconda edizione dal server ufficiale della Diocesi di Milano.
              </p>
            </div>

            <a
              href={selectedSection.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#5c4a37] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#4a3c2c] transition hover:scale-105"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Apri Documento Ufficiale (PDF)</span>
            </a>
          </div>

          {/* Viewer Incorporato */}
          <div className="space-y-2">
            <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-[#aa9576]">
              Anteprima e Consultazione On-line:
            </h4>
            <div className="w-full h-[650px] rounded-2xl overflow-hidden border border-[#decbb8] bg-[#ede5d8] shadow-inner">
              <iframe
                src={`${selectedSection.pdfUrl}#toolbar=1&navpanes=0`}
                className="w-full h-full border-0"
                title={`Messale Ambrosiano - ${selectedSection.title}`}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Lista e Indice delle Sezioni del Messale */
        <div className="space-y-6">
          {/* Barra di Ricerca e Filtri */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl border border-[#e4dcce] bg-[#fffdfa] shadow-xs">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Cerca formulario, tempo o parola chiave..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-[#dac8b1] bg-[#fdfbf7] py-2 pl-9 pr-4 text-xs text-[#3f3933] placeholder-[#8a755d] focus:border-[#aa9576] focus:outline-none"
              />
              <span className="absolute left-3 top-2.5 text-xs text-[#8a755d]">🔍</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {categories.slice(0, 6).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    filterCategory === cat
                      ? "bg-[#5c4a37] text-white shadow-xs"
                      : "bg-[#f5ece0] text-[#6b5d4e] hover:bg-[#ebdcc8]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Griglia delle 12 Sezioni */}
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
                        {sec.category}
                      </span>
                    </div>
                    <span className="text-xs text-[#8a755d] font-semibold group-hover:translate-x-1 transition-transform">
                      Consulta →
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
                  <span className="font-sans font-medium">Testo Ufficiale CEI / ITL</span>
                  <span className="font-bold text-[#5c4a37]">Apri Volume 📖</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
