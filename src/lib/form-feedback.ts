type Issue = { path: PropertyKey[]; message: string };
export type ValidationSchema = {
  safeParse: (value: unknown) => {
    success: boolean;
    error?: { issues: Issue[] };
  };
};
const labels: Record<string, string> = {
  name: "Nome",
  slug: "Endereço da página",
  category: "Categoria",
  description: "Descrição",
  city: "Cidade",
  address: "Endereço",
  addressDetails: "Endereço",
  postalCode: "CEP",
  street: "Rua / avenida",
  number: "Número",
  neighborhood: "Bairro",
  state: "UF",
  contactPhone: "WhatsApp",
  website: "Site",
  instagram: "Instagram",
  bannerId: "Banner",
  photoId: "Foto",
  approvalMode: "Confirmação das reservas",
  cancelNoticeHours: "Prazo para cancelar",
  kind: "Tipo de atendimento",
  modality: "Modalidade",
  durationMinutes: "Duração",
  stepMinutes: "Intervalo entre horários",
  bufferBefore: "Tempo antes",
  bufferAfter: "Tempo depois",
  price: "Preço",
  professionalIds: "Profissionais vinculados",
  professionalId: "Profissional",
  serviceId: "Serviço",
  date: "Data",
  start: "Início",
  end: "Término",
  startsAt: "Horário",
  phone: "WhatsApp",
  days: "Horários semanais",
  intervals: "Períodos",
  enabled: "Dia de atendimento",
  capacity: "Vagas",
  establishmentScore: "Nota do estabelecimento",
  serviceScore: "Nota do serviço",
  agree: "Confirmação da alteração",
  token: "Prévia de cobrança",
  zoom: "Enquadramento",
  status: "Status",
  query: "Busca",
};
export function validationMessages(schema: ValidationSchema, values: unknown) {
  const result = schema.safeParse(values);
  return result.success
    ? []
    : [
        ...new Set(
          (result.error?.issues ?? []).map((issue) => {
            const name = issue.path
              .map((p) =>
                typeof p === "number"
                  ? String(p + 1)
                  : (labels[String(p)] ?? String(p)),
              )
              .join(" · ");
            const message =
              /^(Invalid|Too |Expected|Required|Unrecognized)/.test(
                issue.message,
              )
                ? "Preencha ou confira este campo."
                : issue.message;
            return `${name || "Dados do formulário"}: ${message}`;
          }),
        ),
      ];
}

export function fieldValuesEqual(value: unknown, baseline: unknown): boolean {
  if (typeof baseline === "number" && typeof value === "string" && value.trim())
    return Number(value) === baseline;
  if (Array.isArray(value) && Array.isArray(baseline)) {
    if (value.length !== baseline.length) return false;
    // Linked professionals are a selection, not an ordered list.
    if (
      value.every((item) => typeof item === "string") &&
      baseline.every((item) => typeof item === "string")
    )
      return (
        JSON.stringify([...value].sort()) ===
        JSON.stringify([...baseline].sort())
      );
    return value.every((item, index) =>
      fieldValuesEqual(item, baseline[index]),
    );
  }
  if (
    value &&
    baseline &&
    typeof value === "object" &&
    typeof baseline === "object"
  ) {
    const keys = new Set([...Object.keys(value), ...Object.keys(baseline)]);
    return [...keys].every((key) =>
      fieldValuesEqual(
        (value as Record<string, unknown>)[key],
        (baseline as Record<string, unknown>)[key],
      ),
    );
  }
  return JSON.stringify(value) === JSON.stringify(baseline);
}
