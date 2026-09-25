import type { AchievementRow, ProfileRow, StageProgressRow } from "@/lib/supabase/database";
import { EMPTY_PROGRESS, MAX_ATTEMPTS_KEPT, PERSONAS, type ProgressData, type StageProgress } from "./types";

const MAX_CODE_LENGTH = 20_000;

const earliest = (a?: number, b?: number) => (a === undefined ? b : b === undefined ? a : Math.min(a, b));

/** Этап с двух устройств: сдан, если сдан где-то; флаги складываются; код берётся локальный, если он есть. */
export function mergeStage(local: StageProgress | undefined, remote: StageProgress | undefined): StageProgress {
  if (!local) return remote ?? { attempts: [] };
  if (!remote) return local;
  const merged: StageProgress = {
    attempts: [...new Set([...remote.attempts, ...local.attempts])].slice(-MAX_ATTEMPTS_KEPT),
  };
  const code = local.code ?? remote.code;
  if (code !== undefined) merged.code = code;
  const fails = Math.max(local.fails ?? 0, remote.fails ?? 0);
  if (fails) merged.fails = fails;
  const startedAt = earliest(local.startedAt, remote.startedAt);
  if (startedAt !== undefined) merged.startedAt = startedAt;
  const passedAt = earliest(local.passedAt, remote.passedAt);
  if (passedAt !== undefined) merged.passedAt = passedAt;
  if (local.hintUsed || remote.hintUsed) merged.hintUsed = true;
  if (local.cheatUsed || remote.cheatUsed) merged.cheatUsed = true;
  if (local.solutionViewed || remote.solutionViewed) merged.solutionViewed = true;
  return merged;
}

/** Ничего не сделано и настройки по умолчанию: такой браузер просто принимает облачный прогресс. */
export function isPristine(p: ProgressData): boolean {
  return (
    Object.keys(p.stages).length === 0 &&
    Object.keys(p.achievements).length === 0 &&
    p.streak === 0 &&
    p.persona === EMPTY_PROGRESS.persona &&
    p.sound === EMPTY_PROGRESS.sound
  );
}

/** Слияние при входе: по каждому этапу берётся лучшее, ачивки объединяются, настройки — с этого устройства. */
export function mergeProgress(local: ProgressData, remote: ProgressData): ProgressData {
  if (isPristine(local)) return remote;
  const keys = new Set([...Object.keys(local.stages), ...Object.keys(remote.stages)]);
  const stages = Object.fromEntries([...keys].map((key) => [key, mergeStage(local.stages[key], remote.stages[key])]));
  const achievements = { ...local.achievements };
  for (const [id, at] of Object.entries(remote.achievements)) achievements[id] = Math.min(achievements[id] ?? at, at);
  const lastStage = local.lastStage ?? remote.lastStage;
  return {
    stages,
    streak: Math.max(local.streak, remote.streak),
    achievements,
    persona: local.persona,
    sound: local.sound,
    ...(lastStage ? { lastStage } : {}),
  };
}

/**
 * Прогресс в браузере при входе в аккаунт uid. Гостевой (owner = null) или этого же аккаунта — сливается с облаком.
 * Прогресс другого аккаунта не подмешивается: иначе все аккаунты в одном браузере получали бы один и тот же прогресс.
 */
export function progressOnSignIn(
  local: ProgressData,
  localOwner: string | null,
  remote: ProgressData,
  uid: string,
): ProgressData {
  return localOwner !== null && localOwner !== uid ? remote : mergeProgress(local, remote);
}

const time = (iso: string | null) => (iso ? Date.parse(iso) : undefined);
const iso = (ms: number | undefined) => (ms === undefined ? null : new Date(ms).toISOString());

export function progressFromRows(
  profile: ProfileRow | null,
  stageRows: StageProgressRow[],
  achievementRows: AchievementRow[],
): ProgressData {
  const stages: Record<string, StageProgress> = {};
  for (const row of stageRows) {
    const stage: StageProgress = { attempts: row.attempts ?? [] };
    if (row.code !== null) stage.code = row.code;
    if (row.fails) stage.fails = row.fails;
    const startedAt = time(row.started_at);
    if (startedAt !== undefined) stage.startedAt = startedAt;
    const passedAt = time(row.passed_at);
    if (passedAt !== undefined) stage.passedAt = passedAt;
    if (row.hint_used) stage.hintUsed = true;
    if (row.cheat_used) stage.cheatUsed = true;
    if (row.solution_viewed) stage.solutionViewed = true;
    stages[`${row.quest_id}/${row.stage_id}`] = stage;
  }
  return {
    stages,
    streak: profile?.streak ?? 0,
    achievements: Object.fromEntries(achievementRows.map((a) => [a.achievement_id, Date.parse(a.unlocked_at)])),
    persona: profile && PERSONAS.includes(profile.persona) ? profile.persona : EMPTY_PROGRESS.persona,
    sound: profile?.sound ?? EMPTY_PROGRESS.sound,
    ...(profile?.last_stage ? { lastStage: profile.last_stage } : {}),
  };
}

export function stageToRow(userId: string, key: string, stage: StageProgress): Omit<StageProgressRow, "updated_at"> {
  const [questId, stageId] = key.split("/");
  return {
    user_id: userId,
    quest_id: questId,
    stage_id: stageId,
    code: stage.code !== undefined && stage.code.length <= MAX_CODE_LENGTH ? stage.code : null,
    attempts: stage.attempts.slice(-MAX_ATTEMPTS_KEPT),
    fails: stage.fails ?? 0,
    started_at: iso(stage.startedAt),
    passed_at: iso(stage.passedAt),
    hint_used: Boolean(stage.hintUsed),
    cheat_used: Boolean(stage.cheatUsed),
    solution_viewed: Boolean(stage.solutionViewed),
  };
}

export type ProfilePatch = Pick<ProfileRow, "id" | "persona" | "streak" | "sound" | "last_stage">;

export function profilePatch(userId: string, p: ProgressData): ProfilePatch {
  return { id: userId, persona: p.persona, streak: p.streak, sound: p.sound, last_stage: p.lastStage ?? null };
}

/** Что изменилось со времени последней синхронизации. Стор неизменяемый: изменённый этап — новый объект. */
export function diffProgress(prev: ProgressData | null, next: ProgressData) {
  const stageKeys = Object.keys(next.stages).filter((key) => !prev || prev.stages[key] !== next.stages[key]);
  // Сброс квеста удаляет этапы: их нужно удалить и в облаке, иначе при следующем входе они вернутся
  const removedStageKeys = prev ? Object.keys(prev.stages).filter((key) => !(key in next.stages)) : [];
  const achievementIds = Object.keys(next.achievements).filter((id) => !prev?.achievements[id]);
  const profileChanged =
    !prev ||
    prev.streak !== next.streak ||
    prev.persona !== next.persona ||
    prev.sound !== next.sound ||
    prev.lastStage !== next.lastStage;
  return { stageKeys, removedStageKeys, achievementIds, profileChanged };
}

/** Ключи вида «квест/этап», которые пройдут проверки схемы БД */
export const isSyncableKey = (key: string) => /^[a-z0-9_-]{1,40}\/[a-z0-9_-]{1,60}$/.test(key);
