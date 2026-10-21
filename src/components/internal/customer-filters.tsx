"use client";
import { useQueryStates, parseAsString, parseAsStringEnum } from "nuqs";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
const schema = z.object({
  busca: z.string(),
  filtro: z.enum(["all", "upcoming", "no_show", "canceled"]),
});
export function CustomerFilters() {
  const [query, setQuery] = useQueryStates(
    {
      busca: parseAsString.withDefault(""),
      filtro: parseAsStringEnum([
        "all",
        "upcoming",
        "no_show",
        "canceled",
      ]).withDefault("all"),
    },
    { shallow: false },
  );
  const form = useForm({
    resolver: zodResolver(schema),
    values: {
      busca: query.busca,
      filtro: query.filtro as z.infer<typeof schema>["filtro"],
    },
  });
  return (
    <form
      className="mb-6 flex flex-wrap gap-3"
      onSubmit={form.handleSubmit((v) => void setQuery(v))}
    >
      <input
        aria-label="Buscar cliente"
        className="min-h-11 min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-4 text-sm"
        placeholder="Buscar por nome ou e-mail"
        {...form.register("busca")}
      />
      <select
        aria-label="Filtrar clientes"
        className="min-h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm"
        {...form.register("filtro")}
      >
        <option value="all">Todos os clientes</option>
        <option value="upcoming">Com agendamentos futuros</option>
        <option value="no_show">Com faltas registradas</option>
        <option value="canceled">Com cancelamentos</option>
      </select>
      <button className="button secondary">Buscar</button>
    </form>
  );
}
