/**
 * Ссылка на картинку, которую можно подставить в <img> и в CSS: только https, без кавычек, скобок и пробелов.
 * Ссылки из публичных профилей задаёт их владелец, поэтому проверяем всегда. Модуль общий: нужен и серверу
 * (превью /u/ник), и браузеру.
 */
export function safeMediaUrl(url: string | null | undefined): string | null {
  if (!url || url.length > 500) return null;
  return /^https:\/\/[^"'()\s<>]+$/.test(url) ? url : null;
}
