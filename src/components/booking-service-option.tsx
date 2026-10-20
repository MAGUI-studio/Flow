import { CheckIcon } from "@phosphor-icons/react/ssr";
import { money } from "@/lib/format";
export const bookingServiceOptionClass =
  "flex min-h-[120px] min-w-0 flex-col items-stretch gap-3 rounded-xl border p-3.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#635BFF]";
export function bookingServiceOptionStyle(selected: boolean) {
  return `${bookingServiceOptionClass} ${selected ? "border-[#635BFF] bg-[#f5f4ff]" : "border-[#e8e5f6] bg-white hover:border-[#635BFF]/40 hover:bg-[#faf9ff]"}`;
}
export function BookingServiceOption({
  service: s,
  selected,
}: {
  service: {
    name: string;
    durationMinutes: number;
    kind: string;
    modality: string;
    priceCents: number;
  };
  selected: boolean;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <strong className="block text-sm leading-5 font-semibold text-zinc-800">
            {s.name}
          </strong>
          <small className="mt-1 block text-[10px] leading-4 text-zinc-500">
            {s.durationMinutes} minutos ·{" "}
            {s.kind === "collective" ? "Em grupo" : "Individual"} ·{" "}
            {s.modality === "online" ? "Online" : "Presencial"}
          </small>
        </div>
        <span
          aria-hidden="true"
          className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-[#635BFF] bg-[#635BFF] text-white" : "border-zinc-200 bg-white"}`}
        >
          {selected && <CheckIcon size={12} />}
        </span>
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <span className="text-[10px] text-zinc-500">Valor do serviço</span>
        <strong className="text-lg leading-6 font-semibold tracking-tight text-zinc-900">
          {money(s.priceCents)}
        </strong>
      </div>
    </>
  );
}
