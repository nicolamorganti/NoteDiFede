"use client";

import { useState, useEffect } from "react";
import { PreghieraNav } from "@/components/preghiera-nav";
import { LiturgicalTtsPlayer } from "@/components/liturgical-tts-player";


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
    id: "decreti-presentazione",
    title: "Dichiarazione, Decreti Ufficiali & Presentazione CEI",
    subtitle: "Promulgazione della versione italiana del Benedizionale",
    description:
      "I testi magisteriali di promulgazione: Dichiarazione del Presidente della CEI, Decreto di conferma della Congregazione per il Culto Divino e la Disciplina dei Sacramenti e la Presentazione teologico-pastorale dell'Episcopato Italiano.",
    category: "Magistero & Decreti",
    icon: "📜",
    startPage: 1,
    endPage: 20,
    pageRangeLabel: "Pagine stampate 5 - 16 (PDF 1 - 20)",
    highlights: [
      "Dichiarazione del Presidente della CEI",
      "Decreto della Congregazione per il Culto Divino",
      "Presentazione dell'Episcopato Italiano",
      "Orientamenti teologici e pastorali sulle benedizioni",
    ],
  },
  {
    id: "premesse-generali",
    title: "Premesse Generali (Praenotanda) & Decreto Culto Divino",
    subtitle: "Natura teologica, uffici, ministeri e celebrazione delle benedizioni",
    description:
      "Il documento fondamentale che definisce la teologia della benedizione nella storia della salvezza, gli uffici e ministeri (vescovo, presbitero, diacono, laici) e le norme per una degna celebrazione comunitaria.",
    category: "Norme Liturgiche",
    icon: "📑",
    startPage: 21,
    endPage: 40,
    pageRangeLabel: "Pagine stampate 17 - 38 (PDF 21 - 40)",
    highlights: [
      "La benedizione nella storia della salvezza e nella vita della Chiesa",
      "Uffici e ministeri (Vescovo, Presbiteri, Diaconi, Ministri istituiti, Genitori)",
      "Struttura della celebrazione: Parola di Dio e Preghiera della Chiesa",
      "Adattamenti di competenza delle Conferenze Episcopali",
    ],
  },
  {
    id: "parte-prima-persone",
    title: "Parte I: Benedizioni delle Persone (Comunità e Famiglia)",
    subtitle: "Famiglie, sposi, bambini, fidanzati, malati, anziani e missionari",
    description:
      "Tutti i formulari di benedizione per le persone: Comunità (benefici ricevuti, missionari, operatori pastorali, catechisti, anno scolastico, malati, infermi, volontari, pellegrini, viaggiatori, migranti, profughi) e Famiglia (visita annuale delle case, sposi, bambini, figli, fidanzati, madri, anziani).",
    category: "Persone & Famiglia",
    icon: "👥",
    startPage: 41,
    endPage: 308,
    pageRangeLabel: "Pagine stampate 39 - 304 (PDF 41 - 308)",
    highlights: [
      "Sezione I - La Comunità (Ringraziamento, Catechisti, Anno scolastico, Malati, Pellegrini, Migranti)",
      "Sezione II - La Comunità Familiare (Benedizione annuale delle famiglie, Coniugi, Bambini)",
      "Benedizione dei fidanzati, madri prima e dopo il parto, figli e anziani",
    ],
  },
  {
    id: "parte-seconda-dimore",
    title: "Parte II: Benedizioni per le Dimore e le Attività dell'Uomo",
    subtitle: "Case, cantieri, scuole, ospedali, impianti tecnici, lavoro, animali e mensa",
    description:
      "Benedizioni per le realtà umane e quotidiane: Case e ambienti di lavoro (abitazioni, cantieri, parrocchie, seminari, comunità religiose, scuole, università, biblioteche, ospedali, uffici, officine, negozi); Impianti e strumenti (comunicazioni sociali, sport, apparecchiature, veicoli e mezzi di trasporto, attrezzi); La terra e i suoi frutti (animali, campi, prati, primizie, benedizione della mensa per i vari tempi liturgici).",
    category: "Dimore & Lavoro",
    icon: "🏡",
    startPage: 309,
    endPage: 486,
    pageRangeLabel: "Pagine stampate 305 - 484 (PDF 309 - 486)",
    highlights: [
      "Sezione I - Le case, locali parrocchiali, scuole, ospedali, uffici e negozi",
      "Sezione II - Mezzi di trasporto, impianti tecnici, attrezzi di lavoro",
      "Sezione III - Animali, campi, pascoli, primizie e Benedizione della Mensa",
    ],
  },
  {
    id: "parte-terza-luoghi",
    title: "Parte III: Benedizioni di Luoghi, Arredi e Suppellettili per il Culto",
    subtitle: "Fonte battesimale, altare, croce, immagini sacre, campane, organo e cimiteri",
    description:
      "Benedizioni per lo spazio sacro e l'arte liturgica: Battistero e fonte battesimale, cattedra e sede presidenziale, ambone, altare, calice e patena, tabernacolo, croce per la venerazione, immagini del Signore, della Vergine Maria e dei Santi, sede della penitenza, porta della chiesa, campane e torre campanaria, organo a canne, oggetti per il culto, Via Crucis, nuovo cimitero e tombe dei defunti.",
    category: "Luoghi & Oggetti Sacri",
    icon: "⛪",
    startPage: 487,
    endPage: 650,
    pageRangeLabel: "Pagine stampate 485 - 648 (PDF 487 - 650)",
    highlights: [
      "Battistero, Ambone, Altare, Calice e Patena, Tabernacolo",
      "Croci, Immagini di Cristo, della Vergine Maria e dei Santi",
      "Campane, Organo, Via Crucis, Nuovo Cimitero e Tombe",
    ],
  },
  {
    id: "parte-quarta-devozione",
    title: "Parte IV: Benedizioni riguardanti la Devozione Popolare",
    subtitle: "Acque, mare, fuoco, cibi e bevande pasquali, corone del Rosario e scapolari",
    description:
      "I riti legati alla pietà popolare e alla fede del popolo cristiano: Benedizione del mare, laghi, fiumi, sorgenti e fontane; Benedizione del fuoco; Benedizione ai cibi e bevande (pane, vino, olio, sale, acqua, agnello pasquale, uova di Pasqua); Benedizione delle corone del Rosario; Benedizione e imposizione dello scapolare.",
    category: "Pietà Popolare",
    icon: "🕯️",
    startPage: 651,
    endPage: 728,
    pageRangeLabel: "Pagine stampate 649 - 726 (PDF 651 - 728)",
    highlights: [
      "Benedizione del mare, fiumi e sorgenti, benedizione del fuoco",
      "Benedizione pasquale dei cibi (pane, vino, olio, sale, agnello, uova)",
      "Corone del Santo Rosario e Scapolari",
    ],
  },
  {
    id: "parte-quinta-circostanze",
    title: "Parte V: Benedizioni per Diverse Circostanze",
    subtitle: "Rendimento di grazie per benefici ricevuti, cose e situazioni varie",
    description:
      "Formulari per circostanze particolari: Benedizione per i benefici ricevuti e rendimento di grazie; Benedizione per cose e situazioni varie non contemplate nelle sezioni precedenti.",
    category: "Circostanze Varie",
    icon: "✨",
    startPage: 729,
    endPage: 744,
    pageRangeLabel: "Pagine stampate 727 - 740 (PDF 729 - 744)",
    highlights: [
      "Benedizione e inno di ringraziamento per i benefici ricevuti",
      "Benedizione per cose, strumenti e situazioni varie",
    ],
  },
  {
    id: "appendice-liturgica",
    title: "Appendice Liturgica (I, II, III)",
    subtitle: "Quattro Tempora, Rogazioni, Riti del Vescovo, Parroco e Ministri Straordinari",
    description:
      "I. Altre benedizioni per occasioni particolari (Quattro Tempora, Rogazioni prima dell'Ascensione e Giornata del Ringraziamento, Ricorrenze civili e patria, Anniversario di ordinazione, Salvaguardia della salute); II. Dal Cerimoniale dei Vescovi (Benedizioni proprie del Vescovo, Ingresso del nuovo Parroco); III. Altre celebrazioni (Istituzione dei Ministri Straordinari dell'Eucaristia, Incoronazione di un'immagine di Maria).",
    category: "Appendice Liturgica",
    icon: "📖",
    startPage: 745,
    endPage: 856,
    pageRangeLabel: "Pagine stampate 741 - 852 (PDF 745 - 856)",
    highlights: [
      "Appendice I: Quattro Tempora, Rogazioni, Patria e Lavoro, Anniversario Ordinazione",
      "Appendice II: Benedizioni del Vescovo e Rito d'Ingresso del nuovo Parroco",
      "Appendice III: Ministri Straordinari della Comunione e Incoronazione di Maria",
    ],
  },
  {
    id: "lezionario",
    title: "Lezionario del Benedizionale",
    subtitle: "Letture dell'Antico Testamento, Nuovo Testamento, Salmi e Vangeli",
    description:
      "L'ampia raccolta di pericopi bibliche per la celebrazione delle benedizioni: Testi dell'Antico Testamento (Genesi, Esodo, Profeti, Sapienza), Nuovo Testamento (Lettere apostoliche), Salmi responsoriali con ritornelli, Acclamazioni al Vangelo e brani dei quattro Vangeli.",
    category: "Sacra Scrittura",
    icon: "📕",
    startPage: 857,
    endPage: 1108,
    pageRangeLabel: "Pagine stampate 853 - 1104 (PDF 857 - 1108)",
    highlights: [
      "Antico Testamento (pp. 854 - 933)",
      "Nuovo Testamento (pp. 934 - 986)",
      "Salmi responsoriali e Acclamazioni (pp. 987 - 1039)",
      "Vangeli (pp. 1040 - 1104)",
    ],
  },
  {
    id: "preghiere-canti",
    title: "Preghiere, Canti e Litanie",
    subtitle: "Preghiere comuni, Salmi, Cantici biblici, Te Deum e Litanie dei Santi",
    description:
      "Repertorio di preghiere e inni: Preghiere comuni (Padre Nostro, Ave Maria, Gloria), Salmi, Cantici biblici (Daniele, Magnificat, Benedictus), Inni di lode (Te Deum, Cantico delle creature di S. Francesco), Litanie dei Santi (per varie necessità, brevi, per i malati), Litanie della Vergine (Incoronazione, Lauretane) e Acclamazioni.",
    category: "Preghiere & Canti",
    icon: "🕊️",
    startPage: 1109,
    endPage: 1153,
    pageRangeLabel: "Pagine stampate 1105 - 1149 (PDF 1109 - 1153)",
    highlights: [
      "Preghiere comuni, Salmi e Cantici (Magnificat, Benedictus)",
      "Te Deum e Cantico delle Creature di San Francesco",
      "Litanie dei Santi (ordinarie, brevi, infermi) e Litanie Lauretane",
    ],
  },
  {
    id: "testi-latini",
    title: "Testi Latini (Preghiere, Salmi, Inni e Antifone Mariane)",
    subtitle: "Pater Noster, Salmi penitenziali, Inni storici e antifone della Vergine",
    description:
      "Tutti i testi liturgici latini tradizionali: Pater Noster, Ave Maria, Gloria Patri; Salmi (Miserere, Laudate Dominum, De profundis, Lauda Ierusalem); Cantici (Magnificat, Benedictus); Inni (Te Deum, Vexilla Regis, Pange lingua, Veni Creator, Veni Sancte Spiritus); Antifone mariane (Alma Redemptoris, Ave Regina, Salve Regina, Sub tuum praesidium, Regina caeli); Requiem aeternam.",
    category: "Latino Liturgico",
    icon: "🏛️",
    startPage: 1154,
    endPage: 1188,
    pageRangeLabel: "Pagine stampate 1150 - 1184 (PDF 1154 - 1188)",
    highlights: [
      "Pater Noster, Ave Maria, Gloria Patri e Salmi (Miserere, De Profundis)",
      "Te Deum, Pange Lingua, Veni Creator Spiritus, Vexilla Regis",
      "Antifone della Vergine Maria (Salve Regina, Regina Caeli, Sub Tuum Praesidium)",
    ],
  },
  {
    id: "formule-brevi",
    title: "Benedizioni delle Persone in Forma Breve & Angelus",
    subtitle: "Formule brevi per la pastorale quotidiana e preghiera dell'Angelus",
    description:
      "Prontuario per sacerdoti, diaconi e fedeli con le formule brevi di benedizione per le persone, e la preghiera dell'Angelus Domini e Regina Caeli con testo italiano e latino a fronte.",
    category: "Pastorale Breve",
    icon: "⚡",
    startPage: 1189,
    endPage: 1200,
    pageRangeLabel: "Pagine stampate 1185 - 1196 (PDF 1189 - 1200)",
    highlights: [
      "Formule brevi di benedizione per le persone",
      "L'Angelus Domini e Regina Caeli (Italiano e Latino)",
    ],
  },
  {
    id: "indici",
    title: "Indici Ufficiali del Benedizionale",
    subtitle: "Indice alfabetico di tutte le benedizioni e Indice Generale completo",
    description:
      "Gli indici analitici del volume: Indice alfabetico ragionato di tutti i riti e benedizioni e l'Indice Generale completo dell'opera (pp. 1207 - 1227).",
    category: "Indici & Consultazione",
    icon: "🔍",
    startPage: 1201,
    endPage: 1237,
    pageRangeLabel: "Pagine stampate 1197 - 1227 (PDF 1201 - 1237)",
    highlights: [
      "Indice alfabetico ragionato delle benedizioni",
      "Indice Generale completo della Conferenza Episcopale Italiana",
    ],
  },
];

const PDF_URL = "https://liturgico.chiesacattolica.it/wp-content/uploads/sites/8/2022/04/08/Benedizionale-DEFINITIVO-.pdf";

const LITURGICAL_LANGUAGES = [
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "la", name: "Latino", flag: "🇻🇦" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "ro", name: "Română", flag: "🇷🇴" },
];

export function BenedizionaleReader() {
  const [mainTab, setMainTab] = useState<"online" | "pdf">("online");
  const [selectedSection, setSelectedSection] = useState<BenedizioneSection | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("Tutte");

  // Stato per la consultazione testuale online (iBreviary)
  const [selectedLang, setSelectedLang] = useState<string>("it");
  const [isDualMode, setIsDualMode] = useState<boolean>(false);
  const [secondaryLang, setSecondaryLang] = useState<string>("la");
  const [secondaryOnlineId, setSecondaryOnlineId] = useState<string | null>(null);
  const [secondaryItems, setSecondaryItems] = useState<{ id: string; title: string }[]>([]);
  const [secondaryOnlineHtml, setSecondaryOnlineHtml] = useState<string>("");
  const [isLoadingSecondary, setIsLoadingSecondary] = useState<boolean>(false);

  const [onlineItems, setOnlineItems] = useState<{ id: string; title: string }[]>([]);
  const [selectedOnlineId, setSelectedOnlineId] = useState<string | null>("125");
  const [onlineHtml, setOnlineHtml] = useState<string>("");
  const [isLoadingOnline, setIsLoadingOnline] = useState<boolean>(false);
  const [onlineSearch, setOnlineSearch] = useState<string>("");
  const [fontSize, setFontSize] = useState<number>(17);
  const [lineSpacingMode, setLineSpacingMode] = useState<"compact" | "normal" | "spacious">("normal");
  const [isChurchMode, setIsChurchMode] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Inizializza lingua da localStorage
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("liturgia_pref_lang");
      if (savedLang) setSelectedLang(savedLang);
      const savedDual = localStorage.getItem("benedizionale_dual_mode");
      if (savedDual === "true") setIsDualMode(true);
      const savedSecLang = localStorage.getItem("benedizionale_secondary_lang");
      if (savedSecLang) setSecondaryLang(savedSecLang);
    } catch {}
  }, []);

  const handleLangChange = (newLang: string) => {
    setSelectedLang(newLang);
    if (secondaryLang === newLang) {
      setSecondaryLang(newLang === "la" ? "it" : "la");
    }
    try {
      localStorage.setItem("liturgia_pref_lang", newLang);
    } catch {}
  };

  const handleSecondaryLangChange = (newLang: string) => {
    setSecondaryLang(newLang);
    try {
      localStorage.setItem("benedizionale_secondary_lang", newLang);
    } catch {}
  };

  const toggleDualMode = () => {
    const next = !isDualMode;
    setIsDualMode(next);
    try {
      localStorage.setItem("benedizionale_dual_mode", String(next));
    } catch {}
  };

  // Carica la lista dei riti e benedizioni (Primaria)
  useEffect(() => {
    if (mainTab !== "online") return;

    let isMounted = true;
    setIsLoadingOnline(true);
    fetch(`/api/benedizionale-online?lang=${selectedLang}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data.items) {
            setOnlineItems(data.items);
            if (data.items.length > 0) {
              setSelectedOnlineId(data.items[0].id);
            }
          }
          setIsLoadingOnline(false);
        }
      })
      .catch((err) => {
        console.error("Errore caricamento lista Benedizionale:", err);
        if (isMounted) setIsLoadingOnline(false);
      });

    return () => {
      isMounted = false;
    };
  }, [mainTab, selectedLang]);

  // Carica la lista dei riti per la lingua secondaria (Testo a Fronte)
  useEffect(() => {
    if (mainTab !== "online" || !isDualMode) return;

    let isMounted = true;
    fetch(`/api/benedizionale-online?lang=${secondaryLang}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.items) {
          setSecondaryItems(data.items);
          const primaryIndex = onlineItems.findIndex((it) => it.id === selectedOnlineId);
          if (primaryIndex >= 0 && data.items[primaryIndex]) {
            setSecondaryOnlineId(data.items[primaryIndex].id);
          } else if (data.items.length > 0) {
            setSecondaryOnlineId(data.items[0].id);
          }
        }
      })
      .catch((err) => console.error("Errore caricamento lista secondaria benedizionale:", err));

    return () => {
      isMounted = false;
    };
  }, [mainTab, secondaryLang, isDualMode, selectedOnlineId, onlineItems]);

  // Carica il testo del rito selezionato (Primaria)
  useEffect(() => {
    if (mainTab !== "online" || !selectedOnlineId) return;

    let isMounted = true;
    setIsLoadingOnline(true);
    fetch(`/api/benedizionale-online?id=${selectedOnlineId}&lang=${selectedLang}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data.html) {
            const clean = data.html
              .replace(/<p[^>]*>\s*<a[^>]*>\s*-\s*Menu\s*-\s*<\/a>\s*<\/p>/gi, "")
              .replace(/<p[^>]*>\s*-\s*Menu\s*-\s*<\/p>/gi, "")
              .replace(/<a[^>]*>\s*-\s*Menu\s*-\s*<\/a>/gi, "")
              .replace(/-\s*Menu\s*-/gi, "")
              .replace(/<p>\s*(?:<br\s*\/?>|\s|&nbsp;)*<\/p>/gi, "")
              .replace(/(?:<br\s*\/?>\s*){3,}/gi, "<br /><br />");
            setOnlineHtml(clean);
          }
          setIsLoadingOnline(false);
        }
      })
      .catch((err) => {
        console.error("Errore caricamento testo rito:", err);
        if (isMounted) setIsLoadingOnline(false);
      });

    return () => {
      isMounted = false;
    };
  }, [mainTab, selectedOnlineId, selectedLang]);

  // Carica il testo del rito secondario (Testo a Fronte)
  useEffect(() => {
    if (mainTab !== "online" || !isDualMode || !secondaryOnlineId) return;

    let isMounted = true;
    setIsLoadingSecondary(true);
    fetch(`/api/benedizionale-online?id=${secondaryOnlineId}&lang=${secondaryLang}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data.html) {
            const clean = data.html
              .replace(/<p[^>]*>\s*<a[^>]*>\s*-\s*Menu\s*-\s*<\/a>\s*<\/p>/gi, "")
              .replace(/<p[^>]*>\s*-\s*Menu\s*-\s*<\/p>/gi, "")
              .replace(/<a[^>]*>\s*-\s*Menu\s*-\s*<\/a>/gi, "")
              .replace(/-\s*Menu\s*-/gi, "")
              .replace(/<p>\s*(?:<br\s*\/?>|\s|&nbsp;)*<\/p>/gi, "")
              .replace(/(?:<br\s*\/?>\s*){3,}/gi, "<br /><br />");
            setSecondaryOnlineHtml(clean);
          }
          setIsLoadingSecondary(false);
        }
      })
      .catch((err) => {
        console.error("Errore caricamento testo secondario benedizionale:", err);
        if (isMounted) setIsLoadingSecondary(false);
      });

    return () => {
      isMounted = false;
    };
  }, [mainTab, secondaryOnlineId, secondaryLang, isDualMode]);



  const categories = [
    "Tutte",
    "Magistero & Decreti",
    "Norme Liturgiche",
    "Persone & Famiglia",
    "Dimore & Lavoro",
    "Luoghi & Oggetti Sacri",
    "Pietà Popolare",
    "Circostanze Varie",
    "Appendice Liturgica",
    "Sacra Scrittura",
    "Preghiere & Canti",
    "Latino Liturgico",
    "Pastorale Breve",
    "Indici & Consultazione",
  ];

  const filteredPdfSections = BENEDIZIONALE_SECTIONS.filter((sec) => {
    if (activeCategory !== "Tutte" && sec.category !== activeCategory) return false;
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

  const filteredOnlineItems = onlineItems.filter((it) => {
    if (!onlineSearch.trim()) return true;
    return it.title.toLowerCase().includes(onlineSearch.toLowerCase());
  });

  const handleCopyText = () => {
    const tmp = document.createElement("div");
    tmp.innerHTML = onlineHtml;
    const text = tmp.innerText || tmp.textContent || "";
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cycleLineSpacing = () => {
    if (lineSpacingMode === "compact") setLineSpacingMode("normal");
    else if (lineSpacingMode === "normal") setLineSpacingMode("spacious");
    else setLineSpacingMode("compact");
  };

  const spacingLabel =
    lineSpacingMode === "compact"
      ? "Compatta"
      : lineSpacingMode === "normal"
      ? "Normale"
      : "Ampia";

  const lineHeightValue =
    lineSpacingMode === "compact"
      ? "1.35"
      : lineSpacingMode === "normal"
      ? "1.6"
      : "1.85";

  const paragraphMarginValue =
    lineSpacingMode === "compact"
      ? "0.3em"
      : lineSpacingMode === "normal"
      ? "0.65em"
      : "1.05em";

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
            Edizione Ufficiale CEI 1992
          </span>
        </div>
        <p className="text-sm text-[#736555] max-w-3xl leading-relaxed">
          Consulta i testi e i formulari di benedizione on-line in formato testuale (con rubriche in rosso e dialoghi) oppure sfoglia i volumi e i PDF estratti a 13 sezioni conformi all&apos;Indice Generale ufficiale.
        </p>
      </div>

      {/* Selettore Modalità Principale: Consultazione Live vs Volumi PDF */}
      <div className="flex items-center justify-center sm:justify-start gap-2 p-1.5 rounded-2xl bg-[#ede4d8] border border-[#ddd0c0] shadow-inner">
        <button
          onClick={() => setMainTab("online")}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition ${
            mainTab === "online"
              ? "bg-[#5c4a37] text-white shadow-md"
              : "text-[#6b5d4e] hover:bg-[#f6eee3] hover:text-[#3f3933]"
          }`}
        >
          <span>🌐 Consultazione Testuale On-line (iBreviary)</span>
        </button>
        <button
          onClick={() => setMainTab("pdf")}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition ${
            mainTab === "pdf"
              ? "bg-[#5c4a37] text-white shadow-md"
              : "text-[#6b5d4e] hover:bg-[#f6eee3] hover:text-[#3f3933]"
          }`}
        >
          <span>📕 Volumi Ufficiali & PDF Estratti (CEI 1992)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SEZIONE 1: CONSULTAZIONE TESTUALE ON-LINE (iBreviary Riti) */}
      {/* ========================================================================= */}
      {mainTab === "online" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Barra Strumenti: Ricerca nel sottomenu, Font Size, Interlinea, Copia & Modalità Notturna */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[#e4dcce] bg-[#fffdfa] p-3.5 shadow-xs">
            {/* Ricerca tra i 101 formulari */}
            <div className="relative flex-1 min-w-[220px]">
              <input
                type="text"
                placeholder="Cerca tra i 101 riti e benedizioni (famiglia, malati, case, oggetti, defunti)..."
                value={onlineSearch}
                onChange={(e) => setOnlineSearch(e.target.value)}
                className="w-full rounded-2xl border border-[#dac8b1] bg-[#fdfbf7] py-2 pl-9 pr-4 text-xs text-[#3f3933] placeholder-[#8a755d] focus:border-[#aa9576] focus:outline-none"
              />
              <span className="absolute left-3 top-2.5 text-xs text-[#8a755d]">🔍</span>
            </div>

            {/* Controlli Lettore */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Selettore Lingua / Rito */}
              <div className="relative flex items-center rounded-xl border border-[#d9cdbf] bg-[#fbf8f4] px-2 py-1">
                <span className="text-xs mr-1">🌐</span>
                <select
                  value={selectedLang}
                  onChange={(e) => handleLangChange(e.target.value)}
                  className="bg-transparent text-xs font-bold text-[#5c4a37] focus:outline-none cursor-pointer pr-1"
                >
                  {LITURGICAL_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lettore Vocale Text-to-Speech */}
              <LiturgicalTtsPlayer
                htmlContent={onlineHtml}
                lang={selectedLang}
                title="Ascolta"
              />

              {/* Dimensione Font */}
              <div className="flex items-center rounded-xl border border-[#d9cdbf] bg-[#fbf8f4] p-0.5">

                <button
                  onClick={() => setFontSize((s) => Math.max(14, s - 1))}
                  disabled={fontSize <= 14}
                  className="px-2.5 py-1 text-xs font-bold text-[#5c4a37] hover:bg-[#ede4d6] rounded-lg transition disabled:opacity-30"
                  title="Riduci font"
                >
                  A-
                </button>
                <span className="px-1 text-[11px] font-mono text-[#8a755d]">{fontSize}px</span>
                <button
                  onClick={() => setFontSize((s) => Math.min(26, s + 1))}
                  disabled={fontSize >= 26}
                  className="px-2.5 py-1 text-xs font-bold text-[#5c4a37] hover:bg-[#ede4d6] rounded-lg transition disabled:opacity-30"
                  title="Aumenta font"
                >
                  A+
                </button>
              </div>

              {/* Pulsante Testo a Fronte Bilingue */}
              <button
                onClick={toggleDualMode}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                  isDualMode
                    ? "bg-[#5c4a37] border-[#4a3c2c] text-amber-200 shadow-xs"
                    : "bg-[#fbf8f4] border-[#d9cdbf] text-[#5c4a37] hover:bg-[#ede4d6]"
                }`}
                title="Attiva/disattiva visualizzazione a due colonne con testo a fronte bilingue"
              >
                <span>📖 Testo a Fronte</span>
              </button>

              {/* Regolazione Interlinea e Spaziatura */}
              <button
                onClick={cycleLineSpacing}
                className="flex items-center gap-1.5 rounded-xl border border-[#d9cdbf] bg-[#fbf8f4] px-3 py-1.5 text-xs font-semibold text-[#5c4a37] hover:bg-[#ede4d6] transition"
                title="Cambia interlinea (Compatta / Normale / Ampia)"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                <span>{spacingLabel}</span>
              </button>

              {/* Copia Testo */}
              <button
                onClick={handleCopyText}
                className="flex items-center gap-1 rounded-xl border border-[#d9cdbf] bg-[#fbf8f4] px-3 py-1.5 text-xs font-semibold text-[#5c4a37] hover:bg-[#ede4d6] transition"
              >
                {copied ? <span className="text-emerald-600 font-bold">✓ Copiato</span> : <span>📋 Copia</span>}
              </button>

              {/* Modalità Notturna */}
              <button
                onClick={() => setIsChurchMode(!isChurchMode)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                  isChurchMode
                    ? "bg-[#292524] border-[#44403c] text-amber-300 shadow-xs"
                    : "bg-[#fbf8f4] border-[#d9cdbf] text-[#5c4a37] hover:bg-[#ede4d6]"
                }`}
              >
                <span>{isChurchMode ? "🌙 Notte" : "☀️ Giorno"}</span>
              </button>
            </div>
          </div>

          {/* Griglia Selezione Rito / Benedizione */}
          <div className="flex flex-wrap items-center gap-1.5 max-h-52 overflow-y-auto p-2.5 rounded-2xl border border-[#e4dcce] bg-[#fdfbf7]">
            {filteredOnlineItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedOnlineId(item.id)}
                className={`rounded-xl px-3 py-1 text-xs font-semibold transition ${
                  selectedOnlineId === item.id
                    ? "bg-[#5c4a37] text-white shadow-xs"
                    : "bg-[#f5ece0] text-[#6b5d4e] hover:bg-[#ebdcc8]"
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>

          {/* Contenuto Testuale Formattato (Singola o Doppia Colonna) */}
          {isDualMode ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Colonna Sinistra: Lingua Primaria */}
              <div
                className={`benedizionale-online-content rounded-3xl border p-5 sm:p-7 shadow-md transition flex flex-col ${
                  isChurchMode
                    ? "border-[#3f3a36] bg-[#181614] text-[#ece8e2]"
                    : "border-[#e0d6c7] bg-[#fefdfb] text-[#2c2621]"
                }`}
                style={{ fontSize: `${fontSize}px` }}
              >
                <div className="flex items-center justify-between border-b pb-2 mb-4 border-[#e4dcce]/40">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">🌐</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#aa9576]">
                      {LITURGICAL_LANGUAGES.find((l) => l.code === selectedLang)?.flag}{" "}
                      {LITURGICAL_LANGUAGES.find((l) => l.code === selectedLang)?.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#8a755d] bg-[#f5ece0] px-2 py-0.5 rounded-md">
                    Testo Base
                  </span>
                </div>

                {isLoadingOnline ? (
                  <div className="flex items-center justify-center py-16 gap-3 text-sm text-[#8a755d]">
                    <span className="inline-block animate-spin text-xl">⏳</span>
                    <span>Caricamento del rito...</span>
                  </div>
                ) : (
                  <div
                    className="prose max-w-none font-serif flex-1"
                    dangerouslySetInnerHTML={{ __html: onlineHtml }}
                  />
                )}
              </div>

              {/* Colonna Destra: Lingua Secondaria a Fronte */}
              <div
                className={`benedizionale-online-content rounded-3xl border p-5 sm:p-7 shadow-md transition flex flex-col ${
                  isChurchMode
                    ? "border-[#3f3a36] bg-[#1a1715] text-[#ece8e2]"
                    : "border-[#e0d6c7] bg-[#faf6ef] text-[#2c2621]"
                }`}
                style={{ fontSize: `${fontSize}px` }}
              >
                <div className="flex items-center justify-between border-b pb-2 mb-4 border-[#e4dcce]/40">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">⚖️</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#aa9576]">
                      A Fronte:
                    </span>
                    <select
                      value={secondaryLang}
                      onChange={(e) => handleSecondaryLangChange(e.target.value)}
                      className="bg-[#f0e4d2] border border-[#d8c5ad] rounded-lg px-2 py-0.5 text-xs font-bold text-[#5c4a37] focus:outline-none cursor-pointer"
                    >
                      {LITURGICAL_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.flag} {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="text-[10px] font-mono text-[#8a755d] bg-[#ebdcc8] px-2 py-0.5 rounded-md">
                    Traduzione / Ritus
                  </span>
                </div>

                {isLoadingSecondary ? (
                  <div className="flex items-center justify-center py-16 gap-3 text-sm text-[#8a755d]">
                    <span className="inline-block animate-spin text-xl">⏳</span>
                    <span>Caricamento rito a fronte...</span>
                  </div>
                ) : (
                  <div
                    className="prose max-w-none font-serif flex-1"
                    dangerouslySetInnerHTML={{ __html: secondaryOnlineHtml }}
                  />
                )}
              </div>
            </div>
          ) : (
            <div
              className={`benedizionale-online-content rounded-3xl border p-6 sm:p-10 shadow-lg transition ${
                isChurchMode
                  ? "border-[#3f3a36] bg-[#181614] text-[#ece8e2]"
                  : "border-[#e0d6c7] bg-[#fefdfb] text-[#2c2621]"
              }`}
              style={{ fontSize: `${fontSize}px` }}
            >
              {isLoadingOnline ? (
                <div className="flex items-center justify-center py-16 gap-3 text-sm text-[#8a755d]">
                  <span className="inline-block animate-spin text-xl">⏳</span>
                  <span>Caricamento del rito di benedizione...</span>
                </div>
              ) : (
                <div
                  className="prose max-w-none font-serif"
                  dangerouslySetInnerHTML={{ __html: onlineHtml }}
                />
              )}
            </div>
          )}


          {/* Stili Scoped per Benedizionale Online (supporto perfetto modalità giorno / notte & interlinea) */}
          <style jsx global>{`
            .benedizionale-online-content {
              word-break: break-word;
              color: ${isChurchMode ? "#f5f5f4" : "#2c2621"};
            }
            .benedizionale-online-content p,
            .benedizionale-online-content .benedizionale-testo,
            .benedizionale-online-content .body_1,
            .benedizionale-online-content .body_2,
            .benedizionale-online-content .body_3 {
              color: ${isChurchMode ? "#f5f5f4 !important" : "#2c2621 !important"};
              font-family: inherit;
              font-style: normal;
              text-transform: none !important;
              letter-spacing: normal !important;
              line-height: ${lineHeightValue};
              margin-bottom: ${paragraphMarginValue};
              margin-top: 0.15em;
            }
            .benedizionale-online-content span {
              line-height: inherit;
            }
            .benedizionale-online-content .benedizionale-rubrica,
            .benedizionale-online-content .rubrica {
              color: ${isChurchMode ? "#f87171 !important" : "#b91c1c !important"};
              font-family: inherit;
              font-style: italic;
              font-weight: 500;
              font-size: 0.95em;
              text-transform: none !important;
              letter-spacing: normal !important;
              display: inline;
              line-height: ${lineHeightValue};
            }
            .benedizionale-online-content .benedizionale-dialogo {
              color: ${isChurchMode ? "#f87171 !important" : "#b91c1c !important"};
              font-weight: 700;
              display: inline;
              margin-right: 0.15rem;
            }

            .benedizionale-online-content .benedizionale-titolo,
            .benedizionale-online-content .titolo,
            .benedizionale-online-content h1,
            .benedizionale-online-content h2,
            .benedizionale-online-content h3 {
              display: block;
              font-family: inherit;
              font-weight: 700;
              font-size: 1.25em;
              color: ${isChurchMode ? "#fbbf24 !important" : "#5c4a37 !important"};
              margin-top: 1em;
              margin-bottom: 0.3em;
              border-bottom: 1px solid ${isChurchMode ? "#332b24" : "#ebdcc8"};
              padding-bottom: 0.25em;
            }
            .benedizionale-online-content .benedizionale-sezione,
            .benedizionale-online-content .sezione {
              display: block;
              font-family: system-ui, -apple-system, sans-serif;
              font-weight: 700;
              font-size: 0.75em;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: ${isChurchMode ? "#f59e0b !important" : "#aa9576 !important"};
              margin-bottom: 0.2em;
            }
            .benedizionale-online-content hr {
              border-color: ${isChurchMode ? "#332b24" : "#ede3d5"};
              margin: 0.9em 0;
            }
          `}</style>

          <div className="pt-2 flex items-center justify-between text-xs text-[#8a755d]">
            <span>Fonte testi: <em>iBreviary (Custodia di Terra Santa / don Paolo Padrini)</em></span>
            <a
              href="https://www.ibreviary.com/m2/preghiere.php?tipo=Rito"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5c4a37] font-semibold hover:underline"
            >
              Consulta su iBreviary ↗
            </a>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEZIONE 2: VOLUMI UFFICIALI & PDF ESTRATTI (CEI 1992) */}
      {/* ========================================================================= */}
      {mainTab === "pdf" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Disclaimer Legale & Ufficiale CEI */}
          <div className="p-4 sm:p-5 rounded-3xl border border-[#decbb8] bg-[#f9f4ec] shadow-xs space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-base">⚖️</span>
              <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#7e6955]">
                Disclaimer & Diritti d&apos;Autore
              </h4>
            </div>
            <div className="space-y-1.5 text-xs leading-relaxed text-[#6d5d4d] font-sans">
              <p>
                Il testo e i formulari del Benedizionale sono proprietà della <strong>Conferenza Episcopale Italiana (© 1992 Fondazione di Religione Santi Francesco e Caterina)</strong>.
              </p>
              <p>
                La presente sezione consente la <strong>consultazione on-line e lo studio liturgico per uso personale e pastorale senza scopo di lucro</strong>.
              </p>
            </div>
          </div>

          {/* Box Download Volume Completo */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#f4ece0] border border-[#dac7b0] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📘</span>
                <h4 className="font-serif font-bold text-base text-[#5c4a37]">
                  Benedizionale Completo Ufficiale CEI (1237 Pagine · PDF 29.5 MB)
                </h4>
              </div>
              <p className="text-xs text-[#736555] leading-relaxed">
                Il testo integrale del Benedizionale in formato PDF ad alta definizione, comprensivo di tutte le formule di benedizione per persone, famiglie, luoghi e oggetti sacri.
              </p>
            </div>

            <a
              href={PDF_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#5c4a37] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#4a3c2c] transition shrink-0"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Scarica Volume Completo</span>
            </a>
          </div>

          {/* Categorie Filtri */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setSelectedSection(null);
                }}
                className={`rounded-xl px-3 py-1 text-xs font-semibold transition shrink-0 ${
                  activeCategory === cat
                    ? "bg-[#5c4a37] text-white shadow-xs"
                    : "bg-[#f5ece0] text-[#6b5d4e] hover:bg-[#ebdcc8]"
                }`}
              >
                {cat}
              </button>
            ))}
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
                    Scarica o visualizza solo le pagine di questa sezione in un file PDF compatto.
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
                    placeholder="Cerca preghiere, famiglie, case, cibi, ammalati, oggetti sacri..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-2xl border border-[#dac8b1] bg-[#fdfbf7] py-2 pl-9 pr-4 text-xs text-[#3f3933] placeholder-[#8a755d] focus:border-[#aa9576] focus:outline-none"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-[#8a755d]">🔍</span>
                </div>
              </div>

              {/* Griglia delle Sezioni */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPdfSections.map((sec) => (
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
      )}
    </div>
  );
}
