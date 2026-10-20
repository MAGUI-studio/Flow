import { readFileSync } from "node:fs";
import { parse } from "dotenv";
import { createClerkClient } from "@clerk/nextjs/server";
import { UTApi } from "uploadthing/server";
const env = parse(readFileSync(".env.homolog"));
try {
  await createClerkClient({
    secretKey: env.CLERK_SECRET_KEY,
  }).users.getUserList({ limit: 1 });
  console.log("Clerk test instance: API credentials accepted");
  await new UTApi({ token: env.UPLOADTHING_TOKEN }).getUsageInfo();
  console.log("UploadThing: token accepted");
  const required = [
    "DATABASE_URL",
    "DIRECT_DATABASE_URL",
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_PRICE_BASIC",
    "STRIPE_PRICE_MULTI",
    "STRIPE_PORTAL_CONFIGURATION",
    "FLOW_BILLING_ENABLED",
    "UPLOADTHING_TOKEN",
    "CRON_SECRET",
  ];
  const missing = required.filter((key) => !env[key]);
  if (missing.length)
    throw new Error(`Variáveis pendentes: ${missing.join(", ")}`);
  console.log(
    `Homologation environment: ${required.length} required variables populated; secrets not displayed`,
  );
} catch {
  console.error(
    "Falha na validação de um provedor ou variável de homologação; nenhum segredo exibido.",
  );
  process.exitCode = 1;
}
