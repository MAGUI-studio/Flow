import { test, expect } from "@playwright/test";

test("online booking validates selected steps immediately and keeps actions compact", async ({
  page,
}) => {
  const day = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  await page.route("**/api/availability?*", (route) =>
    route.fulfill({
      json: {
        dates: [day],
        slots: [{ startsAt: `${day}T15:45:00-03:00`, remaining: 1 }],
      },
    }),
  );
  await page.goto("/conecta-idiomas");
  const form = page.locator(".booking-grid form");
  await form
    .locator("button[aria-pressed]")
    .filter({ hasText: "Espanhol individual" })
    .click();
  await form.getByRole("button", { name: "Continuar", exact: true }).click();
  await form.locator("button.choice").first().click();
  await form.getByRole("button", { name: "Continuar", exact: true }).click();
  await form.locator(".date-rail-day").first().click();
  await form.getByRole("button", { name: "15:45", exact: true }).click();
  await form.getByRole("button", { name: "Continuar", exact: true }).click();
  const submit = form.locator('button[type="submit"]');
  await expect(submit).toBeDisabled();
  const back = form.getByRole("button", { name: "Voltar", exact: true });
  expect((await back.boundingBox())!.height).toBeLessThan(70);
  const actions = form.locator(".form-actions");
  const initialActions = await actions.boundingBox();
  const initialSubmit = await submit.boundingBox();
  const help = await form.getByRole("button", { name: "Ver campos pendentes para salvar" }).boundingBox();
  expect(help!.x).toBeGreaterThanOrEqual(initialSubmit!.x + initialSubmit!.width);
  expect(Math.abs(help!.y + help!.height / 2 - initialSubmit!.y - initialSubmit!.height / 2)).toBeLessThan(1);
  const phone = form.getByLabel("Seu WhatsApp");
  await phone.fill("1298184755");
  await expect(phone).toHaveValue("(12) 98184-755");
  await expect(submit).toBeDisabled();
  expect((await actions.boundingBox())!.height).toBe(initialActions!.height);
  await form.getByLabel("Seu WhatsApp").fill("12981847553");
  await expect(submit).toBeEnabled();
  expect((await submit.boundingBox())!.width).toBeGreaterThan(initialSubmit!.width);
  expect((await actions.boundingBox())!.height).toBe(initialActions!.height);
  expect(Math.abs((await submit.boundingBox())!.y - initialSubmit!.y)).toBeLessThan(1);
  await expect(
    form.getByRole("button", { name: "Ver campos pendentes para salvar" }),
  ).toHaveCount(0);
  await back.click();
  await expect(
    form.getByRole("button", { name: "Continuar", exact: true }),
  ).toBeDisabled();
  await form.getByRole("button", { name: "15:45", exact: true }).click();
  await form.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(submit).toBeEnabled();
  await form.getByLabel("Seu WhatsApp").fill("");
  await expect(submit).toBeDisabled();
  expect((await actions.boundingBox())!.height).toBe(initialActions!.height);
});
