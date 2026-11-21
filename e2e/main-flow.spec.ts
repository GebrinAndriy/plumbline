import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

test("an owner prices a service and receives a customer's request", async ({ page, browser, baseURL }) => {
  const slug = `e2e-${randomUUID().slice(0, 8)}`;

  await test.step("owner signs up", async () => {
    await page.goto("/sign-up");
    await page.getByLabel("Business name").fill("E2E Blinds");
    await page.getByLabel("Page address").fill(slug);
    await page.getByLabel("Email").fill(`${slug}@example.test`);
    await page.getByLabel("Password", { exact: true }).fill(randomUUID());
    await page.getByRole("button", { name: "Create business" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  await test.step("owner adds a service priced by area with a paid option", async () => {
    await page.getByRole("link", { name: "Services" }).click();
    await page.getByLabel("Service name").fill("Roller blinds");
    await page.getByLabel("Price per m², €").fill("50");
    await page.getByRole("button", { name: "Add service" }).click();

    await page.getByRole("button", { name: "Add option" }).click();
    await page.getByLabel("Option name").fill("Installation");
    await page.getByLabel("Amount, €").fill("30");
    await page.getByRole("button", { name: "Add option" }).click();
    await expect(page.getByRole("list", { name: "Options of Roller blinds" })).toContainText("Installation");
  });

  await test.step("customer gets a price and sends a request", async () => {
    // A separate context has no owner session, like a real visitor.
    const customer = await browser.newContext({ baseURL });
    const calculator = await customer.newPage();
    await calculator.goto(`/b/${slug}`);

    await calculator.getByLabel("Width, cm", { exact: true }).fill("200");
    await calculator.getByLabel("Height, cm", { exact: true }).fill("100");
    await calculator.getByLabel("Quantity").fill("1");
    await calculator.getByLabel("Installation").check();
    await expect(calculator.getByRole("button", { name: /Send request · €130/ })).toBeVisible();
    await expect(calculator.locator("[aria-live=polite]")).toContainText("€130");

    await calculator.getByLabel("Your name").fill("Aoife Kelly");
    await calculator.getByLabel("Phone").fill("+353871234567");
    await calculator.getByRole("button", { name: "Send request" }).click();
    await expect(calculator.getByRole("heading", { name: "Request sent" })).toBeVisible();
    await customer.close();
  });

  await test.step("owner sees the request and moves it forward", async () => {
    await page.goto("/dashboard");
    const lead = page.getByRole("listitem").filter({ hasText: "Aoife Kelly" });
    await expect(lead).toContainText("€130");
    await lead.getByRole("button", { name: "→ Contacted" }).click();
    await expect(lead.getByRole("button", { name: "→ Quoted" })).toBeVisible();
  });
});
