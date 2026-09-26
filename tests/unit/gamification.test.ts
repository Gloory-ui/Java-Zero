import { describe, expect, it } from "vitest";
import { loadCourse } from "@/lib/content/load";
import { toOutline } from "@/lib/content/outline";
import { achievementCatalog, achievementXp, evaluateAchievements } from "@/lib/game/achievements";
import { CHEST_ID, DAILY_TEMPLATES, dailyContext, findDaily, newlyCompleted, pickDaily } from "@/lib/game/daily";
import { RANKS, rankForLevel } from "@/lib/game/ranks";
import { activeDays, streakInfo } from "@/lib/game/streak";
import { levelInfo, MAX_LEVEL, stageXp, totalXp, xpForLevel, xpToNext } from "@/lib/game/xp";
import type { RunResult } from "@/lib/java/judge";
import { mergeProgress } from "@/lib/progress/merge";
import { migrateProgress } from "@/lib/progress/store";
import { EMPTY_PROGRESS, type ProgressData, type StageProgress } from "@/lib/progress/types";

const course = toOutline(loadCourse());
const progress = (patch: Partial<ProgressData>): ProgressData => ({ ...EMPTY_PROGRESS, ...patch });
const passedStages = (...keys: string[]) =>
  Object.fromEntries(keys.map((k): [string, StageProgress] => [k, { attempts: [], passedAt: 1 }]));
const ok: RunResult = { status: "ok", exitCode: 0, ms: 5, stdout: "", error: "" };
const ids = (list: { id: string }[]) => list.map((a) => a.id);

describe("опыт и уровни", () => {
  it("опыт этапа: база, бонусы за первую проверку и без подсказок, половина за шпору или решение", () => {
    expect(stageXp({ attempts: [] }, false)).toBe(70);
    expect(stageXp({ attempts: [], fails: 2 }, false)).toBe(50);
    expect(stageXp({ attempts: [], hintUsed: true }, false)).toBe(60);
    expect(stageXp({ attempts: [] }, true)).toBe(110);
    expect(stageXp({ attempts: [], solutionViewed: true }, false)).toBe(35);
  });

  it("кривая: 50 XP за уровень, каждые 8 уровней шаг растёт на 1", () => {
    expect(xpToNext(1)).toBe(50);
    expect(xpToNext(8)).toBe(51);
    expect(xpToNext(500)).toBe(112);
    expect(levelInfo(0)).toEqual({ level: 1, into: 0, need: 50, percent: 0, max: false });
    expect(levelInfo(49).level).toBe(1);
    expect(levelInfo(50)).toEqual({ level: 2, into: 0, need: 50, percent: 0, max: false });
    expect(levelInfo(xpForLevel(100) - 1).level).toBe(99);
    expect(levelInfo(xpForLevel(100)).level).toBe(100);
  });

  it("потолок — 999-й уровень, лишний опыт уровень не поднимает", () => {
    expect(levelInfo(xpForLevel(MAX_LEVEL))).toMatchObject({ level: 999, percent: 100, max: true });
    expect(levelInfo(10_000_000)).toMatchObject({ level: 999, max: true });
  });

  it("баланс: не слишком быстро и не слишком медленно", () => {
    const at = (xp: number) => levelInfo(xp).level;
    // Этап ≈ 70 XP, квесты дня ≈ 125 XP за активный день
    expect(at(70)).toBe(2);
    expect(at(860)).toBeGreaterThanOrEqual(12);
    expect(at(860)).toBeLessThanOrEqual(25);
    expect(at(3620)).toBeGreaterThanOrEqual(50);
    expect(at(3620)).toBeLessThanOrEqual(90);
    // До 999 — годы регулярной учёбы, а не недели
    expect(xpForLevel(MAX_LEVEL)).toBeGreaterThan(90_000);
    expect(xpForLevel(MAX_LEVEL)).toBeLessThan(150_000);
  });

  it("весь опыт — из фактов: этапы (сохранённый или по флагам), достижения, квесты дня", () => {
    const p = progress({
      stages: {
        "basics/program-structure": { attempts: [], passedAt: 1, xp: 70 },
        "kt1/guess-number": { attempts: [], passedAt: 1 },
        "basics/strings": { attempts: [] },
      },
      achievements: { first_var: 1, quest_kt1: 2 },
      dailyDone: { "2026-09-25/pass_one": { at: 1, xp: 30 } },
    });
    expect(totalXp(p)).toBe(70 + 110 + 25 + 150 + 30);
  });

  it("опыт достижения известен по одному id", () => {
    expect(achievementXp("first_var")).toBe(25);
    expect(achievementXp("quest_basics")).toBe(75);
    expect(achievementXp("quest_kt1")).toBe(150);
    expect(achievementXp("graduate")).toBe(300);
    expect(achievementXp("no_such")).toBe(0);
  });

  it("ранги идут по возрастанию уровня, первый — с первого уровня", () => {
    expect(RANKS[0].level).toBe(1);
    expect(RANKS.map((r) => r.level)).toEqual([...RANKS.map((r) => r.level)].sort((a, b) => a - b));
    expect(rankForLevel(1).title).toBe("БАЙТ-ПАДАВАН");
    expect(RANKS).toHaveLength(100);
    expect(new Set(RANKS.map((r) => r.level)).size).toBe(RANKS.length);
    expect(RANKS.at(-1)?.level).toBe(MAX_LEVEL);
    expect(rankForLevel(2).title).toBe("БАЙТ-ПАДАВАН");
    expect(rankForLevel(4).title).toBe("ИСКАТЕЛЬ КОНСОЛИ");
    expect(rankForLevel(8).title).toBe("СТАЖЁР КОМПИЛЯТОРА");
    expect(rankForLevel(5).title).toBe("СТАЖЁР КОМПИЛЯТОРА");
    expect(new Set(RANKS.map((r) => r.title)).size).toBe(RANKS.length);
    expect(rankForLevel(999).title).toBe(RANKS.at(-1)?.title);
    expect(rankForLevel(998).title).toBe("ПОСЛЕДНИЙ БОСС");
    // Между рангами не больше 25 уровней: новый ранг всегда недалеко
    for (let i = 1; i < RANKS.length; i++) {
      expect((RANKS[i]?.level ?? 0) - (RANKS[i - 1]?.level ?? 0)).toBeLessThanOrEqual(25);
    }
  });
});

describe("квесты дня", () => {
  const ctx = dailyContext({ stages: {} }, course);

  it("три квеста: лёгкий, средний и тяжёлый; выбор зависит только от даты", () => {
    const today = pickDaily("2026-09-25", ctx);
    expect(today).toHaveLength(3);
    expect(today.map((id) => findDaily(id)?.tier)).toEqual(["easy", "medium", "hard"]);
    expect(pickDaily("2026-09-25", ctx)).toEqual(today);
  });

  it("недоступные квесты не выпадают: нет этапов — нет «сдай этап», КТ закрыта — нет «задания КТ»", () => {
    expect(ctx.ktOpen).toBe(false);
    const done = { remainingStages: 0, ktOpen: false };
    for (let d = 1; d <= 28; d++) {
      const picks = pickDaily(`2026-02-${String(d).padStart(2, "0")}`, done).map((id) => findDaily(id));
      expect(picks.every((t) => t && t.needs === undefined)).toBe(true);
      expect(pickDaily(`2026-02-${String(d).padStart(2, "0")}`, ctx)).not.toContain("kt_task");
    }
  });

  it("id квестов проходят проверку БД", () => {
    for (const t of DAILY_TEMPLATES) expect(t.id).toMatch(/^[a-z0-9_]{1,40}$/);
  });

  it("квест засчитывается по счётчику, сундук — когда выполнены все три", () => {
    const daily = { day: "2026-09-25", quests: ["pass_one", "quiz_two", "duel_five"], counters: { pass: 1 }, seen: [] };
    const first = newlyCompleted({ daily, dailyDone: {} }, 5);
    expect(first).toEqual({ "2026-09-25/pass_one": { at: 5, xp: 30 } });

    const all = { ...daily, counters: { pass: 1, quizRight: 2, duelExcellent: 1 } };
    const rest = newlyCompleted({ daily: all, dailyDone: first }, 6);
    expect(Object.keys(rest).sort()).toEqual([`2026-09-25/${CHEST_ID}`, "2026-09-25/duel_five", "2026-09-25/quiz_two"]);
  });
});

describe("серия дней", () => {
  const days = (from: number, to: number, month = "09") =>
    Array.from({ length: to - from + 1 }, (_, i) => `2026-${month}-${String(from + i).padStart(2, "0")}`);

  it("дни подряд; вчерашний день ещё держит серию, пропуск без заморозки обнуляет", () => {
    expect(streakInfo(days(20, 22), "2026-09-22")).toMatchObject({ current: 3, today: true });
    expect(streakInfo(days(20, 22), "2026-09-23")).toMatchObject({ current: 3, today: false });
    expect(streakInfo(days(20, 22), "2026-09-24")).toMatchObject({ current: 0, best: 3 });
  });

  it("7 дней подряд дают заморозку, она закрывает пропущенный день", () => {
    const withGap = [...days(1, 7), "2026-09-09"];
    expect(streakInfo(withGap, "2026-09-09")).toMatchObject({ current: 8, freezes: 0, frozen: ["2026-09-08"] });
  });

  it("запас — две заморозки: закрывают два пропуска подряд до сегодняшнего дня", () => {
    const info = streakInfo(days(1, 14), "2026-09-17");
    expect(info).toMatchObject({ current: 14, freezes: 0, frozen: ["2026-09-15", "2026-09-16"] });
  });

  it("активные дни — из сданных этапов и выполненных квестов дня", () => {
    const at = new Date(2026, 8, 20, 12).getTime();
    const list = activeDays({
      stages: { "basics/strings": { attempts: [], passedAt: at } },
      dailyDone: { "2026-09-21/run_three": { at, xp: 20 } },
    });
    expect(list).toEqual(["2026-09-20", "2026-09-21"]);
  });
});

describe("достижения", () => {
  it("каталог: уникальные id по правилам БД, у тайных есть условие", () => {
    const catalog = achievementCatalog(course);
    expect(new Set(ids(catalog)).size).toBe(catalog.length);
    for (const a of catalog) expect(a.id).toMatch(/^[a-z0-9_]{1,40}$/);
    // Прежние 7 ачивок остались
    for (const old of [
      "first_var",
      "division_safe",
      "input_master",
      "zero_shield",
      "exam_challenger",
      "stack_safe",
      "streak_master",
    ]) {
      expect(ids(catalog)).toContain(old);
    }
  });

  it("по прогрессу: первый этап сам, серии по счётчикам, закрытый квест даёт титул", () => {
    const basics = course.find((q) => q.id === "basics");
    const stages = passedStages(...(basics?.stages.map((s) => `basics/${s.id}`) ?? []));
    const earned = ids(evaluateAchievements(progress({ stages, cleanRun: 3 }), course));
    expect(earned).toEqual(expect.arrayContaining(["first_var", "builder_5", "quest_basics", "streak_master"]));
    expect(earned).not.toContain("builder_10");

    const cheated = { "basics/program-structure": { attempts: [], passedAt: 1, cheatUsed: true } };
    expect(ids(evaluateAchievements(progress({ stages: cheated }), course))).not.toContain("first_var");
  });

  it("открытые не выдаются повторно", () => {
    const p = progress({ stages: passedStages("basics/program-structure"), achievements: { first_var: 1 } });
    expect(ids(evaluateAchievements(p, course))).not.toContain("first_var");
  });

  it("по событию: ночная сдача, CAFEBABE, Hello World, живой ввод", () => {
    const night = new Date(2026, 8, 25, 3).getTime();
    const pass = { type: "pass" as const, key: "basics/strings", before: { attempts: [] }, at: night };
    expect(ids(evaluateAchievements(EMPTY_PROGRESS, course, pass))).toContain("night_owl");

    const check = { type: "check" as const, source: "int magic = 0xCAFEBABE;" };
    expect(ids(evaluateAchievements(EMPTY_PROGRESS, course, check))).toContain("egg_cafebabe");

    const hello = { type: "run" as const, source: "", stdin: "", run: { ...ok, stdout: "Hello, World!\n" } };
    expect(ids(evaluateAchievements(EMPTY_PROGRESS, course, hello))).toContain("hello_world");

    const code = "Scanner sc = new Scanner(System.in);";
    const input = (source: string, stdin: string, run = ok) =>
      ids(evaluateAchievements(EMPTY_PROGRESS, course, { type: "run", source, stdin, run }));
    expect(input(code, "5\n")).toContain("input_master");
    expect(input(code, "  ")).not.toContain("input_master");
    expect(input(`// ${code}`, "5\n")).not.toContain("input_master");
    expect(input(code, "5\n", { ...ok, status: "exception" })).not.toContain("input_master");
  });

  it("«Знаток типов» — только если этап про деление сдан с первой проверки", () => {
    const pass = (fails: number) => ({
      type: "pass" as const,
      key: "basics/arithmetic",
      before: { attempts: [], fails },
      at: new Date(2026, 8, 25, 12).getTime(),
    });
    expect(ids(evaluateAchievements(EMPTY_PROGRESS, course, pass(0)))).toContain("division_safe");
    expect(ids(evaluateAchievements(EMPTY_PROGRESS, course, pass(1)))).not.toContain("division_safe");
  });
});

describe("переход со старой системы", () => {
  it("версия 1 → 2: серия становится cleanRun, появляются квесты дня и отметка о переносе", () => {
    const v1 = {
      stages: passedStages("basics/memory-boxes"),
      streak: 4,
      achievements: {},
      persona: "chill",
      sound: true,
    };
    expect(migrateProgress(v1, 1)).toEqual({
      stages: v1.stages,
      cleanRun: 4,
      achievements: {},
      dailyDone: {},
      stats: {},
      persona: "chill",
      sound: true,
      upgradeNotice: true,
    });
    const fresh = migrateProgress({ stages: {}, streak: 0 }, 1) as Record<string, unknown>;
    expect(fresh.upgradeNotice).toBeUndefined();
  });

  it("слияние: опыт этапа — максимум, квесты дня объединяются, счётчики — максимум", () => {
    const a = progress({
      stages: { "basics/strings": { attempts: [], passedAt: 5, xp: 50 } },
      dailyDone: { "2026-09-24/run_three": { at: 5, xp: 20 } },
      stats: { runs: 10, mentor: 1 },
    });
    const b = progress({
      stages: { "basics/strings": { attempts: [], passedAt: 3, xp: 70 } },
      dailyDone: { "2026-09-25/pass_one": { at: 9, xp: 30 } },
      stats: { runs: 4, quizRight: 2 },
    });
    const merged = mergeProgress(a, b);
    expect(merged.stages["basics/strings"]).toMatchObject({ passedAt: 3, xp: 70 });
    expect(Object.keys(merged.dailyDone).sort()).toEqual(["2026-09-24/run_three", "2026-09-25/pass_one"]);
    expect(merged.stats).toEqual({ runs: 10, mentor: 1, quizRight: 2 });
  });
});
