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

/**
 * Ошибки входа, регистрации и кодов из письма — по-русски. Supabase отвечает по-английски, а тексты
 * нашего сервера уже русские и проходят как есть.
 */
export function describeAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) return "Неверный ник, почта или пароль.";
  if (/email not confirmed/i.test(message)) return "Почта не подтверждена. Введи код из письма.";
  if (/already registered|already been registered|user already exists/i.test(message)) {
    return "Эта почта уже зарегистрирована. Войди или восстанови пароль.";
  }
  if (/token has expired|otp.*(expired|invalid)|invalid.*(otp|token)/i.test(message)) {
    return "Код неверный или устарел. Запроси новый.";
  }
  const short = /password should be at least (\d+)/i.exec(message);
  if (short) return `Пароль слишком короткий: нужно не меньше ${short[1]} символов.`;
  if (/weak|pwned|leaked|known to be/i.test(message)) return "Слишком простой пароль. Придумай другой.";
  if (/same password|different from the old/i.test(message)) return "Новый пароль должен отличаться от старого.";
  if (/signups? not allowed|signup is disabled/i.test(message)) return "Регистрация сейчас выключена.";
  if (/rate limit|seconds|too many/i.test(message)) return "Слишком много попыток. Подожди минуту и попробуй снова.";
  if (/error sending|smtp/i.test(message)) {
    return "Не удалось отправить письмо. Попробуй позже или войди через GitHub или Google.";
  }
  if (/invalid.*email|email.*invalid|unable to validate email/i.test(message))
    return "Проверь адрес почты: в нём ошибка.";
  if (/failed to fetch|network|load failed/i.test(message)) return "Нет связи с сервером. Проверь интернет.";
  return message;
}

/** Пауза перед следующей попыткой: 15 с, 30 с, 1 мин, 2 мин, дальше каждые 5 минут. */
export function retryDelay(attempt: number): number {
  return Math.min(15_000 * 2 ** attempt, 300_000);
}
