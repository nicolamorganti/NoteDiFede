import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Note di Fede — Musica Liturgica & Preghiera",
    short_name: "Note di Fede",
    description: "Note musicali e annotazioni di fede: canti liturgici, celebrazioni, liturgia delle ore e meditazioni sulla Parola.",
    start_url: "/",

    display: "standalone",
    background_color: "#fdfbf7",
    theme_color: "#5c4a37",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
