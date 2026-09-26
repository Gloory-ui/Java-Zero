import type { QuestOutline } from "@/lib/content/outline";
import type { IconName } from "@/lib/icons";
import type { ProgressData } from "@/lib/progress/types";
import { achievementXp, isGroupQuest } from "./achievements";
import type { LevelInfo } from "./xp";
import { passedStageXp } from "./xp";

/**
 * Отдельный прогресс раздела «Группа» (контрольные точки): свой опыт, 100 уровней и 20 академических званий.
 * Общий уровень не меняется: задания КТ по-прежнему дают и общий опыт, а здесь считается только то, что
 * относится к КТ, — задания квестов группы и знаки группы (grp_*, quest_kt*).
 */

export type GroupRank = { level: number; title: string; icon: IconName };

export const GROUP_MAX_LEVEL = 100;

/**
 * Звания по уровню группы. Шкала рассчитана на 50–60 заданий КТ за всю учёбу:
 * три КТ семестра (22 задания) дают примерно 35–40-й уровень, весь план — около 100-го.
 */
export const GROUP_RANKS: readonly GroupRank[] = [
  { level: 1, title: "АБИТУРИЕНТ", icon: "school" },
  { level: 3, title: "ПЕРВОКУРСНИК", icon: "backpack" },
  { level: 6, title: "ВЛАДЕЛЕЦ ЗАЧЁТКИ", icon: "notebook-pen" },
  { level: 10, title: "КОНСПЕКТЁР", icon: "pencil" },
  { level: 14, title: "ДОПУЩЕННЫЙ К КТ", icon: "clipboard-check" },
  { level: 19, title: "ЗАЧЁТНИК", icon: "file-check-2" },
  { level: 24, title: "ХОРОШИСТ", icon: "book-marked" },
  { level: 30, title: "ОТЛИЧНИК ПОТОКА", icon: "badge-check" },
  { level: 36, title: "ЛОВЕЦ ДЕДЛАЙНОВ", icon: "alarm-clock" },
  { level: 42, title: "СТАРОСТА", icon: "bell-ring" },
  { level: 49, title: "ЛЮБИМЕЦ КАФЕДРЫ", icon: "presentation" },
  { level: 56, title: "ХРАНИТЕЛЬ ВЕДОМОСТИ", icon: "stamp" },
  { level: 63, title: "ПОВЕЛИТЕЛЬ КТ", icon: "flag-triangle-right" },
  { level: 70, title: "КЛЮЧНИК СЕССИИ", icon: "key-round" },
  { level: 76, title: "АССИСТЕНТ ПРОФЕССОРА", icon: "library-big" },
  { level: 82, title: "ДОЦЕНТ ПОТОКА", icon: "building-2" },
  { level: 88, title: "ПРОФЕССОР КОДА", icon: "graduation-cap" },
  { level: 93, title: "ДЕКАН ОТЛИЧНИКОВ", icon: "landmark" },
  { level: 97, title: "РЕКТОР JAVA", icon: "crown" },
  { level: 100, title: "ЛЕГЕНДА КАФЕДРЫ", icon: "trophy" },
];

export function groupRankForLevel(level: number): GroupRank {
  return GROUP_RANKS.findLast((r) => level >= r.level) ?? GROUP_RANKS[0];
}

export function nextGroupRank(level: number): GroupRank | undefined {
  return GROUP_RANKS.find((r) => r.level > level);
}

export function groupRankIndex(rank: Pick<GroupRank, "title">): number {
  return Math.max(
    0,
    GROUP_RANKS.findIndex((r) => r.title === rank.title),
  );
}

/** Опыт на следующий уровень группы: 60 XP и +1 за каждый уровень */
export const groupXpToNext = (level: number) => 60 + level;

/** Знак относится к разделу «Группа»: по КТ, вехи группы и «КТ пройдена» */
export const isGroupAchievement = (id: string) => id.startsWith("grp_") || /^quest_kt\d+$/.test(id);

/** Опыт группы: задания квестов группы + знаки группы */
export function groupXp(progress: Pick<ProgressData, "stages" | "achievements">, course: QuestOutline[]): number {
  let xp = 0;
  for (const q of course) {
    if (!isGroupQuest(q)) continue;
    for (const s of q.stages) {
      const key = `${q.id}/${s.id}`;
      const st = progress.stages[key];
      if (st) xp += passedStageXp(key, st);
    }
  }
  for (const id of Object.keys(progress.achievements)) if (isGroupAchievement(id)) xp += achievementXp(id);
  return xp;
}

export function groupLevelInfo(xp: number): LevelInfo {
  let level = 1;
  let rest = Math.max(0, Math.floor(xp));
  while (level < GROUP_MAX_LEVEL && rest >= groupXpToNext(level)) {
    rest -= groupXpToNext(level);
    level++;
  }
  const need = groupXpToNext(level);
  if (level === GROUP_MAX_LEVEL) return { level, into: need, need, percent: 100, max: true };
  return { level, into: rest, need, percent: Math.floor((rest / need) * 100), max: false };
}
