"use client";
import { notify, useToastError } from "@/components/ui/flow-toaster";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { LoaderCircle, Trash2, ShieldAlert } from "lucide-react";
type Props = { id: string; establishmentId: string; name: string };
async function send(
  id: string,
  establishmentId: string,
  method: string,
  values: object = {},
) {
  const result = await fetch(`/api/professionals/${id}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ establishmentId, ...values }),
  });
  const data = await result.json();
  if (!result.ok)
    throw new Error(data.error || "Não foi possível salvar. Tente novamente.");
}
export function ProfessionalDelete({
  id,
  establishmentId,
  name,
  redirectTo,
}: Props & { redirectTo?: string }) {
  const setError = useToastError();
  const router = useRouter();
  const [target, setTarget] = useQueryState(
    "excluir-profissional",
    parseAsString.withOptions({ shallow: true, scroll: false }),
  );
  const open = target === id;
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label={`Excluir ${name}`}
        onClick={() => {
          setError("");
          void setTarget(id);
        }}
        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#eadde2] bg-[#faf5f7] px-5 py-3 text-sm font-semibold text-[#a45e75] transition-colors hover:border-[#a45e75] hover:bg-[#a45e75] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a45e75]"
      >
        <Trash2 size={14} />
        Excluir profissional
      </button>
      <AlertDialog.Root
        open={open}
        onOpenChange={(value) => {
          if (!value && !busy) void setTarget(null);
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-sm" />
          <AlertDialog.Content
            onEscapeKeyDown={(event) => {
              if (busy) event.preventDefault();
            }}
            className="fixed left-1/2 top-1/2 z-[1001] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-[#e8e5f0] bg-white shadow-2xl"
          >
            <div className="relative isolate overflow-hidden border-b border-[#efedf5] px-6 py-6 sm:px-8 sm:py-7">
              <ShieldAlert
                aria-hidden="true"
                className="pointer-events-none absolute -right-5 -bottom-8 -z-10 size-40 -rotate-12 text-[#a45e75] opacity-[0.06]"
              />
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a45e75]">
                Zona de perigo
              </p>
              <AlertDialog.Title className="m-0 break-words text-2xl font-bold tracking-tight text-zinc-900">
                Excluir profissional?
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-2 text-sm leading-relaxed text-zinc-500">
                Ao excluir{" "}
                <strong className="break-words font-semibold text-zinc-800">
                  {name}
                </strong>
                , o profissional sai da equipe e deixa de receber novas
                reservas.
              </AlertDialog.Description>
            </div>
            <div className="space-y-3 px-6 py-5 sm:px-8">
              <p className="m-0 text-sm leading-relaxed text-zinc-500">
                O histórico de atendimentos e avaliações será preservado.
              </p>
              <p className="m-0 flex items-center gap-2 text-xs font-medium text-[#a45e75]">
                <ShieldAlert
                  size={15}
                  aria-hidden="true"
                  className="shrink-0"
                />
                Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 border-t border-[#efedf5] bg-[#faf9fd] px-6 py-5 sm:grid-cols-2 sm:px-8 sm:py-6">
              <AlertDialog.Cancel
                disabled={busy}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#e3dfed] bg-white px-4 py-3 text-sm font-semibold text-zinc-600 transition-colors hover:border-[#635BFF]/30 hover:bg-[#F5F4FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#635BFF] disabled:opacity-50"
              >
                Manter profissional
              </AlertDialog.Cancel>
              <AlertDialog.Action
                disabled={busy}
                onClick={async (event) => {
                  event.preventDefault();
                  setBusy(true);
                  setError("");
                  try {
                    await send(id, establishmentId, "DELETE");
                    notify.success(
                      "Profissional excluído",
                      "O histórico dos atendimentos foi preservado.",
                    );
                    if (redirectTo) {
                      router.replace(redirectTo);
                    } else {
                      await setTarget(null);
                      router.refresh();
                    }
                  } catch (e) {
                    setError(
                      e instanceof Error
                        ? e.message
                        : "Não foi possível excluir.",
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#a45e75] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#8e4e63] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a45e75] disabled:cursor-wait disabled:opacity-50"
              >
                {busy ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} aria-hidden="true" />
                )}
                {busy ? "Excluindo…" : "Excluir profissional"}
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
