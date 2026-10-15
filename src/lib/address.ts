import { z } from "zod";
export const locationSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
});
export type LocationPoint = z.infer<typeof locationSchema>;
export const addressSchema = z.object({
  postalCode: z
    .string()
    .regex(/^\d{5}-?\d{3}$/, "Informe um CEP com 8 dígitos."),
  street: z.string().trim().min(1, "Informe o logradouro.").max(150),
  number: z.string().trim().min(1, "Informe o número ou S/N.").max(20),
  complement: z.string().trim().max(100).default(""),
  neighborhood: z.string().trim().min(1, "Informe o bairro.").max(100),
  city: z.string().trim().min(1, "Informe a cidade.").max(100),
  state: z
    .string()
    .regex(
      /^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$/,
      "Informe uma UF válida.",
    ),
  location: locationSchema.optional(),
});
export const optionalAddressSchema = z.preprocess((value) => {
  if (
    value &&
    typeof value === "object" &&
    Object.values(value).every((v) => !v)
  )
    return undefined;
  return value;
}, addressSchema.optional());
export function formatAddress(address: z.infer<typeof addressSchema>) {
  return `${address.street}, ${address.number}${address.complement ? ` · ${address.complement}` : ""} · ${address.neighborhood} · CEP ${address.postalCode}`;
}
