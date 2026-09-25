import { expect, test } from "@playwright/test";

test("вход: страница открывается и с Supabase, и без него", async ({ page }) => {
  await page.goto("/login?next=/learn/basics/remainder");
  await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();
  // Без переменных Supabase — объяснение, с ними — хотя бы один способ входа
  await expect(
    page.getByText("Аккаунты на этой версии сайта ещё не подключены").or(page.getByLabel("Почта")),
    // Способы входа приходят из Supabase по сети
  ).toBeVisible({ timeout: 15_000 });
});

test("ссылка входа без кода объясняет, что делать", async ({ page }) => {
  await page.goto("/auth/callback?error=access_denied&error_code=otp_expired");
  await expect(page.getByRole("heading", { name: "Вход не удался" })).toBeVisible();
  await expect(page.getByText("Ссылка для входа устарела")).toBeVisible();
});

test("профиль показывает статистику и ранг гостя", async ({ page }) => {
  await page.goto("/profile");
  await expect(page.getByText("Этапов сдано")).toBeVisible();
  await expect(page.getByText("0 из 26")).toBeVisible();
  await expect(page.getByText("БАЙТ-ПАДАВАН").first()).toBeVisible();

  // Характер ментора — в панели «Настройки»
  await page.getByRole("button", { name: "Настройки" }).click();
  await page.getByRole("dialog", { name: "Настройки" }).getByText("Душный препод").click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("java-zero-progress") ?? "{}"));
  expect(saved.state.persona).toBe("dushny");
});
