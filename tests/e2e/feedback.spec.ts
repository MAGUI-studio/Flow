import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import { resolve } from "node:path";
let script: string;
test.beforeAll(async () => {
  test.setTimeout(120000);
  const result = await build({
    entryPoints: [resolve("tests/e2e/fixtures/entry.tsx")],
    bundle: true,
    write: false,
    format: "iife",
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"test"' },
    alias: {
      "@clerk/nextjs": resolve("tests/e2e/fixtures/clerk.ts"),
      "next/link": resolve("tests/e2e/fixtures/link.tsx"),
      "next/navigation": resolve("tests/e2e/fixtures/navigation.ts"),
    },
  });
  script = result.outputFiles[0].text;
});
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    const node = document.createElement("div");
    node.id = "flow-test-root";
    node.style.cssText =
      "position:fixed;inset:0;z-index:1000;background:white;overflow:auto";
    document.body.appendChild(node);
  });
});
test("notification drawer stays inside the layout, animates, and persists read state", async ({
  page,
}, info) => {
  if (info.project.name === "desktop")
    await page.setViewportSize({ width: 2560, height: 1100 });
  let read = false;
  await page.route("**/api/notifications", async (route) => {
    if (route.request().method() === "PATCH") {
      read = true;
      await route.fulfill({ json: { updated: true } });
    } else
      await route.fulfill({
        json: {
          unread: read ? 0 : 1,
          items: [
            {
              id: "00000000-0000-4000-8000-000000000001",
              title: "Agendamento confirmado",
              body: "Corte em Studio Aurora.",
              href: "/agendamentos",
              readAt: read ? new Date().toISOString() : null,
              createdAt: new Date().toISOString(),
            },
          ],
        },
      });
  });
  await page.addScriptTag({ content: script });
  await page.getByRole("button", { name: /Notificações/ }).click();
  const drawer = page.getByRole("dialog", { name: "Suas notificações" });
  await expect(drawer).toBeVisible();
  await expect(
    drawer.getByText("Agendamento confirmado", { exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(300);
  const box = (await drawer.boundingBox())!;
  const width = page.viewportSize()!.width;
  expect(Math.round(box.x + box.width)).toBe(
    Math.round(width > 1760 ? (width + 1760) / 2 : width),
  );
  await page.screenshot({
    path: info.outputPath("notifications.png"),
    animations: "disabled",
  });
  await drawer.getByRole("button", { name: "Marcar todas como lidas" }).click();
  await expect(drawer.getByText("0 não lidas", { exact: true })).toBeVisible();
  await drawer.getByRole("button", { name: "Fechar notificações" }).click();
  await expect(drawer).toBeVisible();
  await expect(drawer).toHaveCount(0);
});
test("leaving an edited form requires confirmation and restoring the original clears it", async ({
  page,
}) => {
  await page.route("**/api/notifications", (route) =>
    route.fulfill({ json: { items: [], unread: 0 } }),
  );
  await page.addScriptTag({ content: script });
  const input = page.getByRole("textbox", { name: "Nome para edição" });
  await input.fill("Bia");
  await page.getByRole("link", { name: "Sair da edição" }).click();
  const dialog = page.getByRole("dialog", { name: "Sair sem salvar?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Continuar editando" }).click();
  await expect(input).toHaveValue("Bia");
  await input.fill("Ana");
  await page.getByRole("link", { name: "Sair da edição" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/\/explorar$/);
});
