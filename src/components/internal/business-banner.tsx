"use client";
import { useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ImageSquareIcon as ImagePlus,
  CircleNotchIcon as LoaderCircle,
  XIcon as X,
  ArrowsOutCardinalIcon as Move,
  PencilSimpleIcon,
  UploadSimpleIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  CropIcon,
} from "@phosphor-icons/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToastError } from "@/components/ui/flow-toaster";
const schema = z.object({ zoom: z.number().min(1).max(3) });
export function BusinessBanner({
  initialUrl,
  onChange,
  onBusyChange,
}: {
  initialUrl?: string | null;
  onChange: (file: File | null, previewUrl: string) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [source, setSource] = useState("");
  const [preview, setPreview] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [pixels, setPixels] = useState<Area>();
  const error = useToastError();
  const picker = useRef<HTMLInputElement>(null);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  const {
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { zoom: 1 } });
  useEffect(
    () => () => {
      if (source) URL.revokeObjectURL(source);
    },
    [source],
  );
  useEffect(() => {
    onBusyChange(!!source);
    return () => onBusyChange(false);
  }, [source, onBusyChange]);
  function close() {
    if (!isSubmitting) setSource("");
  }
  async function save() {
    if (!source || !pixels) return;
    try {
      const image = new Image();
      image.src = source;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 1600;
      canvas.height = 600;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Não foi possível recortar a imagem.");
      ctx.drawImage(
        image,
        pixels.x,
        pixels.y,
        pixels.width,
        pixels.height,
        0,
        0,
        1600,
        600,
      );
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) =>
            b
              ? resolve(b)
              : reject(new Error("Não foi possível recortar a imagem.")),
          "image/webp",
          0.88,
        ),
      );
      const file = new File([blob], "banner.webp", { type: "image/webp" });
      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);
      setUrl(localUrl);
      onChange(file, localUrl);
      setSource("");
    } catch (e) {
      error(
        e instanceof Error ? e.message : "Não foi possível preparar o banner.",
      );
    }
  }
  return (
    <div className="space-y-3">
      <button
        type="button"
        aria-label={
          url
            ? "Editar banner do estabelecimento"
            : "Adicionar banner do estabelecimento"
        }
        onClick={() => picker.current?.click()}
        disabled={isSubmitting}
        className="group relative flex aspect-[8/3] w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 transition-colors hover:border-[#635BFF]/40 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#635BFF]"
      >
        {url ? (
          <>
            <img
              src={url}
              alt="Banner do estabelecimento"
              className="size-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-800">
                <PencilSimpleIcon size={17} aria-hidden="true" />
                Editar banner
              </span>
            </span>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-zinc-400">
            <ImagePlus size={28} aria-hidden="true" />
            <span className="text-xs">
              Clique para adicionar o banner do seu espaço
            </span>
          </div>
        )}
      </button>
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={picker}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          aria-label="Selecionar imagem do banner"
          disabled={isSubmitting}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            if (
              !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
              file.size > 10 * 1024 * 1024
            ) {
              error("Escolha uma imagem JPG, PNG ou WEBP de até 10 MB.");
              return;
            }
            setCrop({ x: 0, y: 0 });
            reset({ zoom: 1 });
            setPixels(undefined);
            setSource(URL.createObjectURL(file));
          }}
        />
        {url && (
          <button
            type="button"
            className="text-xs text-zinc-500 hover:text-red-600"
            onClick={() => {
              setUrl("");
              setPreview("");
              onChange(null, "");
            }}
          >
            Remover banner
          </button>
        )}
      </div>
      <p className="text-xs leading-5 text-zinc-400">
        Ajuste o enquadramento antes de salvar. A imagem será usada na sua
        página e nos cards do Flow.
      </p>
      <Dialog.Root
        open={!!source}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-sm" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-[1001] max-h-[calc(100dvh-2rem)] w-[calc(100%_-_2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-[#e8e5f6] bg-white shadow-2xl">
            <div className="relative overflow-hidden border-b border-[#efedf5] px-6 py-6 sm:px-8 sm:py-7">
              <CropIcon
                aria-hidden="true"
                className="pointer-events-none absolute -right-3 -bottom-5 size-32 rotate-[-12deg] text-[#635BFF] opacity-[0.06]"
              />
              <p className="mb-2 text-[10px] font-semibold tracking-[0.2em] text-[#635BFF] uppercase">
                UM OLHAR PARA O SEU ESPAÇO
              </p>
              <Dialog.Title className="pr-8 text-xl! tracking-tight">
                Enquadre o seu espaço.
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-xs leading-6 text-zinc-500">
                Arraste a imagem e ajuste o zoom para destacar o que mais
                importa.
              </Dialog.Description>
              <button
                type="button"
                aria-label="Fechar recorte"
                disabled={isSubmitting}
                onClick={close}
                className="absolute top-5 right-5 grid size-10 place-items-center rounded-xl border border-[#e8e5f6] bg-white text-zinc-400 transition-colors hover:bg-[#F5F4FF] hover:text-[#635BFF] disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={(event) => {
                event.stopPropagation();
                void handleSubmit(save)(event);
              }}
              noValidate
            >
              <div className="px-6 pt-6 sm:px-8">
                <div className="relative h-64 overflow-hidden rounded-2xl border border-[#e8e5f6] bg-[#F5F4FF] sm:h-80">
                  {source && (
                    <Cropper
                      image={source}
                      crop={crop}
                      zoom={watch("zoom")}
                      aspect={8 / 3}
                      showGrid={false}
                      onCropChange={setCrop}
                      onZoomChange={(value) =>
                        setValue("zoom", value, { shouldValidate: true })
                      }
                      onCropComplete={(_, area) => setPixels(area)}
                    />
                  )}
                </div>
                <p className="mt-3 flex items-center gap-2 text-[11px] text-zinc-400">
                  <Move size={13} aria-hidden="true" />
                  Arraste para reposicionar · Formato panorâmico
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => picker.current?.click()}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-[#635BFF] hover:bg-[#F5F4FF]"
                  >
                    <UploadSimpleIcon size={13} aria-hidden="true" />
                    Trocar imagem
                  </button>
                  <button
                    type="button"
                    aria-label="Diminuir zoom"
                    title="Diminuir zoom"
                    disabled={isSubmitting || watch("zoom") <= 1}
                    onClick={() =>
                      setValue(
                        "zoom",
                        Math.max(1, Number((watch("zoom") - 0.1).toFixed(2))),
                        { shouldValidate: true },
                      )
                    }
                    className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#e8e5f6] bg-white text-zinc-500 transition-colors hover:border-[#635BFF]/40 hover:bg-[#F5F4FF] hover:text-[#635BFF] disabled:opacity-30"
                  >
                    <MagnifyingGlassMinusIcon size={18} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Aumentar zoom"
                    title="Aumentar zoom"
                    disabled={isSubmitting || watch("zoom") >= 3}
                    onClick={() =>
                      setValue(
                        "zoom",
                        Math.min(3, Number((watch("zoom") + 0.1).toFixed(2))),
                        { shouldValidate: true },
                      )
                    }
                    className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#e8e5f6] bg-white text-zinc-500 transition-colors hover:border-[#635BFF]/40 hover:bg-[#F5F4FF] hover:text-[#635BFF] disabled:opacity-30"
                  >
                    <MagnifyingGlassPlusIcon size={18} aria-hidden="true" />
                  </button>
                </div>
                {errors.zoom && (
                  <p role="alert" className="mt-2 text-xs text-red-600">
                    {errors.zoom.message}
                  </p>
                )}
              </div>
              <div className="mt-6 grid grid-cols-1 gap-3 border-t border-[#efedf5] bg-[#faf9fd] px-6 py-5 sm:grid-cols-2 sm:px-8 sm:py-6">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={close}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#e3dfed] bg-white px-6 py-3.5 text-sm font-semibold text-zinc-600 transition-colors hover:border-[#635BFF]/30 hover:bg-[#F5F4FF] disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  disabled={isSubmitting || !pixels}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#635BFF] px-6 py-3.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {isSubmitting && (
                    <LoaderCircle size={15} className="animate-spin" />
                  )}
                  {isSubmitting ? "Ajustando…" : "Usar este banner"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
