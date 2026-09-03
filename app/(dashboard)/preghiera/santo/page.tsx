import { SantoReader } from "@/components/santo-reader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Santo del Giorno - Note di Fede",
  description: "Martirologio Romano e Iconografia sacra dei Santi del giorno (Ufficiale CEI - Conferenza Episcopale Italiana).",
};

export const dynamic = "force-dynamic";

export default function SantoPage() {
  return <SantoReader />;
}
