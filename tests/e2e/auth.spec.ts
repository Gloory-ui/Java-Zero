import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

// Регистрация и вход с подменёнными ответами Supabase: настоящих аккаунтов тест не создаёт.
// Без ключей Supabase (как в CI) аккаунты выключены, и проверять здесь нечего

/** Неподписанный JWT: supabase-js читает из токена только срок действия */
function fakeJwt(sub: string): string {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${part({ alg: "HS256", typ: "JWT" })}.${part({ sub, exp, role: "authenticated", aud: "authenticated" })}.sig`;
}

const USER = { id: "11111111-1111-4111-8111-111111111111", email: "anna@example.com", aud: "authenticated" };

function session() {
  return {
    access_token: fakeJwt(USER.id),
    refresh_token: "refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { ...USER, identities: [{ id: USER.id, provider: "email" }], user_metadata: { user_name: "barsik" } },
  };
}

/** Общие подмены: способы входа, данные пользователя и таблицы — синхронизации после входа есть с чем работать */
async function mockSupabase(page: Page) {
  await page.route("**/auth/v1/settings", (route) =>
    route.fulfill({ json: { external: { email: true, github: true, google: true } } }),
  );
  await page.route("**/auth/v1/user", (route) => route.fulfill({ json: session().user }));
  await page.route("**/rest/v1/**", (route) =>
    route.fulfill({ status: route.request().method() === "GET" ? 200 : 204, json: [] }),
  );
}

async function openLogin(page: Page, query = "") {
  await page.goto(`/login${query}`);
  const disabled = page.getByText("Аккаунты на этой версии сайта ещё не подключены");
  const form = page.getByRole("button", { name: /Войти$|Зарегистрироваться$/ });
  await expect(disabled.or(form).first()).toBeVisible();
  test.skip(await disabled.isVisible(), "Аккаунты не настроены в этой сборке");
}

test("регистрация: ник, почта, пароль, затем 6-значный код из письма", async ({ page }) => {
  await mockSupabase(page);
  await page.route("**/api/auth/handle**", (route) => route.fulfill({ json: { available: true } }));
  let signupBody: Record<string, unknown> = {};
  await page.route("**/auth/v1/signup**", async (route) => {
    signupBody = route.request().postDataJSON();
    await route.fulfill({ json: { ...USER, identities: [{ id: USER.id, provider: "email" }] } });
  });
  let verified = false;
  await page.route("**/auth/v1/verify", async (route) => {
    verified = route.request().postDataJSON().token === "123456";
    await route.fulfill(
      verified ? { json: session() } : { status: 403, json: { msg: "Token has expired or is invalid" } },
    );
  });

  await openLogin(page, "?mode=signup&next=/course");
  await expect(page.getByRole("heading", { level: 1, name: "Регистрация" })).toBeVisible();
  await page.getByLabel("Ник").fill("Barsik");
  await expect(page.getByText("Ник свободен.")).toBeVisible();
  await page.getByLabel("Почта").fill(USER.email);
  await page.getByLabel("Пароль", { exact: true }).fill("secret-pass-1");
  await page.getByRole("button", { name: "Зарегистрироваться" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Подтверди почту" })).toBeVisible();
  // Ник уходит в данные аккаунта: user_name — чтобы имя в профиле было ником, а не частью почты
  expect(signupBody).toMatchObject({ email: USER.email, data: { handle: "barsik", user_name: "barsik" } });

  await page.getByLabel("Код из письма").fill("123456");
  await page.getByRole("button", { name: "Подтвердить" }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe("/course");
  expect(verified).toBe(true);
});

/** Регистрация до шага с кодом; verify отвечает успехом только на 123456 */
async function openCodeStep(page: Page) {
  await mockSupabase(page);
  await page.route("**/api/auth/handle**", (route) => route.fulfill({ json: { available: true } }));
  await page.route("**/auth/v1/signup**", (route) =>
    route.fulfill({ json: { ...USER, identities: [{ id: USER.id, provider: "email" }] } }),
  );
  await page.route("**/auth/v1/verify", (route) =>
    route.fulfill(
      route.request().postDataJSON().token === "123456"
        ? { json: session() }
        : { status: 403, json: { msg: "Token has expired or is invalid" } },
    ),
  );
  await openLogin(page, "?mode=signup&next=/course");
  await page.getByLabel("Ник").fill("barsik");
  await expect(page.getByText("Ник свободен.")).toBeVisible();
  await page.getByLabel("Почта").fill(USER.email);
  await page.getByLabel("Пароль", { exact: true }).fill("secret-pass-1");
  await page.getByRole("button", { name: "Зарегистрироваться" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Подтверди почту" })).toBeVisible();
  const input = page.getByLabel("Код из письма");
  // Карты рисуют значение настоящего поля и лежат с ним в одном контейнере
  return { input, deck: input.locator("..") };
}

test("код колодой карт: ввод по цифре, вставка, Enter, красные карты на неверном коде", async ({ page }) => {
  const { input, deck } = await openCodeStep(page);
  const submit = page.getByRole("button", { name: "Подтвердить" });

  // Поле одно и настоящее: подсказка кода из письма, цифровая клавиатура, фокус сразу в нём
  await expect(input).toBeFocused();
  await expect(input).toHaveAttribute("autocomplete", "one-time-code");
  await expect(input).toHaveAttribute("inputmode", "numeric");
  await expect(input).toHaveAccessibleDescription("6 цифр. Код можно вставить целиком.");

  await page.keyboard.type("12a");
  await expect(input).toHaveValue("12");
  await expect(deck.locator("[data-filled]")).toHaveCount(2);
  await expect(submit).toBeDisabled();

  await page.keyboard.type("9999");
  await expect(deck.locator("[data-filled]")).toHaveCount(6);
  await page.keyboard.press("Enter");
  await expect(deck).toHaveAttribute("data-verdict", "bad");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("alert").filter({ hasText: "Код неверный или устарел. Запроси новый." })).toBeVisible();

  // Правка кода снимает вердикт
  await page.keyboard.press("Backspace");
  await expect(deck).not.toHaveAttribute("data-verdict");
  await expect(deck.locator("[data-filled]")).toHaveCount(5);

  // Код из письма вставляют целиком, с пробелами и словами: остаются цифры
  await input.fill("Код: 123 456");
  await expect(input).toHaveValue("123456");
  const results = await new AxeBuilder({ page }).include("main").analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);

  await page.keyboard.press("Enter");
  await expect(deck).toHaveAttribute("data-verdict", "ok");
  await expect.poll(() => new URL(page.url()).pathname).toBe("/course");
});

test("код восстановления колодой: при «меньше движения» карты не двигаются, линия только проявляется", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockSupabase(page);
  await page.route("**/auth/v1/recover**", (route) => route.fulfill({ json: {} }));
  let tries = 0;
  await page.route("**/auth/v1/verify", (route) =>
    route.fulfill(
      ++tries === 1 ? { status: 403, json: { msg: "Token has expired or is invalid" } } : { json: session() },
    ),
  );
  await openLogin(page);
  await page.getByRole("button", { name: "Забыл пароль?" }).click();
  await page.getByLabel("Почта").fill(USER.email);
  await page.getByRole("button", { name: "Прислать код" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Код из письма" })).toBeVisible();

  const input = page.getByLabel("Код из письма");
  const deck = input.locator("..");
  await page.keyboard.type("654321");
  const motion = await deck.evaluate((el) => {
    const card = el.querySelector("[data-filled]") as HTMLElement;
    const style = (selector: string) => getComputedStyle(el.querySelector(selector) as Element);
    return {
      trace: style("svg rect").animationName,
      comet: style("svg rect:last-child").display,
      transition: getComputedStyle(card).transitionProperty,
    };
  });
  expect(motion.trace).toContain("deck-fade");
  expect(motion.comet).toBe("none");
  expect(motion.transition).not.toContain("translate");

  await page.getByRole("button", { name: "Подтвердить" }).click();
  await expect(deck).toHaveAttribute("data-verdict", "bad");
  expect(await deck.evaluate((el) => getComputedStyle(el).animationName)).toBe("none");

  await page.keyboard.press("Backspace");
  await page.keyboard.type("1");
  await page.getByRole("button", { name: "Подтвердить" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Новый пароль" })).toBeVisible();
});

test("регистрация: занятый ник видно сразу, кнопка неактивна", async ({ page }) => {
  await mockSupabase(page);
  await page.route("**/api/auth/handle**", (route) => route.fulfill({ json: { available: false } }));
  await openLogin(page, "?mode=signup");
  await page.getByLabel("Ник").fill("barsik");
  await expect(page.getByText("Этот ник уже занят.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Зарегистрироваться" })).toBeDisabled();
});

test("вход по нику: сервер возвращает сессию, почту браузер не видит", async ({ page }) => {
  await mockSupabase(page);
  let body: Record<string, unknown> = {};
  await page.route("**/api/auth/login", async (route) => {
    body = route.request().postDataJSON();
    const { access_token, refresh_token } = session();
    await route.fulfill({ json: { access_token, refresh_token } });
  });
  await openLogin(page, "?next=/course");
  await page.getByLabel("Ник или почта").fill("@Barsik");
  await page.getByLabel("Пароль", { exact: true }).fill("secret-pass-1");
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe("/course");
  expect(body).toEqual({ handle: "@Barsik", password: "secret-pass-1" });
});

test("неверный пароль: понятная ошибка по-русски", async ({ page }) => {
  await mockSupabase(page);
  await page.route("**/auth/v1/token**", (route) =>
    route.fulfill({
      status: 400,
      json: { code: 400, error_code: "invalid_credentials", msg: "Invalid login credentials" },
    }),
  );
  await openLogin(page);
  await page.getByLabel("Ник или почта").fill(USER.email);
  await page.getByLabel("Пароль", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Неверный ник, почта или пароль." })).toBeVisible();
});

test("пароль можно показать и скрыть", async ({ page }) => {
  await mockSupabase(page);
  await openLogin(page);
  const input = page.getByLabel("Пароль", { exact: true });
  await input.fill("secret");
  await expect(input).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Показать пароль" }).click();
  await expect(input).toHaveAttribute("type", "text");
});

test("Яндекс: без ключей приложения вход честно говорит, что не настроен", async ({ page }) => {
  await page.goto("/api/auth/yandex?next=/course");
  await expect(page.getByRole("heading", { name: "Вход не удался" })).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: "Вход через Яндекс пока не настроен." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ко входу" })).toHaveAttribute("href", "/login");
});

test("Яндекс: сессия из адреса сохраняется, адрес очищается, студент идёт дальше", async ({ page }) => {
  await mockSupabase(page);
  await openLogin(page);
  const { access_token, refresh_token } = session();
  const fragment = new URLSearchParams({ access_token, refresh_token, next: "/course" });
  await page.goto(`/auth/yandex#${fragment}`);
  await expect.poll(() => new URL(page.url()).pathname).toBe("/course");
  // Токены не остаются в адресе и в истории
  expect(page.url()).not.toContain("access_token");
  const stored = await page.evaluate(() => localStorage.getItem("java-zero-auth"));
  expect(stored).toContain("refresh-token");
});
