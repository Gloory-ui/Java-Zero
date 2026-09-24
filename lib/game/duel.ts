import type { StageMeta } from "@/lib/content/schema";

export type DuelQuestion = StageMeta["exam"][number];

/** Секунд на ответ */
export const DUEL_SECONDS = 30;
/** Ответ быстрее этого — критический удар */
export const CRIT_SECONDS = 5;
/** Сколько вопросов берёт защита: текущий этап и предыдущие этапы квеста */
export const DUEL_MAX_QUESTIONS = 5;

export type DuelAnswer = {
  /** null — время вышло */
  choice: number | null;
  right: boolean;
  crit: boolean;
  seconds: number;
  /** Урон профессору за верный ответ или нервам студента за ошибку */
  damage: number;
  knockedOut: boolean;
};

export type DuelState = {
  questions: DuelQuestion[];
  index: number;
  phase: "question" | "feedback" | "summary";
  correct: number;
  mistakes: DuelQuestion[];
  bossHp: number;
  playerHp: number;
  last?: DuelAnswer;
};

export type Verdict = "knocked-out" | "excellent" | "good" | "fail";

/** Урон профессору: все верные ответы ровно обнуляют его HP */
export const bossDamage = (total: number) => Math.ceil(100 / total);

/** Нервы кончаются ровно тогда, когда ошибок столько, что незачёт (меньше 50%) уже неизбежен */
export const playerDamage = (total: number) => Math.ceil(100 / (Math.floor(total / 2) + 1));

export function startDuel(questions: DuelQuestion[]): DuelState {
  if (questions.length === 0) throw new Error("Для защиты нужен хотя бы один вопрос");
  return { questions, index: 0, phase: "question", correct: 0, mistakes: [], bossHp: 100, playerHp: 100 };
}

/** Ответ на текущий вопрос; choice = null означает, что время вышло. */
export function answer(state: DuelState, choice: number | null, seconds: number): DuelState {
  if (state.phase !== "question") return state;
  const question = state.questions[state.index];
  const total = state.questions.length;

  if (choice !== null && choice === question.correct) {
    const damage = bossDamage(total);
    return {
      ...state,
      phase: "feedback",
      correct: state.correct + 1,
      bossHp: Math.max(0, state.bossHp - damage),
      last: { choice, right: true, crit: seconds <= CRIT_SECONDS, seconds, damage, knockedOut: false },
    };
  }

  const damage = playerDamage(total);
  const playerHp = Math.max(0, state.playerHp - damage);
  return {
    ...state,
    phase: "feedback",
    mistakes: [...state.mistakes, question],
    playerHp,
    last: { choice, right: false, crit: false, seconds, damage, knockedOut: playerHp === 0 },
  };
}

/** Следующий вопрос или итоги: после нокаута или последнего вопроса дуэль заканчивается. */
export function next(state: DuelState): DuelState {
  if (state.phase !== "feedback") return state;
  const done = state.playerHp === 0 || state.index >= state.questions.length - 1;
  return done
    ? { ...state, phase: "summary" }
    : { ...state, phase: "question", index: state.index + 1, last: undefined };
}

export const isLastStep = (state: DuelState) => state.playerHp === 0 || state.index >= state.questions.length - 1;

export function verdict(state: DuelState): { verdict: Verdict; percent: number } {
  const percent = Math.round((state.correct / state.questions.length) * 100);
  if (state.playerHp === 0) return { verdict: "knocked-out", percent };
  if (percent === 100 || state.bossHp === 0) return { verdict: "excellent", percent };
  if (percent >= 50) return { verdict: "good", percent };
  return { verdict: "fail", percent };
}

/** Вопросы защиты этапа: сначала его собственные, затем предыдущих этапов квеста, от ближних к дальним. */
export function duelQuestions(stagesExam: DuelQuestion[][], stageIndex: number): DuelQuestion[] {
  const own = stagesExam[stageIndex] ?? [];
  const earlier = stagesExam.slice(0, stageIndex).reverse().flat();
  return [...own, ...earlier].slice(0, DUEL_MAX_QUESTIONS);
}
