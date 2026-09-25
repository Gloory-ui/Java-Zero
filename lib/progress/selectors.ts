import type { QuestOutline } from "@/lib/content/outline";
import { type ProgressData, stageKey } from "./types";

type Progress = Pick<ProgressData, "stages">;

export function isStagePassed(p: Progress, questId: string, stageId: string): boolean {
  return Boolean(p.stages[stageKey(questId, stageId)]?.passedAt);
}

export function isQuestCompleted(p: Progress, quest: QuestOutline): boolean {
  return quest.stages.every((s) => isStagePassed(p, quest.id, s.id));
}

/**
 * Квест открыт, если закрыт предыдущий. Или если в нём уже есть сданные этапы: когда в курс добавляют
 * новые этапы в пройденный квест, студент не должен терять доступ к тому, что уже проходил.
 */
export function isQuestUnlocked(p: Progress, course: QuestOutline[], quest: QuestOutline): boolean {
  if (quest.unlockAfter === null) return true;
  if (quest.stages.some((s) => isStagePassed(p, quest.id, s.id))) return true;
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

/**
 * Новые этапы, которые студент пропустил: не сданы, а дальше по курсу уже есть сданные.
 * Так бывает только у тех, кто учился до добавления этапов: новичок сдаёт этапы строго по порядку.
 */
export function skippedNewStages(p: Progress, course: QuestOutline[]): string[] {
  const stages = course.flatMap((quest) =>
    quest.stages.map((s) => ({
      key: stageKey(quest.id, s.id),
      isNew: s.isNew,
      passed: isStagePassed(p, quest.id, s.id),
    })),
  );
  const furthest = stages.findLastIndex((s) => s.passed);
  return stages
    .slice(0, Math.max(furthest, 0))
    .filter((s) => s.isNew && !s.passed)
    .map((s) => s.key);
}

/**
 * Куда ведёт кнопка «Продолжить»: первый несданный открытый этап после самого дальнего сданного.
 * Новые этапы, вставленные в курс раньше, не отбрасывают вернувшегося студента назад: их отмечает карта курса.
 * Если после дальнего сданного открытых этапов нет, ведёт к первому несданному открытому этапу курса.
 */
export function nextStage(p: Progress, course: QuestOutline[]): { questId: string; stageId: string } | null {
  const stages = course.flatMap((quest) => {
    const open = isQuestUnlocked(p, course, quest);
    return quest.stages.map((s) => ({
      questId: quest.id,
      stageId: s.id,
      open,
      passed: isStagePassed(p, quest.id, s.id),
    }));
  });
  const furthest = stages.findLastIndex((s) => s.passed);
  const pending = (s: (typeof stages)[number]) => s.open && !s.passed;
  const found = stages.slice(furthest + 1).find(pending) ?? stages.find(pending);
  return found ? { questId: found.questId, stageId: found.stageId } : null;
}
