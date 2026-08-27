import { MinistriInfermiReader } from "@/components/ministri-infermi-reader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comunione agli Infermi - Note di Fede",
  description: "Formulario per i Ministri Straordinari della Santa Comunione agli Infermi (Diocesi di Milano).",
};

export const dynamic = "force-dynamic";

export default function InfermiPage() {
  return <MinistriInfermiReader />;
}
