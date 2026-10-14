import { AuthPage } from "@/components/auth-page";
export const metadata = { title: "Entrar · Flow" };
export default async function Page({
  params,
}: {
  params: Promise<{ "sign-in"?: string[] }>;
}) {
  return (
    <AuthPage mode="sign-in" rootPage={!(await params)["sign-in"]?.length} />
  );
}
