import type { ProfileRow } from "@/lib/supabase/database";
import { ACCENTS, BANNERS, CUSTOM_BANNER, DEFAULT_LOOK, FRAMES, HANDLE_RE, SHOWCASE_MAX } from "./cosmetics";
import { EMPTY_PROFILE, type ProfileData } from "./store";

const known = (list: readonly { id: string }[], id: string | null | undefined, fallback: string) =>
  id && list.some((x) => x.id === id) ? id : fallback;

/** Строка profiles → профиль в браузере. Неизвестные id украшений заменяются значениями по умолчанию */
export function profileFromRow(row: ProfileRow): ProfileData {
  return {
    accent: known(ACCENTS, row.accent, DEFAULT_LOOK.accent),
    frame: known(FRAMES, row.frame, DEFAULT_LOOK.frame),
    banner: row.banner === CUSTOM_BANNER ? CUSTOM_BANNER : known(BANNERS, row.banner, DEFAULT_LOOK.banner),
    bannerUrl: row.banner_url ?? null,
    avatarUrl: row.avatar_url ?? null,
    title: row.title ?? null,
    showcase: (row.showcase ?? []).slice(0, SHOWCASE_MAX),
    handle: row.handle && HANDLE_RE.test(row.handle) ? row.handle : null,
    displayName: row.display_name ?? null,
    bio: row.bio ?? "",
    isPublic: Boolean(row.is_public),
  };
}

/** Студент уже что-то настраивал в этом аккаунте: тогда облако главнее оформления гостя */
export function isCustomized(row: ProfileRow | null): boolean {
  if (!row) return false;
  return Boolean(
    row.handle || row.accent || row.frame || row.banner || row.bio || row.title || (row.showcase ?? []).length > 0,
  );
}

/**
 * Профиль при входе. Настроенный профиль аккаунта главнее. Оформление гостя переезжает в новый аккаунт,
 * а имя и аватар берутся из аккаунта. Оформление другого аккаунта не подмешивается.
 */
export function profileOnSignIn(
  local: ProfileData,
  localOwner: string | null,
  row: ProfileRow | null,
  uid: string,
): ProfileData {
  const remote = row ? profileFromRow(row) : EMPTY_PROFILE;
  if (isCustomized(row) || (localOwner !== null && localOwner !== uid)) return remote;
  return {
    ...local,
    handle: remote.handle,
    displayName: remote.displayName ?? local.displayName,
    avatarUrl: remote.avatarUrl ?? local.avatarUrl,
    isPublic: remote.isPublic,
  };
}

/** Поля профиля для записи в БД. Ник сюда не входит: он меняется отдельно, с проверкой занятости */
export type ProfileLookPatch = Pick<
  ProfileRow,
  | "id"
  | "accent"
  | "frame"
  | "banner"
  | "banner_url"
  | "avatar_url"
  | "title"
  | "showcase"
  | "display_name"
  | "bio"
  | "is_public"
>;

export function profileToPatch(uid: string, p: ProfileData): ProfileLookPatch {
  return {
    id: uid,
    accent: p.accent,
    frame: p.frame,
    banner: p.banner,
    banner_url: p.bannerUrl,
    avatar_url: p.avatarUrl,
    title: p.title,
    showcase: p.showcase.slice(0, SHOWCASE_MAX),
    display_name: p.displayName?.slice(0, 80) ?? null,
    bio: p.bio.slice(0, 160),
    is_public: p.isPublic,
  };
}
