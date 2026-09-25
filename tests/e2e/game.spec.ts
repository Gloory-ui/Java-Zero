import { expect, test } from "@playwright/test";

test("прогресс старого сайта переносится при первом заходе", async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("seeded")) return;
    sessionStorage.setItem("seeded", "1");
    localStorage.clear();
    localStorage.setItem("java_zero_quest_done_basics", "true");
    localStorage.setItem("java_zero_unlocked_loops_prep", "2");
    localStorage.setItem("java_zero_streak", "3");
    localStorage.setItem("java_zero_achievements", JSON.stringify(["first_var"]));
  });

  await page.goto("/course");
  await expect(page.getByText("00 · 2 из 8")).toBeVisible();
  await expect(page.getByText("01 · 2 из 6")).toBeVisible();
  await expect(page.getByRole("link", { name: "Продолжить" })).toHaveAttribute(
    "href",
    "/learn/loops_prep/accumulators",
  );

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("java-zero-progress") ?? "{}"));
  expect(saved.state.streak).toBe(3);
  expect(Object.keys(saved.state.achievements)).toEqual(["first_var"]);
  // Старые ключи остаются на случай отката
  expect(await page.evaluate(() => localStorage.getItem("java_zero_streak"))).toBe("3");
});

test("защита: две ошибки из трёх — досрочный незачёт, затем реванш", async ({ page }) => {
  await page.goto("/learn/basics/program-structure");
  await page.getByRole("tab", { name: "Защита" }).click();
  await page.getByRole("button", { name: "Бросить вызов" }).click();

  // Верные ответы: 3, 1, 3. После первой ошибки защита продолжается
  await expect(page.getByText("Вопрос 1 из 3")).toBeVisible();
  await page.keyboard.press("1");
  await expect(page.getByText("Неверно. Замечание в лист защиты.")).toBeVisible();
  await page.getByRole("button", { name: "Следующий вопрос →" }).click();
  await expect(page.getByText("Вопрос 2 из 3")).toBeVisible();
  await page.keyboard.press("2");
  await expect(page.getByText(/Нервы на нуле/)).toBeVisible();
  await page.getByRole("button", { name: "К итогам →" }).click();
  await expect(page.getByRole("heading", { name: "Незачёт: нервы на нуле" })).toBeVisible();

  await page.getByRole("button", { name: "Ещё раз" }).click();
  for (const key of ["3", "1"]) {
    await page.keyboard.press(key);
    await page.getByRole("button", { name: "Следующий вопрос →" }).click();
  }
  await page.keyboard.press("3");
  await page.getByRole("button", { name: "К итогам →" }).click();
  await expect(page.getByRole("heading", { name: "Профессор повержен. Оценка 5" })).toBeVisible();
  await expect(page.getByText("Гроза преподов")).toBeVisible();
});
