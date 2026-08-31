export interface InvitatoryPsalmOption {
  id: string;
  label: string;
  subtitle: string;
  html: string;
}

export interface ProcessedLiturgicalContent {
  hasInvitatory: boolean;
  introHtml: string;
  invitatoryPsalms: InvitatoryPsalmOption[];
  restOfLiturgyHtml: string;
}

export function parseLiturgicalInvitatory(rawHtml: string): ProcessedLiturgicalContent {
  if (!rawHtml) {
    return {
      hasInvitatory: false,
      introHtml: "",
      invitatoryPsalms: [],
      restOfLiturgyHtml: rawHtml,
    };
  }

  // 1. Verifichiamo se è presente la sezione Invitatorio
  const invIdx = rawHtml.search(/INVITATORIO/i);
  const innoIdx = rawHtml.search(/<span class="rubrica">\s*INNO\s*<\/span>|<p><span class="rubrica">\s*INNO\s*<\/span>|<p class="rubrica">INNO<\/p>/i);

  if (invIdx === -1 || innoIdx === -1) {
    return {
      hasInvitatory: false,
      introHtml: "",
      invitatoryPsalms: [],
      restOfLiturgyHtml: rawHtml,
    };
  }

  const cleanBlock = (h: string) => {
    if (!h) return "";
    return h
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<a name="[^"]*"><\/a>/gi, "")
      .replace(/<p><a href="#(?:Inno|menu)"[^>]*>[\s\S]*?<\/a><\/p>/gi, "")
      .replace(/<a [^>]*href="#(?:Inno|menu)"[^>]*>[\s\S]*?<\/a>/gi, "")
      .replace(/<p class="rubrica solo_scritto">&nbsp;<\/p>/gi, "")
      .replace(/<p class="rubrica solo_scritto"><a href="#Inno">[\s\S]*?<\/a><\/p>/gi, "")
      .replace(/<p class="solo_scritto"><a href="#Inno">[\s\S]*?<\/a><\/p>/gi, "")
      .replace(/<p class="rubrica">Il salmo 94 pu&ograve; essere sostituito[\s\S]*?<\/p>/gi, "")
      .replace(/<p><a title="#ps99"[\s\S]*?<\/p>/gi, "")
      .replace(/<p><a href="#ps66"[\s\S]*?<\/p>/gi, "")
      .replace(/<p><a href="#ps23"[\s\S]*?<\/p>/gi, "")
      .trim();
  };

  // Intro Invitatorio (versetti iniziali & antifona)
  const invPart = rawHtml.slice(invIdx, innoIdx);
  const introMatch = invPart.match(/(?:<p[^>]*>)?(?:<span class="rubrica">)?INVITATORIO[\s\S]*?(?=<p class="rubrica">Il salmo 94|<p><a title="#ps99"|<span class="rubrica">(?:<br \/>\s*)*SALMO|<p>(?:<br \/>\s*)*SALMO)/i);
  let introHtml = introMatch ? cleanBlock(introMatch[0]) : "";
  if (!introHtml.startsWith("<p>") && !introHtml.startsWith("<div")) {
    introHtml = `<p><span class="rubrica font-bold uppercase tracking-wider text-[#8c6d3f]">INVITATORIO</span></p>\n` + introHtml.replace(/^INVITATORIO\s*(?:<\/span>\s*<\/p>)?/i, "");
  }

  // 4 Salmi Invitatori con i loro testi integrali autentici
  const ps94Match = rawHtml.match(/(?:<span class="rubrica">|<p>)(?:<br \/>\s*)*SALMO\s*94[\s\S]*?(?=<p><a name="Inno">|<span class="rubrica">\s*INNO\s*<\/span>|<p><span class="rubrica">\s*INNO\s*<\/span>|<p class="rubrica">INNO<\/p>)/i);
  const ps99Match = rawHtml.match(/<a name="ps99"><\/a>[\s\S]*?(?=<a name="ps66"|<a href="#Inno"|$)/i) ||
                    rawHtml.match(/SALMO 99[\s\S]*?(?=SALMO 66|SALMO 23|<a href="#Inno"|$)/i);
  const ps66Match = rawHtml.match(/<a name="ps66"><\/a>[\s\S]*?(?=<a name="ps23"|<a href="#Inno"|$)/i) ||
                    rawHtml.match(/SALMO 66[\s\S]*?(?=SALMO 23|<a href="#Inno"|$)/i);
  const ps23Match = rawHtml.match(/<a name="ps23"><\/a>[\s\S]*?(?=<a href="#Inno"|<a href="#menu"|$)/i) ||
                    rawHtml.match(/SALMO 23[\s\S]*?(?=<a href="#Inno"|<a href="#menu"|$)/i);

  const invitatoryPsalms: InvitatoryPsalmOption[] = [];
  if (ps94Match) {
    invitatoryPsalms.push({
      id: "ps94",
      label: "Salmo 94",
      subtitle: "Invito a lodare Dio (Predefinito)",
      html: cleanBlock(ps94Match[0]),
    });
  }
  if (ps99Match) {
    invitatoryPsalms.push({
      id: "ps99",
      label: "Salmo 99",
      subtitle: "La gioia nel tempio",
      html: cleanBlock(ps99Match[0]),
    });
  }
  if (ps66Match) {
    invitatoryPsalms.push({
      id: "ps66",
      label: "Salmo 66",
      subtitle: "I popoli glorifichino Dio",
      html: cleanBlock(ps66Match[0]),
    });
  }
  if (ps23Match) {
    invitatoryPsalms.push({
      id: "ps23",
      label: "Salmo 23",
      subtitle: "Il Signore entra nel tempio",
      html: cleanBlock(ps23Match[0]),
    });
  }

  // Resto della Liturgia (Inno, Salmodia, Lettura, Benedictus, Invocazioni, Orazione, Benedizione)
  let restOfLiturgyHtml = rawHtml.slice(innoIdx);
  const cutoffIdx = restOfLiturgyHtml.search(/<p>\s*\*{3,}\s*<\/p>|<a href="HTTP:\/\/www\.ibreviary\.com\/new\/donazione/i);
  if (cutoffIdx !== -1) {
    restOfLiturgyHtml = restOfLiturgyHtml.slice(0, cutoffIdx);
  }
  restOfLiturgyHtml = cleanBlock(restOfLiturgyHtml);

  return {
    hasInvitatory: invitatoryPsalms.length > 0,
    introHtml,
    invitatoryPsalms,
    restOfLiturgyHtml,
  };
}
