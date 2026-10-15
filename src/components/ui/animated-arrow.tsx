import { ArrowRight, ArrowUpRight, type LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

export function AnimatedArrow({ direction = "diagonal", className, ...props }: LucideProps & { direction?: "diagonal" | "right" }) {
  const Icon = direction === "right" ? ArrowRight : ArrowUpRight;
  return <Icon aria-hidden="true" {...props} className={cn(
    "shrink-0 transition-transform duration-200 ease-out [a:hover_&]:translate-x-1 [a:focus-visible_&]:translate-x-1 [button:hover_&]:translate-x-1 [button:focus-visible_&]:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none",
    direction === "diagonal" && "[a:hover_&]:-translate-y-1 [a:focus-visible_&]:-translate-y-1 [button:hover_&]:-translate-y-1 [button:focus-visible_&]:-translate-y-1",
    className,
  )} />;
}
