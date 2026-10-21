"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { notify, useToastError } from "./ui/flow-toaster";
const schema = z.object({ id: z.string().uuid(), published: z.boolean() });
export function PublishBusiness({
  id,
  published,
  ready,
}: {
  id: string;
  published: boolean;
  ready: boolean;
}) {
  const router = useRouter();
  const error = useToastError();
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { id, published: !published },
  });
  return (
    <form
      onSubmit={form.handleSubmit(async () => {
        try {
          const r = await fetch("/api/establishments/publish", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, published: !published }),
          });
          const d = await r.json();
          if (!r.ok) throw Error(d.error);
          notify.success(
            published
              ? "Página retirada do ar"
              : "Seu estabelecimento está publicado",
          );
          router.refresh();
        } catch (e) {
          error(
            e instanceof Error
              ? e.message
              : "Não foi possível atualizar a publicação.",
          );
        }
      })}
    >
      <button
        type="submit"
        disabled={form.formState.isSubmitting || (!published && !ready)}
        className="button w-full justify-center sm:w-auto"
      >
        {form.formState.isSubmitting
          ? "Salvando…"
          : published
            ? "Retirar página do ar"
            : "Publicar estabelecimento"}
      </button>
      {!published && !ready && (
        <p className="mt-3 text-xs text-zinc-500">
          Conclua as etapas acima para publicar.
        </p>
      )}
    </form>
  );
}
