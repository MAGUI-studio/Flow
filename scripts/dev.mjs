import { config } from "dotenv";
import { fork, spawn } from "node:child_process";
import { createRequire } from "node:module";
config({ path: ".env.local", quiet: true });
const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const portIndex = args.findIndex((arg) => arg === "--port" || arg === "-p");
const configuredUrl = new URL(
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
);
const port =
  portIndex >= 0
    ? args[portIndex + 1]
    : process.env.PORT || configuredUrl.port || "3000";
if (["localhost", "127.0.0.1"].includes(configuredUrl.hostname))
  configuredUrl.port = port;
const devUrl = configuredUrl.toString().replace(/\/$/, "");
process.env.NEXT_PUBLIC_APP_URL = devUrl;
const nextArgs = portIndex >= 0 ? args : [...args, "--port", port];
let app;
let listener;
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  app?.kill();
  if (listener?.connected) listener.send({ type: "stop" });
  process.exitCode = code;
}
function startApp() {
  config({ path: ".env.local", override: true, quiet: true });
  process.env.NEXT_PUBLIC_APP_URL = devUrl;
  app = spawn(
    process.execPath,
    [require.resolve("next/dist/bin/next"), "dev", ...nextArgs],
    { stdio: "inherit", env: process.env },
  );
  app.on("exit", (code) => stop(code ?? 0));
  app.on("error", () => stop(1));
}
if (
  /^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY ?? "") &&
  process.env.FLOW_BILLING_ENABLED === "true" &&
  process.env.STRIPE_PRICE_BASIC &&
  process.env.STRIPE_PRICE_MULTI
) {
  console.log("Conectando o webhook Stripe de teste antes de iniciar o Flow…");
  listener = fork(new URL("./stripe-listen.mjs", import.meta.url), [], {
    stdio: ["inherit", "inherit", "inherit", "ipc"],
  });
  const startup = setTimeout(() => {
    console.error(
      "O webhook Stripe não conectou. Confira a rede e execute npm run dev novamente.",
    );
    stop(1);
  }, 45000);
  listener.on("message", (message) => {
    if (message?.type === "stripe-ready" && !app && !stopping) {
      clearTimeout(startup);
      startApp();
    }
  });
  listener.on("exit", (code) => {
    clearTimeout(startup);
    if (!stopping) {
      console.error("A conexão do webhook Stripe foi encerrada.");
      stop(code || 1);
    }
  });
} else startApp();
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
