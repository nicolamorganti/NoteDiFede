import { MessaleRomanoReader } from "@/components/messale-romano-reader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messale Romano — Note di Fede",
  description: "Terza Edizione Italiana Ufficiale del Messale Romano (CEI, Fondazione Santi Francesco e Caterina).",
};

export const dynamic = "force-dynamic";

export default function MessaleRomanoPage() {
  return <MessaleRomanoReader />;
}
