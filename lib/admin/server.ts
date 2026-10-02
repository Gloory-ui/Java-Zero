import { supabaseAdmin, supabaseAnon } from "@/lib/supabase/server";

function deny(status: 401 | 403 | 503, error: string): Response {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

/** id пользователя по токену из заголовка Authorization: Bearer; null — нет токена, он неверный или устарел */
export async function userIdFromRequest(request: Request): Promise<string | null> {
  const anon = supabaseAnon();
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!anon || !token) return null;
  const { data, error } = await anon.auth.getUser(token);
  return error ? null : (data.user?.id ?? null);
}

/** Есть ли пользователь в public.admins. Ошибка базы — исключение: молча отказать админу хуже */
export async function isAdminUser(userId: string): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const { data, error } = await supabaseAdmin.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(`admins: ${error.message}`);
  return Boolean(data);
}

/**
 * Проверка админа для API-маршрутов: токен из заголовка Authorization (adminAuthHeader на клиенте) и строка
 * в public.admins. Возвращает id админа или готовый ответ с отказом:
 *   const admin = await requireAdmin(request); if (admin instanceof Response) return admin;
 */
export async function requireAdmin(request: Request): Promise<{ userId: string } | Response> {
  if (!supabaseAnon() || !supabaseAdmin) return deny(503, "Аккаунты на сайте не настроены");
  const userId = await userIdFromRequest(request);
  if (!userId) return deny(401, "Нужен вход");
  try {
    if (!(await isAdminUser(userId))) return deny(403, "Нет прав администратора");
  } catch {
    return deny(503, "База недоступна");
  }
  return { userId };
}
