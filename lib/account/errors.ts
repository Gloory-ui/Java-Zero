/**
 * Понятный текст ошибки синхронизации. Supabase возвращает ошибки обычными объектами { message, code },
 * а не Error: String(error) давал «[object Object]».
 */
export function describeSyncError(error: unknown): string {
  const { message, code } =
    error && typeof error === "object"
      ? (error as { message?: unknown; code?: unknown })
      : { message: error, code: undefined };
  const text = typeof message === "string" ? message : String(message ?? "неизвестная ошибка");

  if (code === "PGRST205" || code === "42P01") {
    return "в Supabase ещё нет таблиц прогресса: выполни миграцию из docs/supabase.md";
  }
  if (code === "42501") return "нет доступа к таблицам прогресса: проверь, что миграция выполнена целиком";
  if (code === "PGRST301" || /jwt|token/i.test(text)) return "сессия устарела, выйди и войди снова";
  if (/failed to fetch|network|load failed/i.test(text)) return "нет связи с сервером";
  return code ? `${text} (код ${String(code)})` : text;
}

/** Пауза перед следующей попыткой: 15 с, 30 с, 1 мин, 2 мин, дальше каждые 5 минут. */
export function retryDelay(attempt: number): number {
  return Math.min(15_000 * 2 ** attempt, 300_000);
}
