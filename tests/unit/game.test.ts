import { describe, expect, it } from "vitest";
import { loadCourse } from "@/lib/content/load";
import { toOutline } from "@/lib/content/outline";
import { achievementsForPass, achievementsForRun } from "@/lib/game/achievements";
import {
  answer,
  bossDamage,
  DUEL_MAX_QUESTIONS,
  type DuelQuestion,
  duelQuestions,
  next,
  playerDamage,
  startDuel,
  verdict,
} from "@/lib/game/duel";
import { STARTER_RANK, STREAK_RANK, userRank } from "@/lib/game/ranks";
import type { RunResult } from "@/lib/java/judge";

const q = (n: number): DuelQuestion => ({
  q: `Вопрос ${n}`,
  options: ["a", "b", "c", "d"],
  correct: 1,
  explain: "…",
  advice: "…",
});

function play(total: number, choices: (number | null)[]) {
  let state = startDuel(Array.from({ length: total }, (_, i) => q(i)));
  for (const choice of choices) {
    state = answer(state, choice, 10);
    state = next(state);
    if (state.phase === "summary") break;
  }
  return state;
}

describe("дуэль", () => {
  it("урон: нервы обнуляются ровно на неизбежном незачёте", () => {
    expect(playerDamage(1)).toBe(100);
    expect(playerDamage(5)).toBe(34);
    expect(playerDamage(6)).toBe(25);
    expect(bossDamage(3)).toBe(34);
  });

  it("5 вопросов: три ошибки — досрочный незачёт, две — «хорошо»", () => {
    const knocked = play(5, [0, 0, 0, 1, 1]);
    expect(knocked.phase).toBe("summary");
    expect(knocked.index).toBe(2);
    expect(verdict(knocked).verdict).toBe("knocked-out");

    const good = play(5, [1, 0, 1, 0, 1]);
    expect(good.playerHp).toBe(32);
    expect(verdict(good)).toEqual({ verdict: "good", percent: 60 });
  });

  it("все ответы верные — «отлично», профессор повержен", () => {
    const state = play(3, [1, 1, 1]);
    expect(state.bossHp).toBe(0);
    expect(verdict(state).verdict).toBe("excellent");
  });

  it("быстрый ответ — критический удар, таймаут — ошибка", () => {
    const start = startDuel([q(1), q(2)]);
    expect(answer(start, 1, 3).last?.crit).toBe(true);
    expect(answer(start, 1, 6).last?.crit).toBe(false);
    const timeout = answer(start, null, 30);
    expect(timeout.last).toMatchObject({ right: false, choice: null });
    expect(timeout.mistakes).toHaveLength(1);
  });

  it("вопросы: сначала этап, потом прошлые этапы от ближних, не больше пяти", () => {
    const exams = Array.from({ length: 7 }, (_, i) => [q(i)]);
    expect(duelQuestions(exams, 0).map((x) => x.q)).toEqual(["Вопрос 0"]);
    expect(duelQuestions(exams, 2).map((x) => x.q)).toEqual(["Вопрос 2", "Вопрос 1", "Вопрос 0"]);
    expect(duelQuestions(exams, 6)).toHaveLength(DUEL_MAX_QUESTIONS);
  });
});

describe("ачивки", () => {
  it("за сдачу этапов привязаны к id, а не к номерам", () => {
    expect(achievementsForPass("basics/memory-boxes", { attempts: [] }, 1)).toEqual(["first_var"]);
    expect(achievementsForPass("basics/memory-boxes", { attempts: [], cheatUsed: true }, 1)).toEqual([]);
    expect(achievementsForPass("basics/remainder", { attempts: [], fails: 1 }, 1)).toEqual([]);
    expect(achievementsForPass("basics/remainder", { attempts: [] }, 1)).toEqual(["division_safe"]);
    expect(achievementsForPass("calc/switch-zero", { attempts: [], hintUsed: true }, 1)).toEqual([]);
    expect(achievementsForPass("calc/factorial", { attempts: [] }, 3)).toEqual(["stack_safe", "streak_master"]);
  });

  it("«Живой ввод» — только настоящий Scanner, непустой ввод и нормальное завершение", () => {
    const ok: RunResult = { status: "ok", exitCode: 0, ms: 5, stdout: "", error: "" };
    const code = "Scanner sc = new Scanner(System.in);";
    expect(achievementsForRun(code, "5\n", ok)).toEqual(["input_master"]);
    expect(achievementsForRun(code, "  ", ok)).toEqual([]);
    expect(achievementsForRun(`// ${code}`, "5\n", ok)).toEqual([]);
    expect(achievementsForRun(code, "5\n", { ...ok, status: "exception" })).toEqual([]);
  });
});

describe("ранги", () => {
  const course = toOutline(loadCourse());
  const passAll = (questId: string) => {
    const quest = course.find((x) => x.id === questId);
    return Object.fromEntries((quest?.stages ?? []).map((s) => [`${questId}/${s.id}`, { attempts: [], passedAt: 1 }]));
  };

  it("с нуля — БАЙТ-ПАДАВАН, дальше ранг старшего закрытого квеста", () => {
    expect(userRank({ stages: {}, streak: 0 }, course)).toEqual(STARTER_RANK);
    expect(userRank({ stages: passAll("basics"), streak: 0 }, course).title).toBe("СИНТАКСИЧЕСКИЙ ЮНГА");
    const stages = { ...passAll("basics"), ...passAll("loops_prep"), ...passAll("kt1") };
    expect(userRank({ stages, streak: 0 }, course).title).toBe("ГРОЗА СЕССИИ");
  });

  it("серия от пяти перекрывает ранг квеста", () => {
    expect(userRank({ stages: passAll("basics"), streak: 5 }, course)).toEqual(STREAK_RANK);
  });
});
