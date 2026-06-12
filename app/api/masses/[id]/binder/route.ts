import { NextRequest } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { verifyUserRole } from "@/lib/supabase/server";
import { PDFDocument } from "pdf-lib";

type MassSongRecord = {
  id: string;
  song_id: string;
  moment_id: string;
  position: number;
  mass_moments: {
    sort_order: number;
  } | null;
  songs: {
    id: string;
    title: string;
  } | null;
};

type SongFileRecord = {
  id: string;
  song_id: string;
  file_type: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
};

function sanitizeFileName(name: string) {
  return name
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .replace(/__+/g, "_")
    .substring(0, 50);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: massId } = await params;

  // Verify auth header
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

  if (!token) {
    return new Response("Non autorizzato: sessione mancante o non valida.", {
      status: 401,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const { error: authError } = await verifyUserRole(token, ["cantore", "maestro"]);
  if (authError) {
    return new Response(`Non autorizzato: ${authError}`, {
      status: 403,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const supabase = createAdminSupabaseClient();

  // 1. Fetch mass details
  const { data: mass, error: massError } = await supabase
    .from("masses")
    .select("id, title, celebration_date")
    .eq("id", massId)
    .maybeSingle();

  if (massError || !mass) {
    return new Response("Messa non trovata", { status: 404 });
  }

  // 2. Fetch mass songs joined with moment sort order
  const { data: massSongs, error: massSongsError } = await supabase
    .from("mass_songs")
    .select(`
      id,
      song_id,
      moment_id,
      position,
      mass_moments (
        sort_order
      ),
      songs (
        id,
        title
      )
    `)
    .eq("mass_id", massId);

  if (massSongsError || !massSongs) {
    return new Response("Impossibile caricare i canti della messa", { status: 500 });
  }

  // Sort mass songs chronologically by moment sort_order, then position
  const sortedMassSongs = (massSongs as unknown as MassSongRecord[]).sort((a, b) => {
    const sortA = a.mass_moments?.sort_order ?? 999;
    const sortB = b.mass_moments?.sort_order ?? 999;
    if (sortA !== sortB) return sortA - sortB;
    return a.position - b.position;
  });

  const songIds = sortedMassSongs.map((ms) => ms.song_id);
  if (songIds.length === 0) {
    return new Response(
      "Nessun canto presente in questa celebrazione. Aggiungi i canti nel compositore prima di generare il binder.",
      { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  // 3. Fetch all files for these songs
  const { data: filesData, error: filesError } = await supabase
    .from("song_files")
    .select("id, song_id, file_type, file_name, storage_path, mime_type")
    .in("song_id", songIds);

  if (filesError || !filesData) {
    return new Response("Impossibile caricare i file dei canti", { status: 500 });
  }

  // Select one file per song (spartito_pdf takes priority over accordi_pdf)
  const filesToMerge: SongFileRecord[] = [];
  const typedFiles = filesData as SongFileRecord[];

  for (const ms of sortedMassSongs) {
    const songFiles = typedFiles.filter((f) => f.song_id === ms.song_id);
    let targetFile = songFiles.find((f) => f.file_type === "spartito_pdf");
    if (!targetFile) {
      targetFile = songFiles.find((f) => f.file_type === "accordi_pdf");
    }
    if (targetFile) {
      filesToMerge.push(targetFile);
    }
  }

  if (filesToMerge.length === 0) {
    return new Response(
      "Nessuno spartito o foglio accordi (PDF/Immagine) è stato caricato per i canti di questa messa.",
      { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  try {
    const mergedPdf = await PDFDocument.create();
    let pagesAdded = 0;

    for (const file of filesToMerge) {
      try {
        const { data: fileBlob, error: downloadError } = await supabase.storage
          .from("note-di-fede")
          .download(file.storage_path);

        if (downloadError || !fileBlob) {
          console.warn(`Impossibile scaricare il file ${file.file_name} dallo storage:`, downloadError);
          continue;
        }

        const arrayBuffer = await fileBlob.arrayBuffer();
        const ext = file.file_name.substring(file.file_name.lastIndexOf(".")).toLowerCase();

        if (ext === ".pdf") {
          const srcPdf = await PDFDocument.load(arrayBuffer);
          const copiedPages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
          pagesAdded += copiedPages.length;
        } else if ([".png", ".jpg", ".jpeg"].some(suffix => ext.endsWith(suffix))) {
          let img;
          if (ext === ".png") {
            img = await mergedPdf.embedPng(arrayBuffer);
          } else {
            img = await mergedPdf.embedJpg(arrayBuffer);
          }
          if (img) {
            const page = mergedPdf.addPage([img.width, img.height]);
            page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
            pagesAdded++;
          }
        }
      } catch (fileErr) {
        console.error(`Errore durante il processamento del file ${file.file_name}:`, fileErr);
        // Continue merging other files even if one fails
      }
    }

    if (pagesAdded === 0) {
      return new Response(
        "Nessuna pagina valida è stata estratta dai file caricati.",
        { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }

    const mergedPdfBytes = await mergedPdf.save();
    let formattedDate = "";
    if (mass.celebration_date) {
      const parts = mass.celebration_date.split("-");
      if (parts.length === 3) {
        const [year, month, day] = parts;
        formattedDate = `_${day}${month}${year}`;
      }
    }
    const safeFileName = sanitizeFileName(`${mass.title}${formattedDate}`);

    return new Response(Buffer.from(mergedPdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${safeFileName}.pdf"`,
      },
    });
  } catch (err) {
    console.error("Errore generale durante la creazione del PDF unificato:", err);
    return new Response("Errore durante la generazione del documento unico", { status: 500 });
  }
}
