import { describe, expect, it } from "vitest";
import { loadCourse } from "@/lib/content/load";
import { applyQuestOverrides, applyStageOverrides, parseHints, toOverrides } from "@/lib/content/overrides";

const quest = loadCourse().find((q) => q.id === "basics");
if (!quest) throw new Error("нет квеста basics");
const stage = quest.stages[1];

describe("правки текстов из админки поверх файлов курса", () => {
  it("меняют только указанные поля этапа", () => {
    const overrides = toOverrides([
      { quest_id: "basics", stage_id: stage.id, field: "title", value: "Новый заголовок" },
      { quest_id: "basics", stage_id: stage.id, field: "quiz.question", value: "Новый вопрос?" },
    ]);
    const next = applyStageOverrides(stage, overrides);
    expect(next.title).toBe("Новый заголовок");
    expect(next.quiz.question).toBe("Новый вопрос?");
    expect(next.quiz.options).toEqual(stage.quiz.options);
    expect(next.theory).toBe(stage.theory);
    expect(next.tests).toBe(stage.tests);
  });

  it("пустая правка не стирает текст из файла", () => {
    const overrides = toOverrides([
      { quest_id: "basics", stage_id: stage.id, field: "title", value: "   " },
      { quest_id: "basics", stage_id: stage.id, field: "hints", value: "\n\n" },
    ]);
    const next = applyStageOverrides(stage, overrides);
    expect(next.title).toBe(stage.title);
    expect(next.hints).toEqual(stage.hints);
  });

  it("подсказки — по одной на строку, не больше четырёх", () => {
    expect(parseHints(" раз \n\nдва\nтри\nчетыре\nпять")).toEqual(["раз", "два", "три", "четыре"]);
  });

  it("правка квеста меняет его название, а правки этапов доходят до этапов", () => {
    const overrides = toOverrides([
      { quest_id: "basics", stage_id: "", field: "title", value: "Основы" },
      { quest_id: "basics", stage_id: stage.id, field: "pitfalls", value: "Новые ошибки" },
    ]);
    const next = applyQuestOverrides(quest, overrides);
    expect(next.title).toBe("Основы");
    expect(next.subtitle).toBe(quest.subtitle);
    expect(next.stages[1].pitfalls).toBe("Новые ошибки");
    expect(next.stages[0]).toBe(quest.stages[0]);
  });
});
