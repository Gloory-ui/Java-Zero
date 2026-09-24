"use client";

import { supabaseConfig } from "@/lib/supabase/config";
import { flushSync, loadSupabase } from "./session";

export type OAuthProvider = "github" | "google";

export type AuthMethods = Record<OAuthProvider | "email", boolean>;

let methods: Promise<AuthMethods> | null = null;

/** Какие способы входа включены в проекте Supabase: кнопки выключенных провайдеров не показываем. */
export function fetchAuthMethods(): Promise<AuthMethods> {
  methods ??= (async () => {
    if (!supabaseConfig) return { github: false, google: false, email: false };
    const res = await fetch(`${supabaseConfig.url}/auth/v1/settings`, { headers: { apikey: supabaseConfig.key } });
    if (!res.ok) throw new Error(`Supabase ответил ${res.status}`);
    const { external = {} } = (await res.json()) as { external?: Record<string, boolean> };
    return { github: Boolean(external.github), google: Boolean(external.google), email: Boolean(external.email) };
  })().catch((error) => {
    methods = null;
    throw error;
  });
  return methods;
}

/** Куда вернуть после входа: только путь этого сайта, иначе ссылку входа можно подделать для перехода на чужой сайт. */
export function safeNext(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/course";
  return raw;
}

function callbackUrl(next: string): string {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext(next))}`;
}

export async function signInWithProvider(provider: OAuthProvider, next: string) {
  const supabase = await loadSupabase();
  const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: callbackUrl(next) } });
  if (error) throw error;
}

export async function sendMagicLink(email: string, next: string) {
  const supabase = await loadSupabase();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: callbackUrl(next), shouldCreateUser: true },
  });
  if (error) throw error;
}

/** Выход: сначала досылаем несохранённый прогресс. Локальный прогресс остаётся в браузере. */
export async function signOut() {
  await flushSync();
  const supabase = await loadSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
