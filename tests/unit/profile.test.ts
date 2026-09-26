import { describe, expect, it } from "vitest";
import { hexLine, sinceText } from "@/components/profile/profile-hero";
import { loadCourse } from "@/lib/content/load";
import { toOutline } from "@/lib/content/outline";
import { achievementCatalog } from "@/lib/game/achievements";
import { ACCENTS, availableTitles, BANNERS, FRAMES, HANDLE_RE, isUnlocked, unlockText } from "@/lib/profile/cosmetics";
import { safeMediaUrl } from "@/lib/profile/media";
import { profileFromRow, profileOnSignIn, profileToPatch } from "@/lib/profile/row";
import { EMPTY_PROFILE, type ProfileData } from "@/lib/profile/store";
import type { ProfileRow } from "@/lib/supabase/database";

const course = toOutline(loadCourse());

const row = (patch: Partial<ProfileRow> = {}): ProfileRow => ({
  id: "u1",
  display_name: "Аня",
  avatar_url: "https://avatars.example.com/a.png",
  persona: "chill",
  streak: 0,
  stats: {},
  sound: true,
  last_stage: null,
  handle: null,
  bio: "",
  accent: null,
  frame: null,
  banner: null,
  banner_url: null,
  title: null,
  showcase: [],
  is_public: false,
  xp_total: 0,
  level: 1,
  stages_passed: 0,
  streak_days: 0,
  best_streak: 0,
  created_at: "2026-09-01T00:00:00Z",
  updated_at: "2026-09-01T00:00:00Z",
  ...patch,
});

describe("каталог украшений", () => {
  const ids = new Set(achievementCatalog(course).map((a) => a.id));

  it("условия открытия ссылаются на существующие достижения", () => {
    for (const item of [...ACCENTS, ...FRAMES, ...BANNERS]) {
      if (item.unlock.achievement) expect(ids, item.id).toContain(item.unlock.achievement);
    }
  });

  it("id украшений проходят проверку БД, у каждой группы есть бесплатный вариант", () => {
    for (const list of [ACCENTS, FRAMES, BANNERS]) {
      for (const item of list) expect(item.id).toMatch(/^[a-z0-9_-]{1,24}$/);
      expect(list.some((x) => !x.unlock.level && !x.unlock.achievement)).toBe(true);
    }
  });

  it("открытие по уровню и по достижению", () => {
    expect(isUnlocked({ level: 5 }, { level: 4, achievements: {} })).toBe(false);
    expect(isUnlocked({ level: 5 }, { level: 5, achievements: {} })).toBe(true);
    expect(isUnlocked({ achievement: "days_7" }, { level: 30, achievements: {} })).toBe(false);
    expect(isUnlocked({ achievement: "days_7" }, { level: 1, achievements: { days_7: 1 } })).toBe(true);
    expect(unlockText({ level: 10 }, course)).toBe("С 10 уровня");
    expect(unlockText({ achievement: "days_7" }, course)).toBe("Достижение «Марафонец II»");
  });

  it("титулы — за закрытые квесты и редкие достижения", () => {
    expect(availableTitles(course, {})).toEqual([]);
    const titles = availableTitles(course, { quest_kt1: 1, days_60: 2, first_var: 3 }).map((t) => t.text);
    expect(titles).toEqual(expect.arrayContaining(["ГРОЗА СЕССИИ", "ЖЕЛЕЗНАЯ ВОЛЯ"]));
    expect(titles).toHaveLength(2);
  });

  it("ник: латиница, цифры, подчёркивание, 3–20 символов", () => {
    expect(HANDLE_RE.test("java_hero")).toBe(true);
    expect(HANDLE_RE.test("ab")).toBe(false);
    expect(HANDLE_RE.test("Java")).toBe(false);
    expect(HANDLE_RE.test("аня")).toBe(false);
  });
});

describe("профиль и облако", () => {
  const guestLook: ProfileData = { ...EMPTY_PROFILE, accent: "violet", frame: "clean", bio: "учу Java" };

  it("строка БД → профиль: неизвестные украшения заменяются значениями по умолчанию", () => {
    const p = profileFromRow(
      row({ accent: "no-such", frame: "legend", handle: "BAD HANDLE", showcase: ["a", "b", "c", "d", "e"] }),
    );
    expect(p.accent).toBe("crimson");
    expect(p.frame).toBe("legend");
    expect(p.handle).toBeNull();
    expect(p.showcase).toHaveLength(4);
  });

  it("оформление гостя переезжает в новый аккаунт, имя и аватар — из аккаунта", () => {
    const merged = profileOnSignIn(guestLook, null, row(), "u1");
    expect(merged).toMatchObject({ accent: "violet", frame: "clean", bio: "учу Java", displayName: "Аня" });
    expect(merged.avatarUrl).toBe("https://avatars.example.com/a.png");
  });

  it("настроенный профиль аккаунта главнее оформления в браузере", () => {
    const merged = profileOnSignIn(guestLook, null, row({ accent: "cyan", handle: "anya" }), "u1");
    expect(merged).toMatchObject({ accent: "cyan", handle: "anya", bio: "" });
  });

  it("оформление другого аккаунта не подмешивается", () => {
    expect(profileOnSignIn(guestLook, "u2", row(), "u1").accent).toBe("crimson");
  });

  it("ник в общую запись профиля не попадает: он меняется отдельно, с проверкой занятости", () => {
    expect(profileToPatch("u1", { ...guestLook, handle: "anya" })).not.toHaveProperty("handle");
  });
});

describe("картинки и оформление шапки", () => {
  it("в CSS и <img> попадают только безопасные https-ссылки", () => {
    expect(
      safeMediaUrl("https://x.supabase.co/storage/v1/object/public/profile-media/u1/banner.webp?v=1"),
    ).not.toBeNull();
    expect(safeMediaUrl("http://example.com/a.png")).toBeNull();
    expect(safeMediaUrl('https://e.com/a.png") ; background: url("https://evil')).toBeNull();
    expect(safeMediaUrl("javascript:alert(1)")).toBeNull();
    expect(safeMediaUrl(null)).toBeNull();
  });

  it("строка под именем начинается с CAFE BABE, дальше — hex из id", () => {
    expect(hexLine("3f2a9c1e-0b7d-4e21-9a55-1c2d3e4f5a6b")).toBe("CAFE BABE 3F2A 9C1E 0B7D 4E21 9A55 1C2D");
    expect(hexLine("guest").startsWith("CAFE BABE ")).toBe(true);
  });

  it("«С сентября 2026» — месяц в родительном падеже", () => {
    expect(sinceText("2026-09-15T12:00:00Z")).toBe("С сентября 2026");
  });
});
