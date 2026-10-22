"use client";
import { useQueryStates, parseAsInteger, parseAsString } from "nuqs";
import { Pagination } from "@/components/ui/pagination";

export function AdminPagination({
  page,
  total,
  search = "",
  size = 25,
}: {
  page: number;
  total: number;
  path: string;
  search?: string;
  size?: number;
}) {
  const [, setQuery] = useQueryStates(
    {
      pagina: parseAsInteger.withDefault(1),
      busca: parseAsString.withDefault(""),
    },
    { shallow: false, history: "push" },
  );
  const pages = Math.max(1, Math.ceil(total / size));
  return (
    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[11px] text-zinc-400">
        {total.toLocaleString("pt-BR")} registros · Página {page} de {pages}
      </p>
      <div className="[&_nav]:mt-0">
        <Pagination
          page={page}
          totalPages={pages}
          label="Paginação da administração"
          onPageChange={(value) => {
            void setQuery({ pagina: value, busca: search || null });
          }}
        />
      </div>
    </div>
  );
}
