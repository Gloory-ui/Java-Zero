"use client";

import { loadSupabase } from "@/lib/account/session";
import { useAccount } from "@/lib/account/store";
import { CUSTOM_BANNER, HANDLE_RE } from "./cosmetics";
import { type MediaKind, prepareImage, uploadImage } from "./media";
import { useProfile } from "./store";

export type HandleCheck = "ok" | "taken" | "invalid" | "error";

/** Нормализация ника: без @, в нижнем регистре, без пробелов по краям */
export const normalizeHandle = (raw: string) => raw.trim().replace(/^@/, "").toLowerCase();

export async function checkHandle(raw: string): Promise<HandleCheck> {
  const handle = normalizeHandle(raw);
  if (!HANDLE_RE.test(handle)) return "invalid";
  try {
    const supabase = await loadSupabase();
    const { data, error } = await supabase.rpc("handle_available", { p_handle: handle });
    if (error) return "error";
    return data ? "ok" : "taken";
  } catch {
    return "error";
  }
}

/** Ник сохраняется отдельно от остального профиля: уникальность проверяет база, занятый ник вернёт «taken» */
export async function saveHandle(raw: string): Promise<HandleCheck> {
  const handle = normalizeHandle(raw);
  if (!HANDLE_RE.test(handle)) return "invalid";
  const uid = useAccount.getState().user?.id;
  if (!uid) return "error";
  try {
    const supabase = await loadSupabase();
    const { error } = await supabase.from("profiles").update({ handle }).eq("id", uid);
    if (error) return error.code === "23505" ? "taken" : "error";
    useProfile.getState().set({ handle });
    return "ok";
  } catch {
    return "error";
  }
}

/** Своя картинка: сжатие, загрузка в хранилище, ссылка — в профиль. Ошибки с понятным текстом бросает MediaError */
export async function uploadProfileImage(kind: MediaKind, file: File): Promise<void> {
  const uid = useAccount.getState().user?.id;
  if (!uid) throw new Error("Войди в аккаунт, чтобы загрузить картинку.");
  const blob = await prepareImage(file, kind);
  const url = await uploadImage(uid, kind, blob);
  useProfile.getState().set(kind === "avatar" ? { avatarUrl: url } : { bannerUrl: url, banner: CUSTOM_BANNER });
}
