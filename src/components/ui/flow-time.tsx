"use client";
import { useEffect, useRef, useState } from "react";
import { FlowSelect } from "./flow-select";
export function FlowTime({
  name,
  required = false,
  onValueChange,
}: {
  name: string;
  required?: boolean;
  onValueChange?: (value: string) => void;
}) {
  const [hour, setHour] = useState(""),
    [minute, setMinute] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const form = ref.current?.closest("form");
    const reset = () => {
      setHour("");
      setMinute("");
    };
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, []);
  return (
    <div className="flow-time-field">
      <FlowSelect
        aria-label="Hora"
        value={hour}
        onValueChange={(v) => {
          setHour(v);
          onValueChange?.(v && minute ? `${v}:${minute}` : "");
        }}
        required={required}
        name={`${name}_hour`}
      >
        <option value="">Hora</option>
        {Array.from({ length: 24 }, (_, i) => {
          const v = String(i).padStart(2, "0");
          return (
            <option key={v} value={v}>
              {v}
            </option>
          );
        })}
      </FlowSelect>
      <span>:</span>
      <FlowSelect
        aria-label="Minutos"
        value={minute}
        onValueChange={(v) => {
          setMinute(v);
          onValueChange?.(hour && v ? `${hour}:${v}` : "");
        }}
        required={required}
        name={`${name}_minute`}
      >
        <option value="">Min</option>
        {Array.from({ length: 60 }, (_, i) => {
          const v = String(i).padStart(2, "0");
          return (
            <option key={v} value={v}>
              {v}
            </option>
          );
        })}
      </FlowSelect>
      <input
        ref={ref}
        type="hidden"
        name={name}
        value={hour && minute ? `${hour}:${minute}` : ""}
      />
    </div>
  );
}
