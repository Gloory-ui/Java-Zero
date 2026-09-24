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
  await expect(page.getByText("00 · 2 из 2")).toBeVisible();
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

test("защита: ошибка на единственном вопросе — досрочный незачёт, затем реванш", async ({ page }) => {
  await page.goto("/learn/basics/memory-boxes");
  await page.getByRole("tab", { name: "Защита" }).click();
  await page.getByRole("button", { name: "Бросить вызов" }).click();

  await expect(page.getByText("Вопрос 1 из 1")).toBeVisible();
  // Верный вариант второй: жмём первый
  await page.keyboard.press("1");
  await expect(page.getByText(/Неверно\. Замечание в лист защиты\. Нервы на нуле/)).toBeVisible();
  await page.getByRole("button", { name: "К итогам →" }).click();
  await expect(page.getByRole("heading", { name: "Незачёт: нервы на нуле" })).toBeVisible();

  await page.getByRole("button", { name: "Ещё раз" }).click();
  await page.keyboard.press("2");
  await page.getByRole("button", { name: "К итогам →" }).click();
  await expect(page.getByRole("heading", { name: "Профессор повержен. Оценка 5" })).toBeVisible();
  await expect(page.getByText("Гроза преподов")).toBeVisible();
});
