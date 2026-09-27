"use client";

import { type HandleCheck, saveHandle } from "@/lib/profile/actions";
import { supabaseConfig } from "@/lib/supabase/config";
import { HANDLE_RE, isEmailLogin, normalizeHandle } from "./handle";
import { flushSync, loadSupabase, startAccount } from "./session";

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

/** Сессия появилась в этой вкладке: подключаем синхронизацию прогресса, как после входа через GitHub */
async function activate() {
  await startAccount({ force: true });
}

export type HandleAvailability = "ok" | "taken" | "invalid" | "unknown";

/** Свободен ли ник для регистрации. «unknown» — сервер не смог проверить: регистрация всё равно идёт */
export async function checkSignupHandle(raw: string): Promise<HandleAvailability> {
  const handle = normalizeHandle(raw);
  if (!HANDLE_RE.test(handle)) return "invalid";
  try {
    const res = await fetch(`/api/auth/handle?handle=${encodeURIComponent(handle)}`);
    if (!res.ok) return "unknown";
    const body = (await res.json()) as { available?: boolean; reason?: string };
    if (body.reason === "invalid") return "invalid";
    return body.available ? "ok" : "taken";
  } catch {
    return "unknown";
  }
}

/**
 * Регистрация: письмо с кодом на почту. Ник уходит в данные аккаунта: user_name — чтобы имя в профиле было ником,
 * а не частью почты. false — почта уже зарегистрирована (Supabase в этом случае письмо не шлёт)
 */
export async function signUp(email: string, password: string, handle: string, next: string): Promise<boolean> {
  const supabase = await loadSupabase();
  const nick = normalizeHandle(handle);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { handle: nick, user_name: nick }, emailRedirectTo: callbackUrl(next) },
  });
  if (error) throw error;
  return (data.user?.identities?.length ?? 0) > 0;
}

export async function resendSignupCode(email: string, next: string) {
  const supabase = await loadSupabase();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: callbackUrl(next) },
  });
  if (error) throw error;
}

/** Код из письма после регистрации. Ник записывается в профиль сразу: он нужен для входа по нику */
export async function confirmSignup(email: string, code: string, handle: string): Promise<HandleCheck> {
  const supabase = await loadSupabase();
  const token = code.replace(/\s/g, "");
  let { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  // Старые проекты Supabase подтверждают регистрацию только типом signup
  if (error) ({ data, error } = await supabase.auth.verifyOtp({ email, token, type: "signup" }));
  if (error) throw error;
  const uid = data.user?.id;
  const saved = uid ? await saveHandle(handle, uid) : "error";
  await activate();
  return saved;
}

/** Вход паролем по почте или нику. По нику — через сервер: он знает почту, браузер её не видит */
export async function signInWithPassword(login: string, password: string) {
  const supabase = await loadSupabase();
  if (isEmailLogin(login)) {
    const { error } = await supabase.auth.signInWithPassword({ email: login.trim(), password });
    if (error) throw error;
  } else {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle: login, password }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      access_token?: string;
      refresh_token?: string;
    };
    if (!res.ok || !body.access_token || !body.refresh_token) throw new Error(body.error ?? "Не удалось войти.");
    const { error } = await supabase.auth.setSession({
      access_token: body.access_token,
      refresh_token: body.refresh_token,
    });
    if (error) throw error;
  }
  await activate();
}

/** «Забыл пароль»: код на почту. Ссылка в письме тоже работает, если шаблон письма её содержит */
export async function requestPasswordReset(email: string) {
  const supabase = await loadSupabase();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: callbackUrl("/profile") });
  if (error) throw error;
}

/** Код восстановления: после него студент уже вошёл и задаёт новый пароль */
export async function confirmPasswordReset(email: string, code: string) {
  const supabase = await loadSupabase();
  const { error } = await supabase.auth.verifyOtp({ email, token: code.replace(/\s/g, ""), type: "recovery" });
  if (error) throw error;
}

export async function setNewPassword(password: string) {
  const supabase = await loadSupabase();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
  await activate();
}

/** Выход: сначала досылаем несохранённый прогресс. Локальный прогресс остаётся в браузере. */
export async function signOut() {
  await flushSync();
  const supabase = await loadSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
