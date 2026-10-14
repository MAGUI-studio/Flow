"use client";
import { useController, useFormContext, useFormState } from "react-hook-form";
import type { ComponentProps } from "react";
import { FlowSelect } from "./flow-select";
import { FlowDate } from "./flow-date";
import { FlowTime } from "./flow-time";
export function FieldError({ name }: { name: string }) {
  const { errors } = useFormState();
  const message = errors[name]?.message;
  return typeof message === "string" ? (
    <small
      id={`error-${name}`}
      className="mt-2 block text-xs font-normal text-rose-600"
      role="alert"
    >
      {message}
    </small>
  ) : null;
}
export function FormSelect({
  name,
  ...props
}: ComponentProps<typeof FlowSelect> & { name: string }) {
  const { control } = useFormContext();
  const { field, fieldState } = useController({ name, control });
  return (
    <FlowSelect
      {...props}
      name={name}
      value={field.value ?? ""}
      onValueChange={(v) => {
        field.onChange(v);
        props.onValueChange?.(v);
      }}
      inputRef={field.ref}
      onBlur={field.onBlur}
      aria-invalid={!!fieldState.error}
      aria-describedby={fieldState.error ? `error-${name}` : undefined}
    />
  );
}
export function FormDate({ name, ...props }: ComponentProps<typeof FlowDate>) {
  const { field } = useController({ name });
  return (
    <FlowDate
      {...props}
      name={name}
      inputRef={field.ref}
      onValueChange={field.onChange}
    />
  );
}
export function FormTime({ name, ...props }: ComponentProps<typeof FlowTime>) {
  const { field } = useController({ name });
  return <FlowTime {...props} name={name} onValueChange={field.onChange} />;
}
