import { HANDLE_RE } from "@/lib/profile/cosmetics";

export { HANDLE_RE };

/** Нормализация ника: без @, в нижнем регистре, без пробелов по краям */
export const normalizeHandle = (raw: string) => raw.trim().replace(/^@/, "").toLowerCase();

/** Во входе одно поле «ник или почта»: почту выдаёт @ в середине, ник пишут без неё или с @ в начале */
export const isEmailLogin = (login: string) => /^[^@\s]+@[^@\s]+$/.test(login.trim());

/** Пароль: не короче 8 символов и не длиннее 72 байт — дальше bcrypt в Supabase всё равно отбрасывает */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

/** Куда вернуть после входа: только путь этого сайта, иначе ссылку входа можно подделать для перехода на чужой сайт. */
export function safeNext(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/course";
  return raw;
}
