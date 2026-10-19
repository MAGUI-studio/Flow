"use client";
import {
  cloneElement,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";
export function Tooltip({
  text,
  children,
  className,
}: {
  text: string;
  className?: string;
  children: ReactElement<{ "aria-describedby"?: string; title?: string }>;
}) {
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);
  const bubble = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
    above: boolean;
    arrowLeft: number;
  } | null>(null);
  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const anchor = ref.current?.getBoundingClientRect();
      const tip = bubble.current?.getBoundingClientRect();
      if (!anchor || !tip) return;
      const left = Math.max(
        8,
        Math.min(
          window.innerWidth - tip.width - 8,
          anchor.left + anchor.width / 2 - tip.width / 2,
        ),
      );
      const above = anchor.top - tip.height - 8 >= 8;
      setPosition({
        left,
        above,
        top: above ? anchor.top - tip.height - 8 : anchor.bottom + 8,
        arrowLeft: Math.max(
          10,
          Math.min(tip.width - 10, anchor.left + anchor.width / 2 - left),
        ),
      });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, text]);
  return (
    <span
      ref={ref}
      className={`inline-flex shrink-0 ${className ?? ""}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        setOpen(false);
        setPosition(null);
      }}
      onFocus={() => setOpen(true)}
      onBlur={() => {
        setOpen(false);
        setPosition(null);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      {cloneElement(children, {
        "aria-describedby": open ? id : children.props["aria-describedby"],
        title: undefined,
      })}
      {open &&
        createPortal(
          <span
            ref={bubble}
            id={id}
            role="tooltip"
            className="pointer-events-none fixed z-[1100] max-w-[calc(100vw-1rem)] rounded-lg bg-[#635BFF] px-3 py-2 text-center text-xs font-medium leading-snug text-white shadow-lg"
            style={{
              left: position?.left ?? 0,
              top: position?.top ?? 0,
              visibility: position ? "visible" : "hidden",
            }}
          >
            {text}
            <span
              aria-hidden="true"
              className={`absolute size-2 -translate-x-1/2 rotate-45 bg-[#635BFF] ${position?.above ? "-bottom-1" : "-top-1"}`}
              style={{ left: position?.arrowLeft ?? "50%" }}
            />
          </span>,
          document.body,
        )}
    </span>
  );
}
