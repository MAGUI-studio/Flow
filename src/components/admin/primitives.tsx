import { Children, type ReactNode } from "react";
import {
  PageHeading,
  SectionCard,
  EmptyState,
} from "@/components/internal/primitives";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/statusBadge";
export { AdminPagination } from "./pagination";

export function AdminHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <PageHeading
      eyebrow="Administração Flow"
      title={title}
      description={description}
    />
  );
}
export function AdminCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <SectionCard
      title={title}
      className="min-w-0 [&_.internal-card-heading_h2]:m-0!"
    >
      <div className="p-5 sm:p-6">{children}</div>
    </SectionCard>
  );
}
export function AdminFields({ fields }: { fields: [string, ReactNode][] }) {
  return (
    <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
      {fields.map(([label, value]) => (
        <div key={label} className="min-w-0 border-b border-zinc-100 pb-4">
          <dt className="text-[11px] text-zinc-400">{label}</dt>
          <dd className="mt-2 break-words text-xs leading-6 text-zinc-700">
            {value ?? "—"}
          </dd>
        </div>
      ))}
    </dl>
  );
}
export function AdminTable({
  headers,
  children,
  title = "Registros",
  count,
  description,
}: {
  headers: string[];
  children: ReactNode;
  title?: string;
  count?: number;
  description?: string;
}) {
  const shown = count ?? Children.count(children);
  return (
    <DataTable
      title={title}
      count={shown}
      label={title}
      description={description}
      columns={headers.map((label) => (
        <th key={label} scope="col">
          {label}
        </th>
      ))}
      footer={`${shown} ${shown === 1 ? "registro exibido" : "registros exibidos"}`}
      className="[&_tbody>tr>td]:align-top [&_tbody>tr>td]:text-xs [&_tbody>tr>td]:leading-6 [&_tbody>tr>td]:text-zinc-500 [&_a]:text-[#635BFF] [&_a:hover]:underline"
    >
      {children}
    </DataTable>
  );
}
export function AdminEmpty({ children }: { children: ReactNode }) {
  return (
    <EmptyState
      title="Nenhum registro encontrado"
      description={
        typeof children === "string"
          ? children
          : "Não há informações para exibir nesta página."
      }
    />
  );
}
const statuses: Record<string, { status: string; label: string }> = {
  active: { status: "active", label: "Ativa" },
  trialing: { status: "active", label: "Em teste" },
  past_due: { status: "pending", label: "Pagamento em atraso" },
  unpaid: { status: "declined", label: "Não paga" },
  incomplete: { status: "pending", label: "Pagamento pendente" },
  incomplete_expired: { status: "expired", label: "Pagamento expirado" },
  canceled: { status: "canceled", label: "Cancelada" },
  paused: { status: "inactive", label: "Pausada" },
};
export function AdminSubscriptionStatus({ status }: { status: string }) {
  const variant = statuses[status] ?? {
    status: "inactive",
    label: "Situação não informada",
  };
  return <StatusBadge {...variant} />;
}
