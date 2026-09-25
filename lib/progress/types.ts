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
  /** Опыт за первую сдачу: фиксируется в момент сдачи */
  xp?: number;
};

/** События дня, из которых складываются ежедневные квесты */
export type DailyMetric =
  | "pass"
  | "passFirstTry"
  | "passNoHint"
  | "passKt"
  | "quizRight"
  | "run"
  | "runInput"
  | "mentor"
  | "duelGood"
  | "duelExcellent"
  | "check";

export type DailyState = {
  day: string;
  /** Квесты дня выбираются утром и дальше не меняются */
  quests: string[];
  counters: Partial<Record<DailyMetric, number>>;
  /** Что уже засчитано сегодня, чтобы один квиз не считался дважды */
  seen: string[];
};

/** Счётчики для достижений с уровнями: защиты на 5, верные квизы, запуски, вопросы ментору */
export type GameStats = Partial<Record<"duelExcellent" | "duelGood" | "quizRight" | "runs" | "mentor", number>>;

export type ProgressData = {
  stages: Record<string, StageProgress>;
  /** Сданные подряд этапы без проваленных проверок (до системы опыта называлось серией) */
  cleanRun: number;
  /** id достижения → когда открыто */
  achievements: Record<string, number>;
  /** Выполненные ежедневные квесты: «ГГГГ-ММ-ДД/id» → когда и сколько опыта */
  dailyDone: Record<string, { at: number; xp: number }>;
  stats: GameStats;
  /** Сегодняшние квесты и счётчики; живёт только в этом браузере */
  daily?: DailyState;
  persona: Persona;
  sound: boolean;
  lastStage?: string;
};

export const stageKey = (questId: string, stageId: string) => `${questId}/${stageId}`;

export const EMPTY_PROGRESS: ProgressData = {
  stages: {},
  cleanRun: 0,
  achievements: {},
  dailyDone: {},
  stats: {},
  persona: "chill",
  sound: true,
};

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
