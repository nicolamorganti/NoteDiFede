// Calcolo accurato del Calendario Liturgico (Rito Romano e Ambrosiano)
// Include: Tempi Liturgici, Settimana del Salterio (I-IV), Anno Feriale (I-II) e Festivo (A-B-C)

function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

const ROMAN_NUMERALS = [
  "", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
  "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX",
  "XXI", "XXII", "XXIII", "XXIV", "XXV", "XXVI", "XXVII", "XXVIII", "XXIX", "XXX",
  "XXXI", "XXXII", "XXXIII", "XXXIV"
];

function romanToInt(roman: string): number {
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100 };
  let total = 0;
  let prev = 0;
  for (let i = roman.length - 1; i >= 0; i--) {
    const val = map[roman[i]] || 0;
    if (val < prev) total -= val;
    else { total += val; prev = val; }
  }
  return total;
}

function extractSalterioFromSourceTitle(title?: string): number | null {
  if (!title) return null;

  // 1. Cerca diciture esplicite: "salterio: II settimana", "settimana II del salterio", "Salterio II"
  const explicitMatch = title.match(/(?:settimana\s+([IVXLCDM]+|\d+)\s+del\s+salterio|salterio\s*[:\-]?\s*([IVXLCDM]+|\d+)\s*(?:settimana)?)/i);
  if (explicitMatch) {
    const raw = (explicitMatch[1] || explicitMatch[2]).toUpperCase();
    const num = /^\d+$/.test(raw) ? parseInt(raw, 10) : romanToInt(raw);
    if (num >= 1 && num <= 4) return num;
  }

  // 2. Cerca numeri ordinali della settimana nel titolo ufficiale (es. "XXII settimana", "I domenica dopo...", "3ª settimana")
  const weekMatch = title.match(/\b([IVXLCDM]+|\d+)(?:ª|a)?\s+(?:settimana|domenica)/i);
  if (weekMatch) {
    const raw = weekMatch[1].toUpperCase();
    const weekNum = /^\d+$/.test(raw) ? parseInt(raw, 10) : romanToInt(raw);
    if (weekNum >= 1 && weekNum <= 34) {
      return ((weekNum - 1) % 4) + 1;
    }
  }

  return null;
}

export interface LiturgicalDayDetails {
  tempoLiturgico: string;
  salterioSettimana: number;
  salterioLabel: string;
  annoFeriale: string;
  annoFestivo: string;
  fullTagline: string;
}

export function getLiturgicalDayDetails(
  dateInput: string | Date,
  rite: "ambrosiano" | "romano" = "romano",
  apiTemporalInfo?: string
): LiturgicalDayDetails {

  const d = typeof dateInput === "string" ? new Date(dateInput + "T12:00:00Z") : dateInput;
  const year = d.getUTCFullYear();
  const easter = getEasterDate(year);

  // Ciclo feriale: Anni dispari = Anno I, Anni pari = Anno II
  const annoFeriale = year % 2 !== 0 ? "Anno I" : "Anno II";

  // Ciclo festivo: 2026 = Anno C, 2027 = Anno A, 2028 = Anno B (cambia alla I di Avvento)
  const festalYearLetter = ["A", "B", "C"][(year - 2020 + 300) % 3];
  const annoFestivo = `Anno ${festalYearLetter}`;

  const diffDaysToEaster = Math.round((d.getTime() - easter.getTime()) / (1000 * 60 * 60 * 24));

  // Pentecoste = Pasqua + 49 giorni
  const pentecost = new Date(easter);
  pentecost.setUTCDate(pentecost.getUTCDate() + 49);

  // Trova la Domenica della settimana corrente (all'inizio della settimana liturgica)
  const dayOfWeek = d.getUTCDay(); // 0 = dom, 1 = lun...
  const sundayOfCurrentWeek = new Date(d);
  sundayOfCurrentWeek.setUTCDate(d.getUTCDate() - dayOfWeek);

  // Natale
  const christmas = new Date(Date.UTC(year, 11, 25, 12, 0, 0));
  const dayOfWeekChristmas = christmas.getUTCDay(); // 0 = dom, 1 = lun...
  const daysToSundayBeforeChristmas = dayOfWeekChristmas === 0 ? 7 : dayOfWeekChristmas;
  
  // IV Domenica di Avvento Romano (o VI Domenica di Avvento Ambrosiano)
  const fourthSundayAdventRomano = new Date(christmas);
  fourthSundayAdventRomano.setUTCDate(christmas.getUTCDate() - daysToSundayBeforeChristmas);
  
  const firstSundayAdventRomano = new Date(fourthSundayAdventRomano);
  firstSundayAdventRomano.setUTCDate(fourthSundayAdventRomano.getUTCDate() - 21);

  const firstSundayAdventAmbrosiano = new Date(fourthSundayAdventRomano);
  firstSundayAdventAmbrosiano.setUTCDate(fourthSundayAdventRomano.getUTCDate() - 35);

  // I Domenica di Quaresima (42 giorni prima di Pasqua)
  const firstSundayLentRomano = new Date(easter);
  firstSundayLentRomano.setUTCDate(easter.getUTCDate() - 42);

  let tempoLiturgico = "";
  let salterioSettimana = 1;

  const activeAdventStart = rite === "ambrosiano" ? firstSundayAdventAmbrosiano : firstSundayAdventRomano;

  if (d >= activeAdventStart && d < christmas) {
    // Tempo di Avvento
    const diffWeeks = Math.floor((sundayOfCurrentWeek.getTime() - activeAdventStart.getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1;
    const numStr = ROMAN_NUMERALS[diffWeeks] || String(diffWeeks);
    tempoLiturgico = `${numStr} settimana di Avvento`;
    salterioSettimana = ((diffWeeks - 1) % 4) + 1;
  } else if (diffDaysToEaster >= -46 && diffDaysToEaster < 0) {
    // Tempo di Quaresima
    const diffWeeksQuaresima = Math.floor((sundayOfCurrentWeek.getTime() - firstSundayLentRomano.getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1;
    const safeWeeks = Math.max(1, Math.min(6, diffWeeksQuaresima));
    const numStr = ROMAN_NUMERALS[safeWeeks] || String(safeWeeks);
    tempoLiturgico = `${numStr} settimana di Quaresima`;
    salterioSettimana = ((safeWeeks - 1) % 4) + 1;
  } else if (diffDaysToEaster >= 0 && diffDaysToEaster <= 49) {
    // Tempo di Pasqua
    const diffWeeksPasqua = Math.floor((sundayOfCurrentWeek.getTime() - easter.getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1;
    const safeWeeks = Math.max(1, Math.min(7, diffWeeksPasqua));
    const numStr = ROMAN_NUMERALS[safeWeeks] || String(safeWeeks);
    tempoLiturgico = `${numStr} settimana di Pasqua`;
    salterioSettimana = ((safeWeeks - 1) % 4) + 1;
  } else if (d.getUTCMonth() === 11 && d.getUTCDate() >= 25) {
    // Ottava di Natale
    tempoLiturgico = "Ottava di Natale";
    salterioSettimana = 1;
  } else {
    // Tempo Ordinario / Per Annum / Dopo Pentecoste / Dopo il Martirio
    const daysSincePentecost = Math.round((d.getTime() - pentecost.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSincePentecost >= 0) {
      if (rite === "ambrosiano") {
        // Martirio di San Giovanni: 29 Agosto (festa fissa)
        // La domenica successiva o coincidente al 29 Agosto è la I Domenica dopo il Martirio
        const martirioDate = new Date(Date.UTC(year, 7, 29, 12, 0, 0));
        const martirioDayOfWeek = martirioDate.getUTCDay();
        const firstSundayAfterMartirio = new Date(martirioDate);
        firstSundayAfterMartirio.setUTCDate(martirioDate.getUTCDate() + (martirioDayOfWeek === 0 ? 0 : 7 - martirioDayOfWeek));

        if (d < martirioDate && d.getUTCMonth() === 7 && d.getUTCDate() >= 23) {
          tempoLiturgico = "Settimana che precede il Martirio di san Giovanni il Precursore";
          salterioSettimana = 1;
        } else if (d.getUTCMonth() === 7 && d.getUTCDate() === 29) {
          tempoLiturgico = "Martirio di san Giovanni il Precursore";
          salterioSettimana = 1;
        } else if (sundayOfCurrentWeek >= firstSundayAfterMartirio && sundayOfCurrentWeek < firstSundayAdventAmbrosiano) {
          const weeksAfterMartirio = Math.floor((sundayOfCurrentWeek.getTime() - firstSundayAfterMartirio.getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1;
          const numStr = ROMAN_NUMERALS[weeksAfterMartirio] || String(weeksAfterMartirio);
          tempoLiturgico = `${numStr} settimana dopo il Martirio di san Giovanni il Precursore`;
          salterioSettimana = ((weeksAfterMartirio - 1) % 4) + 1;
        } else {
          const weeksAfterPentecost = Math.floor((sundayOfCurrentWeek.getTime() - pentecost.getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1;
          const numStr = ROMAN_NUMERALS[weeksAfterPentecost] || String(weeksAfterPentecost);
          tempoLiturgico = `${numStr} settimana dopo Pentecoste`;
          salterioSettimana = ((weeksAfterPentecost - 1) % 4) + 1;
        }
      } else {
        // Rito Romano post-Pentecoste: conta a ritroso dalla XXXIV Domenica del Tempo Ordinario (Cristo Re)
        const diffWeeksToAdvent = Math.floor((firstSundayAdventRomano.getTime() - sundayOfCurrentWeek.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const weekOfTO = Math.max(1, Math.min(34, 34 - diffWeeksToAdvent + 1));
        const numStr = ROMAN_NUMERALS[weekOfTO] || String(weekOfTO);
        tempoLiturgico = `${numStr} settimana del Tempo «per annum»`;
        salterioSettimana = ((weekOfTO - 1) % 4) + 1;
      }
    } else {
      // Tempo Ordinario prima parte (Gennaio - Quaresima)
      const epiphany = new Date(Date.UTC(year, 0, 6, 12, 0, 0));
      const epDayOfWeek = epiphany.getUTCDay();
      const baptismSunday = new Date(epiphany);
      baptismSunday.setUTCDate(epiphany.getUTCDate() + (epDayOfWeek === 0 ? 0 : 7 - epDayOfWeek));

      const weeksSinceBaptism = Math.floor((sundayOfCurrentWeek.getTime() - baptismSunday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
      const weekOfTO = Math.max(1, Math.min(9, weeksSinceBaptism));
      const numStr = ROMAN_NUMERALS[weekOfTO] || String(weekOfTO);
      tempoLiturgico = `${numStr} settimana del Tempo «per annum»`;
      salterioSettimana = ((weekOfTO - 1) % 4) + 1;
    }
  }


  // Se la fonte ufficiale (chiesadimilano.it / lachiesa.it / iBreviary) fornisce il titolo del giorno, estrai da essa la settimana del salterio
  const sourceSalterio = extractSalterioFromSourceTitle(apiTemporalInfo);
  if (sourceSalterio !== null) {
    salterioSettimana = sourceSalterio;
  }

  // Se l'API ufficiale fornisce già la denominazione temporale esatta, usala come prioritaria
  if (apiTemporalInfo && apiTemporalInfo.trim().length > 3) {
    tempoLiturgico = apiTemporalInfo.trim();
  }


  const salterioLabel = `settimana ${ROMAN_NUMERALS[salterioSettimana]} del salterio`;
  const fullTagline = `${tempoLiturgico} · ${salterioLabel} · ${annoFeriale}`;

  return {
    tempoLiturgico,
    salterioSettimana,
    salterioLabel,
    annoFeriale,
    annoFestivo,
    fullTagline,
  };
}
