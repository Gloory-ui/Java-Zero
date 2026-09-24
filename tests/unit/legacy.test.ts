import { describe, expect, it } from "vitest";
import { loadCourse } from "@/lib/content/load";
import { LEGACY_STAGES, readLegacyProgress } from "@/lib/progress/legacy";
import { codeHash } from "@/lib/progress/types";

const NOW = 1_790_000_000_000;

// Снимок localStorage студента старого сайта: закрыл «Фундамент», на третьем этапе циклов
const snapshot: Record<string, string> = {
  java_zero_active_quest: "loops_prep",
  java_zero_current_loops_prep: "2",
  java_zero_streak: "2",
  java_zero_achievements: JSON.stringify(["first_var", "not_an_achievement"]),
  java_zero_ai_persona: "dushny",
  java_zero_sound: "false",
  java_zero_theme: "light",
  java_zero_quest_done_basics: "true",
  java_zero_unlocked_basics: "1",
  java_zero_unlocked_loops_prep: "2",
  java_zero_code_saves_loops_prep: JSON.stringify({ 2: "for (int i = 0; i < 3; i++) {}" }),
  java_zero_distinct_attempts_loops_prep: JSON.stringify({ 2: ["int a;", "int  a;", "int b;"] }),
  java_zero_started_loops_prep_2: "true",
  java_zero_cheat_used_loops_prep_1: "true",
};

const read = (key: string) => snapshot[key] ?? null;

describe("перенос прогресса со старого сайта", () => {
  it("нет старых ключей — нечего переносить", () => {
    expect(readLegacyProgress(() => null)).toBeNull();
    expect(readLegacyProgress((key) => (key === "java_zero_theme" ? "light" : null))).toBeNull();
  });

  it("переносит сданные этапы, код, попытки, шпору и настройки", () => {
    const data = readLegacyProgress(read, NOW);
    expect(data).not.toBeNull();
    if (!data) return;

    expect(data.stages["basics/memory-boxes"].passedAt).toBe(NOW);
    expect(data.stages["basics/remainder"].passedAt).toBe(NOW);
    expect(data.stages["loops_prep/for-anatomy"].passedAt).toBe(NOW);
    expect(data.stages["loops_prep/break-continue"]).toMatchObject({ passedAt: NOW, cheatUsed: true });

    const current = data.stages["loops_prep/accumulators"];
    expect(current.passedAt).toBeUndefined();
    expect(current.startedAt).toBe(NOW);
    expect(current.code).toBe("for (int i = 0; i < 3; i++) {}");
    // «int a;» и «int  a;» отличаются только пробелами: это одна попытка
    expect(current.attempts).toEqual([codeHash("int a;"), codeHash("int b;")]);

    expect(data.stages["loops_prep/nested-loops"]).toBeUndefined();
    expect(data.streak).toBe(2);
    expect(data.achievements).toEqual({ first_var: NOW });
    expect(data.persona).toBe("dushny");
    expect(data.sound).toBe(false);
    expect(data.lastStage).toBe("loops_prep/accumulators");
  });

  it("битые значения не ломают перенос", () => {
    const broken: Record<string, string> = {
      java_zero_streak: "NaN",
      java_zero_achievements: "{oops",
      java_zero_ai_persona: "rude",
      java_zero_unlocked_kt1: "99",
      java_zero_code_saves_kt1: "not json",
    };
    const data = readLegacyProgress((key) => broken[key] ?? null, NOW);
    expect(data?.streak).toBe(0);
    expect(data?.achievements).toEqual({});
    expect(data?.persona).toBe("chill");
    expect(data?.sound).toBe(true);
    expect(Object.keys(data?.stages ?? {}).filter((k) => k.startsWith("kt1/"))).toHaveLength(6);
  });

  it("старые номера этапов указывают на существующие этапы курса", () => {
    const course = loadCourse();
    for (const [questId, ids] of Object.entries(LEGACY_STAGES)) {
      const quest = course.find((q) => q.id === questId);
      expect(quest, questId).toBeDefined();
      expect(quest?.stages.slice(0, ids.length).map((s) => s.id)).toEqual(ids);
    }
  });
});
