import { currentUser, apiError } from "@/lib/access";
import { reportRows } from "@/lib/reports";
import { reportDays, csvDocument } from "@/lib/report-utils";
import { statusLabel } from "@/lib/format";
export async function GET(request: Request) {
  try {
    const owner = await currentUser();
    const query = new URL(request.url).searchParams;
    const business = query.get("estabelecimento");
    if (
      business &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        business,
      )
    )
      throw new Error("INVALID_INPUT");
    const days = reportDays(query.get("dias"));
    const rows = await reportRows(owner, business, days);
    const csv = csvDocument([
      [
        "Agendamento",
        "Estabelecimento",
        "Início (UTC)",
        "Serviço",
        "Profissional",
        "Status",
        "Valor do serviço (R$)",
      ],
      ...rows.map((row) => [
        row.id,
        row.establishment,
        row.startsAt.toISOString(),
        row.service,
        row.professional,
        statusLabel[row.status] ?? row.status,
        (row.priceCents / 100).toFixed(2).replace(".", ","),
      ]),
    ]);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="flow-agendamentos-${days}-dias.csv"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
