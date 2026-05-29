import { NextRequest } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type SongFileRecord = {
  storage_bucket: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
};

function encodeContentDispositionFileName(fileName: string) {
  return encodeURIComponent(fileName).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params;
  const disposition = request.nextUrl.searchParams.get("disposition");
  const shouldDownload = disposition === "download";
  const supabase = createAdminSupabaseClient();

  const { data: file, error: fileError } = await supabase
    .from("song_files")
    .select("storage_bucket, storage_path, file_name, mime_type")
    .eq("id", fileId)
    .single<SongFileRecord>();

  if (fileError || !file) {
    return new Response("File non trovato", { status: 404 });
  }

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(file.storage_bucket)
    .createSignedUrl(file.storage_path, 60);

  if (signedUrlError || !signedUrlData?.signedUrl) {
    return new Response("Impossibile creare il link temporaneo", {
      status: 502,
    });
  }

  // Support range requests for HTML5 audio players
  const requestHeaders: HeadersInit = {};
  const rangeHeader = request.headers.get("range");
  if (rangeHeader) {
    requestHeaders["Range"] = rangeHeader;
  }

  const storageResponse = await fetch(signedUrlData.signedUrl, {
    cache: "no-store",
    headers: requestHeaders,
  });

  if (!storageResponse.ok || !storageResponse.body) {
    if (storageResponse.status === 416) {
      return new Response("Range Not Satisfiable", {
        status: 416,
        headers: {
          "Content-Range": storageResponse.headers.get("Content-Range") ?? "",
        },
      });
    }
    return new Response("Impossibile leggere il file dallo storage", {
      status: 502,
    });
  }

  const encodedFileName = encodeContentDispositionFileName(file.file_name);
  const contentDispositionType = shouldDownload ? "attachment" : "inline";

  // Force correct MIME type for MP3 files
  let mimeType = file.mime_type ?? storageResponse.headers.get("Content-Type") ?? "application/octet-stream";
  if (file.file_name.toLowerCase().endsWith(".mp3") && !mimeType.startsWith("audio/")) {
    mimeType = "audio/mpeg";
  }

  const responseHeaders = new Headers();
  responseHeaders.set("Cache-Control", "no-store");
  responseHeaders.set(
    "Content-Disposition",
    `${contentDispositionType}; filename*=UTF-8''${encodedFileName}`,
  );
  responseHeaders.set("Content-Type", mimeType);
  responseHeaders.set("Accept-Ranges", "bytes");

  const contentLength = storageResponse.headers.get("Content-Length");
  if (contentLength) {
    responseHeaders.set("Content-Length", contentLength);
  }

  const contentRange = storageResponse.headers.get("Content-Range");
  if (contentRange) {
    responseHeaders.set("Content-Range", contentRange);
  }

  return new Response(storageResponse.body, {
    status: storageResponse.status,
    headers: responseHeaders,
  });
}
