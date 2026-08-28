import { Metadata } from "next";
import { NotizieView } from "@/components/notizie-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notizie & Attualità Ecclesiale | Note di Fede",
  description:
    "Aggiornamenti in tempo reale e feed ufficiali dalla Santa Sede (Vatican News), dalla CEI, dalla Diocesi di Roma e dalla Diocesi di Milano.",
};

export default function NotiziePage() {
  return (
    <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6">
      <NotizieView />
    </div>
  );
}
