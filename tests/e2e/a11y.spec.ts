import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = [
  "/",
  "/course",
  "/handbook",
  "/profile",
  "/login",
  "/privacy",
  "/learn/basics/program-structure",
  "/no-such-page",
];

/** Студент старого курса сдал «Коробки памяти»: открыт этап с таблицей в теории, на карте видны пометки «новый» */
const RETURNING = ["/course", "/learn/basics/memory-boxes"];

const SEEDED = JSON.stringify({
  state: {
    stages: { "basics/memory-boxes": { attempts: [], passedAt: 1 } },
    streak: 1,
    achievements: {},
    persona: "chill",
    sound: true,
  },
  version: 1,
});

const CASES = [...PAGES.map((path) => ({ path, seeded: false })), ...RETURNING.map((path) => ({ path, seeded: true }))];

for (const theme of ["dark", "light"] as const) {
  for (const { path, seeded } of CASES) {
    test(`доступность ${path}${seeded ? " с прогрессом" : ""} (${theme})`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem("java_zero_theme", value), theme);
      if (seeded) await page.addInitScript((value) => localStorage.setItem("java-zero-progress", value), SEEDED);
      await page.goto(path);
      await expect(page.locator("main, [role='main'], .cm-editor").first()).toBeVisible();
      // Анимации появления успевают закончиться, иначе axe меряет контраст полупрозрачного текста
      await page.waitForTimeout(1600);
      // .cm-scroller: фокус получает contenteditable внутри редактора CodeMirror, прокрутка с клавиатуры работает
      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .exclude(".cm-scroller")
        .analyze();
      const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(
        serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
        "нарушения WCAG",
      ).toEqual([]);
    });
  }
}
