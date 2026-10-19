export function normalizeAppUrl(value: string) {
  const url = new URL(value.trim());
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  )
    throw new Error(
      "NEXT_PUBLIC_APP_URL deve ser uma URL pública HTTP ou HTTPS, sem parâmetros.",
    );
  return url.toString().replace(/\/+$/, "");
}
export const appUrl = normalizeAppUrl(
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
);
export const appAddress = appUrl.replace(/^https?:\/\//, "");
export function businessPageUrl(slug: string) {
  return `${appUrl}/${encodeURIComponent(slug)}`;
}
