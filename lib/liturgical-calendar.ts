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

  let tempoLiturgico = "";
  let salterioSettimana = 1;

  const activeAdventStart = rite === "ambrosiano" ? firstSundayAdventAmbrosiano : firstSundayAdventRomano;

  if (d >= activeAdventStart && d < christmas) {
    // Tempo di Avvento
    const diffWeeks = Math.floor((d.getTime() - activeAdventStart.getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1;
    const numStr = ROMAN_NUMERALS[diffWeeks] || String(diffWeeks);
    tempoLiturgico = `${numStr} settimana di Avvento`;
    salterioSettimana = ((diffWeeks - 1) % 4) + 1;
  } else if (diffDaysToEaster >= -46 && diffDaysToEaster < 0) {
    // Tempo di Quaresima
    const diffWeeksQuaresima = Math.floor((diffDaysToEaster + 46) / 7) + 1;
    const numStr = ROMAN_NUMERALS[diffWeeksQuaresima] || String(diffWeeksQuaresima);
    tempoLiturgico = `${numStr} settimana di Quaresima`;
    salterioSettimana = ((diffWeeksQuaresima - 1) % 4) + 1;
  } else if (diffDaysToEaster >= 0 && diffDaysToEaster <= 49) {
    // Tempo di Pasqua
    const diffWeeksPasqua = Math.floor(diffDaysToEaster / 7) + 1;
    const numStr = ROMAN_NUMERALS[diffWeeksPasqua] || String(diffWeeksPasqua);
    tempoLiturgico = `${numStr} settimana di Pasqua`;
    salterioSettimana = ((diffWeeksPasqua - 1) % 4) + 1;
  } else if (d.getUTCMonth() === 11 && d.getUTCDate() >= 25) {
    // Ottava di Natale
    tempoLiturgico = "Ottava di Natale";
    salterioSettimana = 1;
  } else {
    // Tempo Ordinario / Per Annum o Dopo Pentecoste
    const daysSincePentecost = Math.round((d.getTime() - pentecost.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSincePentecost >= 0) {
      if (rite === "ambrosiano") {
        const weeksAfterPentecost = Math.floor(daysSincePentecost / 7) + 1;
        salterioSettimana = ((weeksAfterPentecost - 1) % 4) + 1;

        // Se ad agosto inoltrato (22-28 agosto)
        const month = d.getUTCMonth(); // 7 = Agosto
        const day = d.getUTCDate();
        if (month === 7 && day >= 23 && day <= 28) {
          tempoLiturgico = "Settimana che precede il Martirio di san Giovanni il Precursore";
        } else if (month === 7 && day === 29) {
          tempoLiturgico = "Martirio di san Giovanni il Precursore";
        } else if (month >= 8 && month <= 9) {
          tempoLiturgico = "Tempo dopo il Martirio di san Giovanni il Precursore";
        } else {
          const numStr = ROMAN_NUMERALS[weeksAfterPentecost] || String(weeksAfterPentecost);
          tempoLiturgico = `${numStr} settimana dopo Pentecoste`;
        }
      } else {
        // Settimane del Tempo Ordinario post-Pentecoste
        const weekOfTO = Math.min(34, Math.max(1, Math.floor((daysSincePentecost + 56) / 7) + 1));
        const numStr = ROMAN_NUMERALS[weekOfTO] || String(weekOfTO);
        tempoLiturgico = `${numStr} settimana del Tempo «per annum»`;
        salterioSettimana = ((weekOfTO - 1) % 4) + 1;
      }
    } else {
      // Tempo Ordinario prima parte (Gennaio - Febbraio)
      const dayOfYear = Math.floor((d.getTime() - new Date(Date.UTC(year, 0, 6)).getTime()) / (1000 * 60 * 60 * 24));
      const weekOfTO = Math.max(1, Math.floor(dayOfYear / 7) + 1);
      const numStr = ROMAN_NUMERALS[weekOfTO] || String(weekOfTO);
      tempoLiturgico = `${numStr} settimana del Tempo «per annum»`;
      salterioSettimana = ((weekOfTO - 1) % 4) + 1;
    }
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
