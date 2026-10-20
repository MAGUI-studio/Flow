import { Plus } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
export function PlanLimitButton({
  label,
  message,
}: {
  label: string;
  message: string;
}) {
  return (
    <Tooltip text={message}>
      <span
        tabIndex={0}
        className="inline-flex cursor-not-allowed rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#635BFF]"
      >
        <button
          type="button"
          disabled
          className="button pointer-events-none opacity-50"
        >
          <Plus size={16} aria-hidden="true" />
          {label}
        </button>
      </span>
    </Tooltip>
  );
}
