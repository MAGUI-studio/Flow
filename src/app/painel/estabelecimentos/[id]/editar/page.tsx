import { notFound } from "next/navigation";
import { ownerContext } from "@/lib/panel-context";
import { prisma } from "@/lib/prisma";
import { BusinessForm } from "@/components/internal/business-form";
import { PageHeading } from "@/components/internal/primitives";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await ownerContext();
  const { id } = await params;
  const e = await prisma().establishment.findFirst({
    where: { id, ownerId: userId, active: true },
  });
  if (!e) notFound();
  return (
    <>
      <PageHeading
        eyebrow="SEU NEGÓCIO"
        title="Cada detalhe do seu espaço."
        description="Atualize a apresentação, a imagem de capa e os contatos do seu estabelecimento."
      />
      <BusinessForm
        kind="establishment"
        business={{ id: e.id, name: e.name, timezone: e.timezone }}
        initialEstablishment={{
          id: e.id,
          name: e.name,
          slug: e.slug,
          category: e.category,
          description: e.description ?? "",
          city: e.city ?? "",
          address: e.address ?? "",
          ...(e.addressDetails ? { addressDetails: e.addressDetails } : {}),
          contactPhone: e.contactPhone ?? "",
          website: e.website ?? "",
          instagram: e.instagram ?? "",
          coverUrl: e.coverUrl,
          approvalMode: e.approvalMode,
          cancelNoticeHours: e.cancelNoticeHours,
        }}
      />
    </>
  );
}
