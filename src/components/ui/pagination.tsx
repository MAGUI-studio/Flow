import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  onPageChange,
  label = "Paginação dos estabelecimentos",
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  label?: string;
}) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (value) =>
      value === 1 || value === totalPages || Math.abs(value - page) <= 1,
  );
  const buttonClass =
    "inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-600 transition-colors hover:border-[#635BFF] hover:bg-[#F5F4FF] hover:text-[#635BFF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#635BFF] disabled:pointer-events-none disabled:opacity-35";
  return (
    <nav
      aria-label={label}
      className="mt-9 flex flex-wrap items-center justify-center gap-2"
    >
      <button
        type="button"
        aria-label="Página anterior"
        disabled={page === 1}
        className={buttonClass}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft size={18} />
      </button>
      {pages.map((value, index) => (
        <span key={value} className="inline-flex items-center gap-2">
          {index > 0 && value - pages[index - 1] > 1 && (
            <span aria-hidden="true" className="px-1 text-zinc-400">
              …
            </span>
          )}
          <button
            type="button"
            aria-label={`Página ${value}`}
            aria-current={value === page ? "page" : undefined}
            onClick={() => onPageChange(value)}
            className={cn(
              buttonClass,
              value === page &&
                "border-[#635BFF] bg-[#635BFF] text-white hover:bg-[#5046E5] hover:text-white",
            )}
          >
            {value}
          </button>
        </span>
      ))}
      <button
        type="button"
        aria-label="Próxima página"
        disabled={page === totalPages}
        className={buttonClass}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight size={18} />
      </button>
    </nav>
  );
}
