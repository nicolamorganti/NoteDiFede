import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { SongListItem, MassMomentItem } from "@/lib/songs";

export type MassListItem = {
  id: string;
  title: string;
  liturgicalYear: "A" | "B" | "C";
  celebrationDate: string;
  notes: string | null;
  songCount: number;
  createdAtLabel: string;
};

export type MassSongItem = {
  id: string;
  songId: string;
  momentId: string;
  position: number;
  song: SongListItem;
};

export type MassMomentWithSongs = {
  moment: MassMomentItem;
  songs: MassSongItem[];
};

export type MassDetails = {
  id: string;
  title: string;
  liturgicalYear: "A" | "B" | "C";
  celebrationDate: string;
  notes: string | null;
  moments: MassMomentWithSongs[];
};

function formatMassDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
  }).format(new Date(value));
}

// 1. Ottiene la lista di tutte le messe con il conteggio dei canti associati
export async function getMasses(): Promise<MassListItem[]> {
  const supabase = createServerSupabaseClient();

  // Seleziona messe e unisci i conteggi dei canti
  const { data: massesData, error: massesError } = await supabase
    .from("masses")
    .select("id, title, liturgical_year, celebration_date, notes, created_at")
    .order("celebration_date", { ascending: false });

  if (massesError) {
    console.error("Supabase getMasses error", massesError);
    return [];
  }

  // Per ogni messa, recuperiamo il conteggio dei canti
  const { data: countData, error: countError } = await supabase
    .from("mass_songs")
    .select("mass_id");

  if (countError) {
    console.error("Supabase getMassSongs count error", countError);
  }

  const countsByMassId = (countData ?? []).reduce<Record<string, number>>((acc, item) => {
    acc[item.mass_id] = (acc[item.mass_id] ?? 0) + 1;
    return acc;
  }, {});

  return (massesData as any[]).map((mass) => ({
    id: mass.id,
    title: mass.title,
    liturgicalYear: mass.liturgical_year,
    celebrationDate: mass.celebration_date,
    notes: mass.notes,
    songCount: countsByMassId[mass.id] ?? 0,
    createdAtLabel: formatMassDate(mass.celebration_date),
  }));
}

// 2. Ottiene i dettagli completi di una singola messa con tutti i canti associati per momento liturgico
export async function getMass(id: string): Promise<MassDetails | null> {
  const supabase = createServerSupabaseClient();

  // Recupera i dettagli della messa
  const { data: massData, error: massError } = await supabase
    .from("masses")
    .select("id, title, liturgical_year, celebration_date, notes")
    .eq("id", id)
    .maybeSingle();

  if (massError || !massData) {
    console.error("Supabase getMass error", massError);
    return null;
  }

  // Recupera tutti i momenti liturgici dal database
  const { data: momentsData, error: momentsError } = await supabase
    .from("mass_moments")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true });

  if (momentsError) {
    console.error("Supabase getMass moments error", momentsError);
    return null;
  }

  // Recupera le associazioni canti-messa per questa messa
  const { data: massSongsData, error: massSongsError } = await supabase
    .from("mass_songs")
    .select(`
      id,
      song_id,
      moment_id,
      position,
      songs (
        id,
        code,
        title,
        alternate_title,
        notes,
        updated_at
      )
    `)
    .eq("mass_id", id)
    .order("position", { ascending: true });

  if (massSongsError) {
    console.error("Supabase getMassSongs error", massSongsError);
    return null;
  }

  // Recuperiamo le informazioni complete per TUTTI i canti associati per poter mostrare spartiti, audio, ecc.
  const songIds = (massSongsData ?? []).map((ms) => ms.song_id);

  let arrangementsBySongId: Record<string, any[]> = {};
  let filesByArrangementId: Record<string, any[]> = {};
  let linksBySongId: Record<string, any[]> = {};
  let momentsBySongId: Record<string, any[]> = {};

  if (songIds.length > 0) {
    const [
      { data: arrangementsData },
      { data: filesData },
      { data: linksData },
      { data: momentsJoinData }
    ] = await Promise.all([
      supabase
        .from("song_arrangements")
        .select("id, song_id, arrangement_name, musical_key, instrumentation, notes, updated_at")
        .in("song_id", songIds),
      supabase
        .from("song_files")
        .select("id, arrangement_id, file_type, file_name, mime_type, file_size_bytes, created_at, storage_path")
        .in("song_id", songIds),
      supabase
        .from("song_links")
        .select("id, song_id, arrangement_id, label, url, provider, link_type, notes, created_at")
        .in("song_id", songIds),
      supabase
        .from("song_moments")
        .select("song_id, moment_id, mass_moments(id, name, sort_order)")
        .in("song_id", songIds)
    ]);

    // Formatters
    const formatSongDate = (value: string) =>
      new Intl.DateTimeFormat("it-IT", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value));

    const formatFileSize = (value: number | null) => {
      if (!value || value <= 0) return null;
      if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
      return `${(value / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Mappatura files
    filesByArrangementId = (filesData ?? []).reduce<Record<string, any[]>>((acc, file) => {
      if (!file.arrangement_id) return acc;
      const list = acc[file.arrangement_id] ?? [];
      list.push({
        id: file.id,
        fileType: file.file_type,
        fileLabel: file.file_type === "spartito_pdf" ? "Spartito PDF" : file.file_type === "accordi_pdf" ? "Accordi PDF" : "Vocal Track",
        fileName: file.file_name,
        mimeType: file.mime_type,
        fileSizeLabel: formatFileSize(file.file_size_bytes),
        createdAtLabel: formatSongDate(file.created_at),
        storagePath: file.storage_path,
        previewHref: `/api/song-files/${file.id}?disposition=inline`,
        downloadHref: `/api/song-files/${file.id}?disposition=download`,
      });
      acc[file.arrangement_id] = list;
      return acc;
    }, {});

    // Mappatura arrangiamenti
    arrangementsBySongId = (arrangementsData ?? []).reduce<Record<string, any[]>>((acc, arr) => {
      const list = acc[arr.song_id] ?? [];
      list.push({
        id: arr.id,
        arrangementName: arr.arrangement_name,
        musicalKey: arr.musical_key,
        instrumentation: arr.instrumentation,
        notes: arr.notes,
        updatedAtLabel: formatSongDate(arr.updated_at),
        files: filesByArrangementId[arr.id] ?? [],
      });
      acc[arr.song_id] = list;
      return acc;
    }, {});

    // Mappatura links
    linksBySongId = (linksData ?? []).reduce<Record<string, any[]>>((acc, link) => {
      if (link.arrangement_id) return acc;
      const list = acc[link.song_id] ?? [];
      list.push({
        id: link.id,
        label: link.label,
        url: link.url,
        provider: link.provider,
        linkType: link.link_type,
        notes: link.notes,
        createdAtLabel: formatSongDate(link.created_at),
      });
      acc[link.song_id] = list;
      return acc;
    }, {});

    // Mappatura momenti associati al canto
    momentsBySongId = (momentsJoinData ?? []).reduce<Record<string, any[]>>((acc, item: any) => {
      if (!item.mass_moments) return acc;
      const list = acc[item.song_id] ?? [];
      list.push({
        id: item.mass_moments.id,
        name: item.mass_moments.name,
        sortOrder: item.mass_moments.sort_order,
      });
      list.sort((a, b) => a.sortOrder - b.sortOrder);
      acc[item.song_id] = list;
      return acc;
    }, {});
  }

  // Costruisci le canzoni associate con tutti i metadati mappati
  const songsByMomentId = (massSongsData ?? []).reduce<Record<string, MassSongItem[]>>((acc, ms: any) => {
    if (!ms.songs) return acc;
    const songRow = ms.songs;
    const list = acc[ms.moment_id] ?? [];

    list.push({
      id: ms.id,
      songId: ms.song_id,
      momentId: ms.moment_id,
      position: ms.position,
      song: {
        id: songRow.id,
        code: songRow.code,
        title: songRow.title,
        alternateTitle: songRow.alternate_title,
        notes: songRow.notes,
        updatedAtLabel: new Intl.DateTimeFormat("it-IT", { dateStyle: "medium" }).format(new Date(songRow.updated_at)),
        arrangements: arrangementsBySongId[songRow.id] ?? [],
        links: linksBySongId[songRow.id] ?? [],
        moments: momentsBySongId[songRow.id] ?? [],
      },
    });

    acc[ms.moment_id] = list;
    return acc;
  }, {});

  // Mappa i momenti con i canti corrispondenti
  const momentsWithSongs: MassMomentWithSongs[] = (momentsData as any[]).map((moment) => ({
    moment: {
      id: moment.id,
      name: moment.name,
      sortOrder: moment.sort_order,
    },
    songs: songsByMomentId[moment.id] ?? [],
  }));

  return {
    id: massData.id,
    title: massData.title,
    liturgicalYear: massData.liturgical_year,
    celebrationDate: massData.celebration_date,
    notes: massData.notes,
    moments: momentsWithSongs,
  };
}
