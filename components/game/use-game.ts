"use client";

import { useMemo } from "react";
import { nextRank, type Rank, rankForLevel } from "@/lib/game/ranks";
import { activeDays, type StreakInfo, streakInfo } from "@/lib/game/streak";
import { type LevelInfo, levelInfo, totalXp } from "@/lib/game/xp";
import { useProgress, useProgressHydrated } from "@/lib/progress/store";

export type GameState = {
  hydrated: boolean;
  xp: number;
  level: LevelInfo;
  rank: Rank;
  next?: Rank;
  streak: StreakInfo;
};

/**
 * Опыт, уровень, ранг и серия дней из прогресса. До загрузки прогресса — нулевое состояние,
 * чтобы HTML сервера и клиента совпал.
 */
export function useGame(): GameState {
  const hydrated = useProgressHydrated();
  const stages = useProgress((s) => s.stages);
  const achievements = useProgress((s) => s.achievements);
  const dailyDone = useProgress((s) => s.dailyDone);

  return useMemo(() => {
    const xp = hydrated ? totalXp({ stages, achievements, dailyDone }) : 0;
    const level = levelInfo(xp);
    const streak = hydrated
      ? streakInfo(activeDays({ stages, dailyDone }))
      : { current: 0, best: 0, freezes: 0, frozen: [], today: false };
    return { hydrated, xp, level, rank: rankForLevel(level.level), next: nextRank(level.level), streak };
  }, [hydrated, stages, achievements, dailyDone]);
}
