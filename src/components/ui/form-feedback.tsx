"use client";
import {
  cloneElement,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { useFormContext, useWatch, useFormState } from "react-hook-form";
import * as Popover from "@radix-ui/react-popover";
import { QuestionIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { Tooltip } from "./tooltip";
import { useUnsavedChanges } from "../unsaved-changes";

import {
  validationMessages,
  fieldValuesEqual,
  type ValidationSchema,
} from "@/lib/form-feedback";
export function FormSubmitGuard({
  schema,
  values,
  issues = [],
  children,
  className = "",
  compact = false,
}: {
  schema: ValidationSchema;
  values: unknown;
  issues?: string[];
  children: ReactElement<ButtonHTMLAttributes<HTMLButtonElement>>;
  className?: string;
  compact?: boolean;
}) {
  const pending = [...validationMessages(schema, values), ...issues];
  const [helpOpen, setHelpOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  useEffect(() => () => clearTimeout(closeTimer.current), []);
  function openHelp() {
    clearTimeout(closeTimer.current);
    setHelpOpen(true);
  }
  function closeHelp() {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setHelpOpen(false), 150);
  }
  return (
    <div
      className={`relative min-w-0 items-center gap-2 ${compact ? pending.length > 0 ? "grid grid-cols-[minmax(0,1fr)_2rem]" : "grid grid-cols-1" : "inline-flex flex-wrap"} ${className}`}
    >
      {cloneElement(children, {
        disabled: children.props.disabled || pending.length > 0,
      })}
      {pending.length > 0 && (
        <Popover.Root open={helpOpen} onOpenChange={setHelpOpen}>
          <Popover.Trigger asChild>
            <button
              type="button"
              aria-label="Ver campos pendentes para salvar"
              onPointerEnter={openHelp}
              onPointerLeave={closeHelp}
              onFocus={openHelp}
              onBlur={closeHelp}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[#635BFF] hover:bg-[#F5F4FF] focus-visible:outline-2 focus-visible:outline-[#635BFF]"
            >
              <QuestionIcon size={20} aria-hidden="true" />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              side="top"
              align="end"
              sideOffset={8}
              onOpenAutoFocus={(event) => event.preventDefault()}
              onCloseAutoFocus={(event) => event.preventDefault()}
              onPointerEnter={openHelp}
              onPointerLeave={closeHelp}
              className="z-[1100] max-h-72 w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-[#635BFF] bg-[#635BFF] p-4 text-xs text-white shadow-lg"
            >
              <p className="mb-2 font-semibold text-white">
                O que falta para salvar
              </p>
              <ul className="space-y-2">
                {pending.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      )}
      {pending.length > 0 && (
        <p
          role="status"
          className={compact ? "sr-only" : "basis-full max-w-sm text-left text-[11px] leading-5 text-zinc-500"}
        >
          {pending[0]}
          {pending.length > 1 ? ` (+${pending.length - 1} pendências)` : ""}
        </p>
      )}
    </div>
  );
}
const EditingContext = createContext(false);
export function FormEditState({
  editing,
  extraDirty = false,
  children,
}: {
  editing: boolean;
  extraDirty?: boolean;
  children: ReactNode;
}) {
  const form = useFormContext();
  const values = useWatch({ control: form.control });
  const { defaultValues, isSubmitting } = useFormState({
    control: form.control,
  });
  useUnsavedChanges(
    !isSubmitting && (extraDirty || !fieldValuesEqual(values, defaultValues)),
  );
  return (
    <EditingContext.Provider value={editing}>
      {children}
    </EditingContext.Provider>
  );
}
function nested(value: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (v, k) =>
        v && typeof v === "object"
          ? (v as Record<string, unknown>)[k]
          : undefined,
      value,
    );
}
export function FieldChanged({
  name,
  changed,
}: {
  name: string;
  changed?: boolean;
}) {
  const editing = useContext(EditingContext);
  const form = useFormContext();
  const value = useWatch({ control: form.control, name });
  const { defaultValues } = useFormState({ control: form.control });
  const dirty =
    changed ?? !fieldValuesEqual(value, nested(defaultValues, name));
  if (!editing || !dirty) return null;
  return (
    <Tooltip
      text="Campo alterado. Salve para aplicar a mudança."
      className="ml-1 align-middle"
    >
      <span
        className="inline-flex text-[#635BFF] outline-offset-2 focus-visible:outline-2 focus-visible:outline-[#635BFF]"
        tabIndex={0}
        role="img"
        aria-label="Campo alterado, ainda não salvo"
      >
        <PencilSimpleIcon size={13} aria-hidden="true" />
      </span>
    </Tooltip>
  );
}
