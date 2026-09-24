import type { QuestOutline } from "@/lib/content/outline";
import { type ProgressData, stageKey } from "./types";

type Progress = Pick<ProgressData, "stages">;

export function isStagePassed(p: Progress, questId: string, stageId: string): boolean {
  return Boolean(p.stages[stageKey(questId, stageId)]?.passedAt);
}

export function isQuestCompleted(p: Progress, quest: QuestOutline): boolean {
  return quest.stages.every((s) => isStagePassed(p, quest.id, s.id));
}

export function isQuestUnlocked(p: Progress, course: QuestOutline[], quest: QuestOutline): boolean {
  if (quest.unlockAfter === null) return true;
  const prev = course.find((q) => q.id === quest.unlockAfter);
  return prev ? isQuestCompleted(p, prev) : false;
}

/** Этап открыт, если открыт квест и сдан предыдущий этап. Сданные этапы всегда открыты для повтора. */
export function isStageUnlocked(p: Progress, course: QuestOutline[], quest: QuestOutline, index: number): boolean {
  if (!isQuestUnlocked(p, course, quest)) return false;
  if (index === 0) return true;
  const stage = quest.stages[index];
  const prev = quest.stages[index - 1];
  return isStagePassed(p, quest.id, stage.id) || isStagePassed(p, quest.id, prev.id);
}

export function questProgress(p: Progress, quest: QuestOutline): { passed: number; total: number; percent: number } {
  const passed = quest.stages.filter((s) => isStagePassed(p, quest.id, s.id)).length;
  const total = quest.stages.length;
  return { passed, total, percent: Math.round((passed / total) * 100) };
}

/** Первый несданный открытый этап — туда ведёт кнопка «Продолжить». */
export function nextStage(p: Progress, course: QuestOutline[]): { questId: string; stageId: string } | null {
  for (const quest of course) {
    if (!isQuestUnlocked(p, course, quest)) continue;
    const stage = quest.stages.find((s) => !isStagePassed(p, quest.id, s.id));
    if (stage) return { questId: quest.id, stageId: stage.id };
  }
  return null;
}
