"use client";
import { useEffect, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export function FlowDate({
  name,
  required = false,
  onValueChange,
  inputRef,
  value: controlledValue,
}: {
  name: string;
  required?: boolean;
  onValueChange?: (value: string) => void;
  inputRef?: (node: HTMLInputElement | null) => void;
  value?: string;
}) {
  const [value, setValue] = useState(""),
    [display, setDisplay] = useState(""),
    [open, setOpen] = useState(false),
    [month, setMonth] = useState(
      () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    );
  const input = useRef<HTMLInputElement>(null);
  const cells = useRef<Record<string, HTMLButtonElement | null>>({});
  const pendingFocus = useRef("");
  useEffect(() => {
    if (controlledValue === undefined) return;
    setValue(controlledValue);
    setDisplay(
      controlledValue ? controlledValue.split("-").reverse().join("/") : "",
    );
    if (/^\d{4}-\d{2}-\d{2}$/.test(controlledValue)) {
      const [year, month] = controlledValue.split("-").map(Number);
      setMonth(new Date(year, month - 1, 1));
    }
  }, [controlledValue]);
  useEffect(() => {
    const form = input.current?.closest("form");
    const reset = () => {
      setValue("");
      setDisplay("");
      input.current?.setCustomValidity("");
    };
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, []);
  useEffect(() => {
    if (pendingFocus.current) {
      cells.current[pendingFocus.current]?.focus();
      pendingFocus.current = "";
    }
  }, [month]);
  function choose(d: Date) {
    setValue(iso(d));
    onValueChange?.(iso(d));
    setDisplay(d.toLocaleDateString("pt-BR"));
    input.current?.setCustomValidity("");
    setOpen(false);
  }
  function edit(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 8),
      formatted = digits
        .replace(/^(\d{2})(\d)/, "$1/$2")
        .replace(/^(\d{2})\/(\d{2})(\d)/, "$1/$2/$3");
    setDisplay(formatted);
    setValue("");
    onValueChange?.("");
    if (digits.length === 8) {
      const d = new Date(
        Number(digits.slice(4)),
        Number(digits.slice(2, 4)) - 1,
        Number(digits.slice(0, 2)),
      );
      if (
        d.getFullYear() === Number(digits.slice(4)) &&
        d.getMonth() + 1 === Number(digits.slice(2, 4)) &&
        d.getDate() === Number(digits.slice(0, 2))
      ) {
        setValue(iso(d));
        onValueChange?.(iso(d));
        setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
        input.current?.setCustomValidity("");
      } else input.current?.setCustomValidity("Informe uma data válida.");
    } else
      input.current?.setCustomValidity(
        digits.length ? "Complete a data no formato dia/mês/ano." : "",
      );
  }
  const start = new Date(month);
  start.setDate(1 - ((month.getDay() + 6) % 7));
  const days = Array.from(
    { length: 42 },
    (_, i) =>
      new Date(start.getFullYear(), start.getMonth(), start.getDate() + i),
  );
  function move(d: Date, key: string) {
    const offsets: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
      Home: -(d.getDay() + 6) % 7,
      End: 6 - ((d.getDay() + 6) % 7),
    };
    if (!(key in offsets)) return false;
    const next = new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate() + offsets[key],
    );
    if (next.getMonth() !== month.getMonth()) {
      pendingFocus.current = iso(next);
      setMonth(new Date(next.getFullYear(), next.getMonth(), 1));
    } else cells.current[iso(next)]?.focus();
    return true;
  }
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div className="flow-date-field">
        <input
          ref={(node) => {
            input.current = node;
            inputRef?.(node);
          }}
          type="text"
          inputMode="numeric"
          placeholder="dd/mm/aaaa"
          required={required}
          value={display}
          onChange={(e) => edit(e.target.value)}
          aria-label="Data"
        />
        <input type="hidden" name={name} value={value} />
        <Popover.Trigger asChild>
          <button
            type="button"
            className="field-icon-button"
            aria-label="Abrir calendário"
          >
            <CalendarDays size={18} />
          </button>
        </Popover.Trigger>
      </div>
      <Popover.Portal>
        <Popover.Content
          className="flow-calendar"
          sideOffset={8}
          align="start"
          collisionPadding={16}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            const target = value || iso(new Date());
            (cells.current[target] ?? cells.current[iso(month)])?.focus();
          }}
        >
          <div className="calendar-navigation">
            <button
              type="button"
              aria-label="Mês anterior"
              onClick={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
              }
            >
              <ChevronLeft size={17} />
            </button>
            <strong>
              {month.toLocaleDateString("pt-BR", {
                month: "long",
                year: "numeric",
              })}
            </strong>
            <button
              type="button"
              aria-label="Próximo mês"
              onClick={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
              }
            >
              <ChevronRight size={17} />
            </button>
          </div>
          <div className="flow-calendar-week">
            {["S", "T", "Q", "Q", "S", "S", "D"].map((day, i) => (
              <span key={i}>{day}</span>
            ))}
          </div>
          <div
            className="flow-calendar-grid"
            role="group"
            aria-label="Escolha uma data"
          >
            {days.map((d) => (
              <button
                ref={(node) => {
                  cells.current[iso(d)] = node;
                }}
                key={iso(d)}
                type="button"
                aria-label={d.toLocaleDateString("pt-BR", {
                  dateStyle: "full",
                })}
                aria-pressed={value === iso(d)}
                aria-current={iso(d) === iso(new Date()) ? "date" : undefined}
                tabIndex={
                  iso(d) ===
                  (value &&
                  value.startsWith(
                    `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`,
                  )
                    ? value
                    : month.getMonth() === new Date().getMonth() &&
                        month.getFullYear() === new Date().getFullYear()
                      ? iso(new Date())
                      : iso(month))
                    ? 0
                    : -1
                }
                data-outside={d.getMonth() !== month.getMonth()}
                data-today={iso(d) === iso(new Date())}
                onClick={() => choose(d)}
                onKeyDown={(e) => {
                  if (move(d, e.key)) e.preventDefault();
                }}
              >
                {d.getDate()}
              </button>
            ))}
          </div>
          <div className="calendar-footer">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                choose(today);
              }}
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => {
                setValue("");
                setDisplay("");
                input.current?.setCustomValidity("");
                setOpen(false);
              }}
            >
              Limpar
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
