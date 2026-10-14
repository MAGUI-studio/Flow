import { AuthPage } from "@/components/auth-page";
export const metadata = { title: "Criar conta · Flow" };
export default async function Page({
  params,
}: {
  params: Promise<{ "sign-up"?: string[] }>;
}) {
  return (
    <AuthPage mode="sign-up" rootPage={!(await params)["sign-up"]?.length} />
  );
}
