import { MessaleAmbrosianoReader } from "@/components/messale-ambrosiano-reader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messale Ambrosiano — Note di Fede",
  description: "Seconda Edizione Ufficiale del Messale Ambrosiano (2024), Diocesi di Milano ed Editore ITL.",
};

export const dynamic = "force-dynamic";

export default function MessalePage() {
  return <MessaleAmbrosianoReader />;
}
