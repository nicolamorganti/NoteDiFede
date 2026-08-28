import { BenedizionaleReader } from "@/components/benedizionale-reader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Benedizionale — Note di Fede",
  description: "Benedizionale del Rituale Romano (Conferenza Episcopale Italiana, 1992).",
};

export const dynamic = "force-dynamic";

export default function BenedizionalePage() {
  return <BenedizionaleReader />;
}
