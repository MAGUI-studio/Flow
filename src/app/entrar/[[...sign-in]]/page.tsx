import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Entrar",
  "Entre na sua conta Flow para gerenciar agendamentos, favoritos e seu negócio.",
  "/entrar",
  true,
);
import { AuthPage } from "@/components/auth-page";
export default async function Page({
  params,
}: {
  params: Promise<{ "sign-in"?: string[] }>;
}) {
  return (
    <AuthPage mode="sign-in" rootPage={!(await params)["sign-in"]?.length} />
  );
}
