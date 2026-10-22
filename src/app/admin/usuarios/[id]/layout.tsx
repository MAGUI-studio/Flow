import Link from "next/link";
import type { ReactNode } from "react";
import {
  adminUser,
  adminName,
  adminEmail,
  requireAdminPage,
} from "@/lib/admin";
import { AdminHeading } from "@/components/admin/primitives";
import { AdminUserNavigation } from "@/components/admin/user-navigation";
import { adminRecordSections } from "@/lib/admin-records";
import { ArrowLeft } from "lucide-react";

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const user = await adminUser(id);
  const base = `/admin/usuarios/${id}`;
  return (
    <>
      <Link
        prefetch={false}
        href="/admin/usuarios"
        className="internal-back mb-5! inline-flex items-center gap-2"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Todos os usuários
      </Link>
      <AdminHeading
        title={user ? adminName(user) : "Conta sem identidade Clerk"}
        description={user ? adminEmail(user) : id}
      />
      <AdminUserNavigation
        items={[
          { href: base, label: "Perfil e acesso" },
          { href: `${base}/acessos`, label: "Sessões de acesso" },
          ...Object.entries(adminRecordSections).map(([key, value]) => ({
            href: `${base}/${key}`,
            label: value.title,
          })),
        ]}
      />
      {children}
    </>
  );
}
