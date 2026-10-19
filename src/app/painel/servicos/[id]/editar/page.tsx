import { notFound } from "next/navigation";
import { z } from "zod";
import { panelContext } from "@/lib/panel-context";
import { prisma } from "@/lib/prisma";
import { panelHref, type SearchInput } from "@/lib/url-state";
import { PageHeading } from "@/components/internal/primitives";
import { BusinessForm } from "@/components/internal/business-form";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchInput;
}) {
  const { business } = await panelContext(searchParams);
  const id = z
    .string()
    .uuid()
    .safeParse((await params).id);
  if (!business || !id.success) notFound();
  const service = await prisma().service.findFirst({
    where: { id: id.data, establishmentId: business.id, active: true },
    include: { professionals: true },
  });
  if (!service) notFound();
  const professionals = await prisma().professional.findMany({
    where: {
      establishmentId: business.id,
      deletedAt: null,
      OR: [
        { active: true },
        {
          id: { in: service.professionals.map((link) => link.professionalId) },
        },
      ],
    },
    orderBy: { name: "asc" },
  });
  return (
    <>
      <PageHeading
        eyebrow={business.name}
        title="Editar serviço"
        description="Atualize os dados, valores e profissionais deste atendimento."
        back={{
          href: panelHref("/painel/servicos", business.id),
          label: "Seus serviços",
        }}
      />
      <BusinessForm
        kind="service"
        business={business}
        professionals={professionals}
        initialService={{
          id: service.id,
          name: service.name,
          kind: service.kind === "collective" ? "collective" : "individual",
          modality: service.modality === "online" ? "online" : "in_person",
          durationMinutes: service.durationMinutes,
          stepMinutes: service.stepMinutes,
          bufferBefore: service.bufferBefore,
          bufferAfter: service.bufferAfter,
          price: (service.priceCents / 100).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
          free: service.priceCents === 0,
          professionalIds: service.professionals.map(
            (link) => link.professionalId,
          ),
        }}
      />
    </>
  );
}
