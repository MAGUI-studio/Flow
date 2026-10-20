import { z } from "zod";

export const websiteSchema = z
  .string()
  .trim()
  .max(300)
  .transform((value) => {
    if (!value) return "";
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
  })
  .refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return (
        ["http:", "https:"].includes(url.protocol) &&
        url.hostname.includes(".") &&
        !url.username &&
        !url.password
      );
    } catch {
      return false;
    }
  }, "Informe um site válido.");
export const instagramSchema = z
  .string()
  .trim()
  .max(150)
  .transform((value) =>
    value
      .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
      .replace(/^@/, "")
      .replace(/\/$/, ""),
  )
  .refine(
    (value) => !value || /^[a-zA-Z0-9._]{1,30}$/.test(value),
    "Informe um usuário ou link válido do Instagram.",
  );
export const businessContactsSchema = z.object({
  website: websiteSchema.optional().default(""),
  instagram: instagramSchema.optional().default(""),
  bannerId: z.union([z.string().uuid(), z.literal("")]).optional(),
});
