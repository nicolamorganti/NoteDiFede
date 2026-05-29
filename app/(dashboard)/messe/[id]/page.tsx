import { notFound } from "next/navigation";
import { getMass } from "@/lib/masses";
import { MessaDashboard } from "@/components/messa-dashboard";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MassDashboardPage({ params }: Props) {
  const { id } = await params;
  const mass = await getMass(id);

  if (!mass) {
    notFound();
  }

  return <MessaDashboard massDetails={mass} />;
}
