import { type DuelQuestion, duelQuestions } from "@/lib/game/duel";
import type { Quest, Stage } from "./schema";

/** Всё, что лаборатории нужно об этапе, кроме теории и граблей: их страница рендерит из Markdown */
export type LabStage = Pick<
  Stage,
  | "id"
  | "title"
  | "badge"
  | "hints"
  | "sampleInput"
  | "quiz"
  | "memory"
  | "loopTracer"
  | "tests"
  | "starter"
  | "solution"
> & {
  /** Вопросы защиты: этого этапа и предыдущих этапов квеста */
  duel: DuelQuestion[];
};

export function toLabStage(quest: Quest, stage: Stage): LabStage {
  return {
    id: stage.id,
    title: stage.title,
    badge: stage.badge,
    hints: stage.hints,
    sampleInput: stage.sampleInput,
    quiz: stage.quiz,
    memory: stage.memory,
    loopTracer: stage.loopTracer,
    tests: stage.tests,
    starter: stage.starter,
    solution: stage.solution,
    duel: duelQuestions(
      quest.stages.map((s) => s.exam),
      stage.index,
    ),
  };
}
