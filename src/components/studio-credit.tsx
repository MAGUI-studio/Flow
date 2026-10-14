import { ArrowUpRight } from "lucide-react";

export function StudioCredit({ light = false }: { light?: boolean }) {
  return (
    <a
      href="https://magui.studio/"
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex w-fit items-center gap-2 text-[10px] text-zinc-400"
    >
      Um produto{" "}
      <strong
        className={`font-medium transition-colors ${light ? "text-zinc-600 group-hover:text-zinc-900" : "text-zinc-300 group-hover:text-white"}`}
      >
        MAGUI.studio
      </strong>
      <ArrowUpRight size={12} />
    </a>
  );
}
