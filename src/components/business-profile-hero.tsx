import { FavoriteButton } from "./favorites";
import { BusinessContactLinks } from "./business-contact-links";
import type { BusinessProfile } from "@/lib/catalog";
import { RatingSummary } from "./ui/rating-stars";
import { TopRatedBadge } from "./ui/top-rated-badge";
export function BusinessProfileHero({
  business: b,
}: {
  business: BusinessProfile;
}) {
  return (
    <>
      <div className="profile-cover" style={{ background: b.color }}>
        {b.coverUrl && (
          <img className="profile-image" src={b.coverUrl} alt={b.name} />
        )}
        {!b.coverUrl && (
          <span className="business-monogram">
            {b.logoUrl ? <img src={b.logoUrl} alt={b.name} /> : b.initials}
            <span>✳</span>
          </span>
        )}
      </div>
      <div className="profile-heading block! [&_p]:max-w-none!">
        <div className="min-w-0 w-full">
          <div className="eyebrow" style={{ justifyContent: "flex-start" }}>
            {b.tag}
          </div>
          <div className="flex items-center gap-4">
            <h1 className="min-w-0 tracking-tight">{b.name}</h1>
            {b.isTopRated && <TopRatedBadge />}
            <FavoriteButton id={b.id} name={b.name} className="ml-auto" />
          </div>
          <div className="mb-4">
            <RatingSummary rating={b.rating} count={b.ratingCount} />
          </div>
          <p>{b.description}</p>
          <BusinessContactLinks business={b} />
          {b.address && !b.location && (
            <p>
              {b.address} · {b.city}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
