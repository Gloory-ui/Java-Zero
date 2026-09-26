import { describe, expect, it } from "vitest";
import { loadCourse } from "@/lib/content/load";
import { toOutline } from "@/lib/content/outline";
import { achievementCatalog, achievementXp, isGroupQuest } from "@/lib/game/achievements";
import {
  GROUP_MAX_LEVEL,
  GROUP_RANKS,
  groupLevelInfo,
  groupRankForLevel,
  groupXp,
  isGroupAchievement,
} from "@/lib/game/group";
import { isMajorRank, RANKS } from "@/lib/game/ranks";
import { EMPTY_PROGRESS, type ProgressData } from "@/lib/progress/types";

const course = toOutline(loadCourse());
const catalog = achievementCatalog(course);
const SPECIAL = ["БЕЗУПРЕЧНЫЙ", "НЕСГИБАЕМЫЙ", "ЖЕЛЕЗНАЯ ВОЛЯ", "КВЕСТОМАН", "ГРОЗА ЭКЗАМЕНОВ", "CAFEBABE"];

describe("ранги и уровни", () => {
  it("названия рангов и званий группы не совпадают с титулами квестов и особыми титулами", () => {
    const titles = new Set([...course.map((q) => q.rank.title), ...SPECIAL, "ВЫПУСКНИК JAVA-ZERO"]);
    for (const r of [...RANKS, ...GROUP_RANKS]) expect(titles.has(r.title), r.title).toBe(false);
    expect(new Set([...RANKS, ...GROUP_RANKS].map((r) => r.title)).size).toBe(RANKS.length + GROUP_RANKS.length);
  });

  it("праздничный экран — только на крупных рангах: первые и каждый десятый", () => {
    const major = RANKS.filter((r) => isMajorRank(r));
    expect(major.length).toBe(13);
    expect(isMajorRank(RANKS[2] ?? RANKS[0])).toBe(true);
    expect(isMajorRank(RANKS[11] ?? RANKS[0])).toBe(false);
  });
});

describe("раздел «Группа»", () => {
  it("20 званий по возрастанию уровня, от 1 до 100", () => {
    expect(GROUP_RANKS).toHaveLength(20);
    expect(GROUP_RANKS[0]?.level).toBe(1);
    expect(GROUP_RANKS.at(-1)?.level).toBe(GROUP_MAX_LEVEL);
    const levels = GROUP_RANKS.map((r) => r.level);
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
    expect(new Set(levels).size).toBe(levels.length);
    expect(groupRankForLevel(2).title).toBe("АБИТУРИЕНТ");
  });

  it("шкала рассчитана на 50–60 заданий КТ: 22 задания — середина, 60 — около потолка", () => {
    // Задание КТ с первой проверки и без подсказок — 110 XP, плюс знаки группы примерно на треть сверху
    const tasks = (n: number) => Math.round(n * 110 * 1.35);
    expect(groupLevelInfo(tasks(22)).level).toBeGreaterThanOrEqual(30);
    expect(groupLevelInfo(tasks(22)).level).toBeLessThanOrEqual(50);
    expect(groupLevelInfo(tasks(60)).level).toBeGreaterThanOrEqual(80);
    expect(groupLevelInfo(10 ** 7)).toMatchObject({ level: GROUP_MAX_LEVEL, max: true });
  });

  it("опыт группы — только задания КТ и знаки группы", () => {
    const kt = course.find((q) => isGroupQuest(q));
    const basics = course.find((q) => !isGroupQuest(q));
    if (!kt || !basics) throw new Error("в курсе нет КТ или обычного квеста");
    const stage = { attempts: [], passedAt: 1, xp: 110 };
    const progress: ProgressData = {
      ...EMPTY_PROGRESS,
      stages: {
        [`${kt.id}/${kt.stages[0]?.id}`]: stage,
        [`${basics.id}/${basics.stages[0]?.id}`]: stage,
      },
      achievements: { grp_first: 1, first_var: 1 },
    };
    expect(groupXp(progress, course)).toBe(110 + achievementXp("grp_first"));
  });
});

describe("новые достижения", () => {
  it("опыт каждого достижения считается по одному id, без курса: как в синхронизации", () => {
    for (const a of catalog) expect(achievementXp(a.id), a.id).toBe(a.xp);
  });

  it("id подходят под проверку базы и не повторяются", () => {
    for (const a of catalog) expect(a.id).toMatch(/^[a-z0-9_]{1,40}$/);
    expect(new Set(catalog.map((a) => a.id)).size).toBe(catalog.length);
  });

  it("у каждого квеста курса свои знаки мастерства, у каждой КТ — знаки группы", () => {
    for (const q of course) {
      const ids = catalog.map((a) => a.id);
      if (isGroupQuest(q)) {
        expect(ids).toContain(`grp_clean_${q.id}`);
        expect(ids).toContain(`grp_sprint_${q.id}`);
      } else {
        expect(ids).toContain(`clean_${q.id}`);
        expect(ids).toContain(`nohint_${q.id}`);
      }
    }
    const group = catalog.filter((a) => a.group === "group");
    expect(group.every((a) => isGroupAchievement(a.id))).toBe(true);
  });
});
