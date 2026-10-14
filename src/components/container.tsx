import { createElement, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Container({
  as = "div",
  className = "",
  ...props
}: HTMLAttributes<HTMLElement> & {
  as?: "div" | "main" | "section" | "header" | "footer";
}) {
  return createElement(as, {
    ...props,
    className: cn("w-full px-4 sm:px-6 lg:px-9", className),
  });
}
