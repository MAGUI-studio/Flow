"use client";
import {
  cloneElement,
  createContext,
  useContext,
  type ReactElement,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { useFormContext, useWatch, useFormState } from "react-hook-form";
import * as Popover from "@radix-ui/react-popover";
import { QuestionIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { Tooltip } from "./tooltip";

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
}: {
  schema: ValidationSchema;
  values: unknown;
  issues?: string[];
  children: ReactElement<ButtonHTMLAttributes<HTMLButtonElement>>;
  className?: string;
}) {
  const pending = [...validationMessages(schema, values), ...issues];
  return (
    <div className={`inline-flex min-w-0 items-center gap-2 ${className}`}>
      {cloneElement(children, {
        disabled: children.props.disabled || pending.length > 0,
      })}
      {pending.length > 0 && (
        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              type="button"
              aria-label="Ver campos pendentes para salvar"
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
    </div>
  );
}
const EditingContext = createContext(false);
export function FormEditState({
  editing,
  children,
}: {
  editing: boolean;
  children: ReactNode;
}) {
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
