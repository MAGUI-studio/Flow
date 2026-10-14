import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { Header } from "@/components/header";
import { CancelBooking } from "@/components/cancel-booking";
import { prisma } from "@/lib/prisma";
import { money, statusLabel } from "@/lib/format";
export default async function Page() {
  const { userId } = await auth.protect();
  const bookings = await prisma().booking.findMany({
    where: { consumerId: userId },
    include: {
      session: {
        include: { establishment: true, service: true, professional: true },
      },
    },
    orderBy: { session: { startsAt: "desc" } },
  });
  return (
    <>
      <Header />
      <main className="wrap page-intro">
        <div className="eyebrow" style={{ justifyContent: "flex-start" }}>
          SEU TEMPO, ORGANIZADO
        </div>
        <h1>Meus agendamentos</h1>
        <div className="account-links">
          <Link href="/painel" className="button secondary">
            Painel do meu negócio ↗
          </Link>
          <Link href="/#explorar" className="button">
            Agendar um serviço →
          </Link>
        </div>
        {!bookings.length ? (
          <section className="panel empty">
            <h2>Qual será seu próximo momento?</h2>
            <p className="muted-text">
              Você ainda não tem agendamentos. Encontre um profissional e
              escolha seu horário.
            </p>
          </section>
        ) : (
          bookings.map((b) => {
            const status =
              b.status === "pending" && b.expiresAt && b.expiresAt <= new Date()
                ? "expired"
                : b.status;
            const e = b.session.establishment;
            const canCancel =
              ["pending", "confirmed"].includes(status) &&
              b.session.startsAt.getTime() - Date.now() >=
                e.cancelNoticeHours * 3600000;
            return (
              <article className="panel booking-record" key={b.id}>
                <div>
                  <span className="badge">{statusLabel[status]}</span>
                  <h2 style={{ marginTop: 12 }}>{b.session.service.name}</h2>
                  <p className="muted-text">
                    {e.name} · {b.session.professional.name}
                  </p>
                  <p className="muted-text">
                    {b.session.startsAt.toLocaleString("pt-BR", {
                      timeZone: e.timezone,
                      dateStyle: "long",
                      timeStyle: "short",
                    })}{" "}
                    · {b.durationMinutes} min
                  </p>
                  <strong>{money(b.priceCents)}</strong>
                  {status === "pending" && b.expiresAt && (
                    <p className="muted-text">
                      Aguardando resposta até{" "}
                      {b.expiresAt.toLocaleString("pt-BR", {
                        timeZone: e.timezone,
                      })}
                      .
                    </p>
                  )}
                  {!canCancel && ["pending", "confirmed"].includes(status) && (
                    <p className="muted-text">
                      Para alterações, entre em contato com o estabelecimento.
                    </p>
                  )}
                </div>
                {canCancel && <CancelBooking id={b.id} />}
              </article>
            );
          })
        )}
      </main>
    </>
  );
}
