import { notFound } from "next/navigation";
import { getMass } from "@/lib/masses";
import { getSongs } from "@/lib/songs";
import { MesseComposer } from "@/components/messe-composer";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MesseComposerPage({ params }: Props) {
  const { id } = await params;
  const [mass, songs] = await Promise.all([
    getMass(id),
    getSongs(),
  ]);

  if (!mass) {
    notFound();
  }

  return <MesseComposer massDetails={mass} allSongs={songs} />;
}
