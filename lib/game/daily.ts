import type { QuestOutline } from "@/lib/content/outline";
import type { IconName } from "@/lib/icons";
import { isQuestUnlocked, isStagePassed } from "@/lib/progress/selectors";
import type { DailyMetric, DailyState, ProgressData } from "@/lib/progress/types";
import { hashString } from "./day";

export type DailyTier = "easy" | "medium" | "hard";

export type DailyTemplate = {
  /** id совпадает с проверкой БД: ^[a-z0-9_]{1,40}$ */
  id: string;
  tier: DailyTier;
  icon: IconName;
  title: string;
  metric: DailyMetric;
  goal: number;
  xp: number;
  /** Квест имеет смысл, только если впереди есть несданные этапы или открытая КТ */
  needs?: "stages" | "kt";
};

export const DAILY_TEMPLATES: readonly DailyTemplate[] = [
  {
    id: "pass_one",
    tier: "easy",
    icon: "circle-check",
    title: "Сдай 1 этап",
    metric: "pass",
    goal: 1,
    xp: 30,
    needs: "stages",
  },
  {
    id: "quiz_two",
    tier: "easy",
    icon: "lightbulb",
    title: "Ответь верно на квизы двух этапов",
    metric: "quizRight",
    goal: 2,
    xp: 20,
  },
  { id: "run_three", tier: "easy", icon: "play", title: "Запусти программу 3 раза", metric: "run", goal: 3, xp: 20 },
  { id: "check_three", tier: "easy", icon: "flask", title: "Сделай 3 проверки кода", metric: "check", goal: 3, xp: 20 },
  { id: "mentor_one", tier: "easy", icon: "bot", title: "Задай вопрос AI-ментору", metric: "mentor", goal: 1, xp: 20 },
  {
    id: "first_try",
    tier: "medium",
    icon: "target",
    title: "Сдай этап с первой проверки",
    metric: "passFirstTry",
    goal: 1,
    xp: 40,
    needs: "stages",
  },
  {
    id: "no_hint",
    tier: "medium",
    icon: "puzzle",
    title: "Сдай этап без подсказок",
    metric: "passNoHint",
    goal: 1,
    xp: 40,
    needs: "stages",
  },
  {
    id: "duel_good",
    tier: "medium",
    icon: "medal",
    title: "Пройди защиту на 4 или 5",
    metric: "duelGood",
    goal: 1,
    xp: 40,
  },
  {
    id: "run_input",
    tier: "medium",
    icon: "keyboard",
    title: "Запусти программу со своим вводом",
    metric: "runInput",
    goal: 1,
    xp: 30,
  },
  {
    id: "pass_three",
    tier: "hard",
    icon: "rocket",
    title: "Сдай 3 этапа",
    metric: "pass",
    goal: 3,
    xp: 60,
    needs: "stages",
  },
  {
    id: "duel_five",
    tier: "hard",
    icon: "swords",
    title: "Защити этап на 5",
    metric: "duelExcellent",
    goal: 1,
    xp: 60,
  },
  {
    id: "kt_task",
    tier: "hard",
    icon: "trophy",
    title: "Сдай задание КТ",
    metric: "passKt",
    goal: 1,
    xp: 60,
    needs: "kt",
  },
];

/** Сундук дня: все три квеста выполнены */
export const CHEST_ID = "chest";
export const CHEST_XP = 30;

const TIERS: readonly DailyTier[] = ["easy", "medium", "hard"];

export const findDaily = (id: string) => DAILY_TEMPLATES.find((t) => t.id === id);

export type DailyContext = { remainingStages: number; ktOpen: boolean };

export function dailyContext(p: Pick<ProgressData, "stages">, course: QuestOutline[]): DailyContext {
  let remainingStages = 0;
  let ktOpen = false;
  for (const quest of course) {
    const left = quest.stages.filter((s) => !isStagePassed(p, quest.id, s.id)).length;
    remainingStages += left;
    if (left > 0 && /^kt\d+$/.test(quest.id) && isQuestUnlocked(p, course, quest)) ktOpen = true;
  }
  return { remainingStages, ktOpen };
}

const available = (t: DailyTemplate, ctx: DailyContext) =>
  t.needs === "kt" ? ctx.ktOpen : t.needs === "stages" ? ctx.remainingStages >= t.goal : true;

/**
 * Три квеста дня: лёгкий, средний и тяжёлый. Выбор зависит только от даты, поэтому совпадает на всех устройствах
 * и не меняется при входе в аккаунт. Из пула убираются квесты, которые студенту сейчас не выполнить.
 */
export function pickDaily(day: string, ctx: DailyContext): string[] {
  return TIERS.flatMap((tier) => {
    const pool = DAILY_TEMPLATES.filter((t) => t.tier === tier && available(t, ctx));
    return pool.length > 0 ? [pool[hashString(`${day}:${tier}`) % pool.length].id] : [];
  });
}

export const dailyKey = (day: string, id: string) => `${day}/${id}`;

export function dailyCount(state: DailyState | undefined, t: DailyTemplate): number {
  return Math.min(t.goal, state?.counters[t.metric] ?? 0);
}

/** Квесты дня, выполненные этим событием: ключ «день/квест» → запись для dailyDone. Сундук — когда закрыты все три. */
export function newlyCompleted(
  p: Pick<ProgressData, "daily" | "dailyDone">,
  now = Date.now(),
): Record<string, { at: number; xp: number }> {
  const state = p.daily;
  if (!state) return {};
  const done: Record<string, { at: number; xp: number }> = {};
  for (const id of state.quests) {
    const t = findDaily(id);
    const key = dailyKey(state.day, id);
    if (t && !p.dailyDone[key] && dailyCount(state, t) >= t.goal) done[key] = { at: now, xp: t.xp };
  }
  const chest = dailyKey(state.day, CHEST_ID);
  const allDone =
    state.quests.length > 0 &&
    state.quests.every((id) => p.dailyDone[dailyKey(state.day, id)] || done[dailyKey(state.day, id)]);
  if (allDone && !p.dailyDone[chest]) done[chest] = { at: now, xp: CHEST_XP };
  return done;
}

/** Сколько ежедневных квестов выполнено за всё время (без сундуков) */
export const dailyQuestsDone = (p: Pick<ProgressData, "dailyDone">) =>
  Object.keys(p.dailyDone).filter((k) => !k.endsWith(`/${CHEST_ID}`)).length;
