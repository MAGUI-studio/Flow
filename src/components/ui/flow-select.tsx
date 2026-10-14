"use client";
import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
type Props = {
  children: ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};
export function FlowSelect({
  children,
  value,
  defaultValue,
  onValueChange,
  name,
  required,
  disabled,
  className,
  "aria-label": label,
}: Props) {
  const options = Children.toArray(children).flatMap((child) =>
    isValidElement<{
      value?: string;
      children?: ReactNode;
      disabled?: boolean;
    }>(child)
      ? [
          {
            value: String(child.props.value ?? child.props.children),
            label: child.props.children,
            disabled: child.props.disabled,
          },
        ]
      : [],
  );
  const placeholder = options.find((o) => o.value === "")?.label ?? "Selecione";
  const initial = defaultValue ?? (options[0]?.value || "");
  const [internal, setInternal] = useState(initial);
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const form = ref.current?.closest("form");
    const reset = () => setInternal(initial);
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, [initial]);
  const chosen = value ?? internal;
  return (
    <Select.Root
      name={name}
      required={required}
      disabled={disabled}
      value={chosen}
      onValueChange={(v) => {
        setInternal(v);
        onValueChange?.(v);
      }}
    >
      <Select.Trigger
        ref={ref}
        className={`flow-select-trigger ${className ?? ""}`}
        aria-label={label}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon className="flow-select-chevron">
          <ChevronDown size={17} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          className="flow-select-menu"
          position="popper"
          sideOffset={7}
          collisionPadding={16}
        >
          <Select.ScrollUpButton className="flow-select-scroll">
            <ChevronUp size={16} />
          </Select.ScrollUpButton>
          <Select.Viewport className="flow-select-viewport">
            {options
              .filter((o) => o.value !== "")
              .map((o) => (
                <Select.Item
                  className="flow-select-option"
                  value={o.value}
                  key={o.value}
                  disabled={o.disabled}
                >
                  <Select.ItemText>{o.label}</Select.ItemText>
                  <Select.ItemIndicator className="flow-select-check">
                    <Check size={16} />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
          </Select.Viewport>
          <Select.ScrollDownButton className="flow-select-scroll">
            <ChevronDown size={16} />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
