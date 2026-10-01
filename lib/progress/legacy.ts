import { codeHash, MAX_ATTEMPTS_KEPT, PERSONAS, type Persona, type ProgressData, type StageProgress } from "./types";

/**
 * Этапы сайта до v1.0 в их старом порядке: там прогресс хранился по номеру этапа, а не по id.
 * Список заморожен: старые ключи ссылаются только на эти 18 этапов, новые квесты сюда не добавляются.
 */
export const LEGACY_STAGES: Readonly<Record<string, readonly string[]>> = {
  basics: ["memory-boxes", "remainder"],
  loops_prep: ["for-anatomy", "break-continue", "accumulators", "nested-loops", "while-attempts", "prime-flag"],
  kt1: ["multiplication-table", "skip-multiples", "even-and-triple", "even-odd-sums", "guess-number", "primes-to-n"],
  calc: ["splash", "switch-zero", "history-array", "factorial"],
};

export const LEGACY_ACHIEVEMENTS = [
  "first_var",
  "division_safe",
  "input_master",
  "zero_shield",
  "exam_challenger",
  "stack_safe",
  "streak_master",
] as const;

type Read = (key: string) => string | null;

function json<T>(raw: string | null, fallback: T): T {
  if (raw === null) return fallback;
  try {
    return (JSON.parse(raw) as T) ?? fallback;
  } catch {
    return fallback;
  }
}

function int(raw: string | null): number {
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Есть ли в браузере прогресс старого сайта */
export function hasLegacyProgress(read: Read): boolean {
  if (read("java_zero_streak") !== null || read("java_zero_achievements") !== null) return true;
  return Object.keys(LEGACY_STAGES).some(
    (q) => read(`java_zero_unlocked_${q}`) !== null || read(`java_zero_code_saves_${q}`) !== null,
  );
}

/**
 * Переводит ключи java_zero_* старого сайта в новую схему. Старые ключи не удаляются:
 * если новая версия откатится, студент ничего не потеряет. Время сдачи старых этапов неизвестно,
 * поэтому ставится момент переноса.
 */
export function readLegacyProgress(read: Read, now = Date.now()): ProgressData | null {
  if (!hasLegacyProgress(read)) return null;

  const stages: Record<string, StageProgress> = {};
  for (const [questId, ids] of Object.entries(LEGACY_STAGES)) {
    const done = read(`java_zero_quest_done_${questId}`) === "true";
    const passedCount = done ? ids.length : Math.min(int(read(`java_zero_unlocked_${questId}`)), ids.length);
    const codes = json<Record<string, unknown>>(read(`java_zero_code_saves_${questId}`), {});
    const attempts = json<Record<string, unknown>>(read(`java_zero_distinct_attempts_${questId}`), {});

    ids.forEach((stageId, index) => {
      const stage: StageProgress = { attempts: [] };
      const code = codes[index];
      if (typeof code === "string") stage.code = code;
      const tried = attempts[index];
      if (Array.isArray(tried)) {
        const hashes = tried.filter((c): c is string => typeof c === "string").map(codeHash);
        stage.attempts = [...new Set(hashes)].slice(-MAX_ATTEMPTS_KEPT);
      }
      if (read(`java_zero_started_${questId}_${index}`) === "true" || index < passedCount) stage.startedAt = now;
      if (index < passedCount) stage.passedAt = now;
      if (read(`java_zero_cheat_used_${questId}_${index}`) === "true") stage.cheatUsed = true;

      const touched = stage.code !== undefined || stage.attempts.length > 0 || stage.startedAt || stage.cheatUsed;
      if (touched) stages[`${questId}/${stageId}`] = stage;
    });
  }

  const unlocked = json<unknown>(read("java_zero_achievements"), []);
  const achievements = Object.fromEntries(
    (Array.isArray(unlocked) ? unlocked : [])
      .filter((id): id is string => (LEGACY_ACHIEVEMENTS as readonly unknown[]).includes(id))
      .map((id) => [id, now]),
  );

  const persona = read("java_zero_ai_persona");
  const activeQuest = read("java_zero_active_quest");
  const activeIds = activeQuest ? LEGACY_STAGES[activeQuest] : undefined;
  const activeStage = activeIds?.[int(read(`java_zero_current_${activeQuest}`))];

  return {
    stages,
    cleanRun: int(read("java_zero_streak")),
    achievements,
    dailyDone: {},
    stats: {},
    persona: PERSONAS.includes(persona as Persona) ? (persona as Persona) : "chill",
    sound: read("java_zero_sound") !== "false",
    ...(activeStage ? { lastStage: `${activeQuest}/${activeStage}` } : {}),
  };
}
