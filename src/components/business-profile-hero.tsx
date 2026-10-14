import { Globe, MapPin } from "lucide-react";
import type { BusinessProfile } from "@/lib/catalog";
import { RatingSummary } from "./ui/rating-stars";
import { TopRatedBadge } from "./ui/top-rated-badge";
export function BusinessProfileHero({
  business: b,
}: {
  business: BusinessProfile;
}) {
  const image = (
    <>
      {b.coverUrl && (
        <img
          className="absolute inset-0 size-full object-cover"
          src={b.coverUrl}
          alt=""
        />
      )}
      <span className="relative z-10 text-6xl font-medium tracking-tighter">
        {b.logoUrl ? (
          <img
            src={b.logoUrl}
            alt={b.name}
            className="size-24 object-contain"
          />
        ) : (
          b.initials
        )}
        <span className="text-[#635BFF]">✳</span>
      </span>
    </>
  );
  const location = (
    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#F5F4FF] px-3 py-2 text-xs text-[#635BFF]">
      {b.online ? <Globe size={13} /> : <MapPin size={13} />} {b.city}
    </span>
  );
  const copy = (
    <>
      <span className="text-[10px] font-semibold tracking-[.16em] text-[#635BFF] uppercase">
        {b.tag}
      </span>
      <div className="my-4 flex items-center gap-4">
        <h1
          className={`min-w-0 text-4xl leading-tight tracking-tight sm:text-5xl ${b.templateId === "editorial" ? "font-serif font-normal" : "font-semibold"}`}
        >
          {b.name}
        </h1>
        {b.isTopRated && <TopRatedBadge />}
      </div>
      <div className="mb-4">
        <RatingSummary rating={b.rating} count={b.ratingCount} />
      </div>
      <p className="max-w-xl text-sm leading-relaxed opacity-65">
        {b.description}
      </p>
      {b.address && <p className="mt-3 text-xs opacity-60">{b.address}</p>}
    </>
  );
  if (b.templateId === "minimal")
    return (
      <section className="mb-10 flex flex-col gap-6 border-b border-zinc-200 py-8 sm:flex-row sm:items-center">
        <div
          className="relative grid size-28 shrink-0 place-items-center overflow-hidden rounded-2xl [&_span]:text-3xl"
          style={{ background: b.color }}
        >
          {image}
        </div>
        <div className="flex-1">{copy}</div>
        {location}
      </section>
    );
  if (b.templateId === "editorial")
    return (
      <section className="mb-10 grid overflow-hidden rounded-3xl border border-[#e5dfd3] bg-[#f7f4ee] md:grid-cols-2">
        <div
          className="relative grid min-h-64 place-items-center overflow-hidden"
          style={{ background: b.color }}
        >
          {image}
        </div>
        <div className="flex flex-col justify-center gap-5 p-7 sm:p-10">
          <div>{copy}</div>
          {location}
        </div>
      </section>
    );
  if (b.templateId === "night")
    return (
      <section className="relative isolate mb-10 overflow-hidden rounded-3xl bg-[#101014] px-7 py-12 text-white sm:px-12">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-5 -bottom-20 -z-10 text-[300px] leading-none text-white/5"
        >
          ✳
        </span>
        <div className="mb-7 flex items-center justify-between gap-4">
          <span className="grid size-14 place-items-center rounded-xl border border-white/15 text-xl">
            {b.logoUrl ? (
              <img
                src={b.logoUrl}
                alt={b.name}
                className="size-10 object-contain"
              />
            ) : (
              b.initials
            )}
          </span>
          {location}
        </div>
        {copy}
      </section>
    );
  return (
    <>
      <div className="profile-cover" style={{ background: b.color }}>
        {b.coverUrl && (
          <img className="profile-image" src={b.coverUrl} alt={b.name} />
        )}
        <span className="business-monogram">
          {b.logoUrl ? <img src={b.logoUrl} alt={b.name} /> : b.initials}
          <span>✳</span>
        </span>
      </div>
      <div className="profile-heading">
        <div>
          <div className="eyebrow" style={{ justifyContent: "flex-start" }}>
            {b.tag}
          </div>
          <div className="flex items-center gap-4">
            <h1 className="min-w-0">{b.name}</h1>
            {b.isTopRated && <TopRatedBadge />}
          </div>
          <div className="mb-4">
            <RatingSummary rating={b.rating} count={b.ratingCount} />
          </div>
          <p>{b.description}</p>
          {b.address && <p>{b.address}</p>}
        </div>
        {location}
      </div>
    </>
  );
}
