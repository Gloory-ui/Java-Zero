import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const seedProgress = (page: Page) =>
  page.addInitScript(() =>
    localStorage.setItem(
      "java-zero-progress",
      JSON.stringify({
        state: {
          stages: { "basics/program-structure": { attempts: [], passedAt: 1, xp: 70 } },
          cleanRun: 1,
          achievements: { first_var: 1 },
          dailyDone: {},
          stats: {},
          persona: "chill",
          sound: false,
        },
        version: 2,
      }),
    ),
  );

/** Без переменных Supabase сборка показывает сообщение вместо данных: тогда проверять нечего */
async function accountsDisabled(page: Page, ready: ReturnType<Page["getByText"]>) {
  const disabled = page.getByText("Аккаунты на этой версии сайта не подключены.");
  await expect(disabled.or(ready)).toBeVisible();
  return disabled.isVisible();
}

test("профиль: гость выбирает цвет неона, закрытые украшения показывают условие", async ({ page }) => {
  await seedProgress(page);
  await page.goto("/profile");
  await page.getByRole("button", { name: "Внешний вид" }).click();

  const sheet = page.getByRole("dialog", { name: "Внешний вид" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("button", { name: /Лайм/ })).toBeDisabled();
  await expect(sheet.getByText("С 10 уровня").first()).toBeVisible();

  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).include("dialog").analyze();
  expect(violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);

  await sheet.getByRole("button", { name: /Циан/ }).click();
  await expect(sheet.getByRole("button", { name: /Циан/ })).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("java-zero-profile") ?? "{}"));
  expect(saved.state.accent).toBe("cyan");
});

test("профиль: имя из настроек сразу в шапке, ник — только после входа", async ({ page }) => {
  await seedProgress(page);
  await page.goto("/profile");
  await page.getByRole("button", { name: "Настройки" }).click();
  const sheet = page.getByRole("dialog", { name: "Настройки" });
  await expect(sheet.getByText("Ник и публичный профиль доступны после входа в аккаунт.")).toBeVisible();

  await sheet.getByLabel("Имя в профиле").fill("Аня");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { level: 1, name: "Аня" })).toBeVisible();
  // Поделиться можно только открытым профилем с ником
  await expect(page.getByRole("button", { name: "Поделиться" })).toBeDisabled();
});

test("профиль: «Как видят другие» показывает публичную страницу из своих данных", async ({ page }) => {
  await seedProgress(page);
  await page.goto("/profile");
  await page.getByRole("button", { name: "Как видят другие" }).click();
  const sheet = page.getByRole("dialog", { name: "Как видят другие" });
  await expect(sheet.getByRole("heading", { level: 1, name: "Гость" })).toBeVisible();
  await expect(sheet.getByText("Этапов сдано", { exact: true }).first()).toBeVisible();
  await expect(sheet.getByRole("progressbar", { name: "Опыт до следующего уровня" })).toBeVisible();
});

const PUBLIC = {
  handle: "java_hero",
  display_name: "Аня Кодова",
  avatar_url: null,
  bio: "Готовлюсь к КТ 2",
  accent: "cyan",
  frame: "pulse",
  banner: "aurora",
  // Ссылка с кавычкой не должна попасть в CSS
  banner_url: 'https://evil.example/x.png") ; background: url("https://evil',
  title: "ГРОЗА СЕССИИ",
  showcase: ["quest_kt1", "first_var"],
  xp_total: 1335,
  stages_passed: 14,
  streak_days: 5,
  best_streak: 9,
  created_at: "2026-09-01T10:00:00Z",
  achievements: [
    { id: "quest_kt1", at: "2026-09-20T10:00:00Z" },
    { id: "first_var", at: "2026-09-02T10:00:00Z" },
  ],
};

test("публичный профиль: данные из Supabase, небезопасная ссылка на баннер отброшена", async ({ page }) => {
  await page.route("**/rest/v1/rpc/get_public_profile", (route) => route.fulfill({ json: PUBLIC }));
  await page.goto("/u/java_hero");
  const name = page.getByRole("heading", { level: 1, name: "Аня Кодова" });
  if (await accountsDisabled(page, name)) return;

  await expect(page.getByText("@java_hero")).toBeVisible();
  await expect(page.getByText("ГРОЗА СЕССИИ").first()).toBeVisible();
  await expect(page.getByText("Готовлюсь к КТ 2")).toBeVisible();
  await expect(page.getByText("С сентября 2026")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Витрина" })).toBeVisible();
  const css = await page.evaluate(() => document.querySelector(".banner")?.getAttribute("style") ?? "");
  expect(css).not.toContain("evil");
});

test("публичный профиль: скрытый профиль — понятное сообщение, неверный ник — 404", async ({ page, request }) => {
  await page.route("**/rest/v1/rpc/get_public_profile", (route) => route.fulfill({ json: null }));
  await page.goto("/u/nobody_here");
  const missing = page.getByRole("heading", { name: "Профиль не найден" });
  if (!(await accountsDisabled(page, missing))) await expect(missing).toBeVisible();

  const res = await request.get("/u/Bad-Handle!");
  expect(res.status()).toBe(404);
});

test("таблица лидеров: неделя и всё время, тройка лидеров и своя строка", async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("java-zero-profile", JSON.stringify({ state: { handle: "me_here" }, version: 1 })),
  );
  await page.route("**/rest/v1/rpc/leaderboard", async (route) => {
    const { p_period } = route.request().postDataJSON() as { p_period: string };
    const row = (handle: string, xp: number) => ({
      handle,
      display_name: null,
      avatar_url: null,
      accent: "violet",
      frame: "neon",
      title: null,
      xp_total: xp * 3,
      xp,
    });
    await route.fulfill({
      json: p_period === "week" ? [row("fast_one", 400), row("me_here", 250)] : [row("old_guard", 9000)],
    });
  });
  await page.goto("/leaderboard");
  const first = page.getByRole("link", { name: /@fast_one/ });
  if (await accountsDisabled(page, first)) return;

  await expect(page.getByRole("link", { name: /@me_here/ })).toContainText("это ты");
  await page.getByRole("tab", { name: "Всё время" }).click();
  await expect(page.getByRole("link", { name: /@old_guard/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /@fast_one/ })).toHaveCount(0);
});

test("превью ссылки на профиль: картинка есть даже у скрытого профиля и без Supabase", async ({ request }) => {
  const res = await request.get("/u/nobody_here/opengraph-image");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("image/png");
});
