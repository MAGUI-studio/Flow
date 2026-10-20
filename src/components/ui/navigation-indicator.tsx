"use client";
import { useEffect, useState, type RefObject } from "react";
export function NavigationIndicator({
  containerRef,
  activeKey,
  followClicks = true,
}: {
  containerRef: RefObject<HTMLElement | null>;
  activeKey: string;
  followClicks?: boolean;
}) {
  const [indicatorY, setIndicatorY] = useState<number | null>(null);
  useEffect(() => {
    const nav = containerRef.current;
    if (!nav) return;
    const position = (link: HTMLElement | null) => {
      if (!link) {
        setIndicatorY(null);
        return;
      }
      const linkBounds = link.getBoundingClientRect();
      const navBounds = nav.getBoundingClientRect();
      setIndicatorY(
        linkBounds.top -
          navBounds.top +
          nav.scrollTop +
          linkBounds.height / 2 -
          2.5,
      );
    };
    const update = () =>
      position(nav.querySelector<HTMLElement>('a[aria-current="page"]'));
    update();
    const resize = new ResizeObserver(update);
    resize.observe(nav);
    const click = (event: MouseEvent) => {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.defaultPrevented
      )
        return;
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a")
          : null;
      if (target && nav.contains(target) && target.target !== "_blank")
        position(target);
    };
    if (followClicks) nav.addEventListener("click", click);
    return () => {
      resize.disconnect();
      nav.removeEventListener("click", click);
    };
  }, [activeKey, containerRef, followClicks]);
  return (
    <>
      {indicatorY !== null && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-[13px] z-10 size-[5px] rounded-full bg-[#635BFF] transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none"
          style={{ transform: `translateY(${indicatorY}px)` }}
        />
      )}
    </>
  );
}
