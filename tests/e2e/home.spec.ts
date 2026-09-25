import { expect, test } from "@playwright/test";

test("главная: заголовок, язык, кнопка первого этапа", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Java с нуля до сданной контрольной");
  await expect(page.getByRole("link", { name: "Начать первый этап" }).first()).toHaveAttribute(
    "href",
    "/learn/basics/program-structure",
  );
  await expect(page.getByText("4 квеста, 26 этапов")).toBeVisible();
  expect(errors).toEqual([]);
});

test("вернувшийся студент продолжает со следующего этапа после сданного", async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "java-zero-progress",
      JSON.stringify({
        state: {
          stages: { "basics/memory-boxes": { attempts: [], passedAt: 1 } },
          streak: 1,
          achievements: {},
          persona: "chill",
          sound: true,
        },
        version: 1,
      }),
    ),
  );
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Продолжить с того же места" }).first()).toHaveAttribute(
    "href",
    "/learn/basics/arithmetic",
  );
});

test("справочник, 404, sitemap и robots", async ({ page, request }) => {
  await page.goto("/handbook");
  await expect(page.getByRole("heading", { name: "Справочник Java" })).toBeVisible();
  await expect(page.getByText("В лаборатории Java-Zero дробь вводят через точку")).toBeVisible();

  const missing = await page.goto("/no-such-page");
  expect(missing?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Такой страницы нет" })).toBeVisible();

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/learn/kt1/guess-number");
  // Превью закрыто от поиска целиком
  expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /");
  expect((await request.get("/opengraph-image")).headers()["content-type"]).toContain("image/png");
});

test("тема: тёмная по умолчанию, светлая из localStorage без мигания", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.addInitScript(() => localStorage.setItem("java_zero_theme", "light"));
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("старые адреса .html постоянно перенаправляются", async ({ request }) => {
  const cases = [
    ["/index.html", "/"],
    ["/lab.html", "/course"],
    ["/profile.html", "/profile"],
    ["/handbook.html", "/handbook"],
  ] as const;
  for (const [from, to] of cases) {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status(), from).toBe(308);
    expect(res.headers().location, from).toBe(to);
  }
});

test("превью закрыто от поисковиков", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("нет горизонтальной прокрутки", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
