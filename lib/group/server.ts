import { isAdminUser, userIdFromRequest } from "@/lib/admin/server";
import { supabaseAdmin } from "@/lib/supabase/server";

// Только для серверных маршрутов: доступ к заданиям «Группы» проверяется по таблицам group_members
// (supabase/migrations/20261001130000_group_access.sql) и admins секретным ключом

export type GroupAccess =
  | { ok: true; userId: string; admin: boolean }
  | { ok: false; status: 401 | 403 | 503; error: string };

const NOT_CONFIGURED = { ok: false, status: 503, error: "Раздел «Группа» на этом сервере не настроен." } as const;

/** Участник ли группы; null — таблицу прочитать не удалось (например, миграция ещё не выполнена) */
async function isMember(userId: string): Promise<boolean | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from("group_members")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return error ? null : data !== null;
}

async function isAdmin(userId: string): Promise<boolean> {
  try {
    return await isAdminUser(userId);
  } catch {
    return false;
  }
}

/**
 * Кто открывает задания «Группы»: участник группы или админ. Токен — access_token Supabase из заголовка
 * Authorization: Bearer. Без токена — 401, не участник — 403, база не настроена — 503.
 */
export async function checkGroupAccess(request: Request): Promise<GroupAccess> {
  if (!supabaseAdmin) return NOT_CONFIGURED;
  const userId = await userIdFromRequest(request);
  if (!userId) return { ok: false, status: 401, error: "Войди в аккаунт, чтобы открыть задания группы." };

  const [member, admin] = await Promise.all([isMember(userId), isAdmin(userId)]);
  if (member || admin) return { ok: true, userId, admin };
  // Без таблицы участников доступ проверить нельзя: это настройка сервера, а не отказ студенту
  if (member === null) return NOT_CONFIGURED;
  return { ok: false, status: 403, error: "Задания КТ — только для участников группы." };
}
