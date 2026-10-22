import { formatContact } from "./format-contact";

export const adminValueLabels: Record<string, string> = {
  active: "Ativo",
  inactive: "Inativo",
  trialing: "Em teste",
  past_due: "Pagamento em atraso",
  unpaid: "Não pago",
  incomplete: "Pagamento pendente",
  incomplete_expired: "Pagamento expirado",
  canceled: "Cancelado",
  paused: "Pausado",
  confirmed: "Confirmado",
  pending: "Pendente",
  completed: "Concluído",
  expired: "Expirado",
  declined: "Recusado",
  no_show: "Não compareceu",
  waiting: "Aguardando vaga",
  offered: "Vaga oferecida",
  accepted: "Aceito",
  fulfilled: "Atendido",
  approved: "Aprovado",
  rejected: "Recusado",
  revoked: "Revogada",
  ended: "Encerrada",
  abandoned: "Abandonada",
  removed: "Removido",
  normal: "Agendamento",
  reschedule: "Reagendamento",
  waitlist: "Lista de espera",
  individual: "Individual",
  collective: "Em grupo",
  in_person: "Presencial",
  online: "Online",
  automatic: "Automática",
  manual: "Manual",
  basic: "Essencial",
  multi: "PRO",
  stripe: "Stripe",
  development: "Desenvolvimento",
  seed: "Demonstração",
  oauth_google: "Google",
  google: "Google",
  verified: "Verificado",
  unverified: "Não verificado",
  transferable: "Em transferência",
  mobile: "Celular",
  desktop: "Computador",
  tablet: "Tablet",
};
export const adminEventLabels: Record<string, string> = {
  "booking.created": "Agendamento criado",
  "booking.confirmed": "Agendamento confirmado",
  "booking.pending": "Agendamento aguardando aprovação",
  "booking.canceled": "Agendamento cancelado",
  "booking.completed": "Atendimento concluído",
  "booking.auto_completed": "Atendimento concluído automaticamente",
  "booking.declined": "Agendamento recusado",
  "booking.expired": "Solicitação expirada",
  "booking.no_show": "Ausência registrada",
  "booking.arrived": "Chegada registrada",
  "booking.reschedule_requested": "Reagendamento solicitado",
  "booking.rescheduled": "Agendamento remarcado",
  "booking.reschedule_declined": "Reagendamento recusado",
  "booking.series_created": "Série de agendamentos criada",
  "booking.series_changed": "Série de agendamentos alterada",
  "booking.series_canceled": "Série de agendamentos cancelada",
  "business.published": "Estabelecimento publicado",
  "business.unpublished": "Estabelecimento retirado do ar",
  "schedule.block_created": "Bloqueio de agenda criado",
  "schedule.block_removed": "Bloqueio de agenda removido",
  "review.created": "Avaliação enviada",
  "admin.ban": "Login bloqueado pela administração",
  "admin.unban": "Login desbloqueado pela administração",
  "admin.ban.requested": "Bloqueio de login solicitado",
  "admin.unban.requested": "Desbloqueio de login solicitado",
  "admin.hide": "Página retirada do ar pela administração",
  "admin.publish": "Página publicada pela administração",
  "admin.user.view": "Ficha do usuário consultada",
  "charge.refunded": "Pagamento reembolsado",
  "charge.dispute.created": "Contestação de pagamento recebida",
  "radar.early_fraud_warning.created": "Alerta de fraude recebido",
  "invoice.paid": "Fatura paga",
  "invoice.payment_failed": "Falha no pagamento da fatura",
  "customer.subscription.created": "Assinatura criada",
  "customer.subscription.updated": "Assinatura atualizada",
  "customer.subscription.deleted": "Assinatura encerrada",
};
const sections: Record<string, string> = {
  sessions: "sessões de acesso",
  sessoes: "sessões e vagas",
  arquivos: "imagens",
  historico: "histórico",
  estabelecimentos: "estabelecimentos",
  equipe: "equipe e horários",
  servicos: "serviços",
  agendamentos: "agendamentos",
  avaliacoes: "avaliações",
  favoritos: "favoritos",
  notificacoes: "notificações",
  anotacoes: "anotações",
  espera: "lista de espera",
  recorrencias: "recorrências",
  reagendamentos: "reagendamentos",
  bloqueios: "bloqueios",
};
export function adminEventLabel(value: string) {
  const parts = value.split(":");
  const event = parts[0] === "stripe" ? parts[1] : parts[0];
  if (adminEventLabels[event]) return adminEventLabels[event];
  if (event.startsWith("admin.user.view."))
    return `Consulta de ${sections[event.slice(16)] ?? "dados da conta"}`;
  if (event.startsWith("booking."))
    return `Agendamento: ${adminValueLabels[event.slice(8)] ?? "alteração registrada"}`;
  if (event.startsWith("professional."))
    return "Cadastro do profissional atualizado";
  if (event.startsWith("service.")) return "Serviço atualizado";
  if (event.startsWith("business.")) return "Estabelecimento atualizado";
  if (event.startsWith("waitlist.")) return "Lista de espera atualizada";
  if (event.startsWith("schedule.")) return "Agenda atualizada";
  return "Evento registrado";
}
export function adminEventDescription(value: string) {
  const [kind, target, ...rest] = value.split(":");
  if (kind.startsWith("admin."))
    return [
      target ? `Conta ou registro: ${target}` : "",
      rest.length ? `Motivo: ${rest.join(":")}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
  if (kind === "stripe")
    return rest.length ? `Referências do pagamento: ${rest.join(" · ")}` : "";
  return [target, ...rest].filter(Boolean).join(" · ");
}
export const adminDisplayValue = (value: string) =>
  adminValueLabels[value] ?? "Não informado";
const date = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});
const days = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];
const jsonKeys: Record<string, string> = {
  postalCode: "CEP",
  street: "Rua",
  number: "Número",
  complement: "Complemento",
  neighborhood: "Bairro",
  city: "Cidade",
  state: "Estado",
  country: "País",
  location: "Localização",
  lat: "Latitude",
  lng: "Longitude",
  latitude: "Latitude",
  longitude: "Longitude",
  start: "Início",
  end: "Fim",
  enabled: "Habilitado",
  intervals: "Horários",
  weekday: "Dia da semana",
  days: "Dias",
  status: "Situação",
  reason: "Motivo",
};
function jsonDisplay(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (Array.isArray(value)) return value.map(jsonDisplay).join("\n");
  if (typeof value === "object")
    return Object.entries(value)
      .map(
        ([key, item]) =>
          `${jsonKeys[key] ?? key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}: ${jsonDisplay(item)}`,
      )
      .join(" · ");
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value))
    return date.format(new Date(value));
  return String(value);
}
export function adminFieldValue(key: string, value: unknown): string {
  if (value == null || value === "") return "—";
  if (key === "Ação")
    return `${adminEventLabel(String(value))}${adminEventDescription(String(value)) ? `\n${adminEventDescription(String(value))}` : ""}`;
  if (value instanceof Date) return date.format(value);
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (
    [
      "Status",
      "Situação",
      "Finalidade",
      "Aprovação",
      "Modalidade",
      "Provedor",
      "Plano",
    ].includes(key)
  )
    return adminValueLabels[String(value)] ?? "Não informado";
  if (key === "Tipo" && adminValueLabels[String(value)])
    return adminValueLabels[String(value)];
  if (key === "Preço (centavos)" || key === "Preço")
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value) / 100);
  if (["Telefone", "WhatsApp", "Contato"].includes(key))
    return formatContact(String(value));
  if (key === "Dias da semana" && Array.isArray(value))
    return value.map((day) => days[Number(day)] ?? "—").join(", ");
  if (
    key === "Agenda semanal" &&
    typeof value === "object" &&
    value &&
    "days" in value
  ) {
    const schedule = value as {
      days: {
        weekday: number;
        enabled: boolean;
        intervals: { start: string; end: string }[];
      }[];
    };
    return schedule.days
      .map(
        (day) =>
          `${days[day.weekday]}: ${day.enabled ? day.intervals.map((range) => `${range.start} às ${range.end}`).join(", ") : "Sem atendimento"}`,
      )
      .join("\n");
  }
  if (typeof value === "object") return jsonDisplay(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value)) && key.startsWith("Data"))
    return String(value).split("-").reverse().join("/");
  return String(value);
}
export function adminRecordFields(
  row: Record<string, unknown>,
): [string, string][] {
  return Object.entries(row).map(([key, value]) => [
    key === "Preço (centavos)" ? "Preço" : key === "Status" ? "Situação" : key,
    adminFieldValue(key, value),
  ]);
}
