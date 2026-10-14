import { redirectAuth } from "@/lib/auth-redirect";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ "sign-in"?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return redirectAuth("/entrar", (await params)["sign-in"], await searchParams);
}
