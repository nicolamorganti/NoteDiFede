"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function PreghieraNav() {
  const pathname = usePathname();

  const tabs = [
    {
      href: "/liturgia",
      label: "Liturgia delle Ore",
      icon: "📖",
      description: "Lodi, Vespri, Ufficio e Letture (Ambrosiano e Romano)",
    },
    {
      href: "/preghiera/infermi",
      label: "Comunione agli Infermi",
      icon: "🕊️",
      description: "Rito per i Ministri Straordinari dell'Eucaristia",
    },
    {
      href: "/preghiera/bibbia",
      label: "Sacra Bibbia (CEI 2008)",
      icon: "📜",
      description: "Antico e Nuovo Testamento - Testo Ufficiale CEI 2008",
    },
    {
      href: "/preghiera/messale",
      label: "Messale Ambrosiano",
      icon: "📕",
      description: "Seconda Edizione Ufficiale 2024 (Diocesi di Milano / ITL)",
    },
    {
      href: "/preghiera/messale-romano",
      label: "Messale Romano",
      icon: "📘",
      description: "Terza Edizione Ufficiale 2020 (CEI)",
    },
  ];



  return (
    <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#ede4d8] border border-[#ddd0c0] shadow-inner mb-6">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              isActive
                ? "bg-[#5c4a37] text-white shadow-md"
                : "text-[#6b5d4e] hover:bg-[#f6eee3] hover:text-[#3f3933]"
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
