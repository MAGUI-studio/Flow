import { phoneMask } from "./masks";
export function formatContact(value: string | null | undefined) {
  if (!value) return "—";
  const digits = value.replace(/\D/g, "");
  const national =
    (digits.length === 12 || digits.length === 13) && digits.startsWith("55")
      ? digits.slice(2)
      : digits;
  return national.length === 10 || national.length === 11
    ? phoneMask(national)
    : value;
}
