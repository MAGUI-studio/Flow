"use client";
import { useQueryStates, parseAsInteger, parseAsString } from "nuqs";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useTransition } from "react";
import { Search, X, LoaderCircle, SlidersHorizontal } from "lucide-react";
import { FlowSelect } from "@/components/ui/flow-select";
import { FlowDate } from "@/components/ui/flow-date";
import {
  adminFilterSchema,
  adminFilterDefaults,
  adminFilterOptions,
  adminFilterParsers,
  readAdminFilters,
  type AdminFilters,
  type AdminFilterKey,
} from "@/lib/admin-filters";

export function AdminSearch({
  placeholder = "Buscar nome, e-mail ou ID",
  filters = [],
  options = {},
}: {
  placeholder?: string;
  filters?: AdminFilterKey[];
  options?: Partial<Record<AdminFilterKey, [string, string][]>>;
}) {
  const [query, setQuery] = useQueryStates(
    {
      ...adminFilterParsers,
      pagina: parseAsInteger.withDefault(1),
      registro: parseAsString,
    },
    { shallow: false, history: "push" },
  );
  const [pending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdminFilters>({
    resolver: zodResolver(adminFilterSchema),
    defaultValues: readAdminFilters(query as unknown as Record<string, string>),
  });
  const signature = JSON.stringify(query);
  useEffect(() => {
    reset(readAdminFilters(JSON.parse(signature)));
  }, [signature, reset]);
  const active = Object.entries(adminFilterDefaults).filter(
    ([key, value]) => query[key as keyof AdminFilters] !== value,
  ).length;
  const clear = () => {
    reset(adminFilterDefaults);
    startTransition(async () => {
      await setQuery({ ...adminFilterDefaults, pagina: 1, registro: null });
    });
  };
  return (
    <form
      onSubmit={handleSubmit((values) =>
        startTransition(async () => {
          await setQuery({ ...values, pagina: 1, registro: null });
        }),
      )}
      className="mb-5 w-full min-w-0 space-y-3"
    >
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <label htmlFor="admin-search" className="sr-only">
            Buscar na lista
          </label>
          <div className="internal-search min-h-11 min-w-0! rounded-xl border border-zinc-200 bg-white px-3! focus-within:border-[#635BFF]/40 focus-within:ring-2 focus-within:ring-[#635BFF]/10 [&>svg]:shrink-0">
            <Search size={17} aria-hidden="true" />
            <input
              id="admin-search"
              {...register("busca")}
              placeholder={placeholder}
              className="w-full min-w-0 focus-visible:outline-none"
            />
          </div>
          {errors.busca && (
            <p role="alert" className="mt-2 text-xs text-red-700">
              {errors.busca.message}
            </p>
          )}
        </div>
        <button
          disabled={pending}
          className="button min-h-11! disabled:opacity-50"
        >
          {pending ? (
            <LoaderCircle
              size={15}
              className="animate-spin"
              aria-hidden="true"
            />
          ) : (
            <Search size={15} aria-hidden="true" />
          )}
          {pending ? "Buscando…" : "Aplicar filtros"}
        </button>
        {active > 0 && (
          <button
            type="button"
            disabled={pending}
            onClick={clear}
            className="button secondary min-h-11! text-xs!"
          >
            <X size={14} aria-hidden="true" />
            Limpar filtros
          </button>
        )}
      </div>
      {filters.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
            <SlidersHorizontal size={13} aria-hidden="true" />
            Refinar resultados
            {active > 0 && (
              <span className="rounded bg-[#F5F4FF] px-1.5 py-0.5 text-[#635BFF]">
                {active}
              </span>
            )}
          </div>
          <div className="flex w-full flex-wrap items-start gap-4">
            {filters.map((key) => (
              <div
                key={key}
                className="w-full min-w-0 flex-[1_1_100%] sm:flex-[1_1_calc(50%-0.5rem)] xl:flex-[1_1_calc(33.333333%-0.666667rem)]"
              >
                <span className="mb-2 block text-xs font-medium text-zinc-500">
                  {key === "de"
                    ? "De"
                    : key === "ate"
                      ? "Até"
                      : adminFilterOptions[key]?.label}
                </span>
                <Controller
                  name={key}
                  control={control}
                  render={({ field }) =>
                    key === "de" || key === "ate" ? (
                      <FlowDate
                        name={key}
                        value={field.value}
                        onValueChange={field.onChange}
                        inputRef={field.ref}
                        aria-label={
                          key === "de" ? "Data inicial" : "Data final"
                        }
                        className="mt-0! w-full min-w-0 [&>.field-icon-button]:top-1! [&>.field-icon-button]:right-1! [&>.field-icon-button]:size-9!"
                        inputClassName="m-0! h-11! w-full! min-w-0! rounded-lg! border! border-[#e4e1ed]! bg-white! py-2! pr-12! pl-3! text-xs! text-zinc-800! shadow-xs outline-none placeholder:text-zinc-400 focus:border-[#635BFF]! focus:ring-2 focus:ring-[#635BFF]/10"
                      />
                    ) : (
                      <FlowSelect
                        name={field.name}
                        value={field.value}
                        onValueChange={field.onChange}
                        onBlur={field.onBlur}
                        inputRef={field.ref}
                        aria-label={adminFilterOptions[key]?.label}
                        className="m-0! h-11! min-h-11! w-full! min-w-0! rounded-lg! px-3! py-2! text-xs!"
                      >
                        {(
                          options[key] ??
                          adminFilterOptions[key]?.options ??
                          []
                        ).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </FlowSelect>
                    )
                  }
                />
                {errors[key] && (
                  <p role="alert" className="mt-1.5 text-xs text-red-700">
                    {errors[key]?.message}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
