"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CalendarDays, Check, Heart, MousePointer2 } from "lucide-react";
export function AuthCalendar({ signup }: { signup: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const check = useRef<HTMLSpanElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState({ x: 300, y: 170 });
  const [frame, setFrame] = useState(0);
  const [reduced, setReduced] = useState(true);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    );
    if (root.current) observer.observe(root.current);
    return () => {
      media.removeEventListener("change", update);
      observer.disconnect();
    };
  }, []);
  useEffect(() => {
    if (reduced || !visible) return;
    const timer = setTimeout(
      () => {
        if (!document.hidden) setFrame((frame) => (frame + 1) % 8);
      },
      frame === 6
        ? 2000
        : [2, 4].includes(frame)
          ? 260
          : [0, 5, 7].includes(frame)
            ? 650
            : 900,
    );
    const resume = () => {
      if (!document.hidden) setFrame(0);
    };
    document.addEventListener("visibilitychange", resume);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [frame, reduced, visible]);
  const selected = reduced ? 2 : frame < 2 ? -1 : frame < 4 ? 1 : 2;
  const confirmed = reduced || frame >= 6;
  const clicking = frame === 2 || frame === 4;
  useLayoutEffect(() => {
    const element = scene.current;
    if (!element || reduced || frame >= 5) return;
    const measure = () => {
      if (frame === 0) {
        setCursor({
          x: element.offsetWidth - 24,
          y: element.offsetHeight + 12,
        });
        return;
      }
      const target = element.querySelector<HTMLElement>(
        `[data-day="${frame < 3 ? 1 : 2}"]`,
      );
      if (!target) return;
      let x = target.offsetWidth * 0.6 - 3,
        y = target.offsetHeight * 0.6 - 3;
      let parent: HTMLElement | null = target;
      while (parent && parent !== element) {
        x += parent.offsetLeft;
        y += parent.offsetTop;
        parent = parent.offsetParent as HTMLElement | null;
      }
      setCursor({ x, y });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [frame, reduced]);
  useEffect(() => {
    if (confirmed && !reduced)
      check.current?.animate(
        [
          { transform: "scale(.65)", opacity: 0 },
          { transform: "scale(1.15)", opacity: 1 },
          { transform: "scale(1)", opacity: 1 },
        ],
        { duration: 450, easing: "cubic-bezier(.22,1,.36,1)" },
      );
  }, [confirmed, reduced]);
  return (
    <div
      ref={root}
      className="relative mt-9 hidden max-w-sm lg:block"
      aria-hidden="true"
    >
      <div
        ref={scene}
        className="relative rotate-[-3deg] rounded-2xl border border-[#e8e5f6] bg-white p-5 shadow-[0_12px_30px_#635BFF08]"
      >
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#F5F4FF] text-[#635BFF]">
            <CalendarDays size={20} />
          </span>
          <div>
            <strong className="block text-sm">
              {signup ? "Seu primeiro momento" : "Seu próximo momento"}
            </strong>
            <span className="mt-1 block text-[10px] text-zinc-400">
              Tudo no seu tempo.
            </span>
          </div>
          <span
            ref={check}
            className={`ml-auto grid size-7 shrink-0 place-items-center rounded-full transition-all duration-300 motion-reduce:transition-none ${confirmed ? "scale-100 bg-[#F5F4FF] text-[#635BFF] opacity-100" : "scale-75 text-[#635BFF] opacity-0"}`}
          >
            <Check size={16} />
          </span>
        </div>
        <div className="mt-5 grid grid-cols-5 gap-2">
          {["SEG", "TER", "QUA", "QUI", "SEX"].map((day, index) => (
            <span
              key={day}
              data-day={index}
              className={`relative grid h-14 place-items-center rounded-xl text-[9px] transition-[background-color,color,box-shadow] duration-500 motion-reduce:transition-none ${index === selected ? "bg-[#635BFF] text-white shadow-[0_4px_12px_#635BFF25]" : "bg-zinc-50 text-zinc-400"}`}
            >
              {day}
              <span className="text-lg leading-none">{12 + index}</span>
            </span>
          ))}
        </div>
        {!reduced && (
          <div
            className={`pointer-events-none absolute top-0 left-0 z-20 transition-[transform,opacity] duration-700 ease-[cubic-bezier(.22,1,.36,1)] ${frame >= 1 && frame <= 4 ? "opacity-100" : "opacity-0"}`}
            style={{ transform: `translate3d(${cursor.x}px,${cursor.y}px,0)` }}
          >
            {clicking && (
              <span
                key={frame}
                className="absolute -top-3 -left-3 size-6 animate-ping rounded-full border border-[#635BFF]/40 bg-[#635BFF]/10"
              />
            )}
            <MousePointer2
              size={23}
              fill="white"
              className={`origin-top-left text-zinc-800 drop-shadow-sm transition-transform duration-150 ${clicking ? "scale-85" : "scale-100"}`}
            />
          </div>
        )}
      </div>
      <span
        className={`absolute -right-5 -bottom-5 flex rotate-3 items-center gap-2 rounded-xl border border-[#e8e5f6] bg-white px-4 py-3 text-[10px] text-zinc-600 transition-[transform,box-shadow] duration-500 motion-reduce:transition-none ${confirmed ? "translate-y-0 shadow-[0_5px_16px_#635BFF0a]" : "translate-y-1"}`}
      >
        {confirmed ? (
          <Check size={14} className="text-[#635BFF]" />
        ) : (
          <Heart size={14} className="text-[#635BFF]" />
        )}
        <span className="min-w-28">
          {confirmed
            ? "Um momento só seu."
            : signup
              ? "Seu tempo começa aqui."
              : "O seu dia, mais leve."}
        </span>
      </span>
    </div>
  );
}
