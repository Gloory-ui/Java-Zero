import { describe, expect, it } from "vitest";
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
