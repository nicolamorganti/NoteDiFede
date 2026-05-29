import Link from "next/link";
import type { ReactNode } from "react";

const navigation = [
  { href: "/canti", label: "Catalogo Canti", badge: "Attivo" },
  { href: "/messe", label: "Messe & Liturgia", badge: "Attivo" },
];

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#f6f1ea] text-[#3e3933]">
      <div className="mx-auto flex min-h-screen w-full max-w-screen-2xl flex-col lg:flex-row">
        <aside className="border-b border-[#ddd2c2] bg-[#ede4d8] px-5 py-5 text-[#3f3933] lg:min-h-screen lg:w-80 lg:border-b-0 lg:border-r lg:px-6 lg:py-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <Link href="/" className="inline-flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#6e5a45] font-semibold text-[#fbf7f2]">
                  NF
                </span>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#887865]">
                    Note di Fede
                  </p>
                  <p className="text-lg font-semibold">Workspace</p>
                </div>
              </Link>

              <p className="max-w-xs text-sm leading-6 text-[#685d53]">
                Dashboard amministrativa mobile-first per canti, messe, file e
                momenti liturgici.
              </p>
            </div>

            <nav className="grid gap-2">
              {navigation.map((item) => {
                const isDisabled = item.href === "#";

                if (isDisabled) {
                  return (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-2xl border border-[#d6cabc] bg-[#f7f2ea] px-4 py-3 text-sm text-[#7d7164]"
                    >
                      <span>{item.label}</span>
                      <span className="rounded-full bg-[#ede4d8] px-2 py-1 text-[11px] uppercase tracking-[0.18em]">
                        {item.badge}
                      </span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between rounded-2xl border border-[#d7c7b5] bg-[#f7f0e6] px-4 py-3 text-sm font-medium text-[#453e37] transition hover:bg-[#f2e8da]"
                  >
                    <span>{item.label}</span>
                    <span className="rounded-full bg-[#d9cab6] px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-[#4e443a]">
                      {item.badge}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="border-b border-[#ddd2c2] bg-[#f6f1ea]/90 px-5 py-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#857866]">
                  Area Riservata
                </p>
                <h1 className="text-xl font-serif font-normal text-[#3f3933]">
                  Coro Liturgico
                </h1>
              </div>
            </div>
          </header>

          <main className="flex-1 px-5 py-6 sm:px-6 lg:px-8 xl:px-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
