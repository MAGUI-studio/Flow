export function phoneMask(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  const local = digits.slice(2),
    split = local.startsWith("9") || local.length > 8 ? 5 : 4;
  return `(${digits.slice(0, 2)}) ${local.slice(0, split)}${local.length > split ? "-" + local.slice(split) : ""}`;
}
export function currencyMask(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 9);
  return digits
    ? new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(digits) / 100)
    : "";
}
export function currencyCents(value: string) {
  return Number(value.replace(/\D/g, "")) || 0;
}
