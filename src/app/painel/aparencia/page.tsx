import { panelContext } from "@/lib/panel-context";
import type { SearchInput } from "@/lib/url-state";
import { PageHeading, EmptyState } from "@/components/internal/primitives";
import { TemplatePicker } from "@/components/internal/template-picker";
export default async function Page({
  searchParams,
}: {
  searchParams: SearchInput;
}) {
  const context = await panelContext(searchParams);
  return (
    <>
      <PageHeading
        eyebrow="COM A CARA DO SEU NEGÓCIO"
        title="Sua página, seu estilo."
        description="Escolha um template para apresentar seu espaço e receber seus clientes."
      />
      {context.business ? (
        <TemplatePicker
          key={context.business.id}
          business={context.business}
          plan={context.subscription.plan}
        />
      ) : (
        <EmptyState
          title="Seu primeiro passo"
          description="Cadastre um estabelecimento para escolher sua aparência."
          href="/painel/estabelecimentos/novo"
          label="Criar estabelecimento"
        />
      )}
    </>
  );
}
