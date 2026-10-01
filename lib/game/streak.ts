import type { ProgressData } from "@/lib/progress/types";
import { dayFromNumber, dayNumber, localDay } from "./day";

/** Заморозка даётся за каждые столько активных дней подряд */
export const FREEZE_EVERY = 7;
/** Больше заморозок не копится */
export const FREEZE_MAX = 2;

export type StreakInfo = {
  /** Дней в серии; 0 — серии нет */
  current: number;
  best: number;
  /** Заморозки в запасе */
  freezes: number;
  /** Пропущенные дни, которые закрыла заморозка */
  frozen: string[];
  /** Сегодня уже был активный день */
  today: boolean;
};

/**
 * Активный день — день, когда сдан этап или выполнен ежедневный квест. Дни берутся из фактов прогресса,
 * поэтому серия на двух устройствах сходится сама.
 */
export function activeDays(p: Pick<ProgressData, "stages" | "dailyDone">): string[] {
  const days = new Set<string>();
  for (const stage of Object.values(p.stages)) if (stage.passedAt) days.add(localDay(stage.passedAt));
  for (const key of Object.keys(p.dailyDone)) days.add(key.slice(0, 10));
  return [...days].sort();
}

/**
 * Серия по дням подряд. Каждые 7 дней серии дают заморозку (не больше двух в запасе); заморозка закрывает
 * пропущенный день. Пропуск больше запаса обнуляет серию, заморозки при этом остаются.
 */
export function streakInfo(days: readonly string[], today: string = localDay()): StreakInfo {
  const numbers = [...new Set(days)].map(dayNumber).sort((a, b) => a - b);
  const todayN = dayNumber(today);
  let run = 0;
  let best = 0;
  let freezes = 0;
  let frozen: string[] = [];
  let prev: number | null = null;

  const cover = (from: number, missed: number): boolean => {
    if (missed > freezes) return false;
    freezes -= missed;
    for (let i = 1; i <= missed; i++) frozen.push(dayFromNumber(from + i));
    return true;
  };

  for (const n of numbers) {
    if (n > todayN) break;
    if (prev === null || !cover(prev, n - prev - 1)) {
      run = 0;
      frozen = [];
    }
    run++;
    if (run % FREEZE_EVERY === 0) freezes = Math.min(FREEZE_MAX, freezes + 1);
    best = Math.max(best, run);
    prev = n;
  }

  if (prev === null) return { current: 0, best: 0, freezes: 0, frozen: [], today: false };
  const isToday = prev === todayN;
  // Вчерашний день ещё держит серию: сегодня её можно продлить. Пропуски до вчера закрывают заморозки
  const alive = isToday || cover(prev, todayN - prev - 1);
  return { current: alive ? run : 0, best, freezes, frozen: alive ? frozen : [], today: isToday };
}
