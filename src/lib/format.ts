export const money = (cents: number) =>
  cents === 0
    ? "Gratuito"
    : new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(cents / 100);
export const dayKey = (value: Date | string, timezone: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
export const hourLabel = (value: Date | string, timezone: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
export const statusLabel: Record<string, string> = {
  pending: "Aguardando aprovação",
  confirmed: "Confirmado",
  declined: "Recusado",
  canceled: "Cancelado",
  expired: "Expirado",
  completed: "Concluído",
  no_show: "Não compareceu",
};
