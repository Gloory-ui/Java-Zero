import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

// Вкладка «Обзор» админки с подменёнными ответами Supabase: вход админа лежит в localStorage, функции статистики
// отвечают готовыми строками. Без ключей Supabase (как в CI) аккаунты выключены, и проверять нечего

function fakeJwt(sub: string): string {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${part({ alg: "HS256", typ: "JWT" })}.${part({ sub, exp, role: "authenticated", aud: "authenticated" })}.sig`;
}

const ADMIN = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", email: "boss@example.com", aud: "authenticated" };

function storedSession() {
  return JSON.stringify({
    access_token: fakeJwt(ADMIN.id),
    refresh_token: "refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { ...ADMIN, identities: [{ id: ADMIN.id, provider: "email" }], user_metadata: { user_name: "boss" } },
  });
}

const OVERVIEW = {
  days: 30,
  students: 42,
  signups: 12,
  signups_prev: 7,
  active: 25,
  active_prev: 30,
  active_day: 6,
  learners: 31,
  stages_passed: 870,
  stages_passed_period: 210,
  stages_passed_prev: 180,
  generated_at: new Date().toISOString(),
};

/** Строка на каждый день периода, последняя — сегодня */
function activity(days: number) {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (days - 1 - i));
    const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    return { bucket: iso, signups: i % 3, active: 5 + (i % 7), passed: 3 * (i % 5) };
  });
}

const FUNNEL = [
  { quest_id: "basics", stage_id: "program-structure", reached: 40, passed: 38, here_now: 2, stuck: 0, left_after: 3 },
  { quest_id: "basics", stage_id: "memory-boxes", reached: 35, passed: 20, here_now: 4, stuck: 7, left_after: 0 },
  { quest_id: "kt1", stage_id: "guess-number", reached: 5, passed: 2, here_now: 1, stuck: 1, left_after: 0 },
];

const HARD = [
  {
    quest_id: "basics",
    stage_id: "memory-boxes",
    students: 35,
    passed: 20,
    fails_total: 210,
    fails_avg: 6,
    attempts_avg: 3.4,
    hint_used: 9,
    solution_viewed: 4,
  },
  {
    quest_id: "kt1",
    stage_id: "guess-number",
    students: 5,
    passed: 2,
    fails_total: 20,
    fails_avg: 4,
    attempts_avg: 2,
    hint_used: 1,
    solution_viewed: 0,
  },
];

/** Вход админа и подмены базы; calls собирает аргументы функций статистики */
async function openOverview(
  page: Page,
  overrides: { overview?: (route: Parameters<Parameters<Page["route"]>[1]>[0]) => Promise<void> } = {},
) {
  const calls: Record<string, Record<string, unknown>[]> = {};
  await page.addInitScript((session) => localStorage.setItem("java-zero-auth", session), storedSession());
  await page.route("**/auth/v1/user", (route) => route.fulfill({ json: { ...ADMIN, identities: [] } }));
  await page.route("**/rest/v1/**", (route) =>
    route.fulfill({ status: route.request().method() === "GET" ? 200 : 204, json: [] }),
  );
  await page.route("**/rest/v1/rpc/**", async (route) => {
    const name = new URL(route.request().url()).pathname.split("/").at(-1) ?? "";
    calls[name] = [...(calls[name] ?? []), route.request().postDataJSON() ?? {}];
    if (name === "is_admin") return route.fulfill({ json: true });
    if (name === "admin_overview") {
      if (overrides.overview) return overrides.overview(route);
      return route.fulfill({ json: { ...OVERVIEW, days: route.request().postDataJSON().p_days } });
    }
    if (name === "admin_activity") return route.fulfill({ json: activity(route.request().postDataJSON().p_days) });
    if (name === "admin_funnel") return route.fulfill({ json: FUNNEL });
    if (name === "admin_hard_stages") return route.fulfill({ json: HARD });
    return route.fulfill({ status: 204 });
  });

  await page.goto("/admin/overview");
  const disabled = page.getByText("Аккаунты на сайте не настроены");
  const ready = page.getByRole("heading", { name: "Админка" });
  await expect(disabled.or(ready).first()).toBeVisible();
  test.skip(await disabled.isVisible(), "Аккаунты не настроены в этой сборке");
  return calls;
}

test("обзор: плитки, график с таблицей и клавиатурой, воронка и трудные этапы", async ({ page }) => {
  const calls = await openOverview(page);
  const main = page.getByRole("main");

  const tiles = main.getByRole("region", { name: "Главные числа" });
  await expect(tiles.getByText("Ученики с аккаунтом")).toBeVisible();
  await expect(tiles.getByText("42", { exact: true })).toBeVisible();
  // Изменение к прошлому периоду: новых 12 против 7, активных 25 против 30
  await expect(tiles.getByText("+5")).toBeVisible();
  await expect(tiles.getByText("−5")).toBeVisible();
  expect(calls.admin_activity?.at(-1)).toMatchObject({ p_days: 30, p_bucket: "day" });
  expect(String(calls.admin_activity?.at(-1)?.p_tz)).not.toBe("");

  // Стрелки с клавиатуры листают точки графика, подсказка показывает обе серии
  const chart = main.getByRole("img", { name: /График учеников по дням/ });
  await chart.focus();
  await page.keyboard.press("End");
  const tooltip = main.locator("output").filter({ hasText: "Активные" });
  await expect(tooltip).toContainText("Новые");
  await page.keyboard.press("Escape");
  await expect(tooltip).toHaveCount(0);

  // Те же числа — таблицей
  const card = main.getByRole("region", { name: "Ученики", exact: true });
  await card.getByRole("button", { name: "Таблица" }).click();
  await expect(card.getByRole("row")).toHaveCount(31);

  // Воронка: где останавливаются, этапы квеста по порядку; КТ здесь нет
  const funnel = main.getByRole("region", { name: "Воронка курса «Java с нуля»" });
  await expect(funnel.getByText("Чаще всего останавливаются")).toBeVisible();
  await expect(funnel.getByRole("listitem").filter({ hasText: "Коробки памяти" }).first()).toContainText("7 учеников");
  await funnel.locator("summary").filter({ hasText: "Фундамент Java" }).click();
  await expect(funnel.getByText("открыли 35 · сдали 20")).toBeVisible();
  await expect(funnel.getByText("guess-number")).toHaveCount(0);

  // Трудные этапы: этап группы подписан «КТ 1» и id, без названия
  const hard = main.getByRole("region", { name: "Самые трудные этапы" });
  await expect(hard.getByRole("row", { name: /Коробки памяти/ })).toContainText("57%");
  await expect(hard.getByRole("row", { name: /guess-number/ })).toContainText("КТ 1");

  const results = await new AxeBuilder({ page }).include("main").analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  // Неделя: делить на недели нечего, запрос — по дням
  await main.getByRole("button", { name: "7 дней" }).click();
  await expect(main.getByRole("button", { name: "По неделям" })).toBeDisabled();
  await expect.poll(() => calls.admin_activity?.at(-1)).toMatchObject({ p_days: 7, p_bucket: "day" });
  await main.getByRole("button", { name: "90 дней" }).click();
  await main.getByRole("button", { name: "По неделям" }).click();
  await expect.poll(() => calls.admin_activity?.at(-1)).toMatchObject({ p_days: 90, p_bucket: "week" });
  await expect(main.getByRole("heading", { name: "Активность по неделям" })).toBeVisible();
});

test("обзор до миграции статистики: подсказка, какой SQL выполнить", async ({ page }) => {
  await openOverview(page, {
    overview: (route) =>
      route.fulfill({
        status: 404,
        json: {
          code: "PGRST202",
          message: "Could not find the function public.admin_overview(p_days) in the schema cache",
        },
      }),
  });
  await expect(page.getByRole("alert").filter({ hasText: "Статистика ещё не подключена" })).toContainText(
    "20261001140000_admin_stats.sql",
  );
  await expect(page.getByRole("button", { name: "Повторить" })).toBeVisible();
});
