"use client";
import { notify, useToastError } from "@/components/ui/flow-toaster";
import { formValidation } from "@/lib/form-validation";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Star, Check } from "lucide-react";
import { reviewSchema } from "@/lib/review-rules";
import { RatingStars } from "@/components/ui/rating-stars";
import type { z } from "zod";
function StarInput({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: number | undefined;
  onChange: (value: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <fieldset className="min-w-0">
      <legend className="mb-3 text-xs font-medium text-zinc-700">
        {label}
      </legend>
      <div
        className="flex items-center gap-3"
        onMouseLeave={() => setHover(null)}
      >
        <label
          className={`grid size-8 cursor-pointer place-items-center rounded-lg border text-xs has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#635BFF] ${value === 0 ? "border-[#635BFF] bg-[#F5F4FF] text-[#635BFF]" : "border-zinc-200 text-zinc-400"}`}
        >
          <input
            className="sr-only"
            type="radio"
            name={name}
            checked={value === 0}
            onChange={() => onChange(0)}
            aria-label="0 estrelas"
          />
          0
        </label>
        <div className="relative flex" onMouseLeave={() => setHover(null)}>
          <RatingStars value={hover ?? value ?? 0} size={28} />
          <div className="absolute inset-0 flex">
            {Array.from({ length: 10 }, (_, i) => (i + 1) / 2).map((score) => (
              <label
                key={score}
                title={`${score.toLocaleString("pt-BR")} de 5`}
                className="h-full flex-1 cursor-pointer rounded-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[#635BFF]"
                onMouseEnter={() => setHover(score)}
              >
                <input
                  type="radio"
                  className="sr-only"
                  name={name}
                  checked={value === score}
                  onChange={() => onChange(score)}
                  aria-label={`${score.toLocaleString("pt-BR")} ${score === 1 ? "estrela" : "estrelas"}`}
                />
              </label>
            ))}
          </div>
        </div>
        <span className="min-w-7 text-xs font-medium text-[#635BFF]">
          {value === undefined ? "—" : value.toLocaleString("pt-BR")}
        </span>
      </div>
    </fieldset>
  );
}
export function BookingReview({
  bookingId,
  establishment,
  professional,
  saved,
}: {
  bookingId: string;
  establishment: string;
  professional: string;
  saved?: { establishmentScore: number; professionalScore: number } | null;
}) {
  const setError = useToastError();
  const router = useRouter();
  const [submitted, setSubmitted] = useState(saved ?? null);
  const form = useForm<z.infer<typeof reviewSchema>>({
    ...formValidation,
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      bookingId,
    },
  });
  if (submitted)
    return (
      <div className="border-t border-zinc-100 px-6 py-5">
        <span className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-zinc-600">
          <Check size={14} className="text-[#635BFF]" />
          Sua avaliação
        </span>
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          {[
            { label: establishment, score: submitted.establishmentScore },
            { label: professional, score: submitted.professionalScore },
          ].map((item, index) => (
            <div key={index}>
              <span className="mb-2 block text-[10px] text-zinc-500">
                {item.label}
              </span>
              <RatingStars value={item.score / 2} />
            </div>
          ))}
        </div>
      </div>
    );
  return (
    <form
      noValidate
      className="border-t border-zinc-100 bg-zinc-50/50 px-6 py-5"
      onSubmit={form.handleSubmit(async (input) => {
        setError("");
        try {
          const response = await fetch("/api/reviews", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error);
          notify.success(
            "Avaliação enviada",
            "Obrigado por compartilhar sua experiência.",
          );
          setSubmitted({
            establishmentScore: input.establishmentScore * 2,
            professionalScore: input.professionalScore * 2,
          });
          router.refresh();
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "Não foi possível enviar sua avaliação.",
          );
        }
      })}
    >
      <span className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-zinc-800">
        <Star size={16} className="text-[#635BFF]" />
        Como foi seu atendimento?
      </span>
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <Controller
            control={form.control}
            name="establishmentScore"
            render={({ field }) => (
              <StarInput
                label={establishment}
                name={field.name}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {form.formState.errors.establishmentScore && (
            <p role="alert" className="mt-2 text-xs text-rose-600">
              {form.formState.errors.establishmentScore.message}
            </p>
          )}
        </div>
        <div>
          <Controller
            control={form.control}
            name="professionalScore"
            render={({ field }) => (
              <StarInput
                label={professional}
                name={field.name}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {form.formState.errors.professionalScore && (
            <p role="alert" className="mt-2 text-xs text-rose-600">
              {form.formState.errors.professionalScore.message}
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="button small mt-5"
      >
        {form.formState.isSubmitting ? "Enviando…" : "Enviar avaliação"}
      </button>
    </form>
  );
}
