import { PreghiereTradizioneReader } from "@/components/preghiere-tradizione-reader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preghiere della Tradizione Cristiana — Note di Fede",
  description: "Le grandi preghiere della tradizione cattolica in italiano e latino: Padre Nostro, Ave Maria, Gloria, Salve Regina, Te Deum, Magnificat, Benedictus e inni.",
};

export const dynamic = "force-dynamic";

export default function TradizionePage() {
  return <PreghiereTradizioneReader />;
}
