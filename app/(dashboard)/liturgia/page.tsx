import { LiturgiaReader } from "@/components/liturgia-reader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Liturgia delle Ore - Note di Fede",
  description: "Preghiera quotidiana della Liturgia delle Ore in Rito Ambrosiano e Rito Romano.",
};

export const dynamic = "force-dynamic";

export default function LiturgiaPage() {
  return <LiturgiaReader />;
}
