import { notFound } from "next/navigation";
import { getMass } from "@/lib/masses";
import { MessaDashboard } from "@/components/messa-dashboard";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const mass = await getMass(id);

  if (!mass) {
    return {
      title: "Messa non trovata - Note di Fede",
    };
  }

  const dateStr = new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(mass.celebrationDate));

  return {
    title: `${mass.title} - Note di Fede`,
    description: `Celebrazione liturgica del ${dateStr} (Anno ${mass.liturgicalYear}). Visualizza la scaletta dei canti, scarica gli spartiti ed esercitati con le tracce vocali.`,
    openGraph: {
      title: `${mass.title} - Note di Fede`,
      description: `Celebrazione liturgica del ${dateStr} (Anno ${mass.liturgicalYear}). Visualizza la scaletta dei canti, scarica gli spartiti ed esercitati con le tracce vocali.`,
      type: "website",
    },
  };
}

export default async function MassDashboardPage({ params }: Props) {
  const { id } = await params;
  const mass = await getMass(id);

  if (!mass) {
    notFound();
  }

  return <MessaDashboard massDetails={mass} />;
}
