import { test, expect, type Page } from "@playwright/test";
import { build } from "esbuild";
import { resolve } from "node:path";
let script: string;
test.beforeAll(async () => {
  test.setTimeout(120000);
  const result = await build({
    entryPoints: [resolve("tests/e2e/fixtures/scheduling.tsx")],
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
async function mount(page: Page, view: string) {
  await page.goto("/");
  await page.evaluate((view) => {
    const root = document.createElement("div");
    root.id = "flow-test-root";
    root.dataset.view = view;
    root.style.cssText =
      "position:fixed;inset:0;z-index:1000;overflow:auto;background:white";
    document.body.appendChild(root);
  }, view);
  await page.addScriptTag({ content: script });
  return page.locator("#flow-test-root");
}
test("blocks require explicit review before canceling conflicting reservations", async ({
  page,
}) => {
  const requests: any[] = [];
  await page.route("**/api/scheduling", async (route) => {
    const data = route.request().postDataJSON();
    requests.push(data);
    await route.fulfill({
      json: data.values.cancelConflicts
        ? { block: { id: "saved" }, conflicts: [] }
        : {
            conflicts: [
              {
                id: "00000000-0000-4000-8000-000000000004",
                startsAt: "2027-01-10T12:00:00Z",
                service: "Consulta",
                professional: "Ana",
              },
            ],
          },
    });
  });
  const root = await mount(page, "block");
  const submit = root.getByRole("button", {
    name: "Verificar e bloquear período",
  });
  await expect(submit).toBeDisabled();
  await root.getByLabel("Motivo").fill("Férias");
  await root.getByLabel("Data inicial").fill("2027-01-10");
  await root.getByLabel("Data final").fill("2027-01-12");
  await root.getByLabel("Dia inteiro").check();
  await submit.click();
  const confirm = root.getByRole("button", { name: "Confirmar bloqueio" });
  await expect(confirm).toBeDisabled();
  await root.getByLabel(/Confirmo o cancelamento/).check();
  await confirm.click();
  await expect.poll(() => requests.length).toBe(2);
  expect(requests[1].values.conflictIds).toHaveLength(1);
  expect(requests[1].values.professionalIds).toEqual([]);
});
test("recurrence preview prevents submission until conflicting dates are excluded", async ({
  page,
}) => {
  const requests: any[] = [];
  await page.route("**/api/scheduling", async (route) => {
    const data = route.request().postDataJSON();
    requests.push(data);
    await route.fulfill({
      json: data.preview
        ? {
            occurrences: [
              { date: "2027-01-10", available: true },
              { date: "2027-01-17", available: false },
            ],
          }
        : { count: 1 },
    });
  });
  const root = await mount(page, "series");
  await root.locator('select[name="consumerId"]').selectOption("client");
  await root
    .getByLabel("Serviço", { exact: false })
    .selectOption("00000000-0000-4000-8000-000000000003");
  await root
    .getByLabel("Profissional", { exact: false })
    .selectOption("00000000-0000-4000-8000-000000000002");
  await root.getByLabel("WhatsApp do cliente").fill("12981847553");
  await root.getByLabel("Primeiro atendimento").fill("2027-01-10");
  await root
    .getByRole("button", { name: "Verificar datas e conflitos" })
    .click();
  const confirm = root.getByRole("button", { name: "Confirmar sequência" });
  await expect(confirm).toBeDisabled();
  await root.getByLabel(/17\/01\/2027/).uncheck();
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect.poll(() => requests.length).toBe(2);
  expect(requests[1].values.excludedDates).toEqual(["2027-01-17"]);
});
test("waitlist requires a complete phone and at least one preferred weekday", async ({
  page,
}) => {
  const root = await mount(page, "waitlist");
  const submit = root.getByRole("button", {
    name: "Entrar na lista de espera",
  });
  await expect(submit).toBeDisabled();
  await root.getByLabel("WhatsApp").fill("1298184755");
  await expect(submit).toBeDisabled();
  await root.getByLabel("WhatsApp").fill("12981847553");
  await expect(submit).toBeEnabled();
  for (const day of ["Seg", "Ter", "Qua", "Qui", "Sex"])
    await root.getByLabel(day, { exact: true }).uncheck();
  await expect(submit).toBeDisabled();
  expect(await root.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true);
});
test("rescheduling keeps the original summary and validates the full new selection", async ({
  page,
}) => {
  await page.route("**/api/bookings/*/reschedule?*", (route) =>
    route.fulfill({
      json: {
        professionals: [
          { id: "00000000-0000-4000-8000-000000000002", name: "Ana" },
        ],
        dates: ["2027-01-10"],
        slots: [{ startsAt: "2027-01-10T15:00:00Z" }],
      },
    }),
  );
  const root = await mount(page, "reschedule");
  const form = root.locator("form");
  await expect(form.locator("select")).toHaveCount(0);
  const height = (await form.boundingBox())!.height;
  await root.getByRole("button", { name: "Ana", exact: true }).click();
  await root.getByRole("button", { name: "Continuar", exact: true }).click();
  const next = root.getByRole("button", { name: "Continuar", exact: true });
  await expect(next).toBeDisabled();
  await root.locator(".date-rail-day").first().click();
  await root.getByRole("button", { name: "12:00", exact: true }).click();
  await next.click();
  const submit = root.getByRole("button", {
    name: "Confirmar reagendamento",
    exact: true,
  });
  await expect(
    root.getByText(/Seu horário original fica reservado/),
  ).toBeVisible();
  await expect(submit).toBeEnabled();
  expect((await form.boundingBox())!.height).toBe(height);
  expect(await root.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
});
