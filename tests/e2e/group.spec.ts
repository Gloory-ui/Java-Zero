import { readFileSync } from "node:fs";
import { expect, type Page, test } from "@playwright/test";
import { parse } from "yaml";

const INVITE: string = parse(readFileSync("content/group.yaml", "utf8")).invite;

/** Прогресс в браузере до загрузки страницы; stats.group — отметка участника группы */
async function seed(page: Page, state: Record<string, unknown>) {
  const value = JSON.stringify({
    state: {
      stages: {},
      cleanRun: 0,
      achievements: {},
      dailyDone: {},
      stats: {},
      persona: "chill",
      sound: true,
      ...state,
    },
    version: 2,
  });
  await page.addInitScript((v) => {
    if (sessionStorage.getItem("seeded")) return;
    sessionStorage.setItem("seeded", "1");
    localStorage.setItem("java-zero-progress", v);
  }, value);
}

test("гость не видит КТ: ни в шапке, ни на карте курса; раздел объясняет, как попасть", async ({ page }) => {
  await page.goto("/course");
  await expect(page.getByRole("heading", { level: 1, name: "Java с нуля" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Циклы" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Калькулятор" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Контрольная точка 1" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Группа", exact: true })).toHaveCount(0);

  await page.goto("/group");
  await expect(page.getByText("Этот раздел — для одногруппников")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Контрольная точка 1" })).toHaveCount(0);
});

test("задание КТ без приглашения: объясняем, что это раздел группы", async ({ page }) => {
  await page.goto("/learn/kt1/primes-to-n");
  await expect(page.getByRole("heading", { name: "Задание для одногруппников" })).toBeVisible();
});

test("ссылка-приглашение открывает раздел: подготовка, потом КТ", async ({ page }) => {
  await page.goto(`/group?join=${INVITE}`);
  await expect(page.getByText("Готово: ты в группе")).toBeVisible();
  // Код убран из адреса, чтобы ссылку без него можно было пересылать
  await expect(page).toHaveURL(/\/group$/);
  await expect(page.getByRole("heading", { level: 2, name: "Контрольная точка 1" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 3, name: "Фундамент Java" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Начать с первого шага" })).toHaveAttribute(
    "href",
    "/learn/basics/program-structure",
  );

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("java-zero-progress") ?? "{}"));
  expect(saved.state.stats.group).toBe(1);

  // Участник видит раздел и на карте общего курса
  await page.goto("/course");
  await expect(page.getByRole("link", { name: /Раздел «Группа»/ })).toBeVisible();
});

test("чужой код не пускает в раздел", async ({ page }) => {
  await page.goto("/group?join=wrongcode");
  // У Next есть свой пустой role="alert" для объявлений о переходах, поэтому ищем по тексту
  await expect(page.getByRole("alert").filter({ hasText: "Ссылка-приглашение не подошла" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Контрольная точка 1" })).toHaveCount(0);
});

test("после «Циклов» участник группы идёт к КТ 1, а не к «Калькулятору»", async ({ page }) => {
  const loops = ["for-anatomy", "break-continue", "accumulators", "nested-loops", "while-attempts", "prime-flag"];
  const basics = [
    "program-structure",
    "memory-boxes",
    "arithmetic",
    "remainder",
    "strings",
    "input",
    "conditions",
    "logic",
  ];
  const stages = Object.fromEntries(
    [...basics.map((s) => `basics/${s}`), ...loops.map((s) => `loops_prep/${s}`)].map((k) => [
      k,
      { attempts: [], passedAt: 1, xp: 70 },
    ]),
  );
  await seed(page, { stages, stats: { group: 1 } });
  await page.goto("/group");
  await expect(page.getByRole("link", { name: "Продолжить" })).toHaveAttribute(
    "href",
    "/learn/kt1/multiplication-table",
  );
  await page.goto("/learn/kt1/multiplication-table");
  await expect(page.getByRole("heading", { level: 1, name: /Таблица умножения/ })).toBeVisible();
});

test("кто уже сдавал КТ 1, в группе без приглашения", async ({ page }) => {
  await seed(page, { stages: { "kt1/multiplication-table": { attempts: [], passedAt: 1, xp: 110 } } });
  await page.goto("/group");
  await expect(page.getByRole("heading", { level: 2, name: "Контрольная точка 1" })).toBeVisible();
});

test("шапка участника с пунктом «Группа» влезает в 375, 768 и 1024 px", async ({ page }) => {
  await seed(page, { stats: { group: 1 } });
  for (const width of [375, 768, 1024]) {
    await page.setViewportSize({ width, height: 800 });
    for (const path of ["/group", "/course"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${path} при ${width} px`).toBeLessThanOrEqual(0);
    }
  }
});
