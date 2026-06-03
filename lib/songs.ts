import { createServerSupabaseClient } from "@/lib/supabase/server";

type SongRow = {
  id: string;
  code: string | null;
  title: string;
  alternate_title: string | null;
  notes: string | null;
  updated_at: string;
};

type SongArrangementRow = {
  id: string;
  song_id: string;
  arrangement_name: string | null;
  musical_key: string | null;
  instrumentation: string | null;
  notes: string | null;
  updated_at: string;
};

type SongFileRow = {
  id: string;
  arrangement_id: string | null;
  file_type: string;
  file_name: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  created_at: string;
  storage_path: string;
};

export type SongFileListItem = {
  id: string;
  fileType: string;
  fileLabel: string;
  fileName: string;
  mimeType: string | null;
  fileSizeLabel: string | null;
  createdAtLabel: string;
  storagePath: string;
  previewHref: string;
  downloadHref: string;
};

type SongLinkRow = {
  id: string;
  song_id: string;
  arrangement_id: string | null;
  label: string;
  url: string;
  provider: "youtube" | "generic";
  link_type: "ascolto" | "tutorial" | "riferimento";
  notes: string | null;
  created_at: string;
};

export type SongLinkListItem = {
  id: string;
  label: string;
  url: string;
  provider: "youtube" | "generic";
  linkType: "ascolto" | "tutorial" | "riferimento";
  notes: string | null;
  createdAtLabel: string;
};

export type SongArrangementListItem = {
  id: string;
  arrangementName: string | null;
  musicalKey: string | null;
  instrumentation: string | null;
  notes: string | null;
  updatedAtLabel: string;
  files: SongFileListItem[];
};

export type SongMomentItem = {
  id: string;
  name: string;
  sortOrder: number;
};

export type SongListItem = {
  id: string;
  code: string | null;
  title: string;
  alternateTitle: string | null;
  notes: string | null;
  updatedAtLabel: string;
  arrangements: SongArrangementListItem[];
  links: SongLinkListItem[];
  moments: SongMomentItem[];
};

function formatSongDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatFileSize(value: number | null) {
  if (!value || value <= 0) {
    return null;
  }

  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

type SongMomentRow = {
  song_id: string;
  moment_id: string;
  mass_moments: {
    id: string;
    name: string;
    sort_order: number;
  } | null;
};

export async function getSongs(): Promise<SongListItem[]> {
  const supabase = createServerSupabaseClient();

  const [
    { data: songsData, error: songsError },
    { data: arrangementsData, error: arrangementsError },
    { data: filesData, error: filesError },
    { data: linksData, error: linksError },
    { data: momentsData, error: momentsError },
  ] = await Promise.all([
    supabase
      .from("songs")
      .select("id, code, title, alternate_title, notes, updated_at")
      .order("title", { ascending: true }),
    supabase
      .from("song_arrangements")
      .select(
        "id, song_id, arrangement_name, musical_key, instrumentation, notes, updated_at",
      )
      .order("updated_at", { ascending: false }),
    supabase
      .from("song_files")
      .select(
        "id, arrangement_id, file_type, file_name, mime_type, file_size_bytes, created_at, storage_path",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("song_links")
      .select(
        "id, song_id, arrangement_id, label, url, provider, link_type, notes, created_at",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("song_moments")
      .select("song_id, moment_id, mass_moments(id, name, sort_order)"),
  ]);

  if (songsError) {
    console.error("Supabase getSongs error", songsError);
    return [];
  }

  if (arrangementsError) {
    console.error("Supabase getSongArrangements error", arrangementsError);
    return [];
  }

  if (filesError) {
    console.error("Supabase getSongFiles error", filesError);
    return [];
  }

  if (linksError) {
    console.error("Supabase getSongLinks error", linksError);
    return [];
  }

  if (momentsError) {
    console.error("Supabase getSongMoments error", momentsError);
    return [];
  }

  const filesByArrangementId = (filesData satisfies SongFileRow[]).reduce<
    Record<string, SongFileListItem[]>
  >((accumulator, file) => {
    if (!file.arrangement_id) {
      return accumulator;
    }

    const arrangementFiles = accumulator[file.arrangement_id] ?? [];

    arrangementFiles.push({
      id: file.id,
      fileType: file.file_type,
      fileLabel:
        file.file_type === "spartito_pdf" ? "Spartito PDF" :
        file.file_type === "accordi_pdf" ? "Accordi PDF" :
        file.file_type === "mp3_completo" ? "Brano Completo" :
        file.file_type === "mp3_soprano" ? "Soprano" :
        file.file_type === "mp3_contralto" ? "Contralto" :
        file.file_type === "mp3_tenore" ? "Tenore" :
        file.file_type === "mp3_basso" ? "Basso" :
        file.file_type === "mp3_organo" ? "Organo" :
        file.file_type,
      fileName: file.file_name,
      mimeType: file.mime_type,
      fileSizeLabel: formatFileSize(file.file_size_bytes),
      createdAtLabel: formatSongDate(file.created_at),
      storagePath: file.storage_path,
      previewHref: `/api/song-files/${file.id}?disposition=inline`,
      downloadHref: `/api/song-files/${file.id}?disposition=download`,
    });

    accumulator[file.arrangement_id] = arrangementFiles;

    return accumulator;
  }, {});

  const arrangementsBySongId = (arrangementsData satisfies SongArrangementRow[]).reduce<
    Record<string, SongArrangementListItem[]>
  >((accumulator, arrangement) => {
    const songArrangements = accumulator[arrangement.song_id] ?? [];

    songArrangements.push({
      id: arrangement.id,
      arrangementName: arrangement.arrangement_name,
      musicalKey: arrangement.musical_key,
      instrumentation: arrangement.instrumentation,
      notes: arrangement.notes,
      updatedAtLabel: formatSongDate(arrangement.updated_at),
      files: filesByArrangementId[arrangement.id] ?? [],
    });

    accumulator[arrangement.song_id] = songArrangements;

    return accumulator;
  }, {});

  const linksBySongId = (linksData satisfies SongLinkRow[]).reduce<
    Record<string, SongLinkListItem[]>
  >((accumulator, link) => {
    if (link.arrangement_id) {
      return accumulator;
    }

    const songLinks = accumulator[link.song_id] ?? [];

    songLinks.push({
      id: link.id,
      label: link.label,
      url: link.url,
      provider: link.provider,
      linkType: link.link_type,
      notes: link.notes,
      createdAtLabel: formatSongDate(link.created_at),
    });

    accumulator[link.song_id] = songLinks;

    return accumulator;
  }, {});

  const momentsBySongId = (momentsData as unknown as SongMomentRow[]).reduce<
    Record<string, SongMomentItem[]>
  >((accumulator, item) => {
    if (!item.mass_moments) {
      return accumulator;
    }

    const songMoments = accumulator[item.song_id] ?? [];

    songMoments.push({
      id: item.mass_moments.id,
      name: item.mass_moments.name,
      sortOrder: item.mass_moments.sort_order,
    });

    songMoments.sort((a, b) => a.sortOrder - b.sortOrder);
    accumulator[item.song_id] = songMoments;

    return accumulator;
  }, {});

  return (songsData satisfies SongRow[]).map((song) => ({
    id: song.id,
    code: song.code,
    title: song.title,
    alternateTitle: song.alternate_title,
    notes: song.notes,
    updatedAtLabel: formatSongDate(song.updated_at),
    arrangements: arrangementsBySongId[song.id] ?? [],
    links: linksBySongId[song.id] ?? [],
    moments: momentsBySongId[song.id] ?? [],
  }));
}

export type MassMomentItem = {
  id: string;
  name: string;
  sortOrder: number;
};

export async function getMassMoments(): Promise<MassMomentItem[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("mass_moments")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Supabase getMassMoments error", error);
    return [];
  }

  return ((data || []) as { id: string; name: string; sort_order: number }[]).map((row) => ({
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
  }));
}

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

