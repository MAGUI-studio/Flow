"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, List, Mail } from "lucide-react";
import { ScrollArea } from "./ui/scrollArea";

export function LegalNavigation({
  sections,
}: {
  sections: { id: string; title: string }[];
}) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = sections[0]?.id ?? "";
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element && element.getBoundingClientRect().top <= 160)
          current = section.id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [sections]);

  return (
    <aside className="min-w-0 lg:sticky lg:top-8">
      <nav
        aria-label="Nesta página"
        className="overflow-hidden rounded-2xl border border-[#e9e7f0] bg-white"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <h2 className="m-0! text-[11px] font-semibold tracking-[.12em] text-zinc-500 uppercase">
            Nesta página
          </h2>
          <List size={15} className="text-zinc-400" aria-hidden="true" />
        </div>
        <ScrollArea
          className="h-60 lg:h-[min(420px,calc(100dvh-260px))]"
          viewportClassName="px-3 pb-3"
        >
          <ol className="space-y-1">
            {sections.map((section, index) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  aria-current={active === section.id ? "location" : undefined}
                  className="group flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-xs leading-5 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900 aria-[current=location]:bg-[#F5F4FF] aria-[current=location]:font-medium aria-[current=location]:text-[#635BFF]"
                >
                  <span
                    aria-hidden="true"
                    className="text-[10px] tabular-nums opacity-60"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {section.title}
                  <span
                    aria-hidden="true"
                    className="ml-auto hidden size-1.5 shrink-0 rounded-full bg-[#635BFF] group-aria-[current=location]:block"
                  />
                </a>
              </li>
            ))}
          </ol>
        </ScrollArea>
      </nav>
      <a
        href="mailto:contato@magui.studio"
        className="group mt-4 flex items-start gap-3 rounded-2xl border border-[#e9e7f0] bg-[#F5F4FF]/50 p-5"
      >
        <Mail
          size={17}
          className="mt-0.5 shrink-0 text-[#635BFF]"
          aria-hidden="true"
        />
        <span className="min-w-0">
          <span className="block text-xs font-medium text-zinc-800">
            Podemos ajudar?
          </span>
          <span className="mt-1 block break-all text-[11px] leading-5 text-zinc-500">
            contato@magui.studio
          </span>
        </span>
        <ArrowUpRight
          size={14}
          aria-hidden="true"
          className="ml-auto shrink-0 text-zinc-400 transition-colors group-hover:text-[#635BFF]"
        />
      </a>
    </aside>
  );
}
