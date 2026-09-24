export type Persona = "chill" | "dushny" | "bigtech";

export const PERSONAS: readonly Persona[] = ["chill", "dushny", "bigtech"];

export type StageProgress = {
  /** Последний код студента */
  code?: string;
  /** Хэши разных вариантов кода, которые студент запускал (не больше 20) */
  attempts: string[];
  /** Проваленные проверки: ошибки компиляции и несданные тесты */
  fails?: number;
  startedAt?: number;
  passedAt?: number;
  hintUsed?: boolean;
  /** Шпора старосты: одноразовый джокер на этап */
  cheatUsed?: boolean;
  solutionViewed?: boolean;
};

export type ProgressData = {
  stages: Record<string, StageProgress>;
  /** Серия сданных подряд этапов без проваленных проверок */
  streak: number;
  /** id ачивки → когда открыта */
  achievements: Record<string, number>;
  persona: Persona;
  sound: boolean;
  lastStage?: string;
};

export const stageKey = (questId: string, stageId: string) => `${questId}/${stageId}`;

export const EMPTY_PROGRESS: ProgressData = { stages: {}, streak: 0, achievements: {}, persona: "chill", sound: true };

/** Лимит попыток, после которых открывается эталонное решение */
export const SOLUTION_UNLOCK_ATTEMPTS = 5;

export const MAX_ATTEMPTS_KEPT = 20;

/** Короткий хэш кода без учёта пробелов и переносов: так «разные попытки» не накручиваются отступами. */
export function codeHash(code: string): string {
  const normalized = code.replace(/\s+/g, " ").trim();
  let h = 5381;
  for (let i = 0; i < normalized.length; i++) h = ((h << 5) + h + normalized.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
