import { SantoAmbrosianoPageClient } from "@/components/santo-ambrosiano-page-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Santo del Giorno (Rito Ambrosiano) - Chiesa di Milano · Note di Fede",
  description: "Agiografia ufficiale e calendario diocesano della Chiesa di Milano (Arcidiocesi di Milano). Con iconografia sacra, ascolto vocale HD e generatore di card per WhatsApp.",
};

export const dynamic = "force-dynamic";

export default function SantoAmbrosianoPage() {
  return <SantoAmbrosianoPageClient />;
}
