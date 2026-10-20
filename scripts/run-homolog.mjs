import { readFileSync } from "node:fs";
import { parse } from "dotenv";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const [command, ...args] = process.argv.slice(2);
if (!["build", "start", "migrate"].includes(command))
  throw new Error("Use build, start ou migrate.");
const env = { ...process.env, ...parse(readFileSync(".env.homolog")) };
const file =
  command === "migrate"
    ? require.resolve("prisma/build/index.js")
    : require.resolve("next/dist/bin/next");
const child = spawn(
  process.execPath,
  command === "build" && process.env.npm_execpath
    ? [process.env.npm_execpath, "run", "build"]
    : [
        file,
        ...(command === "migrate" ? ["migrate", "deploy"] : [command, ...args]),
      ],
  { env, stdio: "inherit" },
);
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
