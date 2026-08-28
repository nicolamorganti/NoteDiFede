import { Metadata } from "next";
import { NotizieView } from "@/components/notizie-view";

export const metadata: Metadata = {
  title: "Notizie & Attualità Ecclesiale | Note di Fede",
  description:
    "Aggiornamenti in tempo reale e feed ufficiali dalla Diocesi di Milano, dalla Santa Sede (Vatican News), dalla CEI e dalla Diocesi di Roma.",
};

export default function NotiziePage() {
  return (
    <div className="container mx-auto px-3 sm:px-6 py-6 sm:py-8">
      <NotizieView />
    </div>
  );
}
