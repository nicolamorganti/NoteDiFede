import type { MassDetails } from "@/lib/masses";
import { parseNotesAndLyrics } from "@/lib/song-utils";

/**
 * Genera ed esporta il PDF della tabella celebrazione in formato orizzontale (Landscape)
 */
export async function exportTableReportPdf(massDetails: MassDetails): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape" });

  let y = 15;
  const margin = 15;
  const pageHeight = 210;
  const pageWidth = 297;
  const docWidth = pageWidth - margin * 2;

  const col1Width = 45; // Momento
  const col2Width = 140; // Canto + Note
  const col3Width = docWidth - col1Width - col2Width; // Links ~82

  const col1X = margin;
  const col2X = margin + col1Width;
  const col3X = margin + col1Width + col2Width;

  const checkPageSpace = (heightNeeded: number) => {
    if (y + heightNeeded > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // 1. Titolo
  const dateStr = new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(new Date(massDetails.celebrationDate));

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(50, 50, 50);
  doc.text(massDetails.title, margin, y);

  const titleWidth = doc.getTextWidth(massDetails.title);

  doc.setFont("Helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Domenica ${dateStr}  |  Anno ${massDetails.liturgicalYear}`,
    margin + titleWidth + 5,
    y,
  );

  y += 6;

  if (massDetails.notes) {
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    const noteLines = doc.splitTextToSize(
      `Indicazioni: ${massDetails.notes}`,
      docWidth - 4,
    );
    const noteHeight = noteLines.length * 4.5 + 4;

    doc.setFillColor(251, 249, 245);
    doc.rect(margin, y, docWidth, noteHeight, "F");

    doc.setDrawColor(235, 220, 203);
    doc.setLineWidth(1.5);
    doc.line(margin, y, margin, y + noteHeight);

    doc.setTextColor(92, 74, 55);
    doc.text(noteLines, margin + 4, y + 4.5);

    y += noteHeight + 4;
    doc.setLineWidth(0.2);
  } else {
    y += 2;
  }

  // Header Tabella
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, docWidth, 8, "FD");

  doc.text("Momento", col1X + 2, y + 5);
  doc.text("Canto", col2X + 2, y + 5);
  doc.text("YouTube", col3X + 2, y + 5);

  y += 8;

  massDetails.moments.forEach(({ moment, songs }) => {
    if (songs.length === 0) return;

    songs.forEach((massSong, index) => {
      const { song, notes: specificNotes } = massSong;
      const { notes: generalNotes } = parseNotesAndLyrics(song.notes);

      const notesArr = [];
      if (specificNotes) notesArr.push(specificNotes);
      if (generalNotes) notesArr.push(`Canto: ${generalNotes.replace(/\n/g, " ")}`);
      const notes = notesArr.join(" | ");

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);

      const codePart = song.code ? ` (${song.code})` : "";
      const titleText = `${song.title}${codePart}`;

      doc.setFont("Helvetica", "bold");
      const titleLines = doc.splitTextToSize(titleText, col2Width - 4);

      doc.setFont("Helvetica", "italic");
      doc.setFontSize(9);
      const notesLines = notes
        ? doc.splitTextToSize(notes.replace(/\n/g, " "), col2Width - 4)
        : [];

      const ytLink = song.links.find((l) => l.provider === "youtube") || song.links[0];
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      const linkLines = ytLink ? doc.splitTextToSize(ytLink.label, col3Width - 10) : [];

      const titleHeight = titleLines.length * 4.5;
      const notesHeight = notesLines.length > 0 ? notesLines.length * 4 + 2 : 0;
      const contentCol2Height = titleHeight + notesHeight;
      const linkHeight = linkLines.length * 4;

      const rowHeight = Math.max(8, contentCol2Height + 4, linkHeight + 4);

      checkPageSpace(rowHeight);
      const isNewPage = y === margin;

      doc.setDrawColor(200, 200, 200);

      doc.line(margin, y, margin, y + rowHeight);
      doc.line(margin + docWidth, y, margin + docWidth, y + rowHeight);
      doc.line(col2X, y, col2X, y + rowHeight);
      doc.line(col3X, y, col3X, y + rowHeight);

      if (isNewPage) {
        doc.line(margin, y, margin + docWidth, y);
      }

      const isLastSong = index === songs.length - 1;
      if (isLastSong) {
        doc.line(margin, y + rowHeight, margin + docWidth, y + rowHeight);
      } else {
        doc.line(col2X, y + rowHeight, margin + docWidth, y + rowHeight);
      }

      if (index === 0 || isNewPage) {
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        const momentLines = doc.splitTextToSize(moment.name.toUpperCase(), col1Width - 4);
        doc.text(momentLines, col1X + 2, y + 5);
      }

      let currentY = y + 5;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.text(titleLines, col2X + 2, currentY);

      if (notesLines.length > 0) {
        currentY += titleHeight;
        doc.setFont("Helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(notesLines, col2X + 2, currentY);
      }

      if (ytLink) {
        const linkY = y + 5;
        doc.setFillColor(204, 0, 0);
        doc.roundedRect(col3X + 2, linkY - 3, 6, 4, 1, 1, "F");
        doc.setFillColor(255, 255, 255);
        doc.triangle(col3X + 4, linkY - 2, col3X + 4, linkY, col3X + 6, linkY - 1, "F");

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 238);

        doc.text(linkLines, col3X + 10, linkY);

        const textWidth = doc.getTextWidth(linkLines[0] || "");
        doc.link(col3X + 2, linkY - 4, 8 + textWidth, linkLines.length * 4, {
          url: ytLink.url,
        });
      }

      y += rowHeight;
    });
  });

  const safeTitle = massDetails.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  doc.save(`Tabella_${safeTitle}.pdf`);
}

/**
 * Genera ed esporta il PDF dell'elenco brani celebrazione (Portrait)
 */
export async function exportListReportPdf(
  massDetails: MassDetails,
  reportFormat: "simple" | "links" | "lyrics",
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();

  let y = 20;
  const margin = 20;
  const pageHeight = 275;
  const docWidth = 210 - margin * 2;

  const checkPageSpace = (heightNeeded: number) => {
    if (y + heightNeeded > pageHeight) {
      doc.addPage();
      y = 20;
    }
  };

  const printText = (
    text: string,
    size: number,
    style: "normal" | "bold" | "italic" = "normal",
    color = [63, 57, 51],
  ) => {
    doc.setFont("Helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);

    const lines = doc.splitTextToSize(text, docWidth);
    const lineHeight = size * 0.45;
    const height = lines.length * lineHeight + 2;

    checkPageSpace(height);
    doc.text(lines, margin, y);
    y += height;
  };

  printText(massDetails.title, 20, "bold", [63, 57, 51]);

  const dateStr = new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(massDetails.celebrationDate));
  printText(
    `Domenica ${dateStr}  |  Anno ${massDetails.liturgicalYear}  |  Portale Note di Fede`,
    10,
    "italic",
    [115, 101, 85],
  );

  y += 2;
  doc.setDrawColor(228, 220, 206);
  doc.setLineWidth(0.5);
  doc.line(margin, y, 210 - margin, y);
  y += 8;

  if (massDetails.notes) {
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    const noteLines = doc.splitTextToSize(
      `Indicazioni Celebrazione:\n${massDetails.notes}`,
      docWidth - 10,
    );
    const noteHeight = noteLines.length * 4.5 + 6;

    checkPageSpace(noteHeight);

    doc.setFillColor(251, 249, 245);
    doc.rect(margin, y, docWidth, noteHeight, "F");

    doc.setDrawColor(235, 220, 203);
    doc.setLineWidth(1.5);
    doc.line(margin, y, margin, y + noteHeight);

    doc.setTextColor(92, 74, 55);
    doc.text(noteLines, margin + 5, y + 5);

    y += noteHeight + 8;
  }

  massDetails.moments.forEach(({ moment, songs }) => {
    if (songs.length === 0) return;

    checkPageSpace(15);
    y += 4;
    printText(`${moment.sortOrder}. ${moment.name.toUpperCase()}`, 11, "bold", [138, 117, 93]);
    y += 1;

    songs.forEach((massSong) => {
      const { song, notes: specificNotes } = massSong;
      checkPageSpace(12);
      const codePrefix = song.code ? `[${song.code}] ` : "";
      printText(`${codePrefix}${song.title}`, 12, "bold", [63, 57, 51]);

      if (reportFormat === "links" || reportFormat === "lyrics") {
        if (song.links && song.links.length > 0) {
          song.links.forEach((link) => {
            checkPageSpace(8);
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(115, 101, 85);

            doc.text("• YouTube: ", margin + 5, y);
            const prefixWidth = doc.getTextWidth("• YouTube: ");

            doc.setTextColor(0, 0, 238);
            doc.text(link.label, margin + 5 + prefixWidth, y);

            const labelWidth = doc.getTextWidth(link.label);
            doc.link(margin + 5 + prefixWidth, y - 3, labelWidth, 4.5, {
              url: link.url,
            });

            y += 5;
          });
        }
      }

      if (reportFormat === "lyrics") {
        const { notes: generalNotes, lyrics } = parseNotesAndLyrics(song.notes);

        if (specificNotes) {
          doc.setFont("Helvetica", "italic");
          doc.setFontSize(9);
          const songNoteLines = doc.splitTextToSize(specificNotes, docWidth - 5);
          const noteHeight = songNoteLines.length * 4.5;

          checkPageSpace(noteHeight + 2);
          doc.setTextColor(80, 80, 80);
          doc.text(songNoteLines, margin + 5, y);
          y += noteHeight + 2;
        }

        if (generalNotes) {
          doc.setFont("Helvetica", "italic");
          doc.setFontSize(9);
          const songNoteLines = doc.splitTextToSize(
            `Nota Canto: ${generalNotes}`,
            docWidth - 5,
          );
          const noteHeight = songNoteLines.length * 4.5;

          checkPageSpace(noteHeight + 2);
          doc.setTextColor(100, 100, 100);
          doc.text(songNoteLines, margin + 5, y);
          y += noteHeight + 2;
        }

        if (lyrics) {
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(9);
          const lyricLines = doc.splitTextToSize(lyrics, docWidth - 10);
          const lyricHeight = lyricLines.length * 4.5;

          checkPageSpace(lyricHeight + 4);

          doc.setFillColor(253, 251, 247);
          doc.rect(margin + 2, y - 2, docWidth - 4, lyricHeight + 4, "F");

          doc.setDrawColor(240, 235, 225);
          doc.setLineWidth(0.3);
          doc.rect(margin + 2, y - 2, docWidth - 4, lyricHeight + 4, "S");

          doc.setTextColor(60, 60, 60);
          doc.text(lyricLines, margin + 5, y + 2);

          y += lyricHeight + 6;
        }
      }
      y += 2;
    });
    y += 4;
  });

  const safeTitle = massDetails.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  doc.save(`Report_${safeTitle}.pdf`);
}

/**
 * Esporta il report della celebrazione in formato Word (.doc)
 */
export function exportWordReport(
  massDetails: MassDetails,
  reportFormat: "simple" | "links" | "lyrics",
): void {
  const dateStr = new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(massDetails.celebrationDate));

  let htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>${massDetails.title}</title>
    <style>
      body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #333; line-height: 1.4; }
      h1 { font-size: 18pt; color: #2c251e; margin-bottom: 2pt; }
      .subtitle { font-size: 10pt; color: #666; font-style: italic; margin-bottom: 12pt; }
      .notes-box { background-color: #f7f3ed; border-left: 3px solid #aa9576; padding: 6pt 10pt; margin-bottom: 15pt; font-size: 10pt; }
      h2 { font-size: 12pt; color: #7a654e; text-transform: uppercase; border-bottom: 1px solid #e0d8cc; padding-bottom: 2pt; margin-top: 14pt; margin-bottom: 6pt; }
      .song-title { font-size: 11pt; font-weight: bold; color: #222; margin-top: 4pt; margin-bottom: 2pt; }
      .song-notes { font-size: 9.5pt; color: #666; font-style: italic; margin-left: 10pt; margin-bottom: 2pt; }
      .song-link { font-size: 9.5pt; color: #0066cc; text-decoration: none; margin-left: 10pt; margin-bottom: 2pt; }
      .lyrics-box { background-color: #faf8f5; border: 1px solid #ece5dc; padding: 6pt; margin: 4pt 0 8pt 10pt; font-size: 9.5pt; white-space: pre-wrap; font-family: Calibri, sans-serif; }
    </style>
    </head>
    <body>
      <h1>${massDetails.title}</h1>
      <div class='subtitle'>Domenica ${dateStr}  |  Anno ${massDetails.liturgicalYear}  |  Portale Note di Fede</div>
  `;

  if (massDetails.notes) {
    htmlContent += `<div class='notes-box'><strong>Indicazioni Celebrazione:</strong><br/>${massDetails.notes.replace(/\n/g, "<br/>")}</div>`;
  }

  massDetails.moments.forEach(({ moment, songs }) => {
    if (songs.length === 0) return;
    htmlContent += `<h2>${moment.sortOrder}. ${moment.name}</h2>`;

    songs.forEach((massSong) => {
      const { song, notes: specificNotes } = massSong;
      const codePrefix = song.code ? `[${song.code}] ` : "";
      htmlContent += `<div class='song-title'>${codePrefix}${song.title}</div>`;

      if (reportFormat === "links" || reportFormat === "lyrics") {
        if (song.links && song.links.length > 0) {
          song.links.forEach((link) => {
            htmlContent += `<div><a class='song-link' href='${link.url}'>• YouTube: ${link.label}</a></div>`;
          });
        }
      }

      if (reportFormat === "lyrics") {
        const { notes: generalNotes, lyrics } = parseNotesAndLyrics(song.notes);
        if (specificNotes) {
          htmlContent += `<div class='song-notes'>${specificNotes}</div>`;
        }
        if (generalNotes) {
          htmlContent += `<div class='song-notes'>Nota Canto: ${generalNotes}</div>`;
        }
        if (lyrics) {
          htmlContent += `<div class='lyrics-box'>${lyrics.replace(/\n/g, "<br/>")}</div>`;
        }
      }
    });
  });

  htmlContent += `</body></html>`;

  const blob = new Blob(["\ufeff", htmlContent], {
    type: "application/msword",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const safeTitle = massDetails.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  link.download = `Report_${safeTitle}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
