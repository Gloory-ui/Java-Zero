"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect } from "react";
import { create } from "zustand";
import { loadSupabase } from "@/lib/account/session";
import { useAccount } from "@/lib/account/store";

/** Ошибка админского запроса с текстом для человека */
export class AdminError extends Error {}

/**
 * Клиент Supabase без типов схемы: функции и таблицы админки не входят в lib/supabase/database.ts,
 * чтобы части админки не правили один общий файл. Тип результата задаёт вызывающий
 */
async function untyped(): Promise<SupabaseClient> {
  return (await loadSupabase()) as unknown as SupabaseClient;
}

function humanize(error: { code?: string; message: string }): AdminError {
  if (error.code === "42501") return new AdminError("Нет прав администратора.");
  return new AdminError(error.message || "Запрос не выполнен.");
}

/** Вызов функции базы от имени вошедшего админа. Права проверяет сама функция (public.is_admin()) */
export async function adminRpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await (await untyped()).rpc(fn, args);
  if (error) throw humanize(error);
  return data as T;
}

/** Таблица базы для админки (например, content_overrides); доступ ограничивают политики RLS */
export async function adminTable(name: string) {
  return (await untyped()).from(name);
}

/** Заголовок Authorization для админских API-маршрутов (их проверяет requireAdmin) */
export async function adminAuthHeader(): Promise<Record<string, string>> {
  const { data } = await (await loadSupabase()).auth.getSession();
  return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
}

type AdminState = {
  /** Для какого аккаунта проверено: при смене входа проверка повторяется */
  userId: string | null;
  status: "unknown" | "checking" | "admin" | "not-admin" | "error";
};

const useAdminStore = create<AdminState>(() => ({ userId: null, status: "unknown" }));

/**
 * Права админа текущего аккаунта. Это только подсказка интерфейсу: все данные админки отдают функции
 * базы и маршруты, которые проверяют права сами
 */
export function useAdminStatus(): AdminState["status"] | "signed-out" | "loading" | "disabled" {
  const account = useAccount((s) => s.status);
  const userId = useAccount((s) => s.user?.id ?? null);
  const { userId: checkedFor, status } = useAdminStore();

  useEffect(() => {
    if (account !== "signed-in" || !userId || useAdminStore.getState().userId === userId) return;
    useAdminStore.setState({ userId, status: "checking" });
    adminRpc<boolean>("is_admin")
      .then((isAdmin) => useAdminStore.setState({ userId, status: isAdmin ? "admin" : "not-admin" }))
      .catch(() => useAdminStore.setState({ userId, status: "error" }));
  }, [account, userId]);

  if (account === "disabled") return "disabled";
  if (account === "loading") return "loading";
  if (account === "signed-out" || !userId) return "signed-out";
  return checkedFor === userId ? status : "checking";
}
