import { config } from "dotenv";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
config({ path: ".env.local", quiet: true });
const require = createRequire(import.meta.url);
if (!/^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY ?? ""))
  throw new Error("Configure uma chave de teste em .env.local.");
const shim = require.resolve("@stripe/cli/bin/shim.js");
const child = spawn(
  process.execPath,
  [
    shim,
    "listen",
    "--events",
    "customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.paid,invoice.payment_failed,charge.refunded,charge.dispute.created,radar.early_fraud_warning.created",
    "--forward-to",
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/billing/webhook`,
  ],
  {
    env: { ...process.env, STRIPE_API_KEY: process.env.STRIPE_SECRET_KEY },
    stdio: ["inherit", "pipe", "pipe"],
  },
);
let pending = "";
function output(chunk) {
  pending += chunk.toString();
  const lines = pending.split(/\r?\n/);
  pending = lines.pop() ?? "";
  for (const line of lines) {
    const secret = line.match(/whsec_[A-Za-z0-9]+/)?.[0];
    if (secret) {
      let env = readFileSync(".env.local", "utf8");
      for (const [name, value] of Object.entries({
        STRIPE_WEBHOOK_SECRET: secret,
        FLOW_BILLING_ENABLED: "true",
        DEV_SUBSCRIPTIONS_ENABLED: "false",
      })) {
        const pattern = new RegExp(`^${name}=.*$`, "m");
        env = pattern.test(env)
          ? env.replace(pattern, `${name}=${value}`)
          : `${env}\n${name}=${value}\n`;
      }
      writeFileSync(".env.local", env);
      process.send?.({ type: "stripe-ready" });
      console.log(
        "Webhook local conectado. Segredo salvo em .env.local; reinicie o Next.js se necessário.",
      );
    } else
      console.log(line.replace(/(?:sk|rk)_test_[A-Za-z0-9]+/g, "[redacted]"));
  }
}
child.stdout.on("data", output);
child.stderr.on("data", output);
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill());
process.on("message", (message) => {
  if (message?.type === "stop") {
    child.kill();
    process.disconnect?.();
  }
});
