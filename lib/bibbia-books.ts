export interface BibleBook {
  id: string;
  name: string;
  shortName: string;
  testament: "at" | "nt";
  category: string;
  chaptersCount: number;
}

export const BIBLE_BOOKS: BibleBook[] = [
  // ==================== ANTICO TESTAMENTO (46 Libri) ====================
  // Pentateuco
  { id: "Gen", name: "Genesi", shortName: "Genesi", testament: "at", category: "Pentateuco", chaptersCount: 50 },
  { id: "Es", name: "Esodo", shortName: "Esodo", testament: "at", category: "Pentateuco", chaptersCount: 40 },
  { id: "Lv", name: "Levitico", shortName: "Levitico", testament: "at", category: "Pentateuco", chaptersCount: 27 },
  { id: "Nm", name: "Numeri", shortName: "Numeri", testament: "at", category: "Pentateuco", chaptersCount: 36 },
  { id: "Dt", name: "Deuteronomio", shortName: "Deuteronomio", testament: "at", category: "Pentateuco", chaptersCount: 34 },

  // Storici
  { id: "Gs", name: "Giosuè", shortName: "Giosuè", testament: "at", category: "Libri Storici", chaptersCount: 24 },
  { id: "Gdc", name: "Giudici", shortName: "Giudici", testament: "at", category: "Libri Storici", chaptersCount: 21 },
  { id: "Rt", name: "Rut", shortName: "Rut", testament: "at", category: "Libri Storici", chaptersCount: 4 },
  { id: "1Sam", name: "1 Samuele", shortName: "1 Samuele", testament: "at", category: "Libri Storici", chaptersCount: 31 },
  { id: "2Sam", name: "2 Samuele", shortName: "2 Samuele", testament: "at", category: "Libri Storici", chaptersCount: 24 },
  { id: "1Re", name: "1 Re", shortName: "1 Re", testament: "at", category: "Libri Storici", chaptersCount: 22 },
  { id: "2Re", name: "2 Re", shortName: "2 Re", testament: "at", category: "Libri Storici", chaptersCount: 25 },
  { id: "1Cr", name: "1 Cronache", shortName: "1 Cronache", testament: "at", category: "Libri Storici", chaptersCount: 29 },
  { id: "2Cr", name: "2 Cronache", shortName: "2 Cronache", testament: "at", category: "Libri Storici", chaptersCount: 36 },
  { id: "Esd", name: "Esdra", shortName: "Esdra", testament: "at", category: "Libri Storici", chaptersCount: 10 },
  { id: "Ne", name: "Neemia", shortName: "Neemia", testament: "at", category: "Libri Storici", chaptersCount: 13 },
  { id: "Tb", name: "Tobia", shortName: "Tobia", testament: "at", category: "Libri Storici", chaptersCount: 14 },
  { id: "Gdt", name: "Giuditta", shortName: "Giuditta", testament: "at", category: "Libri Storici", chaptersCount: 16 },
  { id: "Est", name: "Ester", shortName: "Ester", testament: "at", category: "Libri Storici", chaptersCount: 10 },
  { id: "1Mac", name: "1 Maccabei", shortName: "1 Maccabei", testament: "at", category: "Libri Storici", chaptersCount: 16 },
  { id: "2Mac", name: "2 Maccabei", shortName: "2 Maccabei", testament: "at", category: "Libri Storici", chaptersCount: 15 },

  // Sapienziali e Poetici
  { id: "Gb", name: "Giobbe", shortName: "Giobbe", testament: "at", category: "Sapienziali e Poetici", chaptersCount: 42 },
  { id: "Sal", name: "Salmi", shortName: "Salmi", testament: "at", category: "Sapienziali e Poetici", chaptersCount: 150 },
  { id: "Pr", name: "Proverbi", shortName: "Proverbi", testament: "at", category: "Sapienziali e Poetici", chaptersCount: 31 },
  { id: "Qo", name: "Qoelet (Ecclesiaste)", shortName: "Qoelet", testament: "at", category: "Sapienziali e Poetici", chaptersCount: 12 },
  { id: "Ct", name: "Cantico dei Cantici", shortName: "Cantico", testament: "at", category: "Sapienziali e Poetici", chaptersCount: 8 },
  { id: "Sap", name: "Sapienza", shortName: "Sapienza", testament: "at", category: "Sapienziali e Poetici", chaptersCount: 19 },
  { id: "Sir", name: "Siracide (Ecclesiastico)", shortName: "Siracide", testament: "at", category: "Sapienziali e Poetici", chaptersCount: 51 },

  // Profetici
  { id: "Is", name: "Isaia", shortName: "Isaia", testament: "at", category: "Profeti", chaptersCount: 66 },
  { id: "Ger", name: "Geremia", shortName: "Geremia", testament: "at", category: "Profeti", chaptersCount: 52 },
  { id: "Lam", name: "Lamentazioni", shortName: "Lamentazioni", testament: "at", category: "Profeti", chaptersCount: 5 },
  { id: "Bar", name: "Baruc", shortName: "Baruc", testament: "at", category: "Profeti", chaptersCount: 6 },
  { id: "Ez", name: "Ezechiele", shortName: "Ezechiele", testament: "at", category: "Profeti", chaptersCount: 48 },
  { id: "Dn", name: "Daniele", shortName: "Daniele", testament: "at", category: "Profeti", chaptersCount: 14 },
  { id: "Os", name: "Osea", shortName: "Osea", testament: "at", category: "Profeti", chaptersCount: 14 },
  { id: "Gl", name: "Gioele", shortName: "Gioele", testament: "at", category: "Profeti", chaptersCount: 4 },
  { id: "Am", name: "Amos", shortName: "Amos", testament: "at", category: "Profeti", chaptersCount: 9 },
  { id: "Abd", name: "Abdia", shortName: "Abdia", testament: "at", category: "Profeti", chaptersCount: 1 },
  { id: "Gna", name: "Giona", shortName: "Giona", testament: "at", category: "Profeti", chaptersCount: 4 },
  { id: "Mi", name: "Michea", shortName: "Michea", testament: "at", category: "Profeti", chaptersCount: 7 },
  { id: "Na", name: "Naum", shortName: "Naum", testament: "at", category: "Profeti", chaptersCount: 3 },
  { id: "Ab", name: "Abacuc", shortName: "Abacuc", testament: "at", category: "Profeti", chaptersCount: 3 },
  { id: "Sof", name: "Sofonia", shortName: "Sofonia", testament: "at", category: "Profeti", chaptersCount: 3 },
  { id: "Ag", name: "Aggeo", shortName: "Aggeo", testament: "at", category: "Profeti", chaptersCount: 2 },
  { id: "Zc", name: "Zaccaria", shortName: "Zaccaria", testament: "at", category: "Profeti", chaptersCount: 14 },
  { id: "Ml", name: "Malachia", shortName: "Malachia", testament: "at", category: "Profeti", chaptersCount: 3 },

  // ==================== NUOVO TESTAMENTO (27 Libri) ====================
  // Vangeli
  { id: "Mt", name: "Vangelo secondo Matteo", shortName: "Matteo", testament: "nt", category: "Vangeli", chaptersCount: 28 },
  { id: "Mc", name: "Vangelo secondo Marco", shortName: "Marco", testament: "nt", category: "Vangeli", chaptersCount: 16 },
  { id: "Lc", name: "Vangelo secondo Luca", shortName: "Luca", testament: "nt", category: "Vangeli", chaptersCount: 24 },
  { id: "Gv", name: "Vangelo secondo Giovanni", shortName: "Giovanni", testament: "nt", category: "Vangeli", chaptersCount: 21 },

  // Atti
  { id: "At", name: "Atti degli Apostoli", shortName: "Atti", testament: "nt", category: "Storia della Chiesa", chaptersCount: 28 },

  // Lettere Paoline
  { id: "Rm", name: "Lettera ai Romani", shortName: "Romani", testament: "nt", category: "Lettere di San Paolo", chaptersCount: 16 },
  { id: "1Cor", name: "Prima Lettera ai Corinzi", shortName: "1 Corinzi", testament: "nt", category: "Lettere di San Paolo", chaptersCount: 16 },
  { id: "2Cor", name: "Seconda Lettera ai Corinzi", shortName: "2 Corinzi", testament: "nt", category: "Lettere di San Paolo", chaptersCount: 13 },
  { id: "Gal", name: "Lettera ai Galati", shortName: "Galati", testament: "nt", category: "Lettere di San Paolo", chaptersCount: 6 },
  { id: "Ef", name: "Lettera agli Efesini", shortName: "Efesini", testament: "nt", category: "Lettere di San Paolo", chaptersCount: 6 },
  { id: "Fil", name: "Lettera ai Filippesi", shortName: "Filippesi", testament: "nt", category: "Lettere di San Paolo", chaptersCount: 4 },
  { id: "Col", name: "Lettera ai Colossesi", shortName: "Colossesi", testament: "nt", category: "Lettere di San Paolo", chaptersCount: 4 },
  { id: "1Ts", name: "Prima Lettera ai Tessalonicesi", shortName: "1 Tessalonicesi", testament: "nt", category: "Lettere di San Paolo", chaptersCount: 5 },
  { id: "2Ts", name: "Seconda Lettera ai Tessalonicesi", shortName: "2 Tessalonicesi", testament: "nt", category: "Lettere di San Paolo", chaptersCount: 3 },
  { id: "1Tm", name: "Prima Lettera a Timoteo", shortName: "1 Timoteo", testament: "nt", category: "Lettere di San Paolo", chaptersCount: 6 },
  { id: "2Tm", name: "Seconda Lettera a Timoteo", shortName: "2 Timoteo", testament: "nt", category: "Lettere di San Paolo", chaptersCount: 4 },
  { id: "Tt", name: "Lettera a Tito", shortName: "Tito", testament: "nt", category: "Lettere di San Paolo", chaptersCount: 3 },
  { id: "Fm", name: "Lettera a Filemone", shortName: "Filemone", testament: "nt", category: "Lettere di San Paolo", chaptersCount: 1 },
  { id: "Eb", name: "Lettera agli Ebrei", shortName: "Ebrei", testament: "nt", category: "Lettere di San Paolo", chaptersCount: 13 },

  // Lettere Cattoliche
  { id: "Gc", name: "Lettera di Giacomo", shortName: "Giacomo", testament: "nt", category: "Lettere Cattoliche", chaptersCount: 5 },
  { id: "1Pt", name: "Prima Lettera di Pietro", shortName: "1 Pietro", testament: "nt", category: "Lettere Cattoliche", chaptersCount: 5 },
  { id: "2Pt", name: "Seconda Lettera di Pietro", shortName: "2 Pietro", testament: "nt", category: "Lettere Cattoliche", chaptersCount: 3 },
  { id: "1Gv", name: "Prima Lettera di Giovanni", shortName: "1 Giovanni", testament: "nt", category: "Lettere Cattoliche", chaptersCount: 5 },
  { id: "2Gv", name: "Seconda Lettera di Giovanni", shortName: "2 Giovanni", testament: "nt", category: "Lettere Cattoliche", chaptersCount: 1 },
  { id: "3Gv", name: "Terza Lettera di Giovanni", shortName: "3 Giovanni", testament: "nt", category: "Lettere Cattoliche", chaptersCount: 1 },
  { id: "Gd", name: "Lettera di Giuda", shortName: "Giuda", testament: "nt", category: "Lettere Cattoliche", chaptersCount: 1 },

  // Profetici NT
  { id: "Ap", name: "Apocalisse di San Giovanni", shortName: "Apocalisse", testament: "nt", category: "Profetici", chaptersCount: 22 },
];
