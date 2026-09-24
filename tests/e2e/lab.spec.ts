import { expect, type Page, test } from "@playwright/test";

const STAGE = "/learn/basics/memory-boxes";

async function setCode(page: Page, code: string) {
  const editor = page.locator(".cm-content");
  await editor.click();
  await page.keyboard.press("ControlOrMeta+a");
  // insertText вставляет строку одним событием: без автоскобок и автоотступов редактора
  await page.keyboard.insertText(code);
}

test("этап: теория, вкладки и квиз работают без ошибок в консоли", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto(STAGE);
  await expect(page).toHaveTitle(/Коробки памяти/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Коробки памяти");
  await expect(page.getByRole("heading", { name: "Как компьютер хранит данные?" })).toBeVisible();

  await page.getByRole("tab", { name: "Квиз" }).click();
  await expect(page.getByRole("tab", { name: "Квиз" })).toHaveAttribute("aria-selected", "true");
  const options = page.getByRole("radio");
  await expect(options.first()).toBeAttached();
  await page.locator("fieldset label").first().click();
  await expect(page.getByText(/^(Верно|Не то)/)).toBeVisible();

  await expect(page.locator(".cm-content")).toContainText("public class Basics");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test("закрытый этап показывает, куда идти", async ({ page }) => {
  await page.goto("/learn/kt1/primes-to-n");
  await expect(page.getByRole("heading", { name: "Этап пока закрыт" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Продолжить с доступного этапа" })).toHaveAttribute(
    "href",
    "/learn/basics/memory-boxes",
  );
});

test("несуществующий этап — 404", async ({ request }) => {
  const res = await request.get("/learn/basics/no-such-stage");
  expect(res.status()).toBe(404);
});

test("настоящая Java: ошибка компиляции, затем сданный этап", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "CheerpJ тяжёлый: полный прогон только на десктопе");
  test.setTimeout(240_000);

  await page.goto(STAGE);
  await expect(page.locator("output")).toContainText("Java готова", { timeout: 180_000 });

  await setCode(
    page,
    "public class Basics {\n    public static void main(String[] args) {\n        int a = 10\n        System.out.println(a);\n    }\n}\n",
  );
  await page.getByRole("button", { name: "Проверить", exact: true }).click();
  await expect(page.getByText("Код не компилируется: ошибок 1.")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText("строка 3")).toBeVisible();

  await setCode(
    page,
    "public class Basics {\n    public static void main(String[] args) {\n        int a = 10;\n        double b = 2.5;\n        double result = a + b;\n        System.out.println(result);\n    }\n}\n",
  );
  await page.keyboard.press("ControlOrMeta+Enter");
  await expect(page.getByText("Этап сдан")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Тесты: 4 из 4")).toBeVisible();

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("java-zero-progress") ?? "{}"));
  expect(saved.state.stages["basics/memory-boxes"].passedAt).toBeGreaterThan(0);
  expect(saved.state.streak).toBe(1);
});
