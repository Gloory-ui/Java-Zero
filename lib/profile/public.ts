"use client";

import { supabaseConfig } from "@/lib/supabase/config";
import type { LeaderRow, PublicProfile } from "@/lib/supabase/database";

export class PublicDataError extends Error {}

/**
 * Публичные данные читаются через SQL-функции прямо из REST Supabase: гостю не нужна библиотека supabase-js,
 * а функции отдают только поля для показа и только открытые профили.
 */
async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  if (!supabaseConfig) throw new PublicDataError("Аккаунты на этой версии сайта не подключены.");
  let res: Response;
  try {
    res = await fetch(`${supabaseConfig.url}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: {
        apikey: supabaseConfig.key,
        Authorization: `Bearer ${supabaseConfig.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
    });
  } catch {
    throw new PublicDataError("Нет связи с сервером. Проверь интернет и обнови страницу.");
  }
  if (!res.ok) throw new PublicDataError(`Сервер ответил ошибкой ${res.status}. Попробуй позже.`);
  return (await res.json()) as T;
}

/** null — профиля нет или он скрыт владельцем */
export function fetchPublicProfile(handle: string): Promise<PublicProfile | null> {
  return rpc<PublicProfile | null>("get_public_profile", { p_handle: handle });
}

export function fetchLeaderboard(period: "week" | "all"): Promise<LeaderRow[]> {
  return rpc<LeaderRow[]>("leaderboard", { p_period: period });
}

export function profileUrl(handle: string): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/u/${handle}`;
}
