export const ownEstablishmentBookingMessage =
  "Você não pode agendar serviços no seu próprio estabelecimento.";

export function isEstablishmentOwner(
  userId: string | null | undefined,
  ownerId: string | null | undefined,
) {
  return Boolean(userId && ownerId && userId === ownerId);
}
