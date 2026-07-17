export function parseNotesAndLyrics(notesText: string | null) {
  if (!notesText) {
    return { notes: "", lyrics: "" };
  }

  const notesTag = "[NOTE]";
  const lyricsTag = "[TESTO]";

  if (notesText.includes(notesTag) || notesText.includes(lyricsTag)) {
    let notes = "";
    let lyrics = "";

    const notesStart = notesText.indexOf(notesTag);
    const lyricsStart = notesText.indexOf(lyricsTag);

    if (notesStart !== -1 && lyricsStart !== -1) {
      if (notesStart < lyricsStart) {
        notes = notesText.substring(notesStart + notesTag.length, lyricsStart).trim();
        lyrics = notesText.substring(lyricsStart + lyricsTag.length).trim();
      } else {
        lyrics = notesText.substring(lyricsStart + lyricsTag.length, notesStart).trim();
        notes = notesText.substring(notesStart + notesTag.length).trim();
      }
    } else if (notesStart !== -1) {
      notes = notesText.substring(notesStart + notesTag.length).trim();
    } else if (lyricsStart !== -1) {
      lyrics = notesText.substring(lyricsStart + lyricsTag.length).trim();
    }

    return { notes, lyrics };
  }

  return { notes: notesText.trim(), lyrics: "" };
}

export function serializeNotesAndLyrics(notes: string, lyrics: string) {
  const parts = [];
  if (notes.trim()) {
    parts.push(`[NOTE]\n${notes.trim()}`);
  }
  if (lyrics.trim()) {
    parts.push(`[TESTO]\n${lyrics.trim()}`);
  }
  return parts.join("\n\n");
}
