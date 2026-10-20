export const reservedSlugs = [
  "painel",
  "planos",
  "assinatura",
  "agendamentos",
  "favoritos",
  "explorar",
  "entrar",
  "sign-in",
  "sign-up",
  "criar-conta",
  "api",
  "admin",
];
export function businessSlug(name: string) {
  let slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!slug) return "";
  if (slug.length < 3 || reservedSlugs.includes(slug)) slug += "-espaco";
  return slug.slice(0, 70).replace(/-$/, "");
}
