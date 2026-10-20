import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Criar conta",
  "Crie sua conta Flow para agendar serviços, salvar espaços e organizar seu negócio.",
  "/criar-conta",
  true,
);
import { AuthPage } from "@/components/auth-page";
export default async function Page({
  params,
}: {
  params: Promise<{ "sign-up"?: string[] }>;
}) {
  return (
    <AuthPage mode="sign-up" rootPage={!(await params)["sign-up"]?.length} />
  );
}
