import { getMasses } from "@/lib/masses";
import { MesseList } from "@/components/messe-list";

export const dynamic = "force-dynamic";

export default async function MessePage() {
  const masses = await getMasses();
  return <MesseList initialMasses={masses} />;
}
