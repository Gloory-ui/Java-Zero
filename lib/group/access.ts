"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { loadSupabase } from "@/lib/account/session";
import { type AccountState, useAccount } from "@/lib/account/store";
import { useProgress } from "@/lib/progress/store";
import { type GroupStagePayload, type GroupTitles, PENDING_JOIN_KEY } from "./types";

/**
 * Членство в группе на стороне браузера. Решает сервер: функции is_group_member и join_group
 * (supabase/migrations/20261001130000_group_access.sql), задания КТ — маршруты /api/group/*.
 * Ответ кладётся в progress store (groupMember), чтобы карта, шапка и лаборатория знали, показывать ли КТ.
 */

type AccessState = {
  /** Для какого аккаунта проверено членство; null — гость */
  checkedFor: string | null;
  status: "idle" | "checking" | "ready" | "error";
  /** Код из ссылки-приглашения ждёт входа в аккаунт */
  pendingJoin: boolean;
  /** Чем закончился последний вход по ссылке-приглашению */
  join: "joined" | "bad" | "error" | null;
};

export const useGroupAccess = create<AccessState>(() => ({
  checkedFor: null,
  status: "idle",
  pendingJoin: false,
  join: null,
}));

/** Клиент без типов схемы: функций группы нет в lib/supabase/database.ts, как и у админки */
async function untyped(): Promise<SupabaseClient> {
  return (await loadSupabase()) as unknown as SupabaseClient;
}

async function hydrated(): Promise<void> {
  const api = useProgress.persist;
  if (api && !api.hasHydrated()) await api.rehydrate();
}

function takePendingCode(): string | null {
  try {
    const code = sessionStorage.getItem(PENDING_JOIN_KEY);
    sessionStorage.removeItem(PENDING_JOIN_KEY);
    return code;
  } catch {
    return null;
  } finally {
    useGroupAccess.setState({ pendingJoin: false });
  }
}

function rememberJoinCode(code: string) {
  try {
    sessionStorage.setItem(PENDING_JOIN_KEY, code.trim().toLowerCase());
  } catch {}
  useGroupAccess.setState({ pendingJoin: true, join: null });
}

/** Порядковый номер проверки: ответ устаревшей проверки не должен перетереть ответ свежей */
let latest = 0;

/** Спросить сервер, участник ли аккаунт; если ждёт код приглашения — войти по нему */
async function check(userId: string): Promise<void> {
  const mine = ++latest;
  const current = () => mine === latest && useAccount.getState().user?.id === userId;
  useGroupAccess.setState({ status: "checking" });
  await hydrated();
  // Отметка в браузере могла остаться от другого аккаунта: пока сервер не ответил, КТ не показываем
  if (useProgress.getState().owner !== userId) useProgress.getState().setGroupMember(false);
  try {
    const supabase = await untyped();
    const { data, error } = await supabase.rpc("is_group_member");
    if (error) throw error;
    let member = data === true;
    const code = takePendingCode();
    if (code) {
      let join: AccessState["join"] = "joined";
      if (!member) {
        const res = await supabase.rpc("join_group", { p_code: code });
        join = res.error ? "error" : res.data === true ? "joined" : "bad";
        member = join === "joined";
      }
      if (current()) useGroupAccess.setState({ join });
    }
    if (!current()) return;
    useProgress.getState().setGroupMember(member);
    useGroupAccess.setState({ checkedFor: userId, status: "ready" });
  } catch {
    // Сеть или база недоступны: оставляем последний ответ сервера, задания всё равно проверит маршрут
    if (current()) useGroupAccess.setState({ checkedFor: userId, status: "error" });
  }
}

async function signedOut() {
  latest++;
  await hydrated();
  useProgress.getState().setGroupMember(false);
  useGroupAccess.setState({ checkedFor: null, status: "ready" });
}

function onAccount(account: AccountState) {
  if (account.status === "loading") return;
  if (account.status === "signed-in" && account.user) {
    void check(account.user.id);
    return;
  }
  void signedOut();
}

let started = false;

/** Запускается из AccountProvider: проверяет членство при каждом входе и выходе */
export function startGroupAccess() {
  if (started) return;
  started = true;
  try {
    useGroupAccess.setState({ pendingJoin: sessionStorage.getItem(PENDING_JOIN_KEY) !== null });
  } catch {}
  onAccount(useAccount.getState());
  useAccount.subscribe((account, prev) => {
    if (account.status !== prev.status || account.user?.id !== prev.user?.id) onAccount(account);
  });
}

/**
 * Открыта ссылка-приглашение. Вошедший сразу попадает в группу (или узнаёт, что код не подошёл),
 * у гостя код ждёт входа в аккаунт: после входа проверка членства войдёт по нему сама
 */
export async function joinWithCode(code: string): Promise<void> {
  rememberJoinCode(code);
  const account = useAccount.getState();
  if (account.status === "signed-in" && account.user) await check(account.user.id);
}

export class GroupFetchError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function authorized<T>(url: string, signal?: AbortSignal): Promise<T> {
  const { data } = await (await loadSupabase()).auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new GroupFetchError(401, "Войди в аккаунт, чтобы открыть задания группы.");
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal });
  const body: { error?: string } = await res.json().catch(() => ({}));
  if (!res.ok) throw new GroupFetchError(res.status, body.error ?? "Не удалось загрузить задание.");
  return body as T;
}

/** Задание КТ целиком: только участнику группы или админу */
export function fetchGroupStage(questId: string, stageId: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ quest: questId, stage: stageId });
  return authorized<GroupStagePayload>(`/api/group/stage?${query}`, signal);
}

let titlesCache: { userId: string; promise: Promise<GroupTitles> } | null = null;

/** Настоящие названия заданий КТ; одна загрузка на аккаунт за вкладку */
export function fetchGroupTitles(): Promise<GroupTitles> {
  const userId = useAccount.getState().user?.id ?? "";
  if (titlesCache?.userId !== userId) {
    const promise = authorized<GroupTitles>("/api/group/outline");
    titlesCache = { userId, promise };
    promise.catch(() => {
      if (titlesCache?.promise === promise) titlesCache = null;
    });
  }
  return titlesCache.promise;
}

/** Названия заданий КТ для участника или админа; пока не загрузились или доступа нет — null */
export function useGroupTitles(enabled: boolean): GroupTitles | null {
  const [titles, setTitles] = useState<GroupTitles | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    fetchGroupTitles()
      .then((t) => alive && setTitles(t))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [enabled]);
  return enabled ? titles : null;
}
