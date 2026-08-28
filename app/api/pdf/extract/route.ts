import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export const dynamic = "force-dynamic";

// Cache in memoria per i buffer dei PDF sorgente per velocizzare le richieste successive
const pdfSourceCache: Record<string, ArrayBuffer> = {};

const SOURCE_URLS: Record<string, string> = {
  benedizionale:
    "https://liturgico.chiesacattolica.it/wp-content/uploads/sites/8/2022/04/08/Benedizionale-DEFINITIVO-.pdf",
  "messale-romano-testo":
    "https://DriveCEI.glauco.it/invitations?share=a500c08633002063713d&dl=1",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const docKey = searchParams.get("doc") || "benedizionale";
  const customUrl = searchParams.get("url");
  const fromPage = parseInt(searchParams.get("from") || "1", 10);
  const toPage = parseInt(searchParams.get("to") || "10", 10);
  const filename = searchParams.get("name") || `estratto_${docKey}_p${fromPage}-${toPage}.pdf`;

  const sourceUrl = customUrl || SOURCE_URLS[docKey];
  if (!sourceUrl) {
    return NextResponse.json({ error: "Documento non trovato" }, { status: 400 });
  }

  try {
    let sourceBuffer = pdfSourceCache[sourceUrl];
    if (!sourceBuffer) {
      const res = await fetch(sourceUrl, {
        headers: { "User-Agent": "Mozilla/5.0 NoteDiFede/1.9.17" },
      });
      if (!res.ok) {
        throw new Error(`Errore HTTP ${res.status} durante il recupero del documento sorgente`);
      }
      sourceBuffer = await res.arrayBuffer();
      pdfSourceCache[sourceUrl] = sourceBuffer;
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

    // Ritorna il PDF estratto
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
      { error: error?.message || "Impossibile estrarre la sezione PDF richiesta" },
      { status: 500 }
    );
  }
}
