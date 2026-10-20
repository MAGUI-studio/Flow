"use client";
import { useLayoutEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
export function FlowTabs<T extends string>({
  items,
  value,
  onValueChange,
  label,
  id,
  panelId,
  className,
}: {
  items: readonly { value: T; label: string; icon: LucideIcon }[];
  value: T;
  onValueChange: (value: T) => void;
  label: string;
  id: string;
  panelId?: (value: T) => string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{
    left: number;
    width: number;
  } | null>(null);
  useLayoutEffect(() => {
    const list = ref.current;
    if (!list) return;
    const update = () => {
      const active = list.querySelector<HTMLElement>('[aria-selected="true"]');
      if (active)
        setIndicator({ left: active.offsetLeft, width: active.offsetWidth });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(list);
    list
      .querySelectorAll("button")
      .forEach((button) => observer.observe(button));
    return () => observer.disconnect();
  }, [value]);
  return (
    <div
      ref={ref}
      role="tablist"
      aria-label={label}
      className={cn(
        "relative flex w-full min-w-0 gap-5 overflow-x-auto border-b border-zinc-200 sm:gap-7",
        className,
      )}
    >
      {items.map(({ value: key, label, icon: Icon }, index) => (
        <button
          key={key}
          type="button"
          role="tab"
          id={`${id}-${key}`}
          aria-selected={value === key}
          aria-controls={panelId?.(key)}
          tabIndex={value === key ? 0 : -1}
          onClick={() => onValueChange(key)}
          onKeyDown={(event) => {
            let next = index;
            if (event.key === "ArrowRight") next = (index + 1) % items.length;
            else if (event.key === "ArrowLeft")
              next = (index + items.length - 1) % items.length;
            else if (event.key === "Home") next = 0;
            else if (event.key === "End") next = items.length - 1;
            else return;
            event.preventDefault();
            onValueChange(items[next].value);
            ref.current
              ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
              [next]?.focus();
          }}
          className={`relative inline-flex min-h-12 shrink-0 items-center justify-center gap-2 border-b-2 border-transparent px-1 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#635BFF] ${value === key ? "text-[#635BFF]" : "text-zinc-500 hover:border-zinc-300 hover:text-zinc-800"}`}
        >
          <Icon size={16} aria-hidden="true" />
          {label}
        </button>
      ))}
      {indicator && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 h-0.5 rounded-full bg-[#635BFF] transition-[transform,width] duration-300 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none"
          style={{
            width: indicator.width,
            transform: `translateX(${indicator.left}px)`,
          }}
        />
      )}
    </div>
  );
}
