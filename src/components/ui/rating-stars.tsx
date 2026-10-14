import { Star } from "lucide-react";
export function RatingStars({
  value,
  size = 14,
}: {
  value: number;
  size?: number;
}) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span aria-hidden="true" className="inline-flex gap-0.5">
      {[0, 1, 2, 3, 4].map((index) => (
        <span
          key={index}
          className="relative inline-block shrink-0"
          style={{ width: size, height: size }}
        >
          <Star size={size} className="fill-zinc-100 text-zinc-200" />
          <span
            className="absolute inset-y-0 left-0 overflow-hidden"
            style={{
              width: `${Math.max(0, Math.min(1, rounded - index)) * 100}%`,
            }}
          >
            <Star size={size} className="fill-[#635BFF] text-[#635BFF]" />
          </span>
        </span>
      ))}
    </span>
  );
}
export function RatingSummary({
  rating,
  count = 0,
}: {
  rating?: number | null;
  count?: number;
}) {
  if (rating === null || rating === undefined || count === 0)
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] text-zinc-400">
        <Star aria-hidden="true" size={12} />
        Sem avaliações
      </span>
    );
  const label = rating.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return (
    <span
      role="img"
      aria-label={`Nota ${label} de 5, ${count} ${count === 1 ? "avaliação" : "avaliações"}`}
      className="inline-flex flex-wrap items-center gap-2"
    >
      <RatingStars value={rating} />
      <strong className="text-xs font-semibold">{label}</strong>
      <span className="text-[10px] opacity-50">({count})</span>
    </span>
  );
}
