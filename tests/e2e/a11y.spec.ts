import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = ["/", "/course", "/handbook", "/profile", "/login", "/learn/basics/memory-boxes", "/no-such-page"];

for (const theme of ["dark", "light"] as const) {
  for (const path of PAGES) {
    test(`доступность ${path} (${theme})`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem("java_zero_theme", value), theme);
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
