import type { GroupTitles } from "@/lib/group/types";
import type { Quest } from "./schema";

/** Лёгкое оглавление курса для клиента: без теории, кода и тестов. */
export type StageOutline = { id: string; title: string; badge: string; isNew?: boolean };
export type QuestOutline = Pick<
  Quest,
  "id" | "num" | "title" | "subtitle" | "fileName" | "order" | "track" | "unlockAfter" | "groupAfter" | "rank"
> & {
  stages: StageOutline[];
};

/** Название задания КТ в публичном оглавлении: настоящее получает только участник группы (/api/group/outline) */
export const hiddenStageTitle = (index: number) => `Задание ${index + 1}`;

/**
 * Оглавление попадает в HTML каждой страницы, поэтому у заданий «Группы» в нём нет названий:
 * id этапа нужен для адреса и прогресса, а что в задании — знают только участники
 */
export function toOutline(course: Quest[]): QuestOutline[] {
  return course.map((q) => ({
    id: q.id,
    num: q.num,
    title: q.title,
    subtitle: q.subtitle,
    fileName: q.fileName,
    order: q.order,
    track: q.track,
    unlockAfter: q.unlockAfter,
    ...(q.groupAfter !== undefined ? { groupAfter: q.groupAfter } : {}),
    rank: q.rank,
    stages: q.stages.map((s, i) => ({
      id: s.id,
      title: q.track === "group" ? hiddenStageTitle(i) : s.title,
      badge: s.badge,
      ...(s.isNew ? { isNew: true } : {}),
    })),
  }));
}

/** Оглавление с настоящими названиями заданий КТ для участника группы */
export function withGroupTitles(course: QuestOutline[], titles: GroupTitles | null): QuestOutline[] {
  if (!titles) return course;
  return course.map((q) => {
    const named = titles[q.id];
    if (!named) return q;
    const byId = new Map(named.map((s) => [s.id, s.title]));
    return { ...q, stages: q.stages.map((s) => ({ ...s, title: byId.get(s.id) ?? s.title })) };
  });
}
