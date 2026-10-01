import { HANDLE_RE } from "@/lib/profile/cosmetics";

export { HANDLE_RE };

/** Нормализация ника: без @, в нижнем регистре, без пробелов по краям */
export const normalizeHandle = (raw: string) => raw.trim().replace(/^@/, "").toLowerCase();

/** Во входе одно поле «ник или почта»: почту выдаёт @ в середине, ник пишут без неё или с @ в начале */
export const isEmailLogin = (login: string) => /^[^@\s]+@[^@\s]+$/.test(login.trim());

/** Пароль: не короче 8 символов и не длиннее 72 байт — дальше bcrypt в Supabase всё равно отбрасывает */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

const SAME_ORIGIN = "https://java-zero.invalid";

/**
 * Куда вернуть после входа: только путь этого сайта, иначе ссылку входа можно подделать для перехода на чужой сайт.
 * Путь разбирается так же, как его разберёт браузер: он выбрасывает табуляцию и переводы строк и считает обратную
 * черту за «/», поэтому «/<табуляция>/evil.example» превратился бы в «//evil.example». Годится только адрес,
 * который остаётся на этом сайте
 */
export function safeNext(raw: string | null | undefined): string {
  if (!raw?.startsWith("/")) return "/course";
  try {
    const url = new URL(raw, SAME_ORIGIN);
    if (url.origin !== SAME_ORIGIN) return "/course";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/course";
  }
}
