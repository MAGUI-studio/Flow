import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Editar profissional",
  "Atualize os dados, a foto e a disponibilidade do profissional.",
  "/painel/profissionais",
  true,
);
import { weeklyScheduleSchema } from "@/lib/weekly-schedule";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { panelContext } from "@/lib/panel-context";
import { prisma } from "@/lib/prisma";
import { dayKey } from "@/lib/format";
import { panelHref, type SearchInput } from "@/lib/url-state";
import { PageHeading } from "@/components/internal/primitives";
import { ProfessionalEditForm } from "@/components/internal/professional-edit-form";
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
  const p = await prisma().professional.findFirst({
    where: { id: id.data, establishmentId: business.id },
    include: { photo: { select: { url: true } } },
  });
  if (!p) notFound();
  if (p.deletedAt) redirect(panelHref("/painel/profissionais", business.id));
  const parsedSchedule = weeklyScheduleSchema.safeParse(p.weeklySchedule);
  const onVacation = !!p.vacationEndsAt && p.vacationEndsAt > new Date();
  return (
    <div className="[&_.internal-page-heading]:mb-4 [&_.internal-page-heading_h1]:m-0 [&_.internal-page-heading_h1]:text-3xl [&_.internal-page-heading_h1]:leading-tight [&_.internal-page-heading_p]:mt-1.5 [&_.internal-eyebrow]:mb-1.5 [&_.internal-back]:mb-3">
      <PageHeading
        eyebrow={business.name}
        title="Cada pessoa, seu cuidado."
        description="Edite os dados do profissional e organize sua disponibilidade."
        back={{
          href: panelHref("/painel/profissionais", business.id),
          label: "Seus profissionais",
        }}
      />
      <ProfessionalEditForm
        business={business}
        schedule={parsedSchedule.success ? parsedSchedule.data : null}
        professional={{
          id: p.id,
          name: p.name,
          photoUrl: p.photo?.url,
          status: !p.active ? "inactive" : onVacation ? "vacation" : "active",
          start: p.vacationStartsAt
            ? dayKey(p.vacationStartsAt, business.timezone)
            : "",
          end: p.vacationEndsAt
            ? dayKey(
                new Date(p.vacationEndsAt.getTime() - 1),
                business.timezone,
              )
            : "",
        }}
      />
    </div>
  );
}
