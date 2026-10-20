"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { debounce, useQueryStates } from "nuqs";
import * as Popover from "@radix-ui/react-popover";
import {
  ChevronDown,
  LoaderCircle,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { FlowSelect } from "@/components/ui/flow-select";
import { ScrollArea } from "@/components/ui/scrollArea";
import { panelSearch } from "@/lib/url-state";
import { matchesListSearch } from "@/lib/list-filters";

const schema = z.object({
  busca: z.string(),
  servicos: z.array(z.string().uuid()),
  profissionais: z.array(z.string().uuid()),
  combinarServicos: z.enum(["all", "any"]),
  combinarProfissionais: z.enum(["all", "any"]),
  ordem: z.enum(["name_asc", "name_desc", "services_desc", "services_asc"]),
  ordemServico: z.enum([
    "name_asc",
    "name_desc",
    "duration_asc",
    "duration_desc",
    "price_asc",
    "price_desc",
  ]),
  vinculos: z.enum(["all", "linked", "unlinked"]),
  modalidade: z.enum(["all", "online", "in_person"]),
  tipo: z.enum(["all", "individual", "collective"]),
  preco: z.enum(["all", "free", "paid"]),
});
type Values = z.infer<typeof schema>;
type Option = { id: string; name: string };
const optionSearchSchema = z.object({ search: z.string() });

function LinkSelector({
  options,
  selected,
  onChange,
  label,
}: {
  options: Option[];
  selected: string[];
  onChange: (ids: string[]) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const search = useForm({
    resolver: zodResolver(optionSearchSchema),
    defaultValues: { search: "" },
  });
  const term = search.watch("search");
  const visible = options.filter((option) =>
    matchesListSearch(option.name, term),
  );
  return (
    <Popover.Root
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) search.reset();
      }}
    >
      <Popover.Trigger asChild>
        <button
          type="button"
          className={`inline-flex min-h-11 w-full min-w-0 items-center justify-between gap-3 rounded-xl border bg-white px-3.5 text-left text-xs font-medium transition-colors ${selected.length ? "border-[#635BFF]/40 text-[#635BFF]" : "border-zinc-200 text-zinc-600 hover:border-zinc-300"}`}
        >
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal size={14} aria-hidden="true" />
            {label}
            {selected.length > 0 && (
              <span className="rounded-md bg-[#f0eeff] px-1.5 py-0.5 text-[10px] tabular-nums">
                {selected.length}
              </span>
            )}
          </span>
          <ChevronDown size={14} aria-hidden="true" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          collisionPadding={16}
          aria-label={`Selecionar ${label.toLowerCase()}`}
          className="z-50 w-[340px] max-w-[calc(100vw-32px)] rounded-2xl border border-[#e8e5f6] bg-white p-2 shadow-xl outline-none"
        >
          <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-3 text-zinc-400">
            <Search size={15} aria-hidden="true" />
            <input
              {...search.register("search")}
              aria-label={`Buscar ${label.toLowerCase()} nas opções`}
              placeholder={`Buscar ${label.toLowerCase()}…`}
              className="min-w-0 flex-1 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
            />
          </div>
          <p className="px-3 pt-3 pb-2 text-[11px] leading-5 text-zinc-400">
            Selecione um ou mais. A lista atualiza automaticamente.
          </p>
          <ScrollArea className="h-60" viewportClassName="overscroll-contain">
            <fieldset className="m-0 min-w-0 border-0 p-0">
              <legend className="sr-only">{label}</legend>
              {visible.map((option) => (
                <label
                  key={option.id}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm leading-5 text-zinc-600 hover:bg-[#f8f7ff] has-checked:bg-[#f5f4ff] has-checked:text-[#635BFF]"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(option.id)}
                    onChange={(event) =>
                      onChange(
                        event.target.checked
                          ? [...selected, option.id]
                          : selected.filter((id) => id !== option.id),
                      )
                    }
                    className="size-4 shrink-0 accent-[#635BFF]"
                  />
                  <span className="break-words">{option.name}</span>
                </label>
              ))}
              {!visible.length && (
                <p className="px-3 py-8 text-center text-xs leading-6 text-zinc-500">
                  {options.length
                    ? "Nenhuma opção encontrada. Experimente outro nome."
                    : "Nenhuma opção cadastrada neste estabelecimento."}
                </p>
              )}
            </fieldset>
          </ScrollArea>
          <div className="mt-2 flex items-center justify-between border-t border-zinc-100 px-3 pt-3 pb-1 text-xs">
            <button
              type="button"
              disabled={!selected.length}
              onClick={() => onChange([])}
              className="min-h-9 text-zinc-500 hover:text-[#635BFF] disabled:opacity-40"
            >
              Limpar seleção
            </button>
            <Popover.Close asChild>
              <button
                type="button"
                className="min-h-9 rounded-lg bg-[#635BFF] px-4 font-medium text-white hover:bg-[#5046E5]"
              >
                Concluir
              </button>
            </Popover.Close>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function EntityListFilters({
  kind,
  options,
  count,
  total,
}: {
  kind: "professionals" | "services";
  options: Option[];
  count: number;
  total: number;
}) {
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useQueryStates(panelSearch, {
    shallow: false,
    scroll: false,
    history: "replace",
    startTransition,
  });
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    values: query,
  });
  const isTeam = kind === "professionals";
  const idsKey = isTeam ? "servicos" : "profissionais";
  const modeKey = isTeam ? "combinarServicos" : "combinarProfissionais";
  const selected = query[idsKey];
  const noun = isTeam ? "profissionais" : "serviços";
  function setFilter(patch: Partial<Values>) {
    const parsed = schema.partial().safeParse(patch);
    if (parsed.success) void setQuery(parsed.data);
  }
  const active = Boolean(
    query.busca ||
    selected.length ||
    (isTeam
      ? query.vinculos !== "all" || query.ordem !== "name_asc"
      : query.modalidade !== "all" ||
        query.tipo !== "all" ||
        query.preco !== "all" ||
        query.ordemServico !== "name_asc"),
  );
  const selectClass =
    "min-h-11! w-full! min-w-0! max-w-none! rounded-xl! border-zinc-200! bg-white! text-xs!";
  function selectField(
    name:
      "ordem" | "ordemServico" | "vinculos" | "modalidade" | "tipo" | "preco",
    label: string,
    choices: [string, string][],
  ) {
    return (
      <Controller
        name={name}
        control={form.control}
        render={({ field }) => (
          <FlowSelect
            aria-label={label}
            value={field.value}
            onBlur={field.onBlur}
            inputRef={field.ref}
            onValueChange={(value) => {
              field.onChange(value);
              setFilter({
                [name]: value,
                ...(name === "vinculos" && value === "unlinked"
                  ? { servicos: [] }
                  : {}),
              });
            }}
            className={selectClass}
          >
            {choices.map(([value, title]) => (
              <option key={value} value={value}>
                {title}
              </option>
            ))}
          </FlowSelect>
        )}
      />
    );
  }
  return (
    <form
      onSubmit={form.handleSubmit(() => {})}
      className="mb-5 min-w-0 rounded-2xl border border-[#e8e5f6] bg-white p-4 sm:p-5"
      aria-label={`Pesquisar e filtrar ${noun}`}
    >
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 sm:items-center">
        <div className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-zinc-200 px-3.5 text-zinc-400 focus-within:border-[#635BFF]/40 focus-within:ring-2 focus-within:ring-[#635BFF]/10">
          <Search size={17} aria-hidden="true" />
          <Controller
            name="busca"
            control={form.control}
            render={({ field }) => (
              <input
                {...field}
                aria-label={`Buscar ${noun} pelo nome`}
                placeholder={
                  isTeam
                    ? "Buscar profissional pelo nome…"
                    : "Buscar serviço pelo nome…"
                }
                onChange={(event) => {
                  field.onChange(event);
                  void setQuery(
                    { busca: event.target.value },
                    { limitUrlUpdates: debounce(300) },
                  );
                }}
                className="min-w-0 flex-1 bg-transparent py-3 text-sm text-zinc-700 outline-none placeholder:text-zinc-400 focus-visible:outline-none"
              />
            )}
          />
          {query.busca && (
            <button
              type="button"
              aria-label="Limpar busca"
              onClick={() => setFilter({ busca: "" })}
              className="inline-flex size-7 items-center justify-center rounded-md hover:bg-zinc-100"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {selectField(
          isTeam ? "ordem" : "ordemServico",
          `Ordenar ${noun}`,
          isTeam
            ? [
                ["name_asc", "Nome: A–Z"],
                ["name_desc", "Nome: Z–A"],
                ["services_desc", "Mais serviços vinculados"],
                ["services_asc", "Menos serviços vinculados"],
              ]
            : [
                ["name_asc", "Nome: A–Z"],
                ["name_desc", "Nome: Z–A"],
                ["duration_asc", "Menor duração"],
                ["duration_desc", "Maior duração"],
                ["price_asc", "Menor valor"],
                ["price_desc", "Maior valor"],
              ],
        )}
      </div>
      <div
        className={`mt-3 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 ${isTeam ? "" : "xl:grid-cols-4"}`}
      >
        <Controller
          name={idsKey}
          control={form.control}
          render={({ field }) => (
            <LinkSelector
              options={options}
              selected={field.value}
              onChange={(ids) => {
                field.onChange(ids);
                setFilter({
                  [idsKey]: ids,
                  ...(isTeam && ids.length ? { vinculos: "all" } : {}),
                });
              }}
              label={
                isTeam ? "Serviços vinculados" : "Profissionais vinculados"
              }
            />
          )}
        />
        {isTeam ? (
          selectField("vinculos", "Vínculos de serviços", [
            ["all", "Todos os profissionais"],
            ["linked", "Com serviços vinculados"],
            ["unlinked", "Sem serviços vinculados"],
          ])
        ) : (
          <>
            {selectField("modalidade", "Modalidade do serviço", [
              ["all", "Todas as modalidades"],
              ["in_person", "Presencial"],
              ["online", "Online"],
            ])}
            {selectField("tipo", "Tipo de atendimento", [
              ["all", "Todos os tipos"],
              ["individual", "Individual"],
              ["collective", "Em grupo"],
            ])}
            {selectField("preco", "Valor do serviço", [
              ["all", "Todos os valores"],
              ["free", "Gratuitos"],
              ["paid", "Pagos"],
            ])}
          </>
        )}
        {active && (
          <button
            type="button"
            onClick={() =>
              void setQuery(
                isTeam
                  ? {
                      busca: null,
                      servicos: null,
                      combinarServicos: null,
                      vinculos: null,
                      ordem: null,
                    }
                  : {
                      busca: null,
                      profissionais: null,
                      combinarProfissionais: null,
                      modalidade: null,
                      tipo: null,
                      preco: null,
                      ordemServico: null,
                    },
              )
            }
            className="col-span-full inline-flex min-h-10 items-center justify-center justify-self-end gap-1.5 px-2 text-xs text-zinc-500 hover:text-[#635BFF]"
          >
            <X size={13} aria-hidden="true" />
            Limpar filtros
          </button>
        )}
      </div>
      {selected.length > 0 && (
        <div className="mt-4 border-t border-zinc-100 pt-4">
          <div className="flex flex-wrap gap-2">
            {selected.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() =>
                  setFilter({
                    [idsKey]: selected.filter((value) => value !== id),
                  })
                }
                aria-label={`Remover filtro: ${options.find((option) => option.id === id)?.name ?? "opção indisponível"}`}
                className="inline-flex min-h-8 max-w-full items-center gap-2 rounded-lg border border-[#e8e5f6] bg-[#f5f4ff] px-2.5 py-1 text-left text-xs text-[#635BFF] hover:border-[#635BFF]/40"
              >
                <span className="truncate">
                  {options.find((option) => option.id === id)?.name ??
                    "Opção indisponível"}
                </span>
                <X size={12} className="shrink-0" aria-hidden="true" />
              </button>
            ))}
          </div>
          {selected.length > 1 && (
            <Controller
              name={modeKey}
              control={form.control}
              render={({ field }) => (
                <fieldset className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
                  <legend className="sr-only">
                    Como combinar os vínculos selecionados
                  </legend>
                  <span className="mr-1 text-[11px] text-zinc-500">
                    Combinar seleção:
                  </span>
                  {(
                    [
                      ["all", "Todos os selecionados"],
                      ["any", "Qualquer um deles"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={field.value === value}
                      onClick={() => {
                        field.onChange(value);
                        setFilter({ [modeKey]: value });
                      }}
                      className={`min-h-8 rounded-lg border px-2.5 text-[11px] transition-colors ${field.value === value ? "border-[#635BFF]/30 bg-[#f5f4ff] font-medium text-[#635BFF]" : "border-zinc-200 text-zinc-500 hover:border-zinc-300"}`}
                    >
                      {label}
                    </button>
                  ))}
                </fieldset>
              )}
            />
          )}
          <p className="mt-2 text-[11px] leading-5 text-zinc-400">
            {isTeam
              ? "Mostrando profissionais com"
              : "Mostrando serviços vinculados a"}{" "}
            {query[modeKey] === "all"
              ? "todos os itens selecionados."
              : "pelo menos um dos itens selecionados."}
          </p>
        </div>
      )}
      <div
        role="status"
        aria-live="polite"
        className="mt-4 flex items-center gap-2 text-xs text-zinc-500"
      >
        {pending && (
          <LoaderCircle
            size={13}
            aria-hidden="true"
            className="text-[#635BFF] motion-safe:animate-spin"
          />
        )}
        {pending ? "Atualizando resultados…" : `${count} de ${total} ${noun}`}
      </div>
    </form>
  );
}
