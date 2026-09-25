import { describe, expect, it } from "vitest";
import { loadCourse } from "@/lib/content/load";
import { questSchema, stageSchema } from "@/lib/content/schema";

describe("курс из content/quests", () => {
  const course = loadCourse();

  it("четыре квеста по порядку, каждый открывается после предыдущего", () => {
    expect(course.map((q) => q.id)).toEqual(["basics", "loops_prep", "kt1", "calc"]);
    expect(course.map((q) => q.unlockAfter)).toEqual([null, "basics", "loops_prep", "kt1"]);
  });

  it("26 этапов; у каждого есть теория, стартовый код, решение и тесты", () => {
    const stages = course.flatMap((q) => q.stages);
    expect(stages).toHaveLength(26);
    for (const s of stages) {
      expect(s.theory.length, s.id).toBeGreaterThan(20);
      expect(s.starter, s.id).toContain("class");
      expect(s.solution, s.id).toContain("class");
      expect(s.tests.length, s.id).toBeGreaterThan(0);
    }
  });

  it("по шаблону курса: три подсказки, три вопроса защиты и точный вывод в теории", () => {
    for (const s of course.flatMap((q) => q.stages)) {
      expect(s.hints, s.id).toHaveLength(3);
      expect(s.exam, s.id).toHaveLength(3);
      expect(s.theory, s.id).toContain("### Что должна вывести программа");
    }
  });

  it("этапы со Scanner подсказывают пример ввода", () => {
    for (const s of course.flatMap((q) => q.stages)) {
      if (s.solution.includes("new Scanner(System.in)")) expect(s.sampleInput, s.id).toBeTruthy();
    }
  });
});

describe("схема контента", () => {
  const stage = {
    id: "demo",
    badge: "ЭТАП",
    title: "Демо",
    hints: ["подсказка"],
    quiz: { question: "?", options: ["а", "б"], correct: 1, hint: "почему" },
    exam: [{ q: "?", options: ["а", "б"], correct: 0, explain: "потому", advice: "повтори" }],
    tests: [{ name: "вывод", stdout: "1\n" }],
  };

  it("io-тест по умолчанию: пустой ввод и построчное сравнение", () => {
    const parsed = stageSchema.parse(stage);
    expect(parsed.tests[0]).toEqual({ kind: "io", name: "вывод", stdin: "", stdout: "1\n", match: "lines" });
  });

  it("ловит правильный ответ вне списка вариантов", () => {
    expect(stageSchema.safeParse({ ...stage, quiz: { ...stage.quiz, correct: 2 } }).success).toBe(false);
  });

  it("ловит id с пробелами и имя файла не по правилам Java", () => {
    expect(stageSchema.safeParse({ ...stage, id: "Мой этап" }).success).toBe(false);
    const quest = { id: "kt2", num: "КТ", title: "КТ 2", subtitle: "…", order: 5, unlockAfter: "calc" };
    const rank = { title: "Ранг", icon: "⭐", color: "#ffffff" };
    expect(questSchema.safeParse({ ...quest, rank, fileName: "KT2.java" }).success).toBe(true);
    expect(questSchema.safeParse({ ...quest, rank, fileName: "kt2.java" }).success).toBe(false);
  });
});
