import { describe, expect, it } from "vitest";
import { badgeArt, groupRankArt, groupRankTier, rankArt, rankTier } from "@/components/game/badge-art";
import { loadCourse } from "@/lib/content/load";
import { toOutline } from "@/lib/content/outline";
import { achievementCatalog, roman } from "@/lib/game/achievements";
import { GROUP_RANKS } from "@/lib/game/group";
import { RANKS } from "@/lib/game/ranks";

const catalog = achievementCatalog(toOutline(loadCourse()));

/** Что видно глазом: форма, иконка, подпись, узор внутри, декор снаружи и включённые эффекты */
const look = (art: ReturnType<typeof badgeArt>, icon: string, chip: string) =>
  JSON.stringify([
    art.shape,
    icon,
    chip,
    art.face,
    art.ornament.kind,
    art.ornament.paths,
    art.ornament.dots,
    art.decor,
    art.fx,
  ]);

describe("значки", () => {
  it("у каждого достижения свой рисунок", () => {
    const looks = catalog.map((a) => look(badgeArt(a), a.icon, a.series ? roman(a.series.tier) : ""));
    expect(new Set(looks).size).toBe(catalog.length);
  });

  it("рисунок детерминирован: одинаковый при каждом вызове", () => {
    const a = catalog[0];
    if (!a) throw new Error("пустой каталог");
    expect(JSON.stringify(badgeArt({ ...a }))).toBe(JSON.stringify(badgeArt(a)));
  });

  it("у каждого из 100 рангов свой рисунок: 10 эпох рамок, 5 ступеней эффектов по 20 рангов", () => {
    const looks = RANKS.map((r, i) => look(rankArt(r, i), r.icon, String(r.level)));
    expect(new Set(looks).size).toBe(RANKS.length);
    expect(new Set(RANKS.map((r, i) => rankArt(r, i).shape)).size).toBe(10);
    expect([0, 19, 20, 39, 40, 60, 80, 99].map(rankTier)).toEqual([1, 1, 2, 2, 3, 4, 5, 5]);
  });

  it("у каждого из 20 званий группы свой рисунок: 5 гербов по 4 звания", () => {
    const looks = GROUP_RANKS.map((r, i) => look(groupRankArt(r, i), r.icon, String(r.level)));
    expect(new Set(looks).size).toBe(GROUP_RANKS.length);
    expect(new Set(GROUP_RANKS.map((r, i) => groupRankArt(r, i).shape)).size).toBe(5);
    expect([0, 3, 4, 19].map(groupRankTier)).toEqual([1, 1, 2, 5]);
  });

  it("эффекты по редкости: перелив у эпических и легендарных, глитч у легендарных и тайных", () => {
    for (const a of catalog) {
      const { fx } = badgeArt(a);
      expect(fx.iridescent).toBe(a.rarity === "epic" || a.rarity === "legendary");
      if (a.rarity === "legendary" || a.secret || a.group === "secret") expect(fx.glitch).toBe(true);
    }
    // Каждая ступень рангов добавляет слой: 5-я ступень — всё сразу
    const top = rankArt(RANKS[99] ?? RANKS[0], 99);
    expect(top.fx).toEqual({ glow: true, sheen: true, orbit: false, iridescent: true, halo: true, glitch: true });
  });
});
