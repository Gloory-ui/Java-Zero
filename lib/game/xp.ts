import type { ProgressData, StageProgress } from "@/lib/progress/types";
import { achievementXp } from "./achievements";

/** Задание контрольной точки: квесты kt1, kt2… */
export const isKtKey = (key: string) => /^kt\d+\//.test(key);

export type XpPart = { label: string; xp: number };

/**
 * Опыт за первую сдачу этапа по состоянию этапа до сдачи. Считается один раз и сохраняется в этапе:
 * перепроверки и провалы после сдачи его не меняют.
 */
export function stageXpParts(stage: StageProgress, isKt: boolean): XpPart[] {
  const parts: XpPart[] = [{ label: isKt ? "Задание КТ" : "Этап", xp: isKt ? 80 : 40 }];
  if (!stage.fails) parts.push({ label: "С первой проверки", xp: 20 });
  if (!stage.hintUsed) parts.push({ label: "Без подсказок", xp: 10 });
  if (stage.cheatUsed || stage.solutionViewed) {
    const sum = parts.reduce((s, p) => s + p.xp, 0);
    parts.push({ label: stage.solutionViewed ? "Открыто решение" : "Шпора", xp: -Math.floor(sum / 2) });
  }
  return parts;
}

export const stageXp = (stage: StageProgress, isKt: boolean) =>
  stageXpParts(stage, isKt).reduce((sum, p) => sum + p.xp, 0);

/** Опыт сданного этапа: сохранённый при сдаче или, для этапов до системы опыта, посчитанный по флагам. */
export function passedStageXp(key: string, stage: StageProgress): number {
  if (!stage.passedAt) return 0;
  return stage.xp ?? stageXp(stage, isKtKey(key));
}

type XpSource = Pick<ProgressData, "stages" | "achievements" | "dailyDone">;

/** Весь опыт: этапы + достижения + ежедневные квесты. Отдельного счётчика нет, опыт выводится из фактов. */
export function totalXp(p: XpSource): number {
  let xp = 0;
  for (const [key, stage] of Object.entries(p.stages)) xp += passedStageXp(key, stage);
  for (const id of Object.keys(p.achievements)) xp += achievementXp(id);
  for (const done of Object.values(p.dailyDone)) xp += done.xp;
  return xp;
}

/** Сколько опыта нужно, чтобы перейти с уровня level на следующий */
export const xpToNext = (level: number) => 100 + 25 * (level - 1);

export type LevelInfo = {
  level: number;
  /** Опыт, набранный на текущем уровне */
  into: number;
  /** Опыт, нужный для следующего уровня */
  need: number;
  percent: number;
};

export function levelInfo(xp: number): LevelInfo {
  let level = 1;
  let rest = Math.max(0, Math.floor(xp));
  while (rest >= xpToNext(level)) {
    rest -= xpToNext(level);
    level++;
  }
  const need = xpToNext(level);
  return { level, into: rest, need, percent: Math.floor((rest / need) * 100) };
}
