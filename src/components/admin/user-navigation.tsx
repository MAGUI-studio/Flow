"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScrollArea } from "@/components/ui/scrollArea";

export function AdminUserNavigation({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname();
  return (
    <ScrollArea
      orientation="horizontal"
      className="mb-6 rounded-xl border border-zinc-200 bg-white"
    >
      <nav
        aria-label="Informações do usuário"
        className="flex w-max min-w-full items-center gap-1 px-3"
      >
        {items.map((item) => (
          <Link
            key={item.href}
            prefetch={false}
            href={item.href}
            aria-current={pathname === item.href ? "page" : undefined}
            className="inline-flex min-h-12 shrink-0 items-center border-b-2 border-transparent px-3 text-xs text-zinc-500 transition-colors hover:text-[#635BFF] aria-[current=page]:border-[#635BFF] aria-[current=page]:font-semibold aria-[current=page]:text-[#635BFF]"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </ScrollArea>
  );
}
