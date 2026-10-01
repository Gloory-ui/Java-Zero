import type { QuestOutline } from "@/lib/content/outline";
import { type ProgressData, stageKey } from "./types";

/** Счётчики нужны только для отметки «участник группы»: без них студент считается гостем раздела */
type Progress = Pick<ProgressData, "stages"> & Partial<Pick<ProgressData, "stats">>;

export function isStagePassed(p: Progress, questId: string, stageId: string): boolean {
  return Boolean(p.stages[stageKey(questId, stageId)]?.passedAt);
}

export function isQuestCompleted(p: Progress, quest: QuestOutline): boolean {
  return quest.stages.every((s) => isStagePassed(p, quest.id, s.id));
}

/**
 * Участник группы: вошёл по ссылке-приглашению или уже сдавал задания КТ. Второе — одногруппники,
 * которые учились до появления раздела «Группа»: их не нужно приглашать заново.
 */
export function isGroupMember(p: Progress, course: QuestOutline[]): boolean {
  if ((p.stats?.group ?? 0) > 0) return true;
  return course.some((q) => q.track === "group" && q.stages.some((s) => isStagePassed(p, q.id, s.id)));
}

/** Общий курс «Java с нуля»: квесты для всех по порядку */
export function coursePath(course: QuestOutline[]): QuestOutline[] {
  return course.filter((q) => q.track === "course");
}

/** Путь группы: подготовка и КТ в порядке открытия, по цепочке groupAfter */
export function groupPath(course: QuestOutline[]): QuestOutline[] {
  const path: QuestOutline[] = [];
  let next = course.find((q) => q.groupAfter === null);
  while (next) {
    path.push(next);
    const prevId: string = next.id;
    next = course.find((q) => q.groupAfter === prevId);
  }
  return path;
}

/** Что показывать студенту: участнику группы — весь курс, остальным — только общий курс */
export function visibleCourse(p: Progress, course: QuestOutline[]): QuestOutline[] {
  return isGroupMember(p, course) ? course : coursePath(course);
}

/**
 * Квест открыт, если его открывает общий курс (закрыт предыдущий квест) или путь группы (у участника группы
 * закрыт предыдущий квест пути). И если в нём уже есть сданные этапы: когда в курс добавляют новые этапы
 * в пройденный квест, студент не должен терять доступ к тому, что уже проходил.
 */
export function isQuestUnlocked(p: Progress, course: QuestOutline[], quest: QuestOutline): boolean {
  if (quest.stages.some((s) => isStagePassed(p, quest.id, s.id))) return true;
  const closed = (id: string | null | undefined): boolean => {
    if (id === null) return true;
    const prev = course.find((q) => q.id === id);
    return prev ? isQuestCompleted(p, prev) : false;
  };
  if (quest.track === "course" && closed(quest.unlockAfter)) return true;
  return quest.groupAfter !== undefined && isGroupMember(p, course) && closed(quest.groupAfter);
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
 * Новые этапы, которые студент пропустил: не сданы, а дальше по пути уже есть сданные.
 * Так бывает только у тех, кто учился до добавления этапов: новичок сдаёт этапы строго по порядку.
 */
export function skippedNewStages(p: Progress, path: QuestOutline[]): string[] {
  const stages = path.flatMap((quest) =>
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
 * Куда ведёт кнопка «Продолжить» на пути path (общий курс или путь группы): первый несданный открытый этап
 * после самого дальнего сданного. Новые этапы, вставленные раньше, не отбрасывают вернувшегося студента назад:
 * их отмечает карта. Если после дальнего сданного открытых этапов нет, ведёт к первому несданному открытому этапу.
 */
export function nextStage(
  p: Progress,
  course: QuestOutline[],
  path: QuestOutline[] = coursePath(course),
): { questId: string; stageId: string } | null {
  const stages = path.flatMap((quest) => {
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

/**
 * Путь, по которому идёт студент в квесте questId: участник группы на квесте её пути идёт по пути группы
 * (после «Циклов» — КТ 1), остальные — по общему курсу (после «Циклов» — «Калькулятор»).
 */
export function pathFor(p: Progress, course: QuestOutline[], questId?: string): "course" | "group" {
  if (!isGroupMember(p, course)) return "course";
  const quest = questId === undefined ? undefined : course.find((q) => q.id === questId);
  if (quest === undefined) return "group";
  return quest.groupAfter !== undefined ? "group" : "course";
}

export const pathQuests = (course: QuestOutline[], path: "course" | "group") =>
  path === "group" ? groupPath(course) : coursePath(course);
