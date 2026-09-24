"use client";

import type { Session, User } from "@supabase/supabase-js";
import {
  diffProgress,
  isSyncableKey,
  mergeProgress,
  profilePatch,
  progressFromRows,
  stageToRow,
} from "@/lib/progress/merge";
import { useProgress } from "@/lib/progress/store";
import type { ProgressData } from "@/lib/progress/types";
import type { Supabase } from "@/lib/supabase/client";
import { accountsEnabled } from "@/lib/supabase/config";
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
    avatar: typeof meta.avatar_url === "string" ? meta.avatar_url : null,
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
    // lastSynced не двигаем: при следующем изменении уйдёт всё, что не дошло
    useAccount.setState({ sync: "error", error: error instanceof Error ? error.message : String(error) });
  }
}

const onHide = () => {
  if (document.visibilityState === "hidden") void flush();
};

function stopSync() {
  clearTimeout(timer);
  unsubscribe?.();
  unsubscribe = null;
  userId = null;
  lastSynced = null;
  if (typeof document !== "undefined") document.removeEventListener("visibilitychange", onHide);
}

/** Вход: облачный прогресс сливается с локальным, результат уходит обратно, дальше изменения отправляются сами. */
async function startSync(uid: string) {
  stopSync();
  userId = uid;
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
    const merged = mergeProgress(snapshot(), remote);
    useProgress.getState().replace(merged);
    await upload(supabase, uid, remote, merged, true);
    if (userId !== uid) return;

    lastSynced = merged;
    unsubscribe = useProgress.subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(() => void flush(), PUSH_DELAY_MS);
    });
    document.addEventListener("visibilitychange", onHide);
    useAccount.setState({ sync: "synced", syncedAt: Date.now(), error: undefined });
  } catch (error) {
    useAccount.setState({ sync: "error", error: error instanceof Error ? error.message : String(error) });
  }
}

function applySession(session: Session | null) {
  if (!session) {
    stopSync();
    useAccount.setState({ status: "signed-out", user: null, sync: "idle", error: undefined });
    return;
  }
  const user = toUser(session.user);
  const previous = useAccount.getState().user;
  useAccount.setState({ status: "signed-in", user });
  if (previous?.id !== user.id || userId !== user.id) void startSync(user.id);
}

let started = false;

/** Запускается один раз на вкладку из AccountProvider. */
export async function startAccount() {
  if (started || !accountsEnabled) return;
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
    useAccount.setState({ status: "signed-out", sync: "error", error: String(error) });
  }
}

/** Отправить несохранённое прямо сейчас (например, перед выходом). */
export const flushSync = flush;
