import { getSongs, getMassMoments } from "@/lib/songs";
import { CantiCatalog } from "@/components/canti-catalog";

export const dynamic = "force-dynamic";

export default async function CantiPage() {
  const [songs, moments] = await Promise.all([
    getSongs(),
    getMassMoments(),
  ]);

  return <CantiCatalog initialSongs={songs} allMoments={moments} />;
}

