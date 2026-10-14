import { redirectAuth } from "@/lib/auth-redirect";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ "sign-up"?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return redirectAuth(
    "/criar-conta",
    (await params)["sign-up"],
    await searchParams,
  );
}
