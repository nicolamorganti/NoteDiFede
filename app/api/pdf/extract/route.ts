import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Cache in memoria controllata (LRU con limite massimo di 3 file per non saturare la RAM)
const MAX_CACHED_PDFS = 3;
const pdfSourceCache = new Map<string, ArrayBuffer>();

function getCachedPdf(key: string): ArrayBuffer | undefined {
  return pdfSourceCache.get(key);
}

function setCachedPdf(key: string, buffer: ArrayBuffer) {
  if (pdfSourceCache.has(key)) {
    pdfSourceCache.delete(key);
  } else if (pdfSourceCache.size >= MAX_CACHED_PDFS) {
    const oldestKey = pdfSourceCache.keys().next().value;
    if (oldestKey) pdfSourceCache.delete(oldestKey);
  }
  pdfSourceCache.set(key, buffer);
}

const SOURCE_URLS: Record<string, string> = {
  benedizionale:
    "https://liturgico.chiesacattolica.it/wp-content/uploads/sites/8/2022/04/08/Benedizionale-DEFINITIVO-.pdf",
  "messale-romano":
    "https://DriveCEI.glauco.it/invitations?share=a500c08633002063713d&dl=1",
  "messale-romano-testo":
    "https://DriveCEI.glauco.it/invitations?share=a500c08633002063713d&dl=1",
};

/**
 * Whitelist di sicurezza: impedisce SSRF verso host interni o non ecclesiali autorizzati
 */
function isAllowedPdfUrl(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    if (u.protocol !== "https:") return false;
    const hostname = u.hostname.toLowerCase();
    return (
      hostname === "liturgico.chiesacattolica.it" ||
      hostname === "chiesacattolica.it" ||
      hostname.endsWith(".chiesacattolica.it") ||
      hostname === "drivecei.glauco.it" ||
      hostname.endsWith(".glauco.it")
    );
  } catch {
    return false;
  }
}

async function fetchDriveCeiBuffer(url: string): Promise<ArrayBuffer> {
  let currentUrl = url;
  const cookies: string[] = [];
  let res: Response | null = null;

  for (let i = 0; i < 8; i++) {
    const cookieHeader = cookies.map((c) => c.split(";")[0]).join("; ");
    res = await fetch(currentUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede/2.3",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      redirect: "manual",
      signal: AbortSignal.timeout(30000), // 30 secondi di timeout generoso per file PDF grandi
    });

    const setCookies = res.headers.getSetCookie
      ? res.headers.getSetCookie()
      : ([res.headers.get("set-cookie")].filter(Boolean) as string[]);
    if (setCookies.length) {
      cookies.push(...setCookies);
    }

    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      const loc = res.headers.get("location")!;
      currentUrl = loc.startsWith("http") ? loc : new URL(loc, currentUrl).href;
    } else {
      break;
    }
  }

  if (!res || !res.ok) {
    throw new Error(`Errore download DriveCEI HTTP ${res?.status}`);
  }

  return await res.arrayBuffer();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const docKey = searchParams.get("doc") || "benedizionale";
  const customUrl = searchParams.get("url");
  const fromPage = parseInt(searchParams.get("from") || "1", 10);
  const toPage = parseInt(searchParams.get("to") || "10", 10);
  const filename = searchParams.get("name") || `estratto_${docKey}_p${fromPage}-${toPage}.pdf`;

  // Validazione dell'intervallo pagine
  if (isNaN(fromPage) || isNaN(toPage) || fromPage < 1 || toPage < fromPage) {
    return NextResponse.json({ error: "Intervallo di pagine non valido." }, { status: 400 });
  }

  // Limite proporzionato (max 120 pagine per estratto liturgico)
  if (toPage - fromPage > 120) {
    return NextResponse.json(
      { error: "L'estratto supera il limite consentito di 120 pagine per volta." },
      { status: 400 }
    );
  }

  const sourceUrl = customUrl || SOURCE_URLS[docKey];
  if (!sourceUrl) {
    return NextResponse.json({ error: "Documento non trovato." }, { status: 400 });
  }

  // Verifica sicurezza SSRF se fornito URL personalizzato
  if (customUrl && !isAllowedPdfUrl(customUrl)) {
    return NextResponse.json(
      { error: "URL non autorizzato. Sono consentiti solo documenti ufficiali della Chiesa Cattolica." },
      { status: 403 }
    );
  }

  try {
    let sourceBuffer = getCachedPdf(sourceUrl);
    if (!sourceBuffer) {
      if (sourceUrl.toLowerCase().includes("drivecei") || docKey.includes("messale-romano")) {
        sourceBuffer = await fetchDriveCeiBuffer(sourceUrl);
      } else {
        const res = await fetch(sourceUrl, {
          headers: { "User-Agent": "Mozilla/5.0 NoteDiFede/2.3" },
          signal: AbortSignal.timeout(30000), // 30s timeout
        });
        if (!res.ok) {
          throw new Error(`Errore HTTP ${res.status} durante il recupero del documento sorgente`);
        }
        sourceBuffer = await res.arrayBuffer();
      }
      setCachedPdf(sourceUrl, sourceBuffer);
    }

    const srcPdf = await PDFDocument.load(sourceBuffer, { ignoreEncryption: true });
    const totalPages = srcPdf.getPageCount();

    const startIdx = Math.max(0, Math.min(totalPages - 1, fromPage - 1));
    const endIdx = Math.max(startIdx, Math.min(totalPages - 1, toPage - 1));

    const pageIndices: number[] = [];
    for (let i = startIdx; i <= endIdx; i++) {
      pageIndices.push(i);
    }

    const subPdf = await PDFDocument.create();
    const copiedPages = await subPdf.copyPages(srcPdf, pageIndices);
    copiedPages.forEach((page) => subPdf.addPage(page));

    const subPdfBytes = await subPdf.save();

    return new NextResponse(subPdfBytes as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${encodeURIComponent(filename)}"`,
        "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=2592000",
      },
    });
  } catch (error: any) {
    console.error("Errore estrazione PDF:", error);
    return NextResponse.json(
      { error: error?.message || "Impossibile estrarre la sezione PDF richiesta." },
      { status: 500 }
    );
  }
}
