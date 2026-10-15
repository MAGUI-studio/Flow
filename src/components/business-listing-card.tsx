import { AnimatedArrow } from "@/components/ui/animated-arrow";
import Link from "next/link";
import {
  MapPin,
  Globe,
  Scissors,
  Heart,
  Stethoscope,
  GraduationCap,
  BriefcaseBusiness,
  Palette,
  PenTool,
  Flower2,
  Dumbbell,
  PawPrint,
  Camera,
} from "lucide-react";
import type { BusinessCard } from "@/lib/catalog";
import { RatingSummary } from "./ui/rating-stars";
import { TopRatedBadge } from "./ui/top-rated-badge";
import { BusinessMonogram } from "./ui/business-monogram";
const categoryIcons = {
  Beleza: Scissors,
  Barbearia: Scissors,
  Saúde: Stethoscope,
  "Bem-estar": Heart,
  Educação: GraduationCap,
  Consultoria: BriefcaseBusiness,
  Tatuagem: PenTool,
  Estética: Flower2,
  Esportes: Dumbbell,
  Pet: PawPrint,
  Fotografia: Camera,
  Outro: Palette,
};
export function BusinessListingCard({
  business: b,
}: {
  business: BusinessCard;
}) {
  const CategoryIcon =
    categoryIcons[b.category as keyof typeof categoryIcons] ??
    BriefcaseBusiness;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-zinc-200 bg-white transition-[border-color,box-shadow] duration-300 hover:border-[#635BFF]/40 hover:shadow-[0_8px_28px_#635BFF0c] focus-within:border-[#635BFF] motion-reduce:transition-none">
      <Link
        href={`/${b.slug}`}
        aria-label={`Conhecer e agendar em ${b.name}`}
        className="absolute inset-0 z-10 rounded-[22px] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#635BFF]"
      />
      <div
        className="relative isolate grid h-40 shrink-0 place-items-center overflow-hidden sm:h-44"
        style={{ background: b.color }}
      >
        {b.coverUrl ? (
          <img
            src={b.coverUrl}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute size-[220px] translate-x-[70px] translate-y-[70px] rounded-full border border-white/40 outline outline-white/25 outline-offset-[23px]"
          />
        )}
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/90 px-2.5 py-1 text-[9px] font-medium text-zinc-600">
          <CategoryIcon aria-hidden="true" size={11} />
          {b.tag}
        </span>
        {b.logoUrl ? (
          <span className="mt-5 grid size-20 place-items-center rounded-2xl border border-white/70 bg-white/90 p-3 shadow-[0_4px_20px_#18181B05]">
            <img src={b.logoUrl} alt="" className="size-full object-contain" />
          </span>
        ) : (
          !b.coverUrl && <BusinessMonogram name={b.name} />
        )}
      </div>
      <div className="flex flex-1 flex-col px-5 pt-5 pb-4">
        <div className="mb-3 flex min-w-0 items-center gap-1.5 text-[10px] text-zinc-400">
          {b.online ? (
            <Globe aria-hidden="true" size={12} className="shrink-0" />
          ) : (
            <MapPin aria-hidden="true" size={12} className="shrink-0" />
          )}
          <span className="truncate">
            {b.online ? "Atendimento online" : b.city}
          </span>
          {!b.online && b.modalities.includes("online") && (
            <span className="ml-auto shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[8px] text-zinc-500">
              Também online
            </span>
          )}
        </div>
        <div className="flex min-h-12 items-start justify-between gap-3">
          <h3 className="min-w-0 line-clamp-2 text-[19px] font-semibold leading-tight tracking-[-.035em] text-zinc-900 transition-colors duration-200 group-hover:text-[#635BFF]">
            {b.name}
          </h3>
          {b.isTopRated && <TopRatedBadge />}
        </div>
        <div className="mt-1 mb-3">
          <RatingSummary rating={b.rating} count={b.ratingCount} />
        </div>
        <p className="mt-2 min-h-10 line-clamp-2 text-xs leading-relaxed text-zinc-500">
          {b.description}
        </p>
        <div className="mt-5 mb-5 flex min-h-11 flex-col justify-center gap-1.5">
          {b.serviceNames.slice(0, 2).map((name, index) => (
            <span
              key={`${name}-${index}`}
              className="flex min-w-0 items-center gap-2 text-[10px] text-zinc-500"
            >
              <span
                aria-hidden="true"
                className="size-1 shrink-0 rounded-full bg-[#635BFF]/40"
              />
              <span className="truncate">{name}</span>
            </span>
          ))}
          {!b.serviceNames.length && (
            <span className="text-[10px] text-zinc-400">
              Conheça este espaço
            </span>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-zinc-100 pt-4">
          <span className="text-xs font-medium text-zinc-800">
            Conhecer e agendar
          </span>
          <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[#e8e5f6] bg-[#F5F4FF] text-[#635BFF] transition-colors duration-300 group-hover:border-[#635BFF] group-hover:bg-[#635BFF] group-hover:text-white group-focus-visible:bg-[#635BFF] group-focus-visible:text-white">
            <AnimatedArrow
              aria-hidden="true"
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-focus-visible:translate-x-0.5 group-focus-visible:-translate-y-0.5 motion-reduce:transition-none"
            />
          </span>
        </div>
      </div>
    </article>
  );
}
