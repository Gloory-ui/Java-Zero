import { expect, test } from "@playwright/test";

const seed = (state: Record<string, unknown>) =>
  JSON.stringify({
    state: {
      stages: {},
      cleanRun: 0,
      achievements: {},
      dailyDone: {},
      stats: {},
      persona: "chill",
      sound: false,
      ...state,
    },
    version: 2,
  });

test("карта курса: уровень, опыт и три квеста дня", async ({ page }) => {
  // 4 этапа по 70 XP, «Архитектор памяти» и заслуженные при загрузке «Знаток типов» и «Точность I» (по 25 XP):
  // 355 XP — это 8-й уровень (7 уровней по 50 XP), 5 из 51
  const stages = Object.fromEntries(
    ["program-structure", "memory-boxes", "arithmetic", "remainder"].map((id) => [
      `basics/${id}`,
      { attempts: [], passedAt: Date.now(), xp: 70 },
    ]),
  );
  await page.addInitScript(
    (value) => localStorage.setItem("java-zero-progress", value),
    seed({ stages, achievements: { first_var: 1 } }),
  );
  await page.goto("/course");

  const level = page.getByRole("region", { name: "Уровень и опыт" });
  await expect(level.getByRole("progressbar", { name: "Опыт до следующего уровня" })).toHaveAttribute(
    "aria-valuenow",
    "5",
  );
  await expect(level.getByText("СТАЖЁР КОМПИЛЯТОРА")).toBeVisible();

  const daily = page.getByRole("region", { name: "Квесты дня" });
  await expect(daily.getByRole("listitem")).toHaveCount(3);
  await expect(daily.getByText("Сундук дня")).toBeVisible();

  // Сегодня сданы этапы — серия дней уже идёт
  await expect(page.getByRole("link", { name: /Уровень 8/ })).toBeVisible();
});

test("тайный знак: три клика по логотипу, знак появляется в достижениях", async ({ page }) => {
  await page.addInitScript((value) => {
    if (!localStorage.getItem("java-zero-progress")) localStorage.setItem("java-zero-progress", value);
  }, seed({}));
  await page.goto("/achievements");

  await page.getByRole("button", { name: /Тайные знаки/ }).click();
  await expect(page.getByText("Тайный знак", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Фонк-режим")).toHaveCount(0);

  const logo = page.getByRole("link", { name: "Java-Zero, на главную" });
  await logo.click({ clickCount: 3 });
  const toast = page.getByRole("region", { name: "Награды" });
  await expect(toast.getByText("Фонк-режим")).toBeVisible();
  await expect(toast.getByText("+75 XP")).toBeVisible();

  await page.goto("/achievements");
  await page.getByRole("button", { name: /Тайные знаки/ }).click();
  await expect(page.getByText("Фонк-режим")).toBeVisible();
  await expect(page.getByText("Трижды быстро нажми на логотип.")).toBeVisible();
});

test("квиз: верный ответ считается в квесты дня один раз на этап", async ({ page }) => {
  await page.addInitScript((value) => localStorage.setItem("java-zero-progress", value), seed({}));
  await page.goto("/learn/basics/program-structure");
  await page.getByRole("tab", { name: "Квиз" }).click();
  // Верный вариант второй
  await page.locator("fieldset label").nth(1).click();
  await page.locator("fieldset label").nth(0).click();
  await page.locator("fieldset label").nth(1).click();

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("java-zero-progress") ?? "{}"));
  expect(saved.state.daily.counters.quizRight).toBe(1);
  expect(saved.state.stats.quizRight).toBe(1);
  expect(saved.state.daily.quests).toHaveLength(3);
});
