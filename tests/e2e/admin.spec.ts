import { expect, type Page, test } from "@playwright/test";

// Админка с подменёнными ответами Supabase и /api/admin/content: настоящих аккаунтов и правок тест не создаёт.
// Без ключей Supabase (как в CI) аккаунты выключены — тогда проверяется только экран «не настроены»

function fakeJwt(sub: string): string {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${part({ alg: "HS256", typ: "JWT" })}.${part({ sub, exp, role: "authenticated", aud: "authenticated" })}.sig`;
}

const ADMIN = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", email: "boss@example.com", aud: "authenticated" };

/** Вошедший пользователь: сессия в localStorage (ключ java-zero-auth), как её хранит supabase-js */
async function signIn(page: Page, { admin }: { admin: boolean }) {
  const user = { ...ADMIN, identities: [{ id: ADMIN.id, provider: "email" }], user_metadata: { user_name: "boss" } };
  const session = {
    access_token: fakeJwt(ADMIN.id),
    refresh_token: "refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user,
  };
  await page.addInitScript((value) => localStorage.setItem("java-zero-auth", value), JSON.stringify(session));
  // Синхронизация прогресса после входа получает пустые таблицы; конкретные подмены ниже важнее этой
  await page.route("**/rest/v1/**", (route) =>
    route.fulfill({ status: route.request().method() === "GET" ? 200 : 204, json: [] }),
  );
  await page.route("**/auth/v1/user", (route) => route.fulfill({ json: user }));
  await page.route("**/rest/v1/rpc/is_admin", (route) => route.fulfill({ json: admin }));
}

/** Админка доступна только со включёнными аккаунтами; без них тест про права пропускается */
async function skipWithoutAccounts(page: Page) {
  const disabled = page.getByText("Аккаунты на сайте не настроены");
  const ready = page.getByRole("navigation", { name: "Разделы админки" }).or(page.getByText("Нет доступа"));
  await expect(disabled.or(ready).first()).toBeVisible({ timeout: 15_000 });
  test.skip(await disabled.isVisible(), "Аккаунты не настроены в этой сборке");
}

const ROWS = [
  {
    user_id: "11111111-1111-4111-8111-111111111111",
    handle: "honest",
    display_name: "Честный",
    created_at: "2026-09-20T10:00:00Z",
    xp: 1250,
    raw_xp: 1250,
    stages_passed: 18,
    unknown_rows: 0,
    burst: 4,
    last_active: "2026-10-01T09:00:00Z",
    banned: false,
    ban_reason: "",
  },
  {
    user_id: "22222222-2222-4222-8222-222222222222",
    handle: "cheater",
    display_name: null,
    created_at: "2026-09-30T10:00:00Z",
    xp: 70,
    raw_xp: 4650,
    stages_passed: 3,
    unknown_rows: 3,
    burst: 40,
    last_active: "2026-10-01T09:30:00Z",
    banned: false,
    ban_reason: "",
  },
];

test("/admin ведёт в обзор", async ({ page }) => {
  await page.goto("/admin");
  await expect.poll(() => new URL(page.url()).pathname).toBe("/admin/overview");
});

test("админка без входа просит войти", async ({ page }) => {
  await page.goto("/admin/leaderboard");
  await expect(
    page.getByText("Админка — только после входа").or(page.getByText("Аккаунты на сайте не настроены")),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("navigation", { name: "Разделы админки" })).toHaveCount(0);
});

test("не админ видит «Нет доступа» и не получает вкладок", async ({ page }) => {
  await signIn(page, { admin: false });
  await page.goto("/admin/leaderboard");
  await skipWithoutAccounts(page);
  await expect(page.getByRole("heading", { name: "Нет доступа" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Разделы админки" })).toHaveCount(0);
});

test("лидерборд: признаки накрутки и снятие с рейтинга с причиной", async ({ page }) => {
  await signIn(page, { admin: true });
  let rows = ROWS;
  await page.route("**/rest/v1/rpc/admin_leaderboard", (route) => route.fulfill({ json: rows }));
  let banBody: Record<string, unknown> = {};
  await page.route("**/rest/v1/rpc/admin_set_leaderboard_ban", async (route) => {
    banBody = route.request().postDataJSON();
    rows = ROWS.map((r) => (r.handle === "cheater" ? { ...r, banned: true, ban_reason: "накрутка" } : r));
    await route.fulfill({ status: 204 });
  });

  await page.goto("/admin/leaderboard");
  await skipWithoutAccounts(page);
  const cheater = page.getByRole("listitem").filter({ hasText: "@cheater" });
  await expect(cheater.getByText("+4580 XP не засчитано")).toBeVisible();
  await expect(cheater.getByText("3 чужих строк")).toBeVisible();
  await expect(cheater.getByText("40 этапов за час")).toBeVisible();
  await expect(
    page
      .getByRole("listitem")
      .filter({ hasText: "@honest" })
      .getByText(/не засчитано/),
  ).toHaveCount(0);

  await cheater.getByRole("button", { name: "Снять с рейтинга" }).click();
  await cheater.getByLabel("Причина (видна только админам)").fill("накрутка");
  await cheater.getByRole("button", { name: "Снять", exact: true }).click();
  await expect(cheater.getByText("Снят: накрутка")).toBeVisible();
  expect(banBody).toEqual({ p_user: ROWS[1].user_id, p_banned: true, p_reason: "накрутка" });
  await expect(cheater.getByRole("button", { name: "Вернуть в рейтинг" })).toBeVisible();
});

test("квесты: правка названия этапа уходит на сервер, отметка «изменено» появляется", async ({ page }) => {
  await signIn(page, { admin: true });
  const content = {
    quests: [
      {
        id: "basics",
        num: "01",
        track: "course",
        title: "Фундамент",
        subtitle: "Первая программа",
        stages: [
          {
            id: "memory-boxes",
            badge: "ЭТАП 02 / 08",
            title: "Коробки памяти",
            theory: "## Переменные\nТекст теории.",
            pitfalls: "Ошибки.",
            hints: "Первая\nВторая",
            "quiz.question": "Что такое int?",
            "quiz.hint": "Целое",
          },
        ],
      },
    ],
    overrides: [],
  };
  let saved: Record<string, unknown> = {};
  await page.route("**/api/admin/content", async (route) => {
    if (route.request().method() === "POST") {
      saved = route.request().postDataJSON();
      await route.fulfill({ json: { ok: true } });
    } else {
      await route.fulfill({ json: content });
    }
  });

  await page.goto("/admin/quests");
  await skipWithoutAccounts(page);
  await page.getByRole("button", { name: "Коробки памяти" }).click();
  const title = page.getByLabel("Название этапа");
  await expect(title).toHaveValue("Коробки памяти");
  await title.fill("Коробки памяти: int и double");
  await page.getByRole("button", { name: "Сохранить" }).first().click();
  await expect(page.getByText("Сохранено, на сайте — при следующем открытии")).toBeVisible();
  expect(saved).toEqual({
    quest_id: "basics",
    stage_id: "memory-boxes",
    field: "title",
    value: "Коробки памяти: int и double",
  });
  await expect(page.getByText("изменено")).toBeVisible();
});
