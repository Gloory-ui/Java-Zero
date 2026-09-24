"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseConfig } from "./config";
import type { Database } from "./database";

export type Supabase = SupabaseClient<Database>;

let client: Supabase | null = null;

/**
 * Клиент Supabase для браузера. Сессия хранится в localStorage, а не в cookies: страницы сайта статические,
 * серверу сессия не нужна (AI-маршрут получает токен в заголовке). Вход через PKCE, код обменивается на /auth/callback.
 */
export function getSupabase(): Supabase | null {
  if (!supabaseConfig) return null;
  client ??= createClient<Database>(supabaseConfig.url, supabaseConfig.key, {
    auth: {
      flowType: "pkce",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: "java-zero-auth",
    },
  });
  return client;
}
