"use client";
import { useEffect, useId, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
export function TopRatedBadge() {
  const descriptionId = useId();
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = () => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(true);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 120);
  };
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="Sobre o selo dos cinco mais bem avaliados"
          aria-describedby={open ? descriptionId : undefined}
          className="relative z-20 shrink-0 rounded-md p-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#635BFF]"
          onPointerEnter={(event) => {
            if (event.pointerType !== "touch") show();
          }}
          onPointerLeave={(event) => {
            if (event.pointerType !== "touch") hide();
          }}
          onFocus={(event) => {
            if (event.currentTarget.matches(":focus-visible")) show();
          }}
          onClick={(event) => {
            event.preventDefault();
            show();
          }}
          onBlur={hide}
        >
          <img
            src="/brand/flow_king.svg"
            alt=""
            className="size-7 object-contain"
          />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          role="tooltip"
          side="top"
          align="end"
          sideOffset={10}
          collisionPadding={16}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onPointerEnter={show}
          onPointerLeave={hide}
          className="z-50 w-64 rounded-2xl border border-[#5046E5] bg-[#635BFF] p-4 text-white shadow-[0_10px_35px_#635BFF25] outline-none"
        >
          <div className="mb-3 flex items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white">
              <img
                src="/brand/flow_king.svg"
                alt=""
                className="size-6 object-contain"
              />
            </span>
            <strong className="text-xs font-semibold">
              Entre os melhores do Flow
            </strong>
          </div>
          <p
            id={descriptionId}
            className="text-[11px] leading-relaxed text-white/85"
          >
            Este estabelecimento está entre os 5 mais bem avaliados do Flow. O
            selo acompanha as notas dos clientes.
          </p>
          <Popover.Arrow className="fill-[#635BFF]" width={12} height={6} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
