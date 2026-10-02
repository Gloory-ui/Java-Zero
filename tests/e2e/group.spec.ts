import { expect, type Page, test } from "@playwright/test";
import { loadCourse } from "../../lib/content/load";
import { groupStagePayload, groupTitles } from "../../lib/group/content";

// Раздел «Группа» закрыт на сервере: членство — функции Supabase is_group_member и join_group,
// задания КТ — маршрут /api/group/stage. Здесь их ответы подменены: настоящих аккаунтов тест не создаёт

const course = loadCourse();
const kt1 = course.find((q) => q.id === "kt1");
if (!kt1) throw new Error("нет квеста kt1");
const CODE = "invite2026";

const USER = { id: "22222222-2222-4222-8222-222222222222", email: "petya@example.com", aud: "authenticated" };

/** Неподписанный JWT: supabase-js читает из токена только срок действия */
function fakeJwt(sub: string): string {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${part({ alg: "HS256", typ: "JWT" })}.${part({ sub, exp, role: "authenticated", aud: "authenticated" })}.sig`;
}

const TOKEN = fakeJwt(USER.id);

/** Прогресс в браузере до загрузки страницы */
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

type Server = { member: boolean; joins: string[]; stageAuth: (string | null)[] };

/** Вошедший студент: сессия в браузере, ответы Supabase и /api/group/* подменены */
async function signIn(page: Page, { member }: { member: boolean }): Promise<Server> {
  const server: Server = { member, joins: [], stageAuth: [] };
  const session = {
    access_token: TOKEN,
    refresh_token: "refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { ...USER, identities: [{ id: USER.id, provider: "email" }], user_metadata: { user_name: "petya" } },
  };
  await page.addInitScript((s) => localStorage.setItem("java-zero-auth", s), JSON.stringify(session));
  await page.route("**/auth/v1/user", (route) => route.fulfill({ json: session.user }));
  await page.route("**/rest/v1/**", (route) =>
    route.fulfill({ status: route.request().method() === "GET" ? 200 : 204, json: [] }),
  );
  // Обработчики, добавленные позже, срабатывают раньше общего **/rest/v1/**
  await page.route("**/rest/v1/rpc/is_group_member", (route) => route.fulfill({ json: server.member }));
  await page.route("**/rest/v1/rpc/join_group", async (route) => {
    const code = String(route.request().postDataJSON().p_code);
    server.joins.push(code);
    server.member = server.member || code === CODE;
    await route.fulfill({ json: code === CODE });
  });
  await page.route("**/api/group/outline", (route) =>
    server.member ? route.fulfill({ json: groupTitles() }) : route.fulfill({ status: 403, json: { error: "нет" } }),
  );
  await page.route("**/api/group/stage**", async (route) => {
    server.stageAuth.push(route.request().headers().authorization ?? null);
    const url = new URL(route.request().url());
    const payload = groupStagePayload(url.searchParams.get("quest") ?? "", url.searchParams.get("stage") ?? "");
    if (!server.member)
      return route.fulfill({ status: 403, json: { error: "Задания КТ — только для участников группы." } });
    return payload ? route.fulfill({ json: payload }) : route.fulfill({ status: 404, json: { error: "нет" } });
  });
  return server;
}

/** Аккаунты выключены в сборке без ключей Supabase (как в CI): вход проверить нельзя */
async function skipWithoutAccounts(page: Page) {
  await page.goto("/login");
  const disabled = page.getByText("Аккаунты на этой версии сайта ещё не подключены");
  await expect(disabled.or(page.getByRole("button", { name: /Войти$/ })).first()).toBeVisible();
  test.skip(await disabled.isVisible(), "Аккаунты не настроены в этой сборке");
}

const passedStages = (done: Record<string, string[]>) =>
  Object.fromEntries(
    Object.entries(done).flatMap(([quest, ids]) =>
      ids.map((id) => [`${quest}/${id}`, { attempts: [], passedAt: 1, xp: 70 }]),
    ),
  );
const stageIds = (questId: string) => course.find((q) => q.id === questId)?.stages.map((s) => s.id) ?? [];

test("гость не видит КТ: ни в шапке, ни на карте курса; раздел объясняет, как попасть", async ({ page }) => {
  await page.goto("/course");
  await expect(page.getByRole("heading", { level: 1, name: "Java с нуля" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Циклы" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Калькулятор" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Контрольная точка 1" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Группа", exact: true })).toHaveCount(0);

  await page.goto("/group");
  await expect(page.getByText(/^Этот раздел — для одногруппников/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Контрольная точка 1" })).toHaveCount(0);
});

test("старая отметка в браузере и сданный этап КТ доступа не дают", async ({ page }) => {
  await seed(page, { stats: { group: 1 }, stages: { "kt1/multiplication-table": { attempts: [], passedAt: 1 } } });
  await page.goto("/group");
  await expect(page.getByText(/^Этот раздел — для одногруппников/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Контрольная точка 1" })).toHaveCount(0);
});

test("задание КТ без доступа: в HTML и скриптах страницы нет ни названия, ни теории, ни решения", async ({ page }) => {
  const stage = kt1.stages[5];
  const response = await page.goto(`/learn/kt1/${stage.id}`);
  await expect(page.getByRole("heading", { name: "Задание для одногруппников" })).toBeVisible();

  const secrets = [
    stage.title,
    stage.theory.split("\n").find((l) => l.length > 30) ?? "",
    stage.solution.trim().split("\n")[2],
  ];
  const html = (await response?.text()) ?? "";
  const scripts = await page.evaluate(() => [...document.scripts].map((s) => s.src).filter(Boolean));
  const bodies = [html, ...(await Promise.all(scripts.map(async (src) => (await page.request.get(src)).text())))];
  for (const secret of secrets.filter((s) => s.trim().length > 8)) {
    for (const body of bodies) expect(body).not.toContain(secret.trim());
  }
  // Названий заданий КТ нет и в оглавлении, которое уходит в каждую страницу
  for (const s of kt1.stages) expect(html).not.toContain(`"${s.title}"`);
});

test("ссылка-приглашение у гостя: код убран из адреса и ждёт входа в аккаунт", async ({ page }) => {
  await skipWithoutAccounts(page);
  await page.goto(`/group?join=${CODE}`);
  await expect(page).toHaveURL(/\/group$/);
  await expect(page.getByText("Приглашение принято. Войди в аккаунт")).toBeVisible();
  await expect(page.getByRole("link", { name: "Войти в аккаунт" })).toHaveAttribute("href", "/login?next=/group");
});

test("вошедший студент по ссылке-приглашению попадает в группу", async ({ page }) => {
  await skipWithoutAccounts(page);
  const server = await signIn(page, { member: false });
  await page.goto(`/group?join=${CODE.toUpperCase()}`);
  await expect(page.getByText("Готово: ты в группе")).toBeVisible();
  await expect(page).toHaveURL(/\/group$/);
  expect(server.joins).toEqual([CODE]);
  await expect(page.getByRole("heading", { level: 2, name: "Контрольная точка 1" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 3, name: "Фундамент Java" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Начать с первого шага" })).toHaveAttribute(
    "href",
    "/learn/basics/program-structure",
  );
  // Участник видит раздел и на карте общего курса
  await page.goto("/course");
  await expect(page.getByRole("link", { name: /Раздел «Группа»/ })).toBeVisible();
});

test("чужой код не пускает в раздел", async ({ page }) => {
  await skipWithoutAccounts(page);
  await signIn(page, { member: false });
  await page.goto("/group?join=wrongcode");
  // У Next есть свой пустой role="alert" для объявлений о переходах, поэтому ищем по тексту
  await expect(page.getByRole("alert").filter({ hasText: "Ссылка-приглашение не подошла" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Контрольная точка 1" })).toHaveCount(0);
});

test("участник получает задание КТ с сервера по токену", async ({ page }) => {
  await skipWithoutAccounts(page);
  const server = await signIn(page, { member: true });
  await seed(page, { stages: passedStages({ basics: stageIds("basics"), loops_prep: stageIds("loops_prep") }) });
  await page.goto("/group");
  await expect(page.getByRole("link", { name: "Продолжить" })).toHaveAttribute(
    "href",
    "/learn/kt1/multiplication-table",
  );
  // Названия заданий КТ участник получил с сервера
  await expect(page.getByText(kt1.stages[0].title).first()).toBeVisible();

  await page.goto("/learn/kt1/multiplication-table");
  await expect(page.getByRole("heading", { level: 1, name: new RegExp(kt1.stages[0].title) })).toBeVisible();
  expect(server.stageAuth.at(-1)).toBe(`Bearer ${TOKEN}`);
});

test("доступ забрали: сервер отвечает 403, и задание не показывается", async ({ page }) => {
  await skipWithoutAccounts(page);
  const server = await signIn(page, { member: true });
  await page.goto("/group");
  await expect(page.getByRole("heading", { level: 2, name: "Контрольная точка 1" })).toBeVisible();
  server.member = false;
  await page.goto("/learn/kt1/multiplication-table");
  await expect(page.getByRole("heading", { name: "Задание для одногруппников" })).toBeVisible();
});

test("после КТ 1 участник идёт в «Массивы», а КТ 2 ждёт подготовку", async ({ page }) => {
  await skipWithoutAccounts(page);
  await signIn(page, { member: true });
  await seed(page, {
    stages: passedStages({ basics: stageIds("basics"), loops_prep: stageIds("loops_prep"), kt1: stageIds("kt1") }),
  });
  await page.goto("/group");
  await expect(page.getByRole("heading", { level: 2, name: "Контрольная точка 2" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Продолжить" })).toHaveAttribute(
    "href",
    "/learn/arrays_prep/array-basics",
  );
  await expect(page.getByText("Откроется после квеста «Массивы и таблицы».")).toBeVisible();
});

test("шапка участника с пунктом «Группа» влезает в 375, 768 и 1024 px", async ({ page }) => {
  await skipWithoutAccounts(page);
  await signIn(page, { member: true });
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
