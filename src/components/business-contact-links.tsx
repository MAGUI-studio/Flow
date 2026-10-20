import {
  GlobeIcon as Globe,
  InstagramLogoIcon as Instagram,
  WhatsappLogoIcon as MessageCircle,
} from "@phosphor-icons/react/ssr";
import type { BusinessProfile } from "@/lib/catalog";
export function BusinessContactLinks({
  business: b,
}: {
  business: BusinessProfile;
}) {
  const phone = b.contactPhone?.replace(/\D/g, "");
  const links = [
    ...(b.website ? [{ label: "Site", href: b.website, Icon: Globe }] : []),
    ...(b.instagram
      ? [
          {
            label: "Instagram",
            href: `https://www.instagram.com/${b.instagram}/`,
            Icon: Instagram,
          },
        ]
      : []),
    ...(phone
      ? [
          {
            label: "WhatsApp",
            href: `https://wa.me/${phone.length <= 11 ? "55" : ""}${phone}`,
            Icon: MessageCircle,
          },
        ]
      : []),
  ];
  return links.length ? (
    <div className="mt-5 flex flex-wrap gap-2">
      {links.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 py-2 text-xs text-zinc-600 transition-colors hover:border-[#635BFF]/40 hover:text-[#635BFF]"
        >
          <Icon size={14} aria-hidden="true" />
          {label}
        </a>
      ))}
    </div>
  ) : null;
}
