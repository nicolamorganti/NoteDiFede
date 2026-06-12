import { ImageResponse } from "next/og";
import { getMass } from "@/lib/masses";

export const runtime = "nodejs";

export const alt = "Note di Fede - Celebrazione";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const massDetails = await getMass(id);

  if (!massDetails) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 48,
            background: "#fffdfa",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "serif",
            color: "#3f3933",
          }}
        >
          Celebrazione non trovata
        </div>
      ),
      size
    );
  }

  // Conta i canti
  const songCount = massDetails.moments.reduce((acc, m) => acc + m.songs.length, 0);

  // Formatta la data (es. 14 GIU 2026)
  const dateObj = new Date(massDetails.celebrationDate);
  const formattedDate = new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
    .format(dateObj)
    .toUpperCase()
    .replace(".", "");

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#f6f1ea",
          padding: "80px",
          boxSizing: "border-box",
          fontFamily: "serif",
          color: "#3f3933",
        }}
      >
        {/* Riga Superiore: Data e Badge */}
        <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "28px", fontWeight: "bold", color: "#8a755d", letterSpacing: "0.1em" }}>
            {formattedDate}
          </span>
          <div style={{ display: "flex", gap: "16px" }}>
            <span style={{ backgroundColor: "#efe7db", color: "#5c4a37", padding: "10px 24px", borderRadius: "30px", fontSize: "20px", fontWeight: "bold" }}>
              ANNO {massDetails.liturgicalYear}
            </span>
            <span style={{ backgroundColor: "#efe7db", color: "#5c4a37", padding: "10px 24px", borderRadius: "30px", fontSize: "20px", fontWeight: "bold" }}>
              {songCount} {songCount === 1 ? "canto" : "canti"}
            </span>
          </div>
        </div>

        {/* Riga Centrale: Titolo */}
        <div style={{ display: "flex", flexDirection: "column", width: "100%", marginTop: "30px", marginBottom: "30px" }}>
          <h1 style={{ fontSize: "64px", margin: 0, fontWeight: "normal", color: "#3f3933", fontFamily: "serif" }}>
            {massDetails.title}
          </h1>
          <div style={{ width: "100%", height: "2px", backgroundColor: "#e4dcce", marginTop: "30px" }} />
        </div>

        {/* Riga Inferiore: Bottone */}
        <div style={{ display: "flex" }}>
          <div
            style={{
              backgroundColor: "#efe7db",
              color: "#5c4a37",
              padding: "14px 32px",
              borderRadius: "30px",
              fontSize: "20px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
            }}
          >
            Apri elenco &gt;
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
