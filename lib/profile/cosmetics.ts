import type { QuestOutline } from "@/lib/content/outline";
import { achievementCatalog, findAchievement } from "@/lib/game/achievements";

/** Условие открытия украшения: уровень или достижение. Пустое — доступно сразу */
export type Unlock = { level?: number; achievement?: string };

export type Accent = { id: string; name: string; color: string; unlock: Unlock };
export type Frame = { id: string; name: string; unlock: Unlock };
export type Banner = { id: string; name: string; unlock: Unlock };

/** Цвет неона: перекрашивает профиль и всю игровую систему — уровень, ранг, кольца, праздничные экраны */
export const ACCENTS: readonly Accent[] = [
  { id: "crimson", name: "Кибер-красный", color: "#ff2a55", unlock: {} },
  { id: "cyan", name: "Циан", color: "#22d3ee", unlock: {} },
  { id: "violet", name: "Фиолет", color: "#a855f7", unlock: {} },
  { id: "lime", name: "Лайм", color: "#a3e635", unlock: { level: 10 } },
  { id: "ice", name: "Лёд", color: "#7dd3fc", unlock: { achievement: "days_7" } },
  { id: "amber", name: "Янтарь", color: "#f59e0b", unlock: { level: 40 } },
  { id: "emerald", name: "Изумруд", color: "#10b981", unlock: { achievement: "quest_kt1" } },
  { id: "magenta", name: "Маджента", color: "#e879f9", unlock: { level: 100 } },
  { id: "gold", name: "Золото", color: "#fbbf24", unlock: { level: 250 } },
];

/** Рамка аватара. Как она выглядит — в components/profile/profile-avatar.tsx */
export const FRAMES: readonly Frame[] = [
  { id: "clean", name: "Без рамки", unlock: {} },
  { id: "neon", name: "Неон", unlock: {} },
  { id: "pulse", name: "Пульс", unlock: { level: 8 } },
  { id: "dual", name: "Двойной контур", unlock: { level: 25 } },
  { id: "hex", name: "Шестигранник", unlock: { achievement: "honors_3" } },
  { id: "orbit", name: "Орбита", unlock: { level: 60 } },
  { id: "legend", name: "Легенда", unlock: { achievement: "graduate" } },
];

/** Встроенные баннеры — CSS-фоны из app/globals.css (.banner-…). Свой баннер загружается картинкой */
export const BANNERS: readonly Banner[] = [
  { id: "grid", name: "Кибер-сетка", unlock: {} },
  { id: "aurora", name: "Северное сияние", unlock: { level: 12 } },
  { id: "circuit", name: "Плата", unlock: { level: 35 } },
  { id: "sunset", name: "Синтвейв", unlock: { achievement: "days_7" } },
  { id: "nebula", name: "Туманность", unlock: { level: 120 } },
  { id: "matrix", name: "Байт-поток", unlock: { achievement: "builder_20" } },
];

/** Свой баннер: картинка из хранилища Supabase */
export const CUSTOM_BANNER = "custom";

export const DEFAULT_LOOK = { accent: "crimson", frame: "neon", banner: "grid" } as const;

/** Титулы за редкие достижения, кроме квестов (у квестов титул в quest.yaml) */
const SPECIAL_TITLES: Record<string, string> = {
  flawless_quest: "БЕЗУПРЕЧНЫЙ",
  days_30: "НЕСГИБАЕМЫЙ",
  days_60: "ЖЕЛЕЗНАЯ ВОЛЯ",
  daily_100: "КВЕСТОМАН",
  honors_25: "ГРОЗА ЭКЗАМЕНОВ",
  egg_cafebabe: "CAFEBABE",
};

export type Owned = { level: number; achievements: Record<string, number> };

export function isUnlocked(unlock: Unlock, owned: Owned): boolean {
  if (unlock.level !== undefined && owned.level < unlock.level) return false;
  if (unlock.achievement !== undefined && !owned.achievements[unlock.achievement]) return false;
  return true;
}

/** «С 5 уровня», «Достижение «Марафонец II»» */
export function unlockText(unlock: Unlock, course: QuestOutline[]): string {
  if (unlock.level !== undefined) return `С ${unlock.level} уровня`;
  if (unlock.achievement !== undefined) {
    const a = findAchievement(course, unlock.achievement);
    return `Достижение «${a?.title ?? unlock.achievement}»`;
  }
  return "Доступно сразу";
}

export type Title = { id: string; text: string; from: string };

/** Титулы, которые студент может поставить: за закрытые квесты, выпуск и редкие достижения */
export function availableTitles(course: QuestOutline[], achievements: Record<string, number>): Title[] {
  const titles: Title[] = [];
  for (const a of achievementCatalog(course)) {
    if (!achievements[a.id]) continue;
    const text = a.titleReward ?? SPECIAL_TITLES[a.id];
    if (text) titles.push({ id: a.id, text, from: a.title });
  }
  return titles;
}

export const accentById = (id: string | null | undefined) => ACCENTS.find((a) => a.id === id) ?? ACCENTS[0];
export const frameById = (id: string | null | undefined) => FRAMES.find((f) => f.id === id) ?? FRAMES[1];
export const bannerById = (id: string | null | undefined) => BANNERS.find((b) => b.id === id);

/** Ник: латиница в нижнем регистре, цифры, подчёркивание, 3–20 символов — как в проверке БД */
export const HANDLE_RE = /^[a-z0-9_]{3,20}$/;
export const BIO_MAX = 160;
export const SHOWCASE_MAX = 4;
