import Link from "next/link";
import {
  CheckCircleIcon,
  CircleIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react/ssr";
import { panelContext } from "@/lib/panel-context";
import { setupState } from "@/lib/business-setup";
import { prisma } from "@/lib/prisma";
import { panelHref, type SearchInput } from "@/lib/url-state";
import { BusinessOnboarding } from "@/components/internal/business-onboarding";
import { PageHeading } from "@/components/internal/primitives";
import { PublishBusiness } from "@/components/publish-business";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Configurar meu negócio",
  "Prepare sua equipe, serviços e horários antes de publicar seu estabelecimento.",
  "/painel/configuracao",
  true,
);
export default async function Page({
  searchParams,
}: {
  searchParams: SearchInput;
}) {
  const context = await panelContext(searchParams);
  if (!context.business) return <BusinessOnboarding />;
  const s = await setupState(prisma(), context.business.id, context.userId);
  const link = (p: string) => panelHref(p, s.business.id);
  const steps = [
    {
      title: "Apresente seu estabelecimento",
      description:
        "Revise nome, contatos e endereço para atendimentos presenciais.",
      done: s.address,
      href: link(`/painel/estabelecimentos/${s.business.id}/editar`),
    },
    {
      title: "Adicione sua equipe",
      description:
        "Cadastre pelo menos um profissional que vai realizar os atendimentos.",
      done: s.team,
      href: link("/painel/profissionais"),
    },
    {
      title: "Vincule seus serviços",
      description:
        "Cadastre os serviços e escolha os profissionais que podem realizá-los.",
      done: s.services,
      href: link("/painel/servicos"),
    },
    {
      title: "Abra os horários",
      description:
        "Configure os horários da equipe. Para serviços em grupo, crie uma sessão.",
      done: s.availability,
      href: link(
        s.business.services.some((v) => v.kind === "collective")
          ? "/painel/sessoes"
          : "/painel/profissionais",
      ),
    },
  ];
  return (
    <>
      <PageHeading
        eyebrow="PASSO A PASSO"
        title="Prepare seu negócio para receber clientes."
        description={`Configure ${s.business.name} no seu ritmo. Seus dados ficam salvos a cada etapa.`}
      />
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-7">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="m-0! text-sm text-zinc-500">
            {steps.filter((v) => v.done).length} de {steps.length} etapas
            concluídas
          </p>
          <span className="rounded-full bg-[#F5F4FF] px-3 py-1.5 text-xs font-medium text-[#635BFF]">
            {s.business.published ? "Página publicada" : "Página em preparação"}
          </span>
        </div>
        <ol className="divide-y divide-zinc-100">
          {steps.map((v, i) => (
            <li key={v.title}>
              <Link
                href={v.href}
                className="grid grid-cols-[24px_minmax(0,1fr)_18px] items-start gap-x-4 py-5 focus-visible:outline-2 focus-visible:outline-[#635BFF]"
              >
                {v.done ? (
                  <CheckCircleIcon
                    size={24}
                    weight="fill"
                    className="shrink-0 text-[#635BFF]"
                  />
                ) : (
                  <CircleIcon size={24} className="shrink-0 text-zinc-300" />
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="m-0! text-sm leading-6 font-semibold">
                    {i + 1}. {v.title}
                  </h2>
                  <p className="m-0! mt-1! text-xs leading-6 text-zinc-500">
                    {v.description}
                  </p>
                </div>
                <ArrowRightIcon
                  size={18}
                  className="self-center text-[#635BFF]"
                />
              </Link>
            </li>
          ))}
        </ol>
        <div className="mt-6 border-t border-zinc-100 pt-6">
          <PublishBusiness
            id={s.business.id}
            published={s.business.published}
            ready={s.ready}
          />
          {s.business.published && (
            <Link
              href={`/${s.business.slug}`}
              className="mt-4 inline-flex text-xs font-medium text-[#635BFF]"
            >
              Ver minha página publicada →
            </Link>
          )}
        </div>
      </section>
    </>
  );
}
