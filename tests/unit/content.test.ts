import { describe, expect, it } from "vitest";
import { loadCourse, loadGroupPath } from "@/lib/content/load";
import { groupSchema, questSchema, stageSchema } from "@/lib/content/schema";

describe("курс из content/quests", () => {
  const course = loadCourse();

  it("общий курс идёт по цепочке без КТ: «Калькулятор» открывается сразу после «Циклов»", () => {
    expect(course.map((q) => q.id)).toEqual(["basics", "loops_prep", "kt1", "calc", "arrays_prep", "kt2"]);
    expect(course.map((q) => q.track)).toEqual(["course", "course", "group", "course", "course", "group"]);
    expect(course.map((q) => q.unlockAfter)).toEqual([null, "basics", null, "loops_prep", "calc", null]);
  });

  it("путь группы: подготовка из общего курса, потом КТ; «Калькулятор» на пути не стоит", () => {
    expect(course.map((q) => q.groupAfter)).toEqual([null, "basics", "loops_prep", undefined, "kt1", "arrays_prep"]);
    const group = loadGroupPath();
    expect(group.steps).toEqual([
      { prep: ["basics", "loops_prep"], kt: "kt1" },
      { prep: ["arrays_prep"], kt: "kt2" },
    ]);
    expect(group.invite).toMatch(/^[a-z0-9]{4,32}$/);
  });

  it("41 этап; у каждого есть теория, стартовый код, решение и тесты", () => {
    const stages = course.flatMap((q) => q.stages);
    expect(stages).toHaveLength(41);
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

  it("общий курс не упоминает КТ: его видят все, а КТ — только группа", () => {
    for (const q of course.filter((quest) => quest.track === "course")) {
      for (const s of q.stages) {
        const text = [s.title, s.theory, s.pitfalls, ...s.hints, JSON.stringify(s.quiz), JSON.stringify(s.exam)].join(
          " ",
        );
        // «КТ» отдельным словом: в тексте может встретиться, например, «КТО»
        expect(text, `${q.id}/${s.id}`).not.toMatch(/(^|[^А-Яа-яЁё])КТ([^А-Яа-яЁё]|$)|контрольн|билет/i);
      }
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
    const rank = { title: "Ранг", icon: "star", color: "#ffffff" };
    expect(questSchema.safeParse({ ...quest, rank, fileName: "KT2.java" }).success).toBe(true);
    expect(questSchema.safeParse({ ...quest, rank, fileName: "kt2.java" }).success).toBe(false);
  });

  it("квест без track — из общего курса; путь группы требует хотя бы один шаг и код из латиницы", () => {
    const quest = { id: "arrays", num: "03", title: "Массивы", subtitle: "…", order: 5, unlockAfter: "calc" };
    const rank = { title: "Ранг", icon: "star", color: "#ffffff" };
    expect(questSchema.parse({ ...quest, rank, fileName: "Arrays.java" }).track).toBe("course");
    const group = { title: "Группа", subtitle: "КТ", invite: "abc123", steps: [{ prep: ["basics"], kt: "kt1" }] };
    expect(groupSchema.safeParse(group).success).toBe(true);
    expect(groupSchema.safeParse({ ...group, steps: [] }).success).toBe(false);
    expect(groupSchema.safeParse({ ...group, invite: "Код группы" }).success).toBe(false);
  });
});
