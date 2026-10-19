"use client";
import { useToastError } from "@/components/ui/flow-toaster";
import { formValidation } from "@/lib/form-validation";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Cropper, { type Area } from "react-easy-crop";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Camera,
  LoaderCircle,
  X,
  Upload,
  Crop,
  ZoomOut,
  ZoomIn,
  Check,
  Move,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { parseAsString, useQueryState } from "nuqs";
const cropSchema = z.object({ zoom: z.number().min(1).max(3) });
type Props = {
  name: string;
  establishmentId: string;
  professionalId?: string;
  initialUrl?: string;
  onChange?: (id: string) => void;
  onFileChange?: (file: File) => void;
  onBusyChange?: (busy: boolean) => void;
};
export function ProfessionalPhoto({
  name,
  establishmentId,
  professionalId,
  initialUrl,
  onChange,
  onFileChange,
  onBusyChange,
}: Props) {
  const setError = useToastError();
  const router = useRouter();
  const [photoTarget, setPhotoTarget] = useQueryState(
    "foto",
    parseAsString.withOptions({
      shallow: true,
      scroll: false,
      history: "push",
    }),
  );
  const target = professionalId ?? "novo";
  const open = photoTarget === target;
  function close() {
    if (isSubmitting) return;
    void setPhotoTarget(null, { history: "replace" });
    setSource(undefined);
    setError("");
  }
  const picker = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [localPreview, setLocalPreview] = useState<string>();
  const [source, setSource] = useState<string>();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [pixels, setPixels] = useState<Area>();
  const {
    watch,
    reset,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    ...formValidation,
    resolver: zodResolver(cropSchema),
    defaultValues: { zoom: 1 },
  });
  const zoom = watch("zoom");
  useEffect(
    () => () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    },
    [localPreview],
  );
  useEffect(
    () => () => {
      if (source) URL.revokeObjectURL(source);
    },
    [source],
  );
  useEffect(() => {
    onBusyChange?.(open && !!source);
  }, [source, open, onBusyChange]);
  async function save() {
    if (!source || !pixels) return;
    setError("");
    try {
      const image = new Image();
      image.src = source;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 640;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Não foi possível recortar a foto.");
      context.drawImage(
        image,
        pixels.x,
        pixels.y,
        pixels.width,
        pixels.height,
        0,
        0,
        640,
        640,
      );
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) =>
            b
              ? resolve(b)
              : reject(new Error("Não foi possível recortar a foto.")),
          "image/webp",
          0.85,
        ),
      );
      if (blob.size > 1024 * 1024)
        throw new Error("A foto recortada deve ter até 1 MB.");
      const croppedFile = new File([blob], "profissional.webp", {
        type: "image/webp",
      });
      if (onFileChange) {
        const preview = URL.createObjectURL(croppedFile);
        setLocalPreview(preview);
        setUrl(preview);
        onFileChange(croppedFile);
        setSource(undefined);
        void setPhotoTarget(null, { history: "replace" });
        return;
      }
      const form = new FormData();
      form.set("file", croppedFile);
      form.set("establishmentId", establishmentId);
      const response = await fetch("/api/professionals/photo", {
        method: "POST",
        body: form,
      });
      const photo = await response.json();
      if (!response.ok) throw new Error(photo.error);
      if (professionalId) {
        const result = await fetch(`/api/professionals/${professionalId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ establishmentId, photoId: photo.id }),
        });
        if (!result.ok) throw new Error((await result.json()).error);
      }
      setUrl(photo.url);
      onChange?.(photo.id);
      setSource(undefined);
      void setPhotoTarget(null, { history: "replace" });
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível enviar a foto.",
      );
    }
  }
  return (
    <>
      <div className="flex flex-col items-start gap-3">
        <button
          type="button"
          aria-label={
            url
              ? `Editar foto de ${name || "profissional"}`
              : "Adicionar foto do profissional"
          }
          onClick={() => {
            setError("");
            void setPhotoTarget(target);
          }}
          className="group relative grid size-40 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#e8e5f6] bg-[#F5F4FF] text-4xl font-semibold text-[#635BFF] transition-colors hover:border-[#635BFF]/40 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#635BFF] sm:size-48"
        >
          {url ? (
            <img src={url} alt={name} className="size-full object-cover" />
          ) : (
            <span>
              {name
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((n) => n[0])
                .join("") || <Camera size={32} strokeWidth={1.5} />}
            </span>
          )}
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <Camera size={26} strokeWidth={1.5} />
          </span>
        </button>
        <div>
          <p className="text-sm font-medium text-zinc-700">
            Foto do profissional
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
            PNG ou WEBP · Até 1 MB
          </p>
        </div>
      </div>
      <input
        ref={picker}
        type="file"
        accept="image/png,image/webp"
        className="hidden"
        aria-label="Selecionar foto do profissional"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          setError("");
          if (
            !["image/png", "image/webp"].includes(file.type) ||
            file.size > 1024 * 1024
          ) {
            setError("Escolha uma imagem PNG ou WEBP de até 1 MB.");
            return;
          }
          setCrop({ x: 0, y: 0 });
          setPixels(undefined);
          reset({ zoom: 1 });
          setSource(URL.createObjectURL(file));
        }}
      />

      <Dialog.Root
        open={open}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-sm" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-[1001] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-[#e8e5f6] bg-white shadow-2xl"
            onEscapeKeyDown={(e) => {
              if (isSubmitting) e.preventDefault();
            }}
            onPointerDownOutside={(e) => {
              if (isSubmitting) e.preventDefault();
            }}
          >
            <div className="relative overflow-hidden border-b border-[#efedf5] px-6 py-6 sm:px-8 sm:py-7">
              <Crop
                aria-hidden="true"
                className="pointer-events-none absolute -right-3 -bottom-5 size-32 rotate-[-12deg] text-[#635BFF] opacity-[0.06]"
              />
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#635BFF]">
                UM ROSTO PARA CADA ATENDIMENTO
              </p>
              <Dialog.Title className="pr-10 text-2xl font-bold tracking-tight text-[#18181B]">
                A foto do profissional.
              </Dialog.Title>
              <Dialog.Description className="mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
                Escolha uma foto e ajuste o enquadramento para seus clientes
                reconhecerem quem vai atender.
              </Dialog.Description>
              <Dialog.Close
                disabled={isSubmitting}
                aria-label="Fechar recorte"
                className="absolute right-5 top-5 grid size-10 place-items-center rounded-xl border border-[#e8e5f6] bg-white text-zinc-400 transition-colors hover:bg-[#F5F4FF] hover:text-[#635BFF] disabled:opacity-50"
              >
                <X size={18} />
              </Dialog.Close>
            </div>
            <form
              noValidate
              onSubmit={(event) => {
                event.stopPropagation();
                void handleSubmit(save)(event);
              }}
            >
              <div className="px-6 pt-6 sm:px-8">
                <div className="relative h-64 overflow-hidden rounded-2xl border border-[#e8e5f6] bg-[#F5F4FF] sm:h-80">
                  {source ? (
                    <Cropper
                      image={source}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      mediaProps={{
                        onError: () => {
                          setPixels(undefined);
                          setError(
                            "Não foi possível abrir esta imagem. Escolha outro arquivo PNG ou WEBP.",
                          );
                        },
                      }}
                      onCropChange={setCrop}
                      onZoomChange={(value) =>
                        setValue("zoom", value, { shouldValidate: true })
                      }
                      onCropComplete={(_, area) => setPixels(area)}
                      showGrid={false}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => picker.current?.click()}
                      className="group flex size-full flex-col items-center justify-center gap-4 px-6 text-center transition-colors hover:bg-[#eeecff]"
                    >
                      <span className="grid size-16 place-items-center rounded-2xl border border-[#e2defa] bg-white text-[#635BFF] transition-transform group-hover:scale-105">
                        <Upload size={26} />
                      </span>
                      <span>
                        <strong className="block text-base font-semibold text-zinc-800">
                          Escolha a foto do profissional
                        </strong>
                        <span className="mt-2 block text-sm text-zinc-500">
                          PNG ou WEBP · Até 1 MB
                        </span>
                      </span>
                      <span className="rounded-xl bg-[#635BFF] px-5 py-3 text-sm font-semibold text-white">
                        Selecionar imagem
                      </span>
                    </button>
                  )}
                </div>
                {source && (
                  <>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
                      <span className="inline-flex items-center gap-1.5">
                        <Move size={13} />
                        Arraste para enquadrar
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => picker.current?.click()}
                          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 py-1.5 font-medium text-[#635BFF] hover:bg-[#F5F4FF]"
                        >
                          <Upload size={13} />
                          Trocar imagem
                        </button>
                        <button
                          type="button"
                          aria-label="Diminuir zoom"
                          title="Diminuir zoom"
                          disabled={isSubmitting || zoom <= 1}
                          onClick={() =>
                            setValue(
                              "zoom",
                              Math.max(1, Number((zoom - 0.1).toFixed(2))),
                              { shouldValidate: true },
                            )
                          }
                          className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#e8e5f6] bg-white text-zinc-500 transition-colors hover:border-[#635BFF]/40 hover:bg-[#F5F4FF] hover:text-[#635BFF] disabled:opacity-30"
                        >
                          <ZoomOut size={18} />
                        </button>
                        <button
                          type="button"
                          aria-label="Aumentar zoom"
                          title="Aumentar zoom"
                          disabled={isSubmitting || zoom >= 3}
                          onClick={() =>
                            setValue(
                              "zoom",
                              Math.min(3, Number((zoom + 0.1).toFixed(2))),
                              { shouldValidate: true },
                            )
                          }
                          className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#e8e5f6] bg-white text-zinc-500 transition-colors hover:border-[#635BFF]/40 hover:bg-[#F5F4FF] hover:text-[#635BFF] disabled:opacity-30"
                        >
                          <ZoomIn size={18} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="mt-6 grid grid-cols-1 gap-3 border-t border-[#efedf5] bg-[#faf9fd] px-6 py-5 sm:grid-cols-2 sm:px-8 sm:py-6">
                <Dialog.Close
                  disabled={isSubmitting}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#e3dfed] bg-white px-6 py-3.5 text-sm font-semibold text-zinc-600 transition-colors hover:border-[#635BFF]/30 hover:bg-[#F5F4FF] disabled:opacity-50"
                >
                  Cancelar
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={isSubmitting || !source || !pixels}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#635BFF] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#5046E5] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSubmitting ? (
                    <LoaderCircle size={18} className="animate-spin" />
                  ) : (
                    <Check size={18} />
                  )}{" "}
                  {isSubmitting ? "Salvando foto…" : "Usar esta foto"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
