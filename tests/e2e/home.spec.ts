import { expect, test } from "@playwright/test";

test("временная главная: заголовок, язык и ссылка на рабочую версию", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Java-Zero переезжает на новый движок");
  await expect(page.getByRole("link", { name: "Открыть рабочую версию" })).toHaveAttribute(
    "href",
    "https://java-zero.onrender.com",
  );
  expect(errors).toEqual([]);
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
