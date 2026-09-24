import { expect, test } from "@playwright/test";

test("ментор: вопрос уходит с контекстом этапа, ответ рендерится как Markdown", async ({ page }) => {
  let sent: Record<string, unknown> | null = null;
  // Настоящий Gemini в тестах не вызываем: подменяем ответ маршрута
  await page.route("**/api/ai", async (route) => {
    sent = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "text/plain; charset=utf-8",
      body: "Смотри на **строку 3**: там нет `;`.",
    });
  });

  await page.goto("/learn/basics/memory-boxes");
  await page.getByRole("button", { name: "AI-ментор" }).click();
  const panel = page.getByRole("complementary", { name: "AI-ментор" });
  await expect(panel).toBeVisible();

  await panel.getByLabel("Вопрос ментору").fill("Что не так?");
  await panel.getByLabel("Вопрос ментору").press("Enter");

  await expect(panel.getByText("Что не так?")).toBeVisible();
  await expect(panel.locator("strong", { hasText: "строку 3" })).toBeVisible();
  expect(sent).toMatchObject({ stageKey: "basics/memory-boxes", message: "Что не так?", persona: "chill" });
  expect(String((sent as unknown as { code: string }).code)).toContain("public class Basics");

  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
});

test("ментор: ошибка сервера показывается понятным текстом", async ({ page }) => {
  await page.route("**/api/ai", (route) =>
    route.fulfill({ status: 429, json: { error: "Слишком много вопросов подряд. Ментор снова ответит через 3 мин." } }),
  );
  await page.goto("/learn/basics/memory-boxes");
  await page.getByRole("button", { name: "AI-ментор" }).click();
  await page.getByRole("button", { name: "Разбери мой код" }).click();
  await expect(page.getByText("Ментор снова ответит через 3 мин.")).toBeVisible();
});
