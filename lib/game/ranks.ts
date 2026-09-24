import type { QuestOutline } from "@/lib/content/outline";
import { isQuestCompleted } from "@/lib/progress/selectors";
import type { ProgressData } from "@/lib/progress/types";

export type Rank = { title: string; icon: string; color: string };

/** Ранг до первого закрытого квеста */
export const STARTER_RANK: Rank = { title: "БАЙТ-ПАДАВАН", icon: "🌱", color: "#94a3b8" };

/** Особый ранг за серию: перекрывает ранги квестов, пока серия держится */
export const STREAK_RANK: Rank = { title: "СЕНЬОР-КИБЕРДЕД", icon: "👑", color: "#f59e0b" };
export const STREAK_RANK_AT = 5;

/** Ранг студента: серия от 5 этапов, иначе ранг самого старшего закрытого квеста (из quest.yaml). */
export function userRank(progress: Pick<ProgressData, "stages" | "streak">, course: QuestOutline[]): Rank {
  if (progress.streak >= STREAK_RANK_AT) return STREAK_RANK;
  const completed = course.filter((quest) => isQuestCompleted(progress, quest));
  return completed.at(-1)?.rank ?? STARTER_RANK;
}
