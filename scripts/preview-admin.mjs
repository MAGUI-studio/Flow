// Isolated visual fixture. Does not run an admin route or connect to any data provider.
import { build } from "esbuild";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { createServer } from "node:http";
const root = process.cwd();
const result = await build({
  entryPoints: [resolve("tests/e2e/fixtures/admin.tsx")],
  absWorkingDir: root,
  tsconfig: resolve("tsconfig.json"),
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"test"' },
  alias: {
    "next/link": resolve("tests/e2e/fixtures/link.tsx"),
    "next/navigation": resolve("tests/e2e/fixtures/admin-navigation.ts"),
    "@clerk/nextjs": resolve("tests/e2e/fixtures/admin-clerk.tsx"),
  },
  plugins: [
    {
      name: "isolated-admin-action",
      setup(builder) {
        builder.onLoad(
          { filter: /[/\\]src[/\\]app[/\\]admin[/\\]actions\.ts$/ },
          () => ({
            contents:
              "export async function performAdminAction(){return {ok:true}}",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const css = await postcss([tailwind({ base: root })]).process(
  '@import "./src/app/globals.css"; @import "./src/app/internal.css";',
  { from: resolve("test-results-admin-preview.css") },
);
createServer(async (req, res) => {
  try {
    const path = new URL(req.url, "http://localhost").pathname;
    if (path === "/preview.js") {
      res.setHeader("Content-Type", "text/javascript");
      res.end(result.outputFiles[0].contents);
      return;
    }
    if (path === "/preview.css") {
      res.setHeader("Content-Type", "text/css");
      res.end(css.css);
      return;
    }
    if (path.startsWith("/brand/")) {
      const file = resolve(root, "public", `.${path}`);
      if (!file.startsWith(resolve(root, "public") + sep))
        throw Error("Invalid path");
      res.setHeader("Content-Type", "image/svg+xml");
      res.end(await readFile(file));
      return;
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(
      '<!doctype html><html lang="pt-BR"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Prévia administrativa · Flow</title><link rel="stylesheet" href="/preview.css"></head><body><div id="preview" class="mx-auto max-w-440"></div><script src="/preview.js"></script></body></html>',
    );
  } catch {
    res.statusCode = 404;
    res.end("Not found");
  }
}).listen(3011, "127.0.0.1", () =>
  console.log("Isolated admin UI preview: http://localhost:3011/admin"),
);
