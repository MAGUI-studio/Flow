import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
export function DataTable({
  title,
  description,
  count,
  label,
  columns,
  children,
  footer,
  pending = false,
  className,
}: {
  title: string;
  description?: string;
  count: number;
  label: string;
  columns: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  pending?: boolean;
  className?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <h2 className="m-0 text-sm font-semibold text-zinc-800">{title}</h2>
          <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-zinc-600">
            {count}
          </span>
          {pending && (
            <LoaderCircle
              size={14}
              className="animate-spin text-zinc-600"
              aria-label="Atualizando tabela"
            />
          )}
        </div>
        {description && (
          <p className="m-0 text-xs text-zinc-400">{description}</p>
        )}
      </div>
      <div className="overflow-x-auto">
        <table
          aria-label={label}
          aria-busy={pending}
          className={cn(
            "w-full table-auto border-collapse text-left text-sm [&_thead_th]:w-px [&_thead_th]:whitespace-nowrap [&_thead_th:first-child]:w-auto [&_thead_th]:px-5 [&_thead_th]:py-3.5 [&_tbody>tr>td]:px-5 [&_tbody>tr>td]:py-4 [&_tbody>tr>th]:px-5 [&_tbody>tr>th]:py-4 [&_tbody>tr]:transition-colors [&_tbody>tr]:hover:bg-zinc-50",
            className,
          )}
        >
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
              {columns}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">{children}</tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50 px-5 py-3 text-[11px] text-zinc-400">
        <span>{footer}</span>
        <span className="sm:hidden">Deslize para ver todas as colunas</span>
      </div>
    </div>
  );
}
