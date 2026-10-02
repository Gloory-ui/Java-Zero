import { toLabStage } from "@/lib/content/lab-stage";
import { getCourse } from "@/lib/content/load";
import { applyQuestOverrides, NO_OVERRIDES, type Overrides } from "@/lib/content/overrides";
import type { Quest } from "@/lib/content/schema";
import type { GroupStagePayload, GroupTitles } from "./types";

// Задания «Группы» для API-маршрутов: на страницы и в бандлы они не попадают, их отдаёт сервер после проверки
// доступа. Правки текстов из админки (overrides) накладываются здесь же

function groupQuests(course: Quest[], overrides: Overrides): Quest[] {
  return course.filter((q) => q.track === "group").map((q) => applyQuestOverrides(q, overrides));
}

/** Задание КТ целиком; null — такого задания нет или оно не из «Группы» */
export function groupStagePayload(
  questId: string,
  stageId: string,
  overrides: Overrides = NO_OVERRIDES,
  course: Quest[] = getCourse(),
): GroupStagePayload | null {
  const quest = groupQuests(course, overrides).find((q) => q.id === questId);
  const stage = quest?.stages.find((s) => s.id === stageId);
  if (!quest || !stage) return null;
  return {
    questId: quest.id,
    stageIndex: stage.index,
    stage: toLabStage(quest, stage),
    theory: stage.theory,
    pitfalls: stage.pitfalls,
  };
}

/** Названия заданий КТ по квестам */
export function groupTitles(overrides: Overrides = NO_OVERRIDES, course: Quest[] = getCourse()): GroupTitles {
  return Object.fromEntries(
    groupQuests(course, overrides).map((q) => [q.id, q.stages.map((s) => ({ id: s.id, title: s.title }))]),
  );
}
