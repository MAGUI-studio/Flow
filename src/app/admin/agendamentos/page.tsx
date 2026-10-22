import { requireAdminPage, adminPageNumber } from "@/lib/admin";
import {
  readAdminFilters,
  adminDateRange,
  adminFilterDefaults,
} from "@/lib/admin-filters";
import { searchAdminUsers } from "@/lib/admin-directory";
import { adminRecordFields, adminValueLabels } from "@/lib/admin-labels";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import {
  AdminHeading,
  AdminPagination,
  AdminEmpty,
} from "@/components/admin/primitives";
import { AdminSearch } from "@/components/admin/search";
import { AdminRecordsTable } from "@/components/admin/records-table";
import type { SearchInput } from "@/lib/url-state";
export default async function Page({
  searchParams,
}: {
  searchParams: SearchInput;
}) {
  await requireAdminPage();
  const raw = await searchParams,
    f = readAdminFilters(raw),
    page = adminPageNumber(raw.pagina),
    size = Number(f.limite);
  const matched = f.busca
    ? (
        await searchAdminUsers({ ...adminFilterDefaults, busca: f.busca }, true)
      ).users.map((u) => u.id)
    : [];
  const where: Prisma.BookingWhereInput = {
    ...(f.status !== "all" ? { status: f.status } : {}),
    ...(f.busca
      ? {
          OR: [
            { consumerId: { contains: f.busca, mode: "insensitive" } },
            { consumerId: { in: matched } },
            { whatsapp: { contains: f.busca } },
            {
              session: {
                establishment: {
                  name: { contains: f.busca, mode: "insensitive" },
                },
              },
            },
            {
              session: {
                service: { name: { contains: f.busca, mode: "insensitive" } },
              },
            },
            {
              session: {
                professional: {
                  name: { contains: f.busca, mode: "insensitive" },
                },
              },
            },
          ],
        }
      : {}),
    ...(f.de || f.ate ? { session: { startsAt: adminDateRange(f) } } : {}),
  };
  const [bookings, total] = await Promise.all([
    prisma().booking.findMany({
      where,
      skip: (page - 1) * size,
      take: size,
      orderBy: [
        { session: { startsAt: f.ordem === "oldest" ? "asc" : "desc" } },
        { id: "asc" },
      ],
      include: {
        session: {
          include: {
            establishment: { select: { name: true, ownerId: true } },
            service: { select: { name: true } },
            professional: { select: { name: true } },
          },
        },
      },
    }),
    prisma().booking.count({ where }),
  ]);
  return (
    <>
      <AdminHeading
        title="Agendamentos"
        description="Consulte os atendimentos de todos os negócios, clientes e profissionais da plataforma."
      />
      <AdminSearch
        placeholder="Buscar cliente, e-mail, negócio, serviço, profissional ou telefone"
        filters={["status", "de", "ate", "ordem", "limite"]}
        options={{
          status: [
            ["all", "Todas as situações"],
            ...[
              "confirmed",
              "pending",
              "completed",
              "canceled",
              "expired",
              "declined",
              "no_show",
            ].map((s) => [s, adminValueLabels[s]] as [string, string]),
          ],
          ordem: [
            ["newest", "Horários mais recentes"],
            ["oldest", "Horários mais antigos"],
          ],
        }}
      />
      {bookings.length ? (
        <AdminRecordsTable
          title="Agendamentos da plataforma"
          columns={["Estabelecimento", "Serviço", "Início", "Situação"]}
          records={bookings.map((b) => ({
            id: b.id,
            fields: adminRecordFields({
              ID: b.id,
              Estabelecimento: b.session.establishment.name,
              Serviço: b.session.service.name,
              Profissional: b.session.professional.name,
              Cliente: b.consumerId,
              Responsável: b.session.establishment.ownerId,
              WhatsApp: b.whatsapp,
              Início: b.session.startsAt,
              Fim: b.session.endsAt,
              Status: b.status,
              Finalidade: b.purpose,
              "Preço (centavos)": b.priceCents,
              "Duração (min)": b.durationMinutes,
              "Criado em": b.createdAt,
              Chegada: b.arrivedAt,
              Presença: b.attendanceAt,
              "Conclusão automática": b.completedAutomatically,
            }),
          }))}
        />
      ) : (
        <AdminEmpty>
          Nenhum agendamento corresponde aos filtros selecionados.
        </AdminEmpty>
      )}
      <AdminPagination
        page={page}
        total={total}
        path="/admin/agendamentos"
        search={f.busca}
        size={size}
      />
    </>
  );
}
