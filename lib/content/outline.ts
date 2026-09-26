import type { Quest } from "./schema";

/** Лёгкое оглавление курса для клиента: без теории, кода и тестов. */
export type StageOutline = { id: string; title: string; badge: string; isNew?: boolean };
export type QuestOutline = Pick<
  Quest,
  "id" | "num" | "title" | "subtitle" | "fileName" | "order" | "track" | "unlockAfter" | "groupAfter" | "rank"
> & {
  stages: StageOutline[];
};

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
    stages: q.stages.map((s) => ({ id: s.id, title: s.title, badge: s.badge, ...(s.isNew ? { isNew: true } : {}) })),
  }));
}
