import type { QuestOutline } from "@/lib/content/outline";
import type { IconName } from "@/lib/icons";
import type { RunResult } from "@/lib/java/judge";
import { stripJavaComments } from "@/lib/java/judge";
import { isQuestCompleted, isStagePassed } from "@/lib/progress/selectors";
import type { ProgressData, StageProgress } from "@/lib/progress/types";
import { CHEST_ID, dailyQuestsDone } from "./daily";
import type { Verdict } from "./duel";
import { activeDays, streakInfo } from "./streak";

export type Rarity = "common" | "rare" | "epic" | "legendary";

export const RARITY_XP: Record<Rarity, number> = { common: 25, rare: 75, epic: 150, legendary: 300 };
export const RARITY_LABEL: Record<Rarity, string> = {
  common: "Обычное",
  rare: "Редкое",
  epic: "Эпическое",
  legendary: "Легендарное",
};
export const RARITY_ORDER: readonly Rarity[] = ["legendary", "epic", "rare", "common"];

export type AchievementGroup = "course" | "mastery" | "exam" | "streak" | "daily" | "secret";

export const GROUP_LABEL: Record<AchievementGroup, string> = {
  course: "Курс",
  mastery: "Мастерство",
  exam: "Защита",
  streak: "Серии",
  daily: "Квесты дня",
  secret: "Тайные знаки",
};

/** Событие, после которого проверяются достижения. Без события — проверка по накопленному прогрессу */
export type GameEvent =
  | { type: "pass"; key: string; before: StageProgress; at: number; source?: string }
  | { type: "run"; source: string; stdin: string; run: RunResult }
  | { type: "check"; source: string }
  | { type: "duel"; verdict: Verdict; percent: number }
  | { type: "egg"; egg: "phonk" };

export type Facts = {
  progress: ProgressData;
  course: QuestOutline[];
  passed: number;
  totalStages: number;
  firstTry: number;
  noHint: number;
  bestStreak: number;
  dailyDone: number;
};

export type Achievement = {
  /** id совпадает с проверкой БД: ^[a-z0-9_]{1,40}$. Прежние 7 id сохранены */
  id: string;
  group: AchievementGroup;
  icon: IconName;
  title: string;
  desc: string;
  rarity: Rarity;
  xp: number;
  secret?: boolean;
  /** Серия с уровнями: «Строитель III» */
  series?: { id: string; name: string; tier: number };
  /** Для достижений со счётчиком: сколько нужно и сколько есть */
  goal?: number;
  count?: (f: Facts) => number;
  /** Титул, который можно поставить в профиль */
  titleReward?: string;
  test: (f: Facts, e?: GameEvent) => boolean;
};

const ROMAN = ["I", "II", "III", "IV", "V"];
export const TIER_NAME = ["Новичок", "Ученик", "Знаток", "Страж", "Мастер"];
export const roman = (tier: number) => ROMAN[tier - 1] ?? String(tier);

type Base = Omit<Achievement, "xp">;
const make = (a: Base): Achievement => ({ ...a, xp: RARITY_XP[a.rarity] });

/** Серия достижений со счётчиком: пороги по возрастанию и редкость каждого уровня */
function series(
  seriesId: string,
  name: string,
  group: AchievementGroup,
  icon: IconName,
  describe: (n: number) => string,
  count: (f: Facts) => number,
  levels: readonly (readonly [number, Rarity, string?])[],
): Achievement[] {
  return levels.map(([goal, rarity, id], i) =>
    make({
      id: id ?? `${seriesId}_${goal}`,
      group,
      icon,
      title: `${name} ${roman(i + 1)}`,
      desc: describe(goal),
      rarity,
      series: { id: seriesId, name, tier: i + 1 },
      goal,
      count,
      test: (f) => count(f) >= goal,
    }),
  );
}

const passedStage = (f: Facts, key: string) => f.progress.stages[key]?.passedAt !== undefined;
const passEvent = (e: GameEvent | undefined, key?: string) =>
  e?.type === "pass" && (key === undefined || e.key === key) ? e : undefined;
const hourOf = (ms: number) => new Date(ms).getHours();
const USES_SCANNER = /new\s+Scanner\s*\(\s*System\.in\s*\)/;
const finished = (run: RunResult) => run.status === "ok" || (run.status === "exit" && run.exitCode === 0);

const STATIC: readonly Achievement[] = [
  // Мастерство
  make({
    id: "first_var",
    group: "mastery",
    icon: "box",
    title: "Архитектор памяти",
    desc: "Сдай первый этап курса сам: без шпоры и без эталонного решения.",
    rarity: "common",
    test: (f) => {
      const s = f.progress.stages["basics/program-structure"];
      return Boolean(s?.passedAt && !s.cheatUsed && !s.solutionViewed);
    },
  }),
  ...series(
    "builder",
    "Строитель",
    "mastery",
    "brick-wall",
    (n) => `Сдай ${n} этапов курса.`,
    (f) => f.passed,
    [
      [5, "common"],
      [10, "common"],
      [20, "rare"],
      [35, "epic"],
      [50, "legendary"],
    ],
  ),
  ...series(
    "precision",
    "Точность",
    "mastery",
    "crosshair",
    (n) => `Сдай ${n} этапов с первой проверки.`,
    (f) => f.firstTry,
    [
      [3, "common"],
      [10, "rare"],
      [25, "epic"],
    ],
  ),
  ...series(
    "solo",
    "Самостоятельность",
    "mastery",
    "compass",
    (n) => `Сдай ${n} этапов, не открывая подсказок.`,
    (f) => f.noHint,
    [
      [5, "common"],
      [15, "rare"],
      [30, "epic"],
    ],
  ),
  make({
    id: "division_safe",
    group: "mastery",
    icon: "divide",
    title: "Знаток типов",
    desc: "Сдай этап про целое и дробное деление с первой проверки.",
    rarity: "common",
    test: (f, e) => {
      const pass = passEvent(e, "basics/arithmetic");
      if (pass) return !pass.before.fails;
      const s = f.progress.stages["basics/arithmetic"];
      return Boolean(s?.passedAt && !s.fails);
    },
  }),
  make({
    id: "input_master",
    group: "mastery",
    icon: "keyboard",
    title: "Живой ввод",
    desc: "Запусти программу со Scanner на своих входных данных так, чтобы она отработала без ошибок.",
    rarity: "common",
    test: (_f, e) =>
      e?.type === "run" && finished(e.run) && e.stdin.trim() !== "" && USES_SCANNER.test(stripJavaComments(e.source)),
  }),
  make({
    id: "zero_shield",
    group: "mastery",
    icon: "shield-check",
    title: "Щит от нуля",
    desc: "Сдай этап с защитой от деления на ноль, не открывая подсказку.",
    rarity: "rare",
    test: (f, e) => {
      const pass = passEvent(e, "calc/switch-zero");
      if (pass) return !pass.before.hintUsed;
      const s = f.progress.stages["calc/switch-zero"];
      return Boolean(s?.passedAt && !s.hintUsed);
    },
  }),
  make({
    id: "stack_safe",
    group: "mastery",
    icon: "layers",
    title: "Покоритель рекурсии",
    desc: "Сдай этап с рекурсивным факториалом.",
    rarity: "rare",
    test: (f) => passedStage(f, "calc/factorial"),
  }),
  make({
    id: "comeback",
    group: "mastery",
    icon: "rotate-ccw",
    title: "Упорство",
    desc: "Сдай этап, на котором до этого провалил пять проверок.",
    rarity: "rare",
    test: (f, e) => {
      const pass = passEvent(e);
      if (pass) return (pass.before.fails ?? 0) >= 5;
      return Object.values(f.progress.stages).some((s) => s.passedAt && (s.fails ?? 0) >= 5);
    },
  }),
  make({
    id: "flawless_quest",
    group: "mastery",
    icon: "gem",
    title: "Безупречный квест",
    desc: "Закрой квест целиком: каждый этап с первой проверки и без подсказок.",
    rarity: "legendary",
    test: (f) =>
      f.course.some((q) =>
        q.stages.every((s) => {
          const st = f.progress.stages[`${q.id}/${s.id}`];
          return st?.passedAt && !st.fails && !st.hintUsed;
        }),
      ),
  }),

  // Защита
  make({
    id: "exam_challenger",
    group: "exam",
    icon: "swords",
    title: "Гроза преподов",
    desc: "Пройди защиту у профессора без единой ошибки.",
    rarity: "rare",
    test: (_f, e) => e?.type === "duel" && e.percent === 100,
  }),
  ...series(
    "honors",
    "Отличник",
    "exam",
    "medal",
    (n) => `Получи пятёрку на ${n} защитах.`,
    (f) => f.progress.stats.duelExcellent ?? 0,
    [
      [3, "common"],
      [10, "rare"],
      [25, "epic"],
    ],
  ),

  // Серии
  ...series(
    "sniper",
    "Снайпер",
    "streak",
    "flame",
    (n) => `Сдай ${n} этапов подряд без проваленных проверок.`,
    (f) => f.progress.cleanRun,
    [
      [3, "common", "streak_master"],
      [5, "rare"],
      [10, "epic"],
    ],
  ),
  ...series(
    "days",
    "Марафонец",
    "streak",
    "calendar-days",
    (n) => `Учись ${n} дней подряд: сдавай этап или выполняй квест дня.`,
    (f) => f.bestStreak,
    [
      [3, "common"],
      [7, "rare"],
      [14, "rare"],
      [30, "epic"],
      [60, "legendary"],
    ],
  ),

  // Квесты дня
  ...series(
    "daily",
    "Квестоход",
    "daily",
    "map",
    (n) => `Выполни ${n} ${n === 1 ? "квест" : "квестов"} дня.`,
    (f) => f.dailyDone,
    [
      [1, "common"],
      [10, "rare"],
      [30, "epic"],
      [100, "legendary"],
    ],
  ),
  make({
    id: "chest_first",
    group: "daily",
    icon: "gift",
    title: "Сундук дня",
    desc: "Выполни все три квеста за один день.",
    rarity: "common",
    test: (f) => Object.keys(f.progress.dailyDone).some((k) => k.endsWith(`/${CHEST_ID}`)),
  }),
  ...series(
    "erudite",
    "Эрудит",
    "daily",
    "lightbulb",
    (n) => `Ответь верно на квизы ${n} этапов.`,
    (f) => f.progress.stats.quizRight ?? 0,
    [
      [5, "common"],
      [20, "rare"],
    ],
  ),
  ...series(
    "tester",
    "Испытатель",
    "daily",
    "flask",
    (n) => `Запусти свои программы ${n} раз.`,
    (f) => f.progress.stats.runs ?? 0,
    [
      [25, "common"],
      [100, "rare"],
    ],
  ),
  make({
    id: "mentor_first",
    group: "daily",
    icon: "bot",
    title: "Разговор с ментором",
    desc: "Задай первый вопрос AI-ментору.",
    rarity: "common",
    test: (f) => (f.progress.stats.mentor ?? 0) >= 1,
  }),

  // Тайные знаки: условия скрыты, пока знак не найден
  make({
    id: "egg_phonk",
    group: "secret",
    icon: "headphones",
    title: "Фонк-режим",
    desc: "Трижды быстро нажми на логотип.",
    rarity: "rare",
    secret: true,
    test: (_f, e) => e?.type === "egg" && e.egg === "phonk",
  }),
  make({
    id: "egg_cafebabe",
    group: "secret",
    icon: "coffee",
    title: "CAFEBABE",
    desc: "Напиши в коде магическое число class-файлов Java: 0xCAFEBABE.",
    rarity: "epic",
    secret: true,
    test: (_f, e) =>
      (e?.type === "run" || e?.type === "check" || e?.type === "pass") && /cafebabe/i.test(e.source ?? ""),
  }),
  make({
    id: "hello_world",
    group: "secret",
    icon: "globe",
    title: "Hello, World!",
    desc: "Выведи классическое «Hello, World!».",
    rarity: "common",
    secret: true,
    test: (_f, e) => e?.type === "run" && finished(e.run) && /hello,\s*world/i.test(e.run.stdout),
  }),
  make({
    id: "night_owl",
    group: "secret",
    icon: "moon",
    title: "Ночная сова",
    desc: "Сдай этап между полуночью и пятью утра.",
    rarity: "rare",
    secret: true,
    test: (_f, e) => {
      const pass = passEvent(e);
      return pass !== undefined && hourOf(pass.at) < 5;
    },
  }),
  make({
    id: "early_bird",
    group: "secret",
    icon: "sunrise",
    title: "Ранняя пташка",
    desc: "Сдай этап между пятью и семью утра.",
    rarity: "rare",
    secret: true,
    test: (_f, e) => {
      const pass = passEvent(e);
      return pass !== undefined && hourOf(pass.at) >= 5 && hourOf(pass.at) < 7;
    },
  }),
  make({
    id: "lightning",
    group: "secret",
    icon: "zap",
    title: "Молния",
    desc: "Сдай этап с первой проверки меньше чем через две минуты после того, как открыл его.",
    rarity: "epic",
    secret: true,
    test: (_f, e) => {
      const pass = passEvent(e);
      const started = pass?.before.startedAt;
      return pass !== undefined && !pass.before.fails && started !== undefined && pass.at - started <= 120_000;
    },
  }),
];

/** Достижения за квесты: дают титул из quest.yaml. КТ — эпические, остальные квесты — редкие */
function questAchievements(course: QuestOutline[]): Achievement[] {
  const perQuest = course.map((q) =>
    make({
      id: `quest_${q.id}`,
      group: "course",
      icon: q.rank.icon,
      title: `${q.title}: пройдено`,
      desc: `Сдай все этапы квеста «${q.title}». Титул: ${q.rank.title}.`,
      rarity: /^kt\d+$/.test(q.id) ? "epic" : "rare",
      titleReward: q.rank.title,
      test: (f) => isQuestCompleted(f.progress, q),
    }),
  );
  const graduate = make({
    id: "graduate",
    group: "course",
    icon: "medal",
    title: "Выпускник Java-Zero",
    desc: "Сдай все этапы курса.",
    rarity: "legendary",
    titleReward: "ВЫПУСКНИК JAVA-ZERO",
    goal: course.reduce((n, q) => n + q.stages.length, 0),
    count: (f) => f.passed,
    test: (f) => f.passed >= f.totalStages,
  });
  return [...perQuest, graduate];
}

const catalogs = new WeakMap<QuestOutline[], Achievement[]>();

/** Каталог достижений курса. Кэш по объекту курса: каталог нужен на каждое событие */
export function achievementCatalog(course: QuestOutline[]): Achievement[] {
  let catalog = catalogs.get(course);
  if (!catalog) {
    catalog = [...questAchievements(course), ...STATIC];
    catalogs.set(course, catalog);
  }
  return catalog;
}

export function findAchievement(course: QuestOutline[], id: string): Achievement | undefined {
  return achievementCatalog(course).find((a) => a.id === id);
}

/**
 * Опыт достижения по одному id, без курса: нужен синхронизации и подсчёту опыта.
 * Достижения квестов строятся из курса, но их редкость видна по id: КТ — эпические, остальные — редкие.
 */
export function achievementXp(id: string): number {
  const known = STATIC.find((a) => a.id === id);
  if (known) return known.xp;
  if (id === "graduate") return RARITY_XP.legendary;
  if (id.startsWith("quest_")) return RARITY_XP[/^quest_kt\d+$/.test(id) ? "epic" : "rare"];
  return 0;
}

export function facts(progress: ProgressData, course: QuestOutline[]): Facts {
  let passed = 0;
  let firstTry = 0;
  let noHint = 0;
  let totalStages = 0;
  for (const q of course) {
    for (const s of q.stages) {
      totalStages++;
      if (!isStagePassed(progress, q.id, s.id)) continue;
      const st = progress.stages[`${q.id}/${s.id}`];
      passed++;
      if (!st.fails) firstTry++;
      if (!st.hintUsed) noHint++;
    }
  }
  return {
    progress,
    course,
    passed,
    totalStages,
    firstTry,
    noHint,
    bestStreak: streakInfo(activeDays(progress)).best,
    dailyDone: dailyQuestsDone(progress),
  };
}

/** Новые достижения: условие выполнено, а в прогрессе их ещё нет. */
export function evaluateAchievements(progress: ProgressData, course: QuestOutline[], event?: GameEvent): Achievement[] {
  const f = facts(progress, course);
  return achievementCatalog(course).filter((a) => !progress.achievements[a.id] && a.test(f, event));
}

/** Трофейный счёт — опыт всех открытых достижений */
export function trophyScore(progress: Pick<ProgressData, "achievements">): number {
  return Object.keys(progress.achievements).reduce((sum, id) => sum + achievementXp(id), 0);
}
