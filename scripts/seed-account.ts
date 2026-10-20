import { config } from "dotenv";
import { createHash } from "node:crypto";
import { createClerkClient } from "@clerk/nextjs/server";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  createEstablishment,
  createProfessional,
  createService,
  paidAccount,
} from "../src/lib/business-write";
import { planFeatures } from "../src/lib/plan-features";
import { accountSeedTeams } from "../prisma/account-seed-teams";
import { addressSchema, formatAddress } from "../src/lib/address";

config({ path: ".env.local", quiet: true });
const emailIndex = process.argv.indexOf("--email");
const email = (
  emailIndex >= 0 ? process.argv[emailIndex + 1] : process.env.FLOW_SEED_EMAIL
)
  ?.trim()
  .toLowerCase();
const dryRun = process.argv.includes("--dry-run");
const repairTeams = process.argv.includes("--repair-teams");
const refreshContent = process.argv.includes("--refresh-content");
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  throw new Error("Informe --email conta@exemplo.com ou FLOW_SEED_EMAIL.");
if (
  process.env.NODE_ENV === "production" ||
  !/^postgres(?:ql)?:\/\/[^@]+@(localhost|127\.0\.0\.1):5433\/flow(?:\?|$)/.test(
    process.env.DATABASE_URL ?? "",
  )
)
  throw new Error(
    "Este seed só pode executar no banco local de desenvolvimento do Flow.",
  );
if (!process.env.CLERK_SECRET_KEY)
  throw new Error("Configure CLERK_SECRET_KEY em .env.local.");

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const templates = [
  {
    name: "Flow Studio Centro",
    category: "Beleza",
    slug: "flow-studio-centro",
    description:
      "Beleza que acompanha o seu ritmo. No centro de São Paulo, cuidamos de cabelos, unhas e maquiagem com atenção aos detalhes. Do corte do dia a dia à produção para uma ocasião especial, cada atendimento começa com uma boa conversa e um cuidado pensado para você.",
  },
  {
    name: "Flow Espaço Jardins",
    category: "Bem-estar",
    slug: "flow-espaco-jardins",
    description:
      "Um respiro no coração dos Jardins. Reunimos massagens, alongamento e práticas de relaxamento em um ambiente tranquilo e acolhedor. Nossa equipe escuta suas necessidades para oferecer um atendimento no seu ritmo, com tempo para desacelerar e cuidar de você.",
  },
  {
    name: "Flow Estética Vila Mariana",
    category: "Estética",
    slug: "flow-estetica-vila-mariana",
    description:
      "Cuidado com a pele, atenção a cada detalhe e tempo para você. Na Vila Mariana, oferecemos cuidados faciais e corporais com avaliação individual e acompanhamento próximo. Criamos uma rotina de cuidado que respeita suas necessidades, em um espaço confortável e acolhedor.",
  },
];
// Sample map pins for fictional units; never presented as verified business addresses.
const demoLocations = [
  { latitude: -23.5505, longitude: -46.6333 },
  { latitude: -23.5671492, longitude: -46.6644067 },
  { latitude: -23.58006364948452, longitude: -46.64008274947563 },
];
const demoAddresses = [
  {
    postalCode: "01001-000",
    street: "Praça da Sé",
    number: "121",
    complement: "Sala 12 · 1º andar",
    neighborhood: "Sé",
    city: "São Paulo",
    state: "SP",
  },
  {
    postalCode: "01426-001",
    street: "Rua Oscar Freire",
    number: "525",
    complement: "Conjunto 21 · 2º andar",
    neighborhood: "Cerqueira César",
    city: "São Paulo",
    state: "SP",
  },
  {
    postalCode: "04010-000",
    street: "Rua Domingos de Morais",
    number: "340",
    complement: "Sala 304 · 3º andar",
    neighborhood: "Vila Mariana",
    city: "São Paulo",
    state: "SP",
  },
].map((address, index) =>
  addressSchema.parse({ ...address, location: demoLocations[index] }),
);
const serviceNames: Record<string, string[]> = {
  Beleza: [
    "Corte e finalização",
    "Escova",
    "Hidratação capilar",
    "Coloração",
    "Manicure",
    "Pedicure",
    "Design de sobrancelhas",
    "Maquiagem social",
    "Penteado",
    "Tratamento reconstrutor",
    "Avaliação capilar",
    "Lavagem e finalização express",
  ],
  "Bem-estar": [
    "Massagem relaxante",
    "Massagem terapêutica",
    "Reflexologia",
    "Drenagem linfática",
    "Alongamento guiado",
    "Meditação individual",
    "Avaliação de bem-estar",
    "Aromaterapia",
    "Massagem express",
    "Relaxamento profundo",
    "Massagem com pedras quentes",
    "Sessão de respiração",
  ],
  Estética: [
    "Limpeza de pele",
    "Hidratação facial",
    "Avaliação estética",
    "Massagem facial",
    "Drenagem facial",
    "Hidratação corporal",
    "Esfoliação corporal",
    "Revitalização facial",
    "Protocolo de hidratação profunda",
    "Acompanhamento de cuidados com a pele",
    "Microdermoabrasão",
    "Spa facial",
  ],
};
const fallbackServices = [
  "Avaliação inicial",
  "Atendimento personalizado",
  "Consultoria individual",
  "Sessão de acompanhamento",
  "Atendimento express",
  "Sessão completa",
  "Orientação especializada",
  "Retorno de avaliação",
  "Planejamento personalizado",
  "Atendimento premium",
  "Sessão de manutenção",
  "Consulta de revisão",
];
const days = [1, 2, 3, 4, 5, 6, 0].map((weekday) => ({
  weekday,
  enabled: weekday !== 0,
  intervals:
    weekday === 6
      ? [{ start: "09:00", end: "13:00" }]
      : [
          { start: "09:00", end: "12:00" },
          { start: "13:00", end: "18:00" },
        ],
}));

try {
  const users = await clerk.users.getUserList({
    emailAddress: [email],
    limit: 10,
  });
  const exact = users.data.filter((user) =>
    user.emailAddresses.some(
      (address) => address.emailAddress.toLowerCase() === email,
    ),
  );
  if (exact.length !== 1)
    throw new Error(
      "O email deve identificar exatamente uma conta existente no Clerk.",
    );
  const owner = exact[0].id;
  const subscription = await db.subscription.findUnique({
    where: { ownerId: owner },
  });
  if (
    !subscription ||
    subscription.status !== "active" ||
    subscription.paidUntil <= new Date()
  )
    throw new Error(
      "A conta precisa ter uma assinatura ativa. O seed não cria nem altera assinaturas.",
    );
  if (!["basic", "multi"].includes(subscription.plan))
    throw new Error("Plano desconhecido; seed interrompido.");
  const limits = planFeatures(subscription.plan);
  const before = await db.establishment.findMany({
    where: { ownerId: owner },
    select: {
      name: true,
      active: true,
      _count: {
        select: {
          professionals: { where: { deletedAt: null } },
          services: true,
        },
      },
    },
  });
  console.log(
    JSON.stringify(
      {
        mode: dryRun ? "prévia" : "execução",
        plan: subscription.plan,
        limits: {
          establishments: limits.establishments,
          professionalsPerEstablishment: limits.professionals,
        },
        existing: before,
      },
      null,
      2,
    ),
  );
  if (!dryRun) {
    const suffix = createHash("sha256").update(owner).digest("hex").slice(0, 8);
    const result = await db.$transaction(
      async (tx) => {
        const lockedSubscription = await paidAccount(tx, owner);
        if (lockedSubscription.plan !== subscription.plan)
          throw new Error("O plano mudou durante o seed; execute novamente.");
        const establishments = await tx.establishment.findMany({
          where: { ownerId: owner },
          orderBy: { id: "asc" },
        });
        if (establishments.length > limits.establishments)
          throw new Error(
            "A conta já excede o limite do plano; ajuste os estabelecimentos antes de executar.",
          );
        const created = { establishments: 0, professionals: 0, services: 0 };
        const repaired = {
          professionals: 0,
          services: 0,
          locations: 0,
          bios: 0,
        };
        while (establishments.length < limits.establishments) {
          const input = templates[establishments.length];
          const establishment = await createEstablishment(tx, owner, {
            ...input,
            slug: `${input.slug}-${suffix}`,
            city: "São Paulo, SP",
            addressDetails: demoAddresses[establishments.length],
            approvalMode: "automatic",
            cancelNoticeHours: 2,
          });
          establishments.push(establishment);
          created.establishments++;
        }
        for (const establishment of establishments.filter(
          (item) => item.active,
        )) {
          const professionals = await tx.professional.findMany({
            where: { establishmentId: establishment.id, deletedAt: null },
          });
          const seedIndex = templates.findIndex(
            (template) => establishment.slug === `${template.slug}-${suffix}`,
          );
          const details =
            establishment.addressDetails &&
            typeof establishment.addressDetails === "object" &&
            !Array.isArray(establishment.addressDetails)
              ? establishment.addressDetails
              : {};
          if (refreshContent && seedIndex >= 0) {
            if (templates[seedIndex].description.length > 300)
              throw new Error("A bio excede o limite de 300 caracteres.");
            if (
              establishment.description !== templates[seedIndex].description
            ) {
              await tx.establishment.update({
                where: { id: establishment.id },
                data: { description: templates[seedIndex].description },
              });
              repaired.bios++;
            }
          }
          if (
            seedIndex >= 0 &&
            (establishment.address ===
              "Endereço de demonstração — atualizar antes de publicar" ||
              details.demonstration === true ||
              refreshContent) &&
            (!addressSchema.safeParse(details).success ||
              (refreshContent &&
                JSON.stringify(addressSchema.parse(details)) !==
                  JSON.stringify(demoAddresses[seedIndex])))
          ) {
            const address = demoAddresses[seedIndex];
            await tx.establishment.update({
              where: { id: establishment.id },
              data: {
                address: formatAddress(address),
                city: `${address.city}, ${address.state}`,
                addressDetails: {
                  ...details,
                  ...address,
                  demonstration: true,
                },
              },
            });
            repaired.locations++;
          }
          const names =
            accountSeedTeams[
              seedIndex >= 0
                ? seedIndex
                : establishments.indexOf(establishment) %
                  accountSeedTeams.length
            ];
          // Explicit repair of the old seed only, preserving IDs, schedules and service links.
          if (repairTeams && seedIndex > 0) {
            for (const [index, oldName] of accountSeedTeams[0].entries()) {
              const professional = professionals.find(
                (item) => item.name === oldName,
              );
              if (
                !professional ||
                professionals.some((item) => item.name === names[index])
              )
                continue;
              await tx.professional.update({
                where: { id: professional.id },
                data: { name: names[index] },
              });
              professional.name = names[index];
              repaired.professionals++;
            }
          }
          if (professionals.length > limits.professionals)
            throw new Error(
              `A equipe de ${establishment.name} já excede o limite do plano.`,
            );
          for (const name of names) {
            if (professionals.length >= limits.professionals) break;
            if (
              professionals.some((professional) => professional.name === name)
            )
              continue;
            professionals.push(
              await createProfessional(tx, owner, {
                establishmentId: establishment.id,
                name,
                days,
              }),
            );
            created.professionals++;
          }
          const active = professionals.filter(
            (professional) => professional.active,
          );
          if (!active.length)
            throw new Error(
              `Ative um profissional de ${establishment.name} antes de executar o seed.`,
            );
          const services = await tx.service.findMany({
            where: { establishmentId: establishment.id },
          });
          if (refreshContent && seedIndex >= 0) {
            const replacements: Record<string, string> = {
              "Cuidados express": "Lavagem e finalização express",
              "Cuidados integrativos": "Massagem com pedras quentes",
              "Cuidados corporais": "Hidratação corporal",
              "Tratamento personalizado": "Protocolo de hidratação profunda",
              "Cuidados pós-tratamento":
                "Acompanhamento de cuidados com a pele",
            };
            for (const service of services) {
              const name = replacements[service.name];
              if (!name || services.some((item) => item.name === name))
                continue;
              await tx.service.update({
                where: { id: service.id },
                data: { name },
              });
              service.name = name;
              repaired.services++;
            }
          }
          if (
            repairTeams &&
            seedIndex === 2 &&
            !services.some((service) => service.name === "Microdermoabrasão")
          ) {
            const repeated = services.find(
              (service) => service.name === "Design de sobrancelhas",
            );
            if (repeated) {
              await tx.service.update({
                where: { id: repeated.id },
                data: { name: "Microdermoabrasão" },
              });
              repeated.name = "Microdermoabrasão";
              repaired.services++;
            }
          }
          const labels =
            serviceNames[establishment.category] ?? fallbackServices;
          for (const [index, name] of labels.entries()) {
            // Twelve is the seed target, not a product limit. Existing services are preserved.
            if (services.length >= 12) break;
            if (services.some((service) => service.name === name)) continue;
            const assigned = active
              .filter((_, position) => position % 3 === index % 3)
              .slice(0, 5);
            const service = await createService(tx, owner, {
              establishmentId: establishment.id,
              name,
              durationMinutes: [30, 45, 60, 90][index % 4],
              stepMinutes: 15,
              priceCents:
                index === 10
                  ? 0
                  : [4990, 6990, 8990, 11990, 14990, 19990][index % 6],
              bufferAfter: index % 3 === 0 ? 15 : 0,
              modality: "in_person",
              kind: "individual",
              professionalIds: (assigned.length
                ? assigned
                : active.slice(0, 1)
              ).map((professional) => professional.id),
            });
            services.push(service);
            created.services++;
          }
        }
        return {
          created,
          repaired,
          totals: await tx.establishment.findMany({
            where: { ownerId: owner },
            select: {
              name: true,
              slug: true,
              active: true,
              _count: {
                select: {
                  professionals: { where: { deletedAt: null } },
                  services: true,
                },
              },
            },
          }),
        };
      },
      { timeout: 120000, maxWait: 15000 },
    );
    console.log(JSON.stringify(result, null, 2));
    const [professionals, services] = await Promise.all([
      db.professional.findMany({
        where: { establishment: { ownerId: owner }, deletedAt: null },
        select: { name: true },
      }),
      db.service.findMany({
        where: { establishment: { ownerId: owner } },
        select: { name: true },
      }),
    ]);
    console.log(
      JSON.stringify(
        {
          professionals: professionals.length,
          uniqueProfessionalNames: new Set(
            professionals.map((item) => item.name),
          ).size,
          services: services.length,
          uniqueServiceNames: new Set(services.map((item) => item.name)).size,
        },
        null,
        2,
      ),
    );
    console.log(
      "Seed concluído. Cadastros existentes e assinatura preservados. Executar novamente não duplica os dados.",
    );
  }
} finally {
  await db.$disconnect();
}
