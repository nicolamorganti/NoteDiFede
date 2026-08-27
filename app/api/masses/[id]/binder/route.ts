import { NextRequest, NextResponse } from "next/server";
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
  storage_bucket: string;
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
  const adminSupabase = createAdminSupabaseClient();

  // 1. Verifica autorizzazione: controlla prima la sessione nei cookie SSR
  let isAuthorized = false;
  const { error: cookieAuthError } = await verifyUserRole(["cantore", "maestro", "responsabile"]);

  if (!cookieAuthError) {
    isAuthorized = true;
  } else {
    // Fallback: controlla eventuale header Authorization Bearer token inviato dal client
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      if (token) {
        const { data: { user } } = await adminSupabase.auth.getUser(token);
        if (user) {
          const { data: profile } = await adminSupabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

          if (profile && ["cantore", "maestro", "responsabile"].includes(profile.role)) {
            isAuthorized = true;
          }
        }
      }
    }
  }

  if (!isAuthorized) {
    return new NextResponse(
      "Non autorizzato: accesso riservato a Cantori, Maestri e Responsabili.",
      {
        status: 403,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      }
    );
  }

  const supabase = adminSupabase;


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
      notes,
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
    .select("id, song_id, file_type, file_name, storage_bucket, storage_path, mime_type")
    .in("song_id", songIds);

  if (filesError || !filesData) {
    return new NextResponse("Impossibile caricare i file dei canti", { status: 500 });
  }

  // Select all files per song (spartiti and accordi)
  const filesToMerge: SongFileRecord[] = [];
  const typedFiles = filesData as SongFileRecord[];

  for (const ms of sortedMassSongs) {
    const songFiles = typedFiles.filter((f) => f.song_id === ms.song_id);
    
    // Seleziona tutti gli spartiti e tutti gli accordi
    const spartiti = songFiles.filter((f) => f.file_type === "spartito_pdf");
    const accordi = songFiles.filter((f) => f.file_type === "accordi_pdf");
    
    // Aggiungi tutti i file trovati per questo canto al PDF finale
    filesToMerge.push(...spartiti, ...accordi);
  }

  if (filesToMerge.length === 0) {
    return new NextResponse(
      "Nessuno spartito o foglio accordi (PDF/Immagine) è stato caricato per i canti di questa messa.",
      { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  try {
    const mergedPdf = await PDFDocument.create();
    let pagesAdded = 0;

    for (const file of filesToMerge) {
      try {
        const bucket = file.storage_bucket || "note-di-fede";
        let arrayBuffer: ArrayBuffer | null = null;

        // Prova il download diretto
        const { data: fileBlob, error: downloadError } = await supabase.storage
          .from(bucket)
          .download(file.storage_path);

        if (!downloadError && fileBlob) {
          arrayBuffer = await fileBlob.arrayBuffer();
        } else {
          // Fallback via signed url
          const { data: signedData } = await supabase.storage
            .from(bucket)
            .createSignedUrl(file.storage_path, 60);

          if (signedData?.signedUrl) {
            const fetchRes = await fetch(signedData.signedUrl);
            if (fetchRes.ok) {
              arrayBuffer = await fetchRes.arrayBuffer();
            }
          }
        }

        if (!arrayBuffer) {
          console.warn(`Impossibile scaricare il file ${file.file_name} dallo storage.`);
          continue;
        }

        const ext = file.file_name.substring(file.file_name.lastIndexOf(".")).toLowerCase();

        if (ext === ".pdf") {
          const srcPdf = await PDFDocument.load(arrayBuffer);
          const copiedPages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
          pagesAdded += copiedPages.length;
        } else if ([".png", ".jpg", ".jpeg"].some((suffix) => ext.endsWith(suffix))) {
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
      }
    }

    if (pagesAdded === 0) {
      return new NextResponse(
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

    return new NextResponse(new Uint8Array(mergedPdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFileName}.pdf"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err) {
    console.error("Errore generale durante la creazione del PDF unificato:", err);
    return new NextResponse("Errore durante la generazione del documento unico", { status: 500 });
  }
}

