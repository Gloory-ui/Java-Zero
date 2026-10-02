import { describe, expect, it } from "vitest";
import {
  buildFunnel,
  type CourseIndex,
  delta,
  type FunnelRow,
  niceTicks,
  normalizeRows,
  plural,
  shortDate,
  stageLabel,
  topStops,
} from "@/components/admin/overview/model";

const COURSE: CourseIndex = [
  {
    id: "basics",
    num: "00",
    title: "Фундамент Java",
    stages: [
      { id: "program-structure", title: "Структура программы" },
      { id: "memory-boxes", title: "Коробки памяти" },
    ],
  },
  { id: "loops_prep", num: "01", title: "Циклы", stages: [{ id: "for-anatomy", title: "Анатомия for" }] },
];

const row = (quest_id: string, stage_id: string, extra: Partial<FunnelRow>): FunnelRow => ({
  quest_id,
  stage_id,
  reached: 0,
  passed: 0,
  here_now: 0,
  stuck: 0,
  left_after: 0,
  ...extra,
});

describe("воронка «Обзора»", () => {
  it("идёт по порядку курса, этапы без строк — нули, чужие и выдуманные строки не попадают", () => {
    const funnel = buildFunnel(COURSE, [
      row("basics", "memory-boxes", { reached: 3, passed: 1, stuck: 1, here_now: 2 }),
      row("basics", "program-structure", { reached: 4, passed: 4, here_now: 1 }),
      row("kt1", "guess-number", { reached: 9 }),
    ]);
    expect(funnel.map((q) => q.id)).toEqual(["basics", "loops_prep"]);
    expect(funnel[0].stages.map((s) => [s.id, s.reached, s.passed])).toEqual([
      ["program-structure", 4, 4],
      ["memory-boxes", 3, 1],
    ]);
    expect(funnel[0]).toMatchObject({ started: 4, finished: 1, stopped: 1 });
    expect(funnel[1]).toMatchObject({ started: 0, finished: 0, stopped: 0 });
  });

  it("где останавливаются: больше остановившихся — выше, нулевые не показываются", () => {
    const funnel = buildFunnel(COURSE, [
      row("basics", "program-structure", { reached: 9, left_after: 1 }),
      row("basics", "memory-boxes", { reached: 8, stuck: 3, left_after: 1 }),
      row("loops_prep", "for-anatomy", { reached: 2 }),
    ]);
    expect(topStops(funnel)).toEqual([
      { questTitle: "Фундамент Java", stageTitle: "Коробки памяти", stuck: 3, leftAfter: 1 },
      { questTitle: "Фундамент Java", stageTitle: "Структура программы", stuck: 0, leftAfter: 1 },
    ]);
  });
});

describe("подписи и числа «Обзора»", () => {
  it("этап курса — по названию, этап группы — «КТ N» и id, его названия в коде страницы нет", () => {
    expect(stageLabel(COURSE, "basics", "memory-boxes")).toEqual({ quest: "Фундамент Java", stage: "Коробки памяти" });
    expect(stageLabel(COURSE, "kt2", "matrix-sum")).toEqual({ quest: "КТ 2", stage: "matrix-sum" });
    expect(stageLabel(COURSE, "basics", "old-stage")).toEqual({ quest: "Фундамент Java", stage: "old-stage" });
  });

  it("изменение к прошлому периоду со знаком; два нуля сравнивать не с чем", () => {
    expect(delta(5, 2)).toBe("+3");
    expect(delta(1, 4)).toBe("−3");
    expect(delta(3, 3)).toBe("0");
    expect(delta(0, 0)).toBeNull();
  });

  it("деления оси — круглые числа от нуля, не ниже максимума", () => {
    expect(niceTicks(0)).toEqual([0, 1]);
    expect(niceTicks(3)).toEqual([0, 1, 2, 3]);
    expect(niceTicks(7)).toEqual([0, 2, 4, 6, 8]);
    expect(niceTicks(134)).toEqual([0, 50, 100, 150]);
    for (const max of [1, 9, 42, 999, 12345]) expect(niceTicks(max).at(-1)).toBeGreaterThanOrEqual(max);
  });

  it("даты и склонения по-русски", () => {
    expect(shortDate("2026-10-01")).toBe("1 окт");
    expect(shortDate("2026-05-31")).toBe("31 мая");
    expect([1, 2, 5, 11, 21, 22, 112].map((n) => plural(n, ["ученик", "ученика", "учеников"]))).toEqual([
      "ученик",
      "ученика",
      "учеников",
      "учеников",
      "ученик",
      "ученика",
      "учеников",
    ]);
  });

  it("числа из базы строками тоже становятся числами, мусор — нулём", () => {
    const rows = normalizeRows<{ bucket: string; active: number }>(
      [
        { bucket: "2026-10-01", active: "4" },
        { bucket: "2026-10-02", active: null },
      ],
      ["active"],
    );
    expect(rows).toEqual([
      { bucket: "2026-10-01", active: 4 },
      { bucket: "2026-10-02", active: 0 },
    ]);
    expect(normalizeRows(null, [])).toEqual([]);
  });
});
