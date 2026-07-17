import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { verifyUserRole } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const { user, profile } = await verifyUserRole([]);
  
  return (
    <AppShell initialUser={user} initialRole={profile?.role} initialFullName={profile?.full_name}>
      {children}
    </AppShell>
  );
}
