import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAllowedDomain(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    const hostname = u.hostname.toLowerCase();
    return (
      hostname === "chiesadimilano.it" ||
      hostname.endsWith(".chiesadimilano.it") ||
      hostname === "chiesacattolica.it" ||
      hostname.endsWith(".chiesacattolica.it") ||
      hostname === "glauco.it" ||
      hostname.endsWith(".glauco.it")
    );
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl || !isAllowedDomain(targetUrl)) {
    return NextResponse.json(
      { error: "URL non valido o dominio non autorizzato." },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede/2.4 (ImageProxy)",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Errore recupero immagine: HTTP ${res.status}` },
        { status: res.status }
      );
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const imageBuffer = await res.arrayBuffer();

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=604800, stale-while-revalidate=2592000",
      },
    });
  } catch (err: any) {
    console.error("Errore proxy immagine:", err);
    return NextResponse.json(
      { error: err.message || "Impossibile recuperare l'immagine richiesta." },
      { status: 500 }
    );
  }
}
