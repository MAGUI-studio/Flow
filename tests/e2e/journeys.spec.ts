import { test, expect } from "@playwright/test";
test("public booking keeps its height through service, professional and time steps", async ({
  page,
}) => {
  await page.goto("/atelier-linha-fina");
  const form = page.locator(".booking-grid form");
  await expect(form).toBeVisible();
  const initial = await form.boundingBox();
  expect(initial).not.toBeNull();
  await form.locator("button[aria-pressed]").first().click();
  await form.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(
    form.getByRole("heading", { name: "Com quem você quer agendar?" }),
  ).toBeVisible();
  expect(Math.round((await form.boundingBox())!.height)).toBe(
    Math.round(initial!.height),
  );
  await form.locator("button.choice").first().click();
  await form.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(
    form.getByRole("heading", { name: "Qual é o seu melhor momento?" }),
  ).toBeVisible();
  expect(Math.round((await form.boundingBox())!.height)).toBe(
    Math.round(initial!.height),
  );
  await expect(
    page.getByRole("heading", { name: "Onde nos encontrar" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Notificações/ })).toHaveCount(
    0,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("subscription return confirms verified access and explains the next setup step", async ({
  page,
}) => {
  await page.route("**/api/billing/status", (route) =>
    route.fulfill({
      json: { active: true, plan: "basic", nextUrl: "/painel/configuracao" },
    }),
  );
  await page.goto("/assinatura/retorno?plano=basic");
  await expect(
    page.getByRole("heading", { name: "Sua assinatura está confirmada!" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Configurar meu negócio", exact: true }),
  ).toHaveAttribute("href", "/painel/configuracao");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("notifications and private APIs require authentication", async ({
  request,
}) => {
  for (const path of ["/api/notifications", "/api/billing/status"]) {
    const r = await request.get(path);
    expect(r.status()).toBe(401);
  }
});
