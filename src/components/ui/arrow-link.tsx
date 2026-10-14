import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
export const arrowMotion =
  "transition-transform duration-200 ease-out group-hover:translate-x-1 group-hover:-translate-y-1 group-focus-visible:translate-x-1 group-focus-visible:-translate-y-1 motion-reduce:transition-none";
export function ArrowLink({
  children,
  className,
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <Link {...props} className={cn("button group", className)}>
      {children}
      <ArrowUpRight size={19} className={arrowMotion} />
    </Link>
  );
}
export function ArrowButton({
  children,
  className,
  ...props
}: ComponentProps<"button">) {
  return (
    <button {...props} className={cn("button group", className)}>
      {children}
      <ArrowRight
        size={19}
        className="transition-transform duration-200 ease-out group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transition-none"
      />
    </button>
  );
}
