import { requireAdminPage } from "@/lib/admin";
import { AdminShell } from "@/components/admin/shell";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Administração | Flow",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};
export default async function Layout({ children }: { children: ReactNode }) {
  await requireAdminPage();
  return <AdminShell>{children}</AdminShell>;
}
