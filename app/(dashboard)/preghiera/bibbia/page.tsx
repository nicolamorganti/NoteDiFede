import { BibbiaReader } from "@/components/bibbia-reader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sacra Bibbia (CEI 2008) - Note di Fede",
  description: "Leggi e consulta l'Antico e Nuovo Testamento nella Traduzione Ufficiale CEI 2008 della Conferenza Episcopale Italiana.",
};

export const dynamic = "force-dynamic";

export default function BibbiaPage() {
  return <BibbiaReader />;
}
