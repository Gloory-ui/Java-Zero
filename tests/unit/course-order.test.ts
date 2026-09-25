import { describe, expect, it } from "vitest";
import { loadCourse, stageBadge } from "@/lib/content/load";
import { toOutline } from "@/lib/content/outline";
import { isQuestUnlocked, isStageUnlocked, nextStage, skippedNewStages } from "@/lib/progress/selectors";
import type { StageProgress } from "@/lib/progress/types";

const course = toOutline(loadCourse());
const quest = (id: string) => course.find((q) => q.id === id) ?? course[0];
const passed = (...keys: string[]) => ({
  stages: Object.fromEntries(keys.map((k): [string, StageProgress] => [k, { attempts: [], passedAt: 1 }])),
});

/** Студент старого курса: закрыл «Фундамент» из двух этапов и сдал половину циклов */
const veteran = passed(
  "basics/memory-boxes",
  "basics/remainder",
  "loops_prep/for-anatomy",
  "loops_prep/break-continue",
  "loops_prep/accumulators",
);

describe("номер этапа", () => {
  it("подставляет номер и общее число этапов с ведущим нулём", () => {
    expect(stageBadge("ЭТАП {n} / {total}", 0, 8)).toBe("ЭТАП 01 / 08");
    expect(stageBadge("КТ 1 // ЗАДАНИЕ {n}", 5, 6)).toBe("КТ 1 // ЗАДАНИЕ 06");
  });

  it("номера идут подряд в каждом квесте", () => {
    expect(quest("basics").stages.map((s) => s.badge)).toEqual(
      Array.from({ length: 8 }, (_, i) => `ЭТАП 0${i + 1} / 08`),
    );
  });
});

describe("порядок курса", () => {
  it("26 этапов, «Фундамент» начинается с первой программы", () => {
    expect(course.flatMap((q) => q.stages)).toHaveLength(26);
    expect(quest("basics").stages[0].id).toBe("program-structure");
  });

  it("новичок начинает с первого этапа, остальные квесты закрыты", () => {
    const fresh = passed();
    expect(nextStage(fresh, course)).toEqual({ questId: "basics", stageId: "program-structure" });
    expect(isQuestUnlocked(fresh, course, quest("loops_prep"))).toBe(false);
    expect(isStageUnlocked(fresh, course, quest("basics"), 1)).toBe(false);
  });
});

describe("старый прогресс после перестройки курса", () => {
  it("квест со сданными этапами остаётся открытым, хотя в «Фундаменте» появились новые этапы", () => {
    expect(isQuestUnlocked(veteran, course, quest("loops_prep"))).toBe(true);
    expect(isStageUnlocked(veteran, course, quest("loops_prep"), 3)).toBe(true);
    expect(isQuestUnlocked(veteran, course, quest("kt1"))).toBe(false);
  });

  it("новые этапы сразу после сданных открыты", () => {
    const basics = quest("basics");
    const open = basics.stages.map((_, i) => isStageUnlocked(veteran, course, basics, i));
    // program-structure, memory-boxes, arithmetic, remainder, strings открыты; дальше — по порядку
    expect(open).toEqual([true, true, true, true, true, false, false, false]);
  });

  it("«Продолжить» ведёт туда, где студент остановился, а не к новым этапам в начале", () => {
    expect(nextStage(veteran, course)).toEqual({ questId: "loops_prep", stageId: "nested-loops" });
  });

  it("если впереди всё закрыто, «Продолжить» ведёт к первому несданному этапу", () => {
    const allOld = passed("basics/memory-boxes", "basics/remainder");
    expect(nextStage(allOld, course)).toEqual({ questId: "basics", stageId: "strings" });

    const endOfCourse = passed(...course.flatMap((q) => q.stages.map((s) => `${q.id}/${s.id}`)).slice(-1));
    expect(nextStage(endOfCourse, course)).toEqual({ questId: "basics", stageId: "program-structure" });
  });
});

describe("пометка «новый»", () => {
  it("новичок проходит этапы по порядку, и пометок у него нет", () => {
    expect(skippedNewStages(passed(), course)).toEqual([]);
    expect(skippedNewStages(passed("basics/program-structure", "basics/memory-boxes"), course)).toEqual([]);
  });

  it("у студента старого курса отмечены новые этапы позади него, этапы впереди — нет", () => {
    expect(skippedNewStages(veteran, course)).toEqual([
      "basics/program-structure",
      "basics/arithmetic",
      "basics/strings",
      "basics/input",
      "basics/conditions",
      "basics/logic",
    ]);
  });
});
