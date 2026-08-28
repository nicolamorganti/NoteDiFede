"use client";

import { useState, useEffect } from "react";
import { PreghieraNav } from "@/components/preghiera-nav";
import { LiturgicalTtsPlayer } from "@/components/liturgical-tts-player";


interface MessaleRomanoSection {
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

const MESSALE_ROMANO_SECTIONS: MessaleRomanoSection[] = [
  {
    id: "decreti-costituzione",
    title: "Decreti Ufficiali, Presentazione CEI & Costituzione Apostolica",
    subtitle: "Approvazione della 3ª Edizione Italiana e Costituzione di Papa Paolo VI",
    description:
      "I testi magisteriali di promulgazione: Decreto del Presidente della CEI, Decreti della Congregazione per il Culto Divino e la Disciplina dei Sacramenti, Presentazione dell'Episcopato Italiano e la Costituzione Apostolica «Missale Romanum» di Papa Paolo VI.",
    category: "Magistero & Decreti",
    icon: "📜",
    startPage: 10,
    endPage: 21,
    pageRangeLabel: "Pagine romane V - XVI (PDF 10 - 21)",
    highlights: [
      "Decreto di conferma della Terza Edizione Italiana (Culto Divino)",
      "Decreto del Presidente della Conferenza Episcopale Italiana",
      "Presentazione dell'Episcopato Italiano alla 3ª edizione",
      "Costituzione Apostolica «Missale Romanum» di Papa Paolo VI (1969)",
    ],
  },
  {
    id: "ogmr",
    title: "Ordinamento Generale del Messale Romano (OGMR)",
    subtitle: "Principi teologici, norme liturgiche e compiti ministeriali",
    description:
      "Il testo normativo fondamentale che guida la teologia, la celebrazione, i ruoli dei ministri, i gesti, le posture, l'altare, i vasi sacri e l'arte liturgica secondo il Rito Romano rinnovato.",
    category: "Norme Liturgiche",
    icon: "📑",
    startPage: 22,
    endPage: 59,
    pageRangeLabel: "Pagine romane XVII - LIV (PDF 22 - 59)",
    highlights: [
      "Importanza e dignità della celebrazione eucaristica",
      "Struttura della Messa, suoi elementi e sue parti",
      "Uffici e ministeri nella celebrazione (Sacerdote, Diacono, Lettori, Ministranti)",
      "Disposizione e decoro della chiesa e dell'altare",
      "Precisazioni della Conferenza Episcopale Italiana",
    ],
  },
  {
    id: "anno-liturgico-calendario",
    title: "Norme Generali per l'Anno Liturgico & Calendario Romano",
    subtitle: "Lettera «Mysterii paschalis», precedenze e tabella celebrazioni",
    description:
      "La Lettera Apostolica di Paolo VI, le norme per l'Anno Liturgico e i tempi (Avvento, Natale, Quaresima, Pasqua, Tempo Ordinario), le solennità, le feste, le memorie, la tabella delle precedenze e il Calendario Romano Generale con le feste d'Italia.",
    category: "Norme Liturgiche",
    icon: "🗓️",
    startPage: 60,
    endPage: 83,
    pageRangeLabel: "Pagine romane LV - LXXVI (PDF 60 - 83)",
    highlights: [
      "Lettera Apostolica «Mysterii paschalis» di Paolo VI",
      "Norme generali per l'ordinamento dell'Anno liturgico e del calendario",
      "Tabella dei giorni liturgici disposti secondo l'ordine di precedenza",
      "Calendario Romano Generale e Tabella annuale delle celebrazioni mobili",
    ],
  },
  {
    id: "proprio-tempo",
    title: "Proprio del Tempo: Avvento, Natale, Quaresima, Triduo e Pasqua",
    subtitle: "I tempi forti della salvezza dall'Avvento a Pentecoste",
    description:
      "Tutti i formulari completi delle domeniche e delle ferie per l'Avvento, il Tempo di Natale fino al Battesimo del Signore, la Quaresima (dalle Ceneri), la Settimana Santa, la Messa nella Cena del Signore, la Passione, la Veglia Pasquale e i 50 giorni di Pasqua.",
    category: "Anno Liturgico",
    icon: "🕯️",
    startPage: 84,
    endPage: 343,
    pageRangeLabel: "Pagine stampate 1 - 260 (PDF 84 - 343)",
    highlights: [
      "Tempo di Avvento e Tempo di Natale",
      "Quaresima e Settimana Santa",
      "Triduo Pasquale (Cena del Signore, Passione, Veglia)",
      "Tempo di Pasqua fino alla Domenica di Pentecoste",
    ],
  },
  {
    id: "tempo-ordinario",
    title: "Tempo Ordinario: 34 Domeniche & Solennità del Signore",
    subtitle: "Le 34 domeniche per annum e le grandi solennità del Signore",
    description:
      "I formulari completi per le 34 domeniche del Tempo Ordinario, unitamente alle Solennità del Signore: Santissima Trinità, Santissimo Corpo e Sangue di Cristo (Corpus Domini), Sacratissimo Cuore di Gesù e Cristo Re dell'Universo.",
    category: "Anno Liturgico",
    icon: "🌿",
    startPage: 344,
    endPage: 389,
    pageRangeLabel: "Pagine stampate 261 - 306 (PDF 344 - 389)",
    highlights: [
      "Formulari per le 34 domeniche del Tempo Ordinario",
      "Santissima Trinità e SS.mo Corpo e Sangue di Cristo (Corpus Domini)",
      "Sacratissimo Cuore di Gesù",
      "Nostro Signore Gesù Cristo Re dell'Universo",
    ],
  },
  {
    id: "rito-messa-preghiere",
    title: "Rito della Messa con il Popolo & Preghiere Eucaristiche",
    subtitle: "Riti d'Introduzione, Canone I-IV, Riconciliazione e Varie Necessità",
    description:
      "Il cuore della celebrazione liturgica: Riti d'Introduzione con l'Atto Penitenziale («fratelli e sorelle»), Gloria («uomini, amati dal Signore»), Liturgia della Parola, Liturgia Eucaristica con Padre Nostro («non abbandonarci alla tentazione»), Prefazi, Canone Romano (I), Canoni II, III, IV, Preghiere della Riconciliazione e per Varie Necessità.",
    category: "Ordinario & Canoni",
    icon: "🍞",
    startPage: 390,
    endPage: 597,
    pageRangeLabel: "Pagine stampate 307 - 514 (PDF 390 - 597)",
    highlights: [
      "Rito della Messa con il popolo (Riti di Introduzione, Parola, Eucaristia, Comunione e Congedo)",
      "Tutti i Prefazi del Tempo, dei Santi e delle Feste",
      "Canone Romano (Preghiera Eucaristica I) e Preghiere Eucaristiche II, III, IV",
      "Preghiere Eucaristiche della Riconciliazione (I e II)",
      "Preghiera Eucaristica per le Messe «per varie necessità» (I - IV)",
      "Benedizioni solenni e Orazioni sul popolo",
    ],
  },
  {
    id: "proprio-santi",
    title: "Proprio dei Santi (Mese per Mese: Gennaio - Dicembre)",
    subtitle: "Le celebrazioni dei santi nel corso dell'anno civile",
    description:
      "Tutti i formulari liturgici ordinati da Gennaio a Dicembre per le solennità, feste e memorie dei Santi del calendario universale e dei patroni d'Italia: S. Francesco d'Assisi, S. Caterina da Siena, S. Benedetto, S. Maria Maddalena, S. Pio da Pietrelcina e i nuovi santi.",
    category: "Santorale",
    icon: "👑",
    startPage: 598,
    endPage: 775,
    pageRangeLabel: "Pagine stampate 515 - 694 (PDF 598 - 775)",
    highlights: [
      "Gennaio - Dicembre con tutte le memorie obbligatorie e facoltative",
      "San Francesco d'Assisi e Santa Caterina da Siena (Patroni d'Italia)",
      "San Benedetto abate (Patrono d'Europa)",
      "Santa Maria Maddalena (elevata al grado di Festa)",
      "San Pio da Pietrelcina e San Paolo VI",
    ],
  },
  {
    id: "comuni-santi",
    title: "Comuni dei Santi & Dedicazione della Chiesa",
    subtitle: "Formulari comuni per Maria, Martiri, Pastori, Dottori, Vergini e Religiosi",
    description:
      "I formulari comuni utilizzabili per la celebrazione dei santi: Dedicazione della Chiesa, Beata Vergine Maria, Martiri, Pastori (Papi e Vescovi), Dottori della Chiesa, Vergini, Religiosi e Sante Donne.",
    category: "Santorale",
    icon: "🏛️",
    startPage: 776,
    endPage: 843,
    pageRangeLabel: "Pagine stampate 695 - 760 (PDF 776 - 843)",
    highlights: [
      "Comune della Dedicazione di una chiesa",
      "Comune della Beata Vergine Maria",
      "Comune dei Martiri e dei Pastori",
      "Comune dei Dottori della Chiesa, delle Vergini e dei Santi",
    ],
  },
  {
    id: "messe-rituali",
    title: "Messe Rituali (Sacramenti & Ministeri Ecclesiali)",
    subtitle: "Iniziazione cristiana, Unzione, Ordini, Matrimonio e Dedicazione",
    description:
      "I formulari completi per la celebrazione dei Sacramenti e dei Sacramentali: Scrutini battesimali, Battesimo, Confermazione, Prima Comunione, Unzione degli Infermi e Viatico, Ordinazioni (Vescovo, Presbiteri, Diaconi), Matrimonio, Benedizione Abbaziale, Consacrazione delle Vergini, Professione Religiosa, Ministeri di Lettori e Accoliti, Dedicazione di Chiesa e Altare.",
    category: "Sacramenti & Riti",
    icon: "✨",
    startPage: 844,
    endPage: 921,
    pageRangeLabel: "Pagine stampate 761 - 838 (PDF 844 - 921)",
    highlights: [
      "Sacramenti dell'Iniziazione Cristiana (Battesimo, Cresima, Eucaristia)",
      "Unzione degli infermi e Viatico",
      "Ordinazioni episcopali, presbiterali e diaconali",
      "Celebrazione del Matrimonio e Anniversari",
      "Professione religiosa e Dedicazione di una chiesa o altare",
    ],
  },
  {
    id: "varie-necessita",
    title: "Messe e Orazioni per Varie Necessità",
    subtitle: "Per la Santa Chiesa, per la Società Civile e per Diverse Necessità",
    description:
      "Formulari per le grandi intenzioni del mondo e della Chiesa: I. Per la Santa Chiesa (Papa, Vescovo, Sinodo, Sacerdoti, Vocazioni, Famiglia, Riconciliazione, Unità, Cristiani perseguitati); II. Per la Società Civile (Patria, Governanti, Lavoro, Semina, Raccolto, Pace e Giustizia, Guerra, Profughi, Fame, Terremoto, Pioggia); III. Per Diverse Necessità (Perdono dei peccati, Carità, Infermi, Moribondi, Rendimento di grazie).",
    category: "Intenzioni Ecclesiali",
    icon: "🌍",
    startPage: 922,
    endPage: 1004,
    pageRangeLabel: "Pagine stampate 839 - 922 (PDF 922 - 1004)",
    highlights: [
      "I. Per la Santa Chiesa (Papa, Vescovo, Ministri, Vocazioni, Famiglia, Pace, Unità dei Cristiani)",
      "II. Per la Società Civile (Patria, Governanti, Santificazione del lavoro, Pace, Profughi, Calamità)",
      "III. Per Diverse Necessità (Remissione peccati, Castità, Carità, Parenti, Infermi, Rendimento di grazie)",
    ],
  },
  {
    id: "messe-votive",
    title: "Messe Votive (Trinità, Croce, Eucaristia, Spirito Santo, Maria)",
    subtitle: "Messe in onore dei divini misteri, della Vergine, degli Angeli e Apostoli",
    description:
      "Formulari per la celebrazione votiva: Santissima Trinità, Misericordia di Dio, Nostro Signore Gesù Cristo Sommo ed Eterno Sacerdote, Mistero della Santa Croce, Santissima Eucaristia, Santissimo Nome di Gesù, Preziosissimo Sangue, Sacro Cuore, Spirito Santo, Maria Madre della Chiesa, Loreto, Santi Angeli, San Giovanni Battista, San Giuseppe, Santi Apostoli.",
    category: "Messe Votive",
    icon: "🕊️",
    startPage: 1005,
    endPage: 1033,
    pageRangeLabel: "Pagine stampate 923 - 950 (PDF 1005 - 1033)",
    highlights: [
      "SS. Trinità, Misericordia di Dio, Cristo Eterno Sacerdote",
      "Santa Croce, Santissima Eucaristia e Preziosissimo Sangue",
      "Spirito Santo e Sacratissimo Cuore di Gesù",
      "Beata Vergine Maria (Madre della Chiesa, Loreto, Regina degli Apostoli)",
      "Santi Angeli, San Giovanni Battista, San Giuseppe e Santi Apostoli",
    ],
  },
  {
    id: "messe-defunti",
    title: "Messe dei Defunti (Esequie, Anniversari & Suffragi)",
    subtitle: "Liturgia esequiale per adulti e fanciulli, anniversari e orazioni diverse",
    description:
      "Tutti i formulari per la liturgia funebre: Esequie (fuori e nel Tempo Pasquale), Esequie di bambini (battezzati e non ancora battezzati), Anniversari della morte, Commemorazioni diverse e Orazioni per il Papa, Vescovo, Sacerdoti, Diaconi, Religiosi, Genitori, Coniugi, defunti dopo lunga infermità o morte improvvisa.",
    category: "Suffragio & Esequie",
    icon: "🕯️",
    startPage: 1034,
    endPage: 1069,
    pageRangeLabel: "Pagine stampate 951 - 986 (PDF 1034 - 1069)",
    highlights: [
      "Messe esequiali (nel Tempo Pasquale e durante l'anno)",
      "Esequie di bambini (battezzati e non ancora battezzati)",
      "Messe nell'anniversario della morte",
      "Orazioni per il Papa, Vescovi, Sacerdoti, Genitori e Benefattori defunti",
    ],
  },
  {
    id: "appendice-riti",
    title: "Appendice: Riti Speciali, Preghiera Universale, Collette & Ferie",
    subtitle: "Aspersione, Ministro Straordinario, Annuncio Pasqua e Orazioni feriali",
    description:
      "Rito per la benedizione e l'aspersione dell'acqua domenicale, Rito per incaricare volta per volta un fedele alla distribuzione dell'Eucaristia, Annuncio del giorno di Pasqua nell'Epifania, Formulari per la Preghiera Universale, Collette per domeniche e solennità, Orazioni per le ferie del Tempo Ordinario, Praeparatio ad Missam e Gratiarum actio post Missam.",
    category: "Appendice Liturgica",
    icon: "📖",
    startPage: 1070,
    endPage: 1195,
    pageRangeLabel: "Pagine stampate 987 - 1112 (PDF 1070 - 1195)",
    highlights: [
      "Benedizione e aspersione domenicale dell'acqua benedetta",
      "Mandato straordinario occasionale per la distribuzione dell'Eucaristia",
      "Annuncio del giorno della Pasqua (Epifania)",
      "Formulari per la Preghiera dei fedeli (universale)",
      "Collette per le ferie del Tempo Ordinario e Comune di Maria",
      "Praeparatio ad Missam e Ringraziamento post Missam",
    ],
  },
  {
    id: "melodie",
    title: "Melodie & Spartiti per il Rito della Messa",
    subtitle: "Spartiti gregoriani e moderni per il celebrante, ministri e assemblea",
    description:
      "Tutta la sezione musicale ufficiale con notazione quadrata e moderna: Riti di Introduzione, Dialoghi della Liturgia della Parola, Prefazi con melodie solenni e semplici, Canone Romano e Canoni II-IV musicati, Riti di Comunione e formule di Congedo.",
    category: "Musica Sacra",
    icon: "🎼",
    startPage: 1196,
    endPage: 1257,
    pageRangeLabel: "Pagine stampate 1113 - 1174 (PDF 1196 - 1257)",
    highlights: [
      "Spartiti musicali per i Riti d'Introduzione e Saluti",
      "Melodie per tutti i Prefazi (tono solenne e feriale)",
      "Preghiere Eucaristiche I, II, III e IV musicate",
      "Canti di comunione, Padre Nostro e formule di congedo",
    ],
  },
  {
    id: "indici",
    title: "Indici Ufficiali del Messale Romano",
    subtitle: "Indice dei Prefazi, Indice alfabetico dei Santi e Indice Generale",
    description:
      "Gli indici completi della Terza Edizione Italiana: Indice alfabetico dei Prefazi, Indice alfabetico delle celebrazioni nel Proprio dei Santi e l'Indice Generale ragionato dell'opera.",
    category: "Indici & Consultazione",
    icon: "🔍",
    startPage: 1258,
    endPage: 1278,
    pageRangeLabel: "Pagine stampate 1175 - 1190 (PDF 1258 - 1278)",
    highlights: [
      "Indice alfabetico e tematico dei Prefazi",
      "Indice alfabetico di tutte le celebrazioni dei Santi",
      "Indice Generale completo della 3ª Edizione Italiana",
    ],
  },
];

const LITURGICAL_LANGUAGES = [
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "la", name: "Latino", flag: "🇻🇦" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "ro", name: "Română", flag: "🇷🇴" },
  { code: "monastico", name: "Monastico", flag: "⛪" },
  { code: "vetus", name: "Vetus Ordo", flag: "🕊️" },
];

export function MessaleRomanoReader() {
  const [mainTab, setMainTab] = useState<"online" | "pdf">("online");
  const [selectedSection, setSelectedSection] = useState<MessaleRomanoSection | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("Tutte");

  // Stato per la consultazione testuale online (iBreviary)
  const [selectedLang, setSelectedLang] = useState<string>("it");
  const [isDualMode, setIsDualMode] = useState<boolean>(false);
  const [secondaryLang, setSecondaryLang] = useState<string>("la");
  const [secondaryOnlineId, setSecondaryOnlineId] = useState<string | null>("1");
  const [secondaryItems, setSecondaryItems] = useState<{ id: string; title: string }[]>([]);
  const [secondaryOnlineHtml, setSecondaryOnlineHtml] = useState<string>("");
  const [isLoadingSecondary, setIsLoadingSecondary] = useState<boolean>(false);

  const [onlineCategory, setOnlineCategory] = useState<"ordinario" | "preghiera_eucaristica" | "prefazio" | "preghiera_dei_fedeli">("ordinario");
  const [onlineItems, setOnlineItems] = useState<{ id: string; title: string }[]>([]);
  const [selectedOnlineId, setSelectedOnlineId] = useState<string | null>("1");
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
      const savedDual = localStorage.getItem("messale_dual_mode");
      if (savedDual === "true") setIsDualMode(true);
      const savedSecLang = localStorage.getItem("messale_secondary_lang");
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
      localStorage.setItem("messale_secondary_lang", newLang);
    } catch {}
  };

  const toggleDualMode = () => {
    const next = !isDualMode;
    setIsDualMode(next);
    try {
      localStorage.setItem("messale_dual_mode", String(next));
    } catch {}
  };

  // Carica la lista dei testi per la categoria online (Primaria)
  useEffect(() => {
    if (mainTab !== "online") return;

    if (onlineCategory === "ordinario") {
      setSelectedOnlineId("1");
      return;
    }

    let isMounted = true;
    setIsLoadingOnline(true);
    fetch(`/api/messale-online?category=${onlineCategory}&lang=${selectedLang}`)
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
        console.error("Errore caricamento lista:", err);
        if (isMounted) setIsLoadingOnline(false);
      });

    return () => {
      isMounted = false;
    };
  }, [mainTab, onlineCategory, selectedLang]);

  // Carica la lista dei testi per la categoria online (Secondaria se Dual Mode)
  useEffect(() => {
    if (mainTab !== "online" || !isDualMode) return;

    if (onlineCategory === "ordinario") {
      setSecondaryOnlineId("1");
      return;
    }

    let isMounted = true;
    fetch(`/api/messale-online?category=${onlineCategory}&lang=${secondaryLang}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.items) {
          setSecondaryItems(data.items);
          // Seleziona lo stesso indice o il primo
          const primaryIndex = onlineItems.findIndex((it) => it.id === selectedOnlineId);
          if (primaryIndex >= 0 && data.items[primaryIndex]) {
            setSecondaryOnlineId(data.items[primaryIndex].id);
          } else if (data.items.length > 0) {
            setSecondaryOnlineId(data.items[0].id);
          }
        }
      })
      .catch((err) => console.error("Errore caricamento lista secondaria:", err));

    return () => {
      isMounted = false;
    };
  }, [mainTab, onlineCategory, secondaryLang, isDualMode, selectedOnlineId, onlineItems]);

  // Carica il testo della preghiera/rito selezionato (Primaria)
  useEffect(() => {
    if (mainTab !== "online" || !selectedOnlineId) return;

    let isMounted = true;
    setIsLoadingOnline(true);
    fetch(`/api/messale-online?category=${onlineCategory}&id=${selectedOnlineId}&lang=${selectedLang}`)
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
        console.error("Errore caricamento testo:", err);
        if (isMounted) setIsLoadingOnline(false);
      });

    return () => {
      isMounted = false;
    };
  }, [mainTab, onlineCategory, selectedOnlineId, selectedLang]);

  // Carica il testo della preghiera/rito selezionato (Secondaria per Testo a Fronte)
  useEffect(() => {
    if (mainTab !== "online" || !isDualMode || !secondaryOnlineId) return;

    let isMounted = true;
    setIsLoadingSecondary(true);
    fetch(`/api/messale-online?category=${onlineCategory}&id=${secondaryOnlineId}&lang=${secondaryLang}`)
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
        console.error("Errore caricamento testo secondario:", err);
        if (isMounted) setIsLoadingSecondary(false);
      });

    return () => {
      isMounted = false;
    };
  }, [mainTab, onlineCategory, secondaryOnlineId, secondaryLang, isDualMode]);



  const categories = [
    "Tutte",
    "Magistero & Decreti",
    "Norme Liturgiche",
    "Anno Liturgico",
    "Ordinario & Canoni",
    "Santorale",
    "Sacramenti & Riti",
    "Intenzioni Ecclesiali",
    "Messe Votive",
    "Suffragio & Esequie",
    "Appendice Liturgica",
    "Musica Sacra",
    "Indici & Consultazione",
  ];

  const filteredPdfSections = MESSALE_ROMANO_SECTIONS.filter((sec) => {
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
            📘
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#aa9576]">
            Conferenza Episcopale Italiana · Rito Romano
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-serif text-3xl font-normal text-[#3f3933]">
            Messale Romano
          </h2>
          <span className="rounded-full bg-[#ebdcc8] border border-[#d9c5ac] px-2.5 py-0.5 text-xs font-bold text-[#5c4a37]">
            Terza Edizione Ufficiale
          </span>
        </div>
        <p className="text-sm text-[#736555] max-w-3xl leading-relaxed">
          Consulta il testo liturgico online in formato testuale fluido (con rubriche e dialoghi) oppure sfoglia i volumi e i PDF ufficiali approvati dalla CEI.
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
          <span>📕 Volumi Ufficiali & PDF Estratti (CEI 2020)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SEZIONE 1: CONSULTAZIONE TESTUALE ON-LINE (iBreviary) */}
      {/* ========================================================================= */}
      {mainTab === "online" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Barra Sottocategorie Online */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "ordinario", label: "Ordinario della Messa", icon: "🍞" },
              { id: "preghiera_eucaristica", label: "Preghiere Eucaristiche", icon: "🕊️" },
              { id: "prefazio", label: "Prefazi (79)", icon: "📜" },
              { id: "preghiera_dei_fedeli", label: "Preghiere dei Fedeli", icon: "🙏" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setOnlineCategory(cat.id as any);
                  setOnlineSearch("");
                }}
                className={`flex flex-col sm:flex-row items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition shadow-xs ${
                  onlineCategory === cat.id
                    ? "bg-[#5c4a37] border-[#4a3c2c] text-white shadow-md"
                    : "bg-[#fffdfa] border-[#e0d6c7] text-[#6b5d4e] hover:bg-[#fbf7f0]"
                }`}
              >
                <span className="text-lg">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Barra Strumenti: Ricerca nel sottomenu, Font Size, Interlinea, Copia & Modalità Notturna */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[#e4dcce] bg-[#fffdfa] p-3.5 shadow-xs">
            {/* Ricerca (se la categoria ha una lista di elementi) */}
            {onlineCategory !== "ordinario" ? (
              <div className="relative flex-1 min-w-[220px]">
                <input
                  type="text"
                  placeholder={`Cerca tra i ${onlineCategory === "prefazio" ? "Prefazi" : onlineCategory === "preghiera_eucaristica" ? "Canoni" : "formulari"}...`}
                  value={onlineSearch}
                  onChange={(e) => setOnlineSearch(e.target.value)}
                  className="w-full rounded-2xl border border-[#dac8b1] bg-[#fdfbf7] py-2 pl-9 pr-4 text-xs text-[#3f3933] placeholder-[#8a755d] focus:border-[#aa9576] focus:outline-none"
                />
                <span className="absolute left-3 top-2.5 text-xs text-[#8a755d]">🔍</span>
              </div>
            ) : (
              <div className="text-xs font-serif font-bold text-[#5c4a37] flex items-center gap-2">
                <span>📖 Rito della Messa con il popolo secondo il Messale Romano 2020</span>
              </div>
            )}

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

          {/* Griglia Selezione Elementi (se non ordinario) */}
          {onlineCategory !== "ordinario" && (
            <div className="flex flex-wrap items-center gap-1.5 max-h-48 overflow-y-auto p-2 rounded-2xl border border-[#e4dcce] bg-[#fdfbf7]">
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
          )}

          {/* Contenuto Testuale: Singola Colonna o Doppia Colonna Testo a Fronte */}
          {isDualMode ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Colonna Sinistra: Lingua Primaria */}
              <div
                className={`messale-online-content rounded-3xl border p-5 sm:p-7 shadow-md transition flex flex-col ${
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
                    <span>Caricamento testo...</span>
                  </div>
                ) : (
                  <div
                    className="prose max-w-none font-serif flex-1"
                    dangerouslySetInnerHTML={{ __html: onlineHtml }}
                  />
                )}
              </div>

              {/* Colonna Destra: Lingua Secondaria (Testo a Fronte) */}
              <div
                className={`messale-online-content rounded-3xl border p-5 sm:p-7 shadow-md transition flex flex-col ${
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
                    Traduzione / Traditio
                  </span>
                </div>

                {isLoadingSecondary ? (
                  <div className="flex items-center justify-center py-16 gap-3 text-sm text-[#8a755d]">
                    <span className="inline-block animate-spin text-xl">⏳</span>
                    <span>Caricamento testo a fronte...</span>
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
              className={`messale-online-content rounded-3xl border p-6 sm:p-10 shadow-lg transition ${
                isChurchMode
                  ? "border-[#3f3a36] bg-[#181614] text-[#ece8e2]"
                  : "border-[#e0d6c7] bg-[#fefdfb] text-[#2c2621]"
              }`}
              style={{ fontSize: `${fontSize}px` }}
            >
              {isLoadingOnline ? (
                <div className="flex items-center justify-center py-16 gap-3 text-sm text-[#8a755d]">
                  <span className="inline-block animate-spin text-xl">⏳</span>
                  <span>Caricamento dei testi liturgici...</span>
                </div>
              ) : (
                <div
                  className="prose max-w-none font-serif"
                  dangerouslySetInnerHTML={{ __html: onlineHtml }}
                />
              )}
            </div>
          )}

          {/* Stili Scoped per Messale Online (supporto perfetto modalità giorno / notte & interlinea) */}

          <style jsx global>{`
            .messale-online-content {
              word-break: break-word;
              color: ${isChurchMode ? "#f5f5f4" : "#2c2621"};
            }
            .messale-online-content p,
            .messale-online-content .messale-testo,
            .messale-online-content .body_2,
            .messale-online-content .body_3 {
              color: ${isChurchMode ? "#f5f5f4 !important" : "#2c2621 !important"};
              font-family: inherit;
              line-height: ${lineHeightValue};
              margin-bottom: ${paragraphMarginValue};
              margin-top: 0.15em;
            }
            .messale-online-content span {
              line-height: inherit;
            }
            .messale-online-content .messale-rubrica,
            .messale-online-content .rubrica {
              color: ${isChurchMode ? "#f87171 !important" : "#b91c1c !important"};
              font-family: system-ui, -apple-system, sans-serif;
              font-weight: 700;
              font-size: 0.82em;
              text-transform: uppercase;
              letter-spacing: 0.04em;
              display: inline;
              line-height: ${lineHeightValue};
            }
            .messale-online-content .messale-dialogo,
            .messale-online-content .body_1 {
              color: ${isChurchMode ? "#f87171 !important" : "#b91c1c !important"};
              font-family: system-ui, -apple-system, sans-serif;
              font-weight: 700;
              display: inline;
              margin-right: 0.15rem;
            }
            .messale-online-content .messale-titolo,
            .messale-online-content .titolo,
            .messale-online-content h1,
            .messale-online-content h2,
            .messale-online-content h3 {
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
            .messale-online-content .messale-sezione,
            .messale-online-content .sezione {
              display: block;
              font-family: system-ui, -apple-system, sans-serif;
              font-weight: 700;
              font-size: 0.75em;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: ${isChurchMode ? "#f59e0b !important" : "#aa9576 !important"};
              margin-bottom: 0.2em;
            }
            .messale-online-content hr {
              border-color: ${isChurchMode ? "#332b24" : "#ede3d5"};
              margin: 0.9em 0;
            }
          `}</style>

          <div className="pt-2 flex items-center justify-between text-xs text-[#8a755d]">
            <span>Fonte testi: <em>iBreviary (Custodia di Terra Santa / don Paolo Padrini)</em></span>
            <a
              href="https://www.ibreviary.com/m2/messale.php"
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
      {/* SEZIONE 2: VOLUMI UFFICIALI & PDF ESTRATTI (CEI 2020) */}
      {/* ========================================================================= */}
      {mainTab === "pdf" && (
        <div className="space-y-6 animate-in fade-in duration-200">
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
                    Scarica o consulta solo le pagine di questa specifica sezione in un PDF compatto e leggero.
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
                    placeholder="Cerca formulari, canti, ordinario, prefazi, santi o defunti..."
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


