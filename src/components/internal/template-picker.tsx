"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Check, Lock, ArrowUpRight } from "lucide-react";
import { templates, effectiveTemplate } from "@/lib/plan-features";
import { templateSchema } from "@/lib/template-schema";
export function TemplatePicker({
  business,
  plan,
}: {
  business: { id: string; slug: string; name: string; templateId: string };
  plan: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const form = useForm({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      establishmentId: business.id,
      templateId: effectiveTemplate(business.templateId, plan),
    },
  });
  const selected = form.watch("templateId");
  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(async (input) => {
        setMessage("");
        try {
          const response = await fetch("/api/templates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error);
          setMessage(
            "Template atualizado. Sua página já está com o novo visual.",
          );
          router.refresh();
        } catch (error) {
          setMessage(
            error instanceof Error ? error.message : "Não foi possível salvar.",
          );
        }
      })}
    >
      <fieldset>
        <legend className="mb-6 text-sm text-zinc-500">
          Escolha a apresentação de {business.name}. Seus serviços e
          agendamentos são preservados.
        </legend>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {templates.map((template) => {
            const locked = template.pro && plan !== "multi";
            return (
              <label
                key={template.id}
                className={`relative cursor-pointer overflow-hidden rounded-2xl border bg-white transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#635BFF] ${selected === template.id ? "border-[#635BFF] ring-1 ring-[#635BFF]" : "border-zinc-200"} ${locked ? "cursor-not-allowed" : "hover:border-[#635BFF]"}`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  {...form.register("templateId")}
                  value={template.id}
                  disabled={locked}
                />
                <div
                  aria-hidden="true"
                  className="p-4"
                  style={{ background: template.color }}
                >
                  <div className="rounded-lg bg-white p-3 shadow-sm">
                    <div
                      className={`mb-3 rounded-md ${template.id === "minimal" ? "h-4 w-8 bg-zinc-200" : template.id === "night" ? "h-12 bg-zinc-900" : "h-12 bg-[#e5dff0]"}`}
                    />
                    <div
                      className={`text-xs font-semibold ${template.id === "editorial" ? "font-serif" : ""}`}
                    >
                      {business.name}
                    </div>
                    <div className="mt-2 h-1 w-3/4 rounded bg-zinc-100" />
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="h-8 rounded border border-[#e8e5f6] bg-[#F5F4FF]" />
                      <div className="h-8 rounded border border-zinc-100" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <strong className="text-sm">{template.name}</strong>
                    {locked ? (
                      <Lock size={14} className="text-zinc-400" />
                    ) : selected === template.id ? (
                      <Check size={16} className="text-[#635BFF]" />
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                    {template.description}
                  </p>
                  <span className="mt-4 inline-block rounded-full bg-[#F5F4FF] px-2 py-1 text-[10px] text-[#635BFF]">
                    {template.pro ? "Exclusivo Pro" : "Todos os planos"}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </fieldset>
      {form.formState.errors.templateId && (
        <p role="alert" className="mt-3 text-xs text-rose-600">
          {form.formState.errors.templateId.message}
        </p>
      )}
      {message && (
        <p role="status" className="mt-5 text-sm text-zinc-600">
          {message}
        </p>
      )}
      <div className="mt-7 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="button"
        >
          {form.formState.isSubmitting ? "Salvando…" : "Salvar aparência"}
        </button>
        <a
          href={`/${business.slug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-xs text-[#635BFF]"
        >
          Ver página <ArrowUpRight size={14} />
        </a>
      </div>
    </form>
  );
}
