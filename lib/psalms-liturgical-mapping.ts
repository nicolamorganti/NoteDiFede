"use client";

export interface PsalmMapping {
  hebrewNum: number;
  liturgicalNum: string;
  displayNumber: string; // es. "142 (141)" o "1"
  shortBadge: string; // es. "(141)" o ""
  liturgicalExplanation: string;
  hasDifferentNumber: boolean;
}

/**
 * Calcola la corrispondenza tra la numerazione Ebraica (Bibbia CEI 2008 / Bibbie Moderne)
 * e la numerazione Greca / Volgata / Liturgica (Messale e Liturgia delle Ore Romana e Ambrosiana).
 */
export function getPsalmMapping(hebrewNum: number): PsalmMapping {
  // Salmi 1 - 8: coincidono
  if (hebrewNum >= 1 && hebrewNum <= 8) {
    return {
      hebrewNum,
      liturgicalNum: `${hebrewNum}`,
      displayNumber: `${hebrewNum}`,
      shortBadge: "",
      liturgicalExplanation: "La numerazione ebraica (Bibbia) e liturgica coincide.",
      hasDifferentNumber: false,
    };
  }

  // Salmo 9 (Ebraico) = Salmo 9 (Liturgico, vv. 1-21)
  if (hebrewNum === 9) {
    return {
      hebrewNum: 9,
      liturgicalNum: "9",
      displayNumber: "9 (9)",
      shortBadge: "(9)",
      liturgicalExplanation: "Nella Liturgia (Romana e Ambrosiana) e Volgata i Salmi 9 e 10 sono uniti nell'unico Salmo 9 (vv. 1-21).",
      hasDifferentNumber: true,
    };
  }

  // Salmo 10 (Ebraico) = Salmo 9 (Liturgico, vv. 22-39)
  if (hebrewNum === 10) {
    return {
      hebrewNum: 10,
      liturgicalNum: "9",
      displayNumber: "10 (9)",
      shortBadge: "(9)",
      liturgicalExplanation: "Nella Liturgia (Romana e Ambrosiana) e Volgata i Salmi 9 e 10 sono uniti nell'unico Salmo 9 (vv. 22-39).",
      hasDifferentNumber: true,
    };
  }

  // Salmi 11 - 113: la liturgia è indietro di 1 (Liturgico = Ebraico - 1)
  if (hebrewNum >= 11 && hebrewNum <= 113) {
    const lit = hebrewNum - 1;
    return {
      hebrewNum,
      liturgicalNum: `${lit}`,
      displayNumber: `${hebrewNum} (${lit})`,
      shortBadge: `(${lit})`,
      liturgicalExplanation: `Salmo ${hebrewNum} nel testo ebraico/CEI = Salmo ${lit} nella Liturgia (Romana e Ambrosiana) e Volgata.`,
      hasDifferentNumber: true,
    };
  }

  // Salmo 114 (Ebraico) = Salmo 113 (Liturgico, vv. 1-8 / In exitu Israel)
  if (hebrewNum === 114) {
    return {
      hebrewNum: 114,
      liturgicalNum: "113",
      displayNumber: "114 (113)",
      shortBadge: "(113)",
      liturgicalExplanation: "Nella Liturgia e Volgata i Salmi 114 e 115 sono uniti nell'unico Salmo 113 (vv. 1-8).",
      hasDifferentNumber: true,
    };
  }

  // Salmo 115 (Ebraico) = Salmo 113 (Liturgico, vv. 9-26 / Non nobis Domine)
  if (hebrewNum === 115) {
    return {
      hebrewNum: 115,
      liturgicalNum: "113",
      displayNumber: "115 (113)",
      shortBadge: "(113)",
      liturgicalExplanation: "Nella Liturgia e Volgata i Salmi 114 e 115 sono uniti nell'unico Salmo 113 (vv. 9-26).",
      hasDifferentNumber: true,
    };
  }

  // Salmo 116 (Ebraico) = Salmi 114 e 115 (Liturgico)
  if (hebrewNum === 116) {
    return {
      hebrewNum: 116,
      liturgicalNum: "114-115",
      displayNumber: "116 (114-115)",
      shortBadge: "(114-115)",
      liturgicalExplanation: "Nella Liturgia e Volgata il Salmo 116 è diviso in Salmo 114 (vv. 1-9) e Salmo 115 (vv. 10-19).",
      hasDifferentNumber: true,
    };
  }

  // Salmi 117 - 146: la liturgia è indietro di 1 (Liturgico = Ebraico - 1, es. 142 -> 141)
  if (hebrewNum >= 117 && hebrewNum <= 146) {
    const lit = hebrewNum - 1;
    return {
      hebrewNum,
      liturgicalNum: `${lit}`,
      displayNumber: `${hebrewNum} (${lit})`,
      shortBadge: `(${lit})`,
      liturgicalExplanation: `Salmo ${hebrewNum} nel testo ebraico/CEI = Salmo ${lit} nella Liturgia (Romana e Ambrosiana) e Volgata.`,
      hasDifferentNumber: true,
    };
  }

  // Salmo 147 (Ebraico) = Salmi 146 e 147 (Liturgico)
  if (hebrewNum === 147) {
    return {
      hebrewNum: 147,
      liturgicalNum: "146-147",
      displayNumber: "147 (146-147)",
      shortBadge: "(146-147)",
      liturgicalExplanation: "Nella Liturgia e Volgata il Salmo 147 è diviso in Salmo 146 (vv. 1-11) e Salmo 147 (vv. 12-20).",
      hasDifferentNumber: true,
    };
  }

  // Salmi 148 - 150: coincidono di nuovo fino alla fine
  if (hebrewNum >= 148 && hebrewNum <= 150) {
    return {
      hebrewNum,
      liturgicalNum: `${hebrewNum}`,
      displayNumber: `${hebrewNum}`,
      shortBadge: "",
      liturgicalExplanation: "La numerazione ebraica (Bibbia) e liturgica coincide di nuovo fino alla fine.",
      hasDifferentNumber: false,
    };
  }

  return {
    hebrewNum,
    liturgicalNum: `${hebrewNum}`,
    displayNumber: `${hebrewNum}`,
    shortBadge: "",
    liturgicalExplanation: "",
    hasDifferentNumber: false,
  };
}

/**
 * Ricerca inversa: dato un numero liturgico (es. 141), restituisce i numeri di capitolo ebraico/CEI corrispondenti (es. [142]).
 */
export function findHebrewPsalmsFromLiturgicalQuery(liturgicalQueryNum: number): number[] {
  const matches: number[] = [];
  for (let i = 1; i <= 150; i++) {
    const mapping = getPsalmMapping(i);
    if (
      mapping.liturgicalNum === `${liturgicalQueryNum}` ||
      mapping.liturgicalNum === `${liturgicalQueryNum}-${liturgicalQueryNum + 1}` ||
      mapping.liturgicalNum === `${liturgicalQueryNum - 1}-${liturgicalQueryNum}`
    ) {
      matches.push(i);
    }
  }
  return matches;
}
