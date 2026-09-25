"use client";

import type { Session, User } from "@supabase/supabase-js";
import {
  diffProgress,
  isSyncableKey,
  profilePatch,
  progressFromRows,
  progressOnSignIn,
  stageToRow,
} from "@/lib/progress/merge";
import { useProgress } from "@/lib/progress/store";
import type { ProgressData } from "@/lib/progress/types";
import type { Supabase } from "@/lib/supabase/client";
import { AUTH_STORAGE_KEY, accountsEnabled } from "@/lib/supabase/config";
import { describeSyncError, retryDelay } from "./errors";
import { type AccountUser, useAccount } from "./store";

const PUSH_DELAY_MS = 1500;

let supabasePromise: Promise<Supabase> | null = null;

/** Библиотека Supabase грузится отдельным чанком и только если аккаунты включены. */
export function loadSupabase(): Promise<Supabase> {
  supabasePromise ??= import("@/lib/supabase/client").then(({ getSupabase }) => {
    const client = getSupabase();
    if (!client) throw new Error("Supabase не настроен");
    return client;
  });
  return supabasePromise;
}

function toUser(user: User): AccountUser {
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? null,
    name: meta.full_name ?? meta.name ?? meta.user_name ?? user.email?.split("@")[0] ?? null,
    // GitHub кладёт ссылку в avatar_url, Google — в avatar_url и picture
    avatar:
      [meta.avatar_url, meta.picture].find((v): v is string => typeof v === "string" && v.startsWith("https://")) ??
      null,
  };
}

function snapshot(): ProgressData {
  const { stages, streak, achievements, persona, sound, lastStage } = useProgress.getState();
  return { stages, streak, achievements, persona, sound, ...(lastStage ? { lastStage } : {}) };
}

async function ensureHydrated() {
  const api = useProgress.persist;
  if (api && !api.hasHydrated()) await api.rehydrate();
}

// ——— Синхронизация ———

let userId: string | null = null;
let lastSynced: ProgressData | null = null;
let unsubscribe: (() => void) | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let retryAttempt = 0;

function failed(error: unknown) {
  useAccount.setState({ sync: "error", error: describeSyncError(error) });
}

async function upload(supabase: Supabase, uid: string, prev: ProgressData | null, next: ProgressData, byValue = false) {
  const diff = diffProgress(prev, next);
  let stageKeys = diff.stageKeys.filter(isSyncableKey);
  if (byValue && prev) {
    // При первом слиянии prev собран из строк БД: сравниваем по содержимому, а не по ссылкам
    stageKeys = stageKeys.filter((key) => {
      const before = prev.stages[key];
      return (
        !before ||
        JSON.stringify(stageToRow(uid, key, before)) !== JSON.stringify(stageToRow(uid, key, next.stages[key]))
      );
    });
  }

  const jobs: PromiseLike<{ error: unknown }>[] = [];
  if (diff.profileChanged) jobs.push(supabase.from("profiles").upsert(profilePatch(uid, next)));
  if (stageKeys.length > 0) {
    const rows = stageKeys.map((key) => stageToRow(uid, key, next.stages[key]));
    jobs.push(supabase.from("stage_progress").upsert(rows));
  }
  if (diff.achievementIds.length > 0) {
    const rows = diff.achievementIds.map((id) => ({
      user_id: uid,
      achievement_id: id,
      unlocked_at: new Date(next.achievements[id]).toISOString(),
    }));
    jobs.push(supabase.from("achievements").upsert(rows, { ignoreDuplicates: true }));
  }
  for (const key of diff.removedStageKeys.filter(isSyncableKey)) {
    const [questId, stageId] = key.split("/");
    jobs.push(supabase.from("stage_progress").delete().match({ user_id: uid, quest_id: questId, stage_id: stageId }));
  }

  const results = await Promise.all(jobs);
  const failed = results.find((r) => r.error);
  if (failed) throw failed.error;
}

async function flush() {
  clearTimeout(timer);
  const uid = userId;
  if (!uid) return;
  const next = snapshot();
  const diff = diffProgress(lastSynced, next);
  const nothing =
    !diff.profileChanged &&
    diff.stageKeys.length === 0 &&
    diff.achievementIds.length === 0 &&
    diff.removedStageKeys.length === 0;
  if (nothing) return;

  useAccount.setState({ sync: "syncing" });
  try {
    await upload(await loadSupabase(), uid, lastSynced, next);
    if (userId !== uid) return;
    lastSynced = next;
    useAccount.setState({ sync: "synced", syncedAt: Date.now(), error: undefined });
  } catch (error) {
    // lastSynced не двигаем: следующая попытка отправит всё, что не дошло
    failed(error);
    timer = setTimeout(() => void flush(), retryDelay(1));
  }
}

const onHide = () => {
  if (document.visibilityState === "hidden") void flush();
};

const onOnline = () => {
  if (!userId) return;
  if (lastSynced) void flush();
  else void startSync(userId);
};

function stopSync() {
  clearTimeout(timer);
  clearTimeout(retryTimer);
  unsubscribe?.();
  unsubscribe = null;
  userId = null;
  lastSynced = null;
  if (typeof document !== "undefined") document.removeEventListener("visibilitychange", onHide);
  if (typeof window !== "undefined") window.removeEventListener("online", onOnline);
}

/**
 * Вход: облачный прогресс сливается с локальным, результат уходит обратно, дальше изменения отправляются сами.
 * Если первая попытка сорвалась (нет сети, база ещё не готова), повторяем с растущей паузой и при появлении сети.
 */
async function startSync(uid: string) {
  stopSync();
  userId = uid;
  window.addEventListener("online", onOnline);
  useAccount.setState({ sync: "syncing" });
  try {
    const supabase = await loadSupabase();
    await ensureHydrated();
    const [profile, stages, achievements] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabase.from("stage_progress").select("*").eq("user_id", uid),
      supabase.from("achievements").select("*").eq("user_id", uid),
    ]);
    const error = profile.error ?? stages.error ?? achievements.error;
    if (error) throw error;
    if (userId !== uid) return;

    const remote = progressFromRows(profile.data, stages.data ?? [], achievements.data ?? []);
    const store = useProgress.getState();
    const merged = progressOnSignIn(snapshot(), store.owner, remote, uid);
    store.replace(merged);
    store.setOwner(uid);
    await upload(supabase, uid, remote, merged, true);
    if (userId !== uid) return;

    lastSynced = merged;
    unsubscribe = useProgress.subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(() => void flush(), PUSH_DELAY_MS);
    });
    document.addEventListener("visibilitychange", onHide);
    retryAttempt = 0;
    useAccount.setState({ sync: "synced", syncedAt: Date.now(), error: undefined });
  } catch (error) {
    if (userId !== uid) return;
    failed(error);
    retryTimer = setTimeout(() => {
      if (userId === uid) void startSync(uid);
    }, retryDelay(retryAttempt++));
  }
}

/**
 * Сессии нет: если в браузере лежит прогресс аккаунта, убираем его — он сохранён в облаке, а следующий человек
 * (или другой аккаунт) должен начать с чистого листа. Гостевой прогресс не трогаем.
 */
async function dropAccountProgress() {
  await ensureHydrated();
  if (useProgress.getState().owner) useProgress.getState().clearAfterSignOut();
}

function applySession(session: Session | null) {
  if (!session) {
    stopSync();
    useAccount.setState({ status: "signed-out", user: null, sync: "idle", error: undefined });
    void dropAccountProgress();
    return;
  }
  const user = toUser(session.user);
  const previous = useAccount.getState().user;
  useAccount.setState({ status: "signed-in", user });
  if (previous?.id !== user.id || userId !== user.id) {
    retryAttempt = 0;
    void startSync(user.id);
  }
}

let started = false;

function hasStoredSession(): boolean {
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY) !== null;
  } catch {
    return true;
  }
}

/**
 * Запускается один раз на вкладку из AccountProvider. Гостю библиотека Supabase (~270 КБ) не нужна: без сохранённой
 * сессии статус сразу «не вошёл», а клиент грузится только при входе (force из /auth/callback).
 */
export async function startAccount({ force = false }: { force?: boolean } = {}) {
  if (started || !accountsEnabled) return;
  if (!force && !hasStoredSession()) {
    useAccount.setState({ status: "signed-out" });
    void dropAccountProgress();
    return;
  }
  started = true;
  try {
    const supabase = await loadSupabase();
    const { data } = await supabase.auth.getSession();
    applySession(data.session);
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") return;
      // Вызовы Supabase внутри этого колбэка блокируют клиент: откладываем на следующий тик
      setTimeout(() => applySession(session), 0);
    });
  } catch (error) {
    useAccount.setState({ status: "signed-out", sync: "error", error: describeSyncError(error) });
  }
}

/** Отправить несохранённое прямо сейчас (например, перед выходом). */
export const flushSync = flush;
