import { describe, expect, it } from "vitest";
import { loadCourse, stageBadge } from "@/lib/content/load";
import { toOutline } from "@/lib/content/outline";
import { achievementCatalog } from "@/lib/game/achievements";
import { dailyContext } from "@/lib/game/daily";
import {
  coursePath,
  groupPath,
  isGroupMember,
  isQuestUnlocked,
  isStageUnlocked,
  nextStage,
  pathFor,
  skippedNewStages,
  visibleCourse,
} from "@/lib/progress/selectors";
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

describe("два раздела: «Java с нуля» и «Группа»", () => {
  const stagesOf = (...ids: string[]) =>
    course.filter((q) => ids.includes(q.id)).flatMap((q) => q.stages.map((s) => `${q.id}/${s.id}`));
  /** Прошёл «Фундамент» и «Циклы» */
  const loopsDone = passed(...stagesOf("basics", "loops_prep"));
  const member = (p: ReturnType<typeof passed>) => ({ ...p, stats: { group: 1 } });

  it("общий курс — без КТ; путь группы — подготовка, потом КТ", () => {
    expect(coursePath(course).map((q) => q.id)).toEqual(["basics", "loops_prep", "calc"]);
    expect(groupPath(course).map((q) => q.id)).toEqual(["basics", "loops_prep", "kt1"]);
  });

  it("гость раздела не видит КТ, и она у него не открывается; «Калькулятор» открыт после «Циклов»", () => {
    expect(isGroupMember(loopsDone, course)).toBe(false);
    expect(visibleCourse(loopsDone, course).map((q) => q.id)).toEqual(["basics", "loops_prep", "calc"]);
    expect(isQuestUnlocked(loopsDone, course, quest("kt1"))).toBe(false);
    expect(isQuestUnlocked(loopsDone, course, quest("calc"))).toBe(true);
    expect(nextStage(loopsDone, course)).toEqual({ questId: "calc", stageId: "splash" });
  });

  it("участник группы: КТ 1 открывается после подготовки, «Продолжить» в группе ведёт к ней", () => {
    expect(isQuestUnlocked(member(passed()), course, quest("kt1"))).toBe(false);
    const p = member(loopsDone);
    expect(visibleCourse(p, course)).toHaveLength(course.length);
    expect(isQuestUnlocked(p, course, quest("kt1"))).toBe(true);
    expect(nextStage(p, course, groupPath(course))).toEqual({ questId: "kt1", stageId: "multiplication-table" });
    // На карте общего курса он идёт дальше по общему курсу
    expect(nextStage(p, course)).toEqual({ questId: "calc", stageId: "splash" });
  });

  it("путь студента: участник на квесте пути группы идёт по нему, на «Калькуляторе» — по общему курсу", () => {
    const p = member(loopsDone);
    expect(pathFor(p, course, "loops_prep")).toBe("group");
    expect(pathFor(p, course, "kt1")).toBe("group");
    expect(pathFor(p, course, "calc")).toBe("course");
    expect(pathFor(loopsDone, course, "loops_prep")).toBe("course");
  });

  it("кто уже сдавал задания КТ 1, в группе без приглашения", () => {
    const oldStudent = passed("kt1/multiplication-table");
    expect(isGroupMember(oldStudent, course)).toBe(true);
    expect(isQuestUnlocked(oldStudent, course, quest("kt1"))).toBe(true);
  });

  it("«Выпускник» — за общий курс: задания КТ для него не нужны", () => {
    const graduate = achievementCatalog(course).find((a) => a.id === "graduate");
    const main = coursePath(course).reduce((n, q) => n + q.stages.length, 0);
    expect(graduate?.goal).toBe(main);
  });

  it("квест дня про КТ выпадает только участнику группы с открытой КТ", () => {
    expect(dailyContext(loopsDone, course).ktOpen).toBe(false);
    expect(dailyContext(member(loopsDone), course).ktOpen).toBe(true);
    // Гостю раздела этапы КТ не считаются оставшимися
    const left = (p: ReturnType<typeof passed>) => dailyContext(p, course).remainingStages;
    expect(left(member(passed())) - left(passed())).toBe(quest("kt1").stages.length);
  });
});
