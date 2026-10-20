import { auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
export async function currentUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("UNAUTHENTICATED");
  return userId;
}
export async function requireBusinessOwner(establishmentId: string) {
  const userId = await currentUser();
  const result = await prisma().establishment.findFirst({
    where: {
      id: establishmentId,
      ownerId: userId,
      active: true,
      owner: {
        subscription: {
          is: { status: "active", paidUntil: { gt: new Date() } },
        },
      },
    },
    select: { id: true },
  });
  if (!result) throw new Error("FORBIDDEN");
  return userId;
}
export function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const errors: Record<string, [number, string]> = {
    BILLING_QUOTE_EXPIRED: [
      409,
      "A prévia expirou ou a assinatura mudou. Atualize a prévia e tente novamente.",
    ],
    BILLING_SUBSCRIPTION_REQUIRED: [
      409,
      "Contrate um plano para começar sua assinatura.",
    ],
    BILLING_PLAN_UNCHANGED: [409, "Este já é o seu plano atual."],
    BILLING_CHANGE_UNAVAILABLE: [
      409,
      "Resolva o pagamento ou o cancelamento pendente na gestão da assinatura antes de mudar de plano.",
    ],
    BILLING_PAYMENT_PENDING: [
      409,
      "Existe um pagamento pendente. Abra a gestão de pagamentos para concluir.",
    ],
    BILLING_NOT_CONFIGURED: [503, "Cobrança ainda não configurada."],
    INVALID_INPUT: [400, "Confira os campos informados e tente novamente."],
    VACATION_BOOKINGS_CONFLICT: [
      409,
      "Há agendamentos confirmados ou aguardando aprovação nesse período. Resolva essas reservas na agenda antes de marcar as férias.",
    ],
    PROFESSIONAL_HAS_BOOKINGS: [
      409,
      "Este profissional tem agendamentos futuros confirmados ou aguardando aprovação. Resolva essas reservas na agenda antes de excluir. Você pode deixá-lo inativo para impedir novas reservas.",
    ],
    REVIEW_NOT_ELIGIBLE: [
      409,
      "A avaliação fica disponível 24 horas após o horário de um agendamento confirmado ou concluído.",
    ],
    REVIEW_EXISTS: [409, "Este agendamento já foi avaliado."],
    INVALID_SLUG: [
      400,
      "Use um endereço com letras minúsculas, números e hífens.",
    ],
    PLAN_LIMIT: [409, "Seu plano atingiu o limite de estabelecimentos."],
    PROFESSIONAL_LIMIT: [
      409,
      "Você atingiu o limite de profissionais do seu plano neste estabelecimento.",
    ],
    DOWNGRADE_SELECTION_REQUIRED: [
      409,
      "Escolha quais estabelecimentos excluir antes de mudar para o Essencial.",
    ],
    PROFESSIONAL_DOWNGRADE_REQUIRED: [
      409,
      "O Essencial permite até 10 profissionais por estabelecimento. Ajuste sua equipe antes de mudar de plano.",
    ],
    ARRIVAL_TOO_EARLY: [
      409,
      "A chegada só pode ser registrada a partir de 1 hora antes do agendamento.",
    ],
    BOOKING_CLOSED: [409, "Este agendamento já foi encerrado ou expirou."],
    CANCELLATION_DEADLINE: [
      409,
      "O prazo para cancelar online terminou. Entre em contato com o estabelecimento.",
    ],
    UNAUTHENTICATED: [401, "Entre com sua conta Google."],
    FORBIDDEN: [403, "Acesso indisponível. Verifique sua assinatura."],
    DATABASE_NOT_CONFIGURED: [
      503,
      "O serviço está temporariamente indisponível. Tente novamente em instantes.",
    ],
    SESSION_FULL: [409, "As vagas desse horário foram preenchidas."],
    SESSION_UNAVAILABLE: [409, "Este horário não está mais disponível."],
    ESTABLISHMENT_FROZEN: [
      409,
      "O estabelecimento não está recebendo reservas.",
    ],
    WHATSAPP_REQUIRED: [400, "Informe um WhatsApp válido com código do país."],
    OUTSIDE_AVAILABILITY: [
      409,
      "Este horário está fora da disponibilidade do profissional.",
    ],
    SESSION_NOT_FOUND: [404, "Horário não encontrado."],
    IDEMPOTENCY_CONFLICT: [
      409,
      "Esta solicitação já foi utilizada para outro horário.",
    ],
    PROFESSIONAL_UNAVAILABLE: [409, "Profissional indisponível."],
    SERVICE_UNAVAILABLE: [409, "Serviço indisponível."],
    INVALID_CAPACITY: [409, "A capacidade deste atendimento é inválida."],
  };
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    ["P2002", "23505"].includes(String(error.code))
  )
    return Response.json(
      {
        error:
          "Este cadastro já existe. Confira o endereço ou os dados informados.",
      },
      { status: 409 },
    );
  const known = Object.keys(errors).find((code) =>
    new RegExp(`\\b${code}\\b`).test(message),
  );
  const [status, text] = errors[known ?? message] ?? [
    500,
    "Não foi possível concluir a operação.",
  ];
  return Response.json({ error: text }, { status });
}
