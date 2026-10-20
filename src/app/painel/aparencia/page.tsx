import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Aparência do estabelecimento",
  "Personalize o visual da página pública do seu estabelecimento.",
  "/painel/aparencia",
  true,
);
import { panelContext } from "@/lib/panel-context";
import type { SearchInput } from "@/lib/url-state";
import { PageHeading } from "@/components/internal/primitives";
import { TemplatePicker } from "@/components/internal/template-picker";
import { BusinessOnboarding } from "@/components/internal/business-onboarding";
export default async function Page({
  searchParams,
}: {
  searchParams: SearchInput;
}) {
  const context = await panelContext(searchParams);
  if (!context.business) return <BusinessOnboarding title="Aparência" />;
  return (
    <>
      <PageHeading
        eyebrow={context.business.name}
        title="Sua página, seu estilo."
        description="Escolha um template para apresentar seu espaço e receber seus clientes."
      />
      <TemplatePicker
        key={context.business.id}
        business={context.business}
        plan={context.subscription.plan}
      />
    </>
  );
}
