import { expect, type Page, test } from "@playwright/test";
import { loadCourse } from "../../lib/content/load";
import { groupTitles } from "../../lib/group/content";

// Вкладка «Группа» в админке: функции базы (admin_group_*) подменены, настоящих аккаунтов и данных тест не трогает

function findQuest(id: string) {
  const quest = loadCourse().find((q) => q.id === id);
  if (!quest) throw new Error(`нет квеста ${id}`);
  return quest;
}

const kt1 = findQuest("kt1");

const ADMIN = { id: "33333333-3333-4333-8333-333333333333", email: "teacher@example.com", aud: "authenticated" };
const ANNA = "44444444-4444-4444-8444-444444444444";
const BORYA = "55555555-5555-4555-8555-555555555555";

function fakeJwt(sub: string): string {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${part({ alg: "HS256", typ: "JWT" })}.${part({ sub, exp, role: "authenticated", aud: "authenticated" })}.sig`;
}

type Db = { code: string; members: Record<string, unknown>[]; calls: { fn: string; args: unknown }[] };

async function openAsAdmin(page: Page): Promise<Db> {
  await page.goto("/login");
  const disabled = page.getByText("Аккаунты на этой версии сайта ещё не подключены");
  await expect(disabled.or(page.getByRole("button", { name: /Войти$/ })).first()).toBeVisible();
  test.skip(await disabled.isVisible(), "Аккаунты не настроены в этой сборке");

  const db: Db = {
    code: "abc12345",
    calls: [],
    members: [
      {
        user_id: ANNA,
        handle: "anna",
        display_name: "Анна",
        avatar_url: null,
        source: "invite",
        added_by_handle: null,
        joined_at: "2026-09-20T10:00:00Z",
      },
      {
        user_id: BORYA,
        handle: "borya",
        display_name: "Боря",
        avatar_url: null,
        source: "legacy",
        added_by_handle: null,
        joined_at: "2026-09-10T10:00:00Z",
      },
    ],
  };
  const session = {
    access_token: fakeJwt(ADMIN.id),
    refresh_token: "refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { ...ADMIN, identities: [{ id: ADMIN.id, provider: "email" }], user_metadata: { user_name: "teacher" } },
  };
  await page.addInitScript((s) => localStorage.setItem("java-zero-auth", s), JSON.stringify(session));
  await page.route("**/auth/v1/user", (route) => route.fulfill({ json: session.user }));
  await page.route("**/rest/v1/**", (route) =>
    route.fulfill({ status: route.request().method() === "GET" ? 200 : 204, json: [] }),
  );
  await page.route("**/rest/v1/rpc/**", async (route) => {
    const fn = new URL(route.request().url()).pathname.split("/").pop() ?? "";
    const args = route.request().postDataJSON() ?? {};
    db.calls.push({ fn, args });
    switch (fn) {
      case "is_admin":
        return route.fulfill({ json: true });
      case "is_group_member":
        return route.fulfill({ json: false });
      case "admin_group_invite":
        return route.fulfill({ json: db.code });
      case "admin_group_set_invite":
        db.code = args.p_code ?? "rnd0000001";
        return route.fulfill({ json: db.code });
      case "admin_group_members":
        return route.fulfill({ json: db.members });
      case "admin_group_progress":
        return route.fulfill({
          json: [
            {
              user_id: ANNA,
              quest_id: "kt1",
              stage_id: kt1.stages[0].id,
              started_at: "2026-09-21T09:00:00Z",
              passed_at: "2026-09-21T10:00:00Z",
              attempts: 3,
              fails: 2,
              hint_used: false,
              solution_viewed: false,
              updated_at: "2026-09-21T10:00:00Z",
            },
            {
              user_id: ANNA,
              quest_id: "kt1",
              stage_id: kt1.stages[1].id,
              started_at: "2026-09-21T11:00:00Z",
              passed_at: null,
              attempts: 4,
              fails: 4,
              hint_used: true,
              solution_viewed: false,
              updated_at: "2026-09-21T11:30:00Z",
            },
          ],
        });
      case "admin_group_grant":
        if (args.p_handle !== "vasya") {
          return route.fulfill({ status: 404, json: { code: "P0002", message: "user not found" } });
        }
        db.members = [
          ...db.members,
          {
            user_id: "66666666-6666-4666-8666-666666666666",
            handle: "vasya",
            display_name: "Вася",
            avatar_url: null,
            source: "admin",
            added_by_handle: "teacher",
            joined_at: "2026-10-01T10:00:00Z",
          },
        ];
        return route.fulfill({ json: "66666666-6666-4666-8666-666666666666" });
      case "admin_group_revoke":
        db.members = db.members.filter((m) => m.user_id !== args.p_user);
        return route.fulfill({ status: 204, body: "" });
      default:
        return route.fulfill({ json: [] });
    }
  });
  await page.route("**/api/group/outline", (route) => route.fulfill({ json: groupTitles() }));
  await page.goto("/admin/group");
  await expect(page.getByRole("heading", { level: 2, name: "Ссылка-приглашение" })).toBeVisible();
  return db;
}

test("ссылка-приглашение: показана целиком, код меняется после подтверждения", async ({ page }) => {
  const db = await openAsAdmin(page);
  const link = page.getByRole("textbox", { name: "Ссылка-приглашение" });
  await expect(link).toHaveValue(/\/group\?join=abc12345$/);

  await page.getByRole("button", { name: "Новый случайный код" }).click();
  await expect(page.getByText("Старая ссылка перестанет пускать новых людей")).toBeVisible();
  await page.getByRole("button", { name: "Сменить на случайный" }).click();
  await expect(link).toHaveValue(/\/group\?join=rnd0000001$/);

  await page.getByLabel("Свой код").fill("Bad code!");
  await page.getByRole("button", { name: "Сохранить код" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "латиница в нижнем регистре и цифры" })).toBeVisible();
  await page.getByLabel("Свой код").fill("Epai2026");
  await page.getByRole("button", { name: "Сохранить код" }).click();
  await expect(link).toHaveValue(/\/group\?join=epai2026$/);
  expect(db.calls.filter((c) => c.fn === "admin_group_set_invite").map((c) => c.args)).toEqual([
    {},
    { p_code: "epai2026" },
  ]);
});

test("участники: выдать доступ по нику, понятная ошибка для чужого ника, забрать доступ", async ({ page }) => {
  await openAsAdmin(page);
  await expect(page.getByRole("heading", { level: 2, name: "Участники · 2" })).toBeVisible();
  await expect(page.getByText("был в группе до обновления")).toBeVisible();

  await page.getByLabel("Ник студента").fill("@nobody");
  await page.getByRole("button", { name: "Выдать доступ" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Студента с ником @nobody нет" })).toBeVisible();

  await page.getByLabel("Ник студента").fill("@vasya");
  await page.getByRole("button", { name: "Выдать доступ" }).click();
  await expect(page.getByText("@vasya теперь в группе.")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Участники · 3" })).toBeVisible();
  await expect(page.getByText("выдал админ @teacher")).toBeVisible();

  await page.getByRole("button", { name: "Забрать доступ у @borya" }).click();
  await page.getByRole("button", { name: "Да, забрать" }).click();
  await expect(page.getByText("Доступ у @borya забран.")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Участники · 2" })).toBeVisible();
});

test("прогресс по КТ: сданное с датой, начатое с числом вариантов, подсказка с подробностями", async ({ page }) => {
  await openAsAdmin(page);
  const table = page.getByRole("table");
  await expect(table.getByRole("rowheader", { name: "@anna" })).toBeVisible();
  const anna = table.getByRole("row", { name: /@anna/ });
  await expect(anna.getByRole("cell").first()).toHaveAttribute("title", new RegExp(`${kt1.stages[0].title}: сдано`));
  await expect(anna.getByRole("cell").first()).toHaveAttribute("title", /3 варианта кода, 2 проваленные проверки/);
  await expect(anna.getByRole("cell").nth(1)).toHaveAttribute("title", /начато, не сдано.*брал подсказку/);
  await expect(anna.getByRole("cell").last()).toHaveText(`1/${kt1.stages.length}`);
  // Настоящие названия заданий админ получил с сервера
  await expect(table.getByRole("columnheader", { name: kt1.stages[0].title })).toHaveCount(1);

  await page.getByRole("tab", { name: "Контрольная точка 2" }).click();
  await expect(table.getByRole("row", { name: /@anna/ }).getByRole("cell").last()).toHaveText(/^0\//);
});

test("вкладка влезает в экран телефона: широкая таблица прокручивается внутри себя", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await openAsAdmin(page);
  await expect(page.getByRole("table")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
