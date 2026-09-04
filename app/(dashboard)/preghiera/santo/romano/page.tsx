import { SantoRomanoPageClient } from "@/components/santo-romano-page-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Santo del Giorno (Rito Romano) - Martirologio CEI · Note di Fede",
  description: "Martirologio Romano e Iconografia sacra dei Santi del giorno secondo la Conferenza Episcopale Italiana (CEI). Con ritratti dei santi minori, ascolto vocale e card per WhatsApp.",
};

export const dynamic = "force-dynamic";

export default function SantoRomanoPage() {
  return <SantoRomanoPageClient />;
}
