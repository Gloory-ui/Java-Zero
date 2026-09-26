"use client";

import { create } from "zustand";
import { sound } from "@/lib/audio";
import type { QuestOutline } from "@/lib/content/outline";
import type { IconName } from "@/lib/icons";
import type { RunResult } from "@/lib/java/judge";
import { useProgress } from "@/lib/progress/store";
import type { DailyMetric } from "@/lib/progress/types";
import { type Achievement, evaluateAchievements, type GameEvent, RARITY_ORDER, type Rarity } from "./achievements";
import { CHEST_ID, dailyContext, findDaily, newlyCompleted, pickDaily } from "./daily";
import { localDay } from "./day";
import type { Verdict } from "./duel";
import { type Rank, rankForLevel } from "./ranks";
import { isKtKey, levelInfo, MAX_LEVEL, stageXpParts, totalXp, type XpPart } from "./xp";

// ——— Отклик: карточки, «+XP», праздничные экраны ———

export type Toast = {
  id: number;
  icon: IconName;
  title: string;
  desc: string;
  tone: "achievement" | "daily" | "egg" | "level";
  rarity?: Rarity;
  xp?: number;
  /** Значок достижения в карточке вместо простой иконки */
  badge?: Pick<Achievement, "id" | "group" | "rarity" | "secret" | "series" | "icon">;
  /** Значок ранга в карточке нового уровня */
  rank?: Rank;
};

type ToastStore = { items: Toast[]; push: (toast: Omit<Toast, "id">) => void; dismiss: (id: number) => void };

let nextId = 1;

export const useToasts = create<ToastStore>((set) => ({
  items: [],
  // Больше трёх карточек разом не показываем: старые уходят первыми
  push: (toast) => set((s) => ({ items: [...s.items, { ...toast, id: nextId++ }].slice(-3) })),
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

/** «+60 XP» вылетает у чипа уровня: туда студент смотрит, чтобы увидеть рост */
export const useXpGain = create<{ gain: { id: number; xp: number } | null }>(() => ({ gain: null }));

export type Celebration =
  | { kind: "level"; level: number; rank?: Rank }
  | { kind: "upgrade"; xp: number; level: number; achievements: number };

export const useCelebration = create<{ current: Celebration | null; close: () => void }>((set) => ({
  current: null,
  close: () => set({ current: null }),
}));

// ——— Курс для проверки достижений: его регистрирует GameBootstrap в корневом layout ———

let course: QuestOutline[] = [];

export function registerCourse(outline: QuestOutline[]) {
  course = outline;
}

/** Квесты дня выбираются при первом событии дня и дальше не меняются */
export function ensureDay() {
  const store = useProgress.getState();
  const today = localDay();
  if (store.daily?.day === today) return;
  store.startDay(today, pickDaily(today, dailyContext(store, course)));
}

function toastAchievement(a: Achievement) {
  useToasts.getState().push({
    icon: a.icon,
    title: a.title,
    desc: a.desc,
    tone: a.secret ? "egg" : "achievement",
    rarity: a.rarity,
    xp: a.xp,
    badge: { id: a.id, group: a.group, rarity: a.rarity, secret: a.secret, series: a.series, icon: a.icon },
  });
}

/**
 * После события: засчитать квесты дня, открыть достижения, показать прирост опыта и новый уровень.
 * silent — пересчёт при загрузке: награды выдаются без карточек и звуков.
 */
function settle(xpBefore: number, event?: GameEvent, silent = false) {
  const store = useProgress.getState();

  const done = newlyCompleted(store);
  if (Object.keys(done).length > 0) {
    store.completeDaily(done);
    if (!silent) {
      for (const [key, { xp }] of Object.entries(done)) {
        const id = key.slice(11);
        const t = findDaily(id);
        useToasts.getState().push(
          id === CHEST_ID
            ? { icon: "gift", title: "Сундук дня открыт", desc: "Все три квеста дня выполнены.", tone: "daily", xp }
            : {
                icon: t?.icon ?? "circle-check",
                title: "Квест дня выполнен",
                desc: t?.title ?? "",
                tone: "daily",
                xp,
              },
        );
      }
    }
  }

  const earned = evaluateAchievements(useProgress.getState(), course, event);
  const fresh = new Set(store.unlockAchievements(earned.map((a) => a.id)));
  if (!silent && fresh.size > 0) {
    const got = earned.filter((a) => fresh.has(a.id));
    for (const a of got) toastAchievement(a);
    // Звук по самой редкой награде из открытых, тайный знак добавляет глитч
    const top = RARITY_ORDER.find((r) => got.some((a) => a.rarity === r)) ?? "common";
    sound.achievement(top, { glitch: got.some((a) => a.secret) });
  }

  const xpAfter = totalXp(useProgress.getState());
  if (silent || xpAfter <= xpBefore) return;
  useXpGain.setState({ gain: { id: nextId++, xp: xpAfter - xpBefore } });
  const before = levelInfo(xpBefore).level;
  const after = levelInfo(xpAfter).level;
  if (after <= before) return;
  // Уровни растут часто: обычный — короткая карточка, новый ранг и каждая сотня — праздничный экран
  const rank = rankForLevel(after);
  const newRank = rank.title !== rankForLevel(before).title;
  const milestone = Math.floor(after / 100) > Math.floor(before / 100) || after === MAX_LEVEL;
  if (newRank || milestone) {
    useCelebration.setState({ current: { kind: "level", level: after, ...(newRank ? { rank } : {}) } });
  } else {
    useToasts.getState().push({
      icon: rank.icon,
      title: `Уровень ${after}`,
      desc: `${rank.title}. До следующего ранга — меньше, чем кажется.`,
      tone: "level",
      rank,
    });
    sound.levelUp(fresh.size > 0 ? 0.5 : 0);
  }
}

const currentXp = () => totalXp(useProgress.getState());

// ——— События ———

export type PassResult = { firstPass: boolean; parts: XpPart[]; xp: number };

/**
 * Проверка кода закончилась: passed — все тесты пройдены. Для первой сдачи возвращает, из чего сложился опыт.
 * Ошибка компиляции — тоже проваленная проверка.
 */
export function checkFinished(key: string, source: string, passed: boolean): PassResult | null {
  ensureDay();
  const store = useProgress.getState();
  const xpBefore = currentXp();
  store.bumpDaily(["check"]);

  if (!passed) {
    store.failCheck(key);
    sound.error();
    settle(xpBefore, { type: "check", source });
    return null;
  }

  const before = store.stages[key] ?? { attempts: [] };
  const isKt = isKtKey(key);
  const parts = stageXpParts(before, isKt);
  const xp = parts.reduce((sum, p) => sum + p.xp, 0);
  const firstPass = store.markPassed(key, xp);
  sound.success();
  if (!firstPass) {
    settle(xpBefore, { type: "check", source });
    return { firstPass: false, parts: [], xp: 0 };
  }

  const metrics: DailyMetric[] = ["pass"];
  if (!before.fails) metrics.push("passFirstTry");
  if (!before.hintUsed) metrics.push("passNoHint");
  if (isKt) metrics.push("passKt");
  store.bumpDaily(metrics);
  settle(xpBefore, { type: "pass", key, before, at: Date.now(), source });
  return { firstPass: true, parts, xp };
}

export function runFinished(source: string, stdin: string, run: RunResult) {
  ensureDay();
  const store = useProgress.getState();
  const xpBefore = currentXp();
  const ok = run.status === "ok" || (run.status === "exit" && run.exitCode === 0);
  store.addStats({ runs: 1 });
  store.bumpDaily(ok && stdin.trim() !== "" ? ["run", "runInput"] : ["run"]);
  settle(xpBefore, { type: "run", source, stdin, run });
}

export function duelFinished(verdict: Verdict, percent: number) {
  ensureDay();
  const store = useProgress.getState();
  const xpBefore = currentXp();
  if (verdict === "excellent") {
    store.addStats({ duelExcellent: 1, duelGood: 1 });
    store.bumpDaily(["duelGood", "duelExcellent"]);
  } else if (verdict === "good") {
    store.addStats({ duelGood: 1 });
    store.bumpDaily(["duelGood"]);
  }
  settle(xpBefore, { type: "duel", verdict, percent });
}

/** Верный ответ на квиз засчитывается один раз в день на этап: перещёлкивание вариантов опыт не даёт */
export function quizAnswered(key: string, right: boolean) {
  if (!right) return;
  ensureDay();
  const store = useProgress.getState();
  const seen = `quiz:${key}`;
  if (store.daily?.seen.includes(seen)) return;
  const xpBefore = currentXp();
  store.addStats({ quizRight: 1 });
  store.bumpDaily(["quizRight"], seen);
  settle(xpBefore);
}

export function mentorAsked() {
  ensureDay();
  const store = useProgress.getState();
  const xpBefore = currentXp();
  store.addStats({ mentor: 1 });
  store.bumpDaily(["mentor"]);
  settle(xpBefore);
}

/** Пасхалка: три быстрых клика по логотипу */
export function phonkDrop() {
  sound.phonk808();
  const xpBefore = currentXp();
  const unlocked = Boolean(useProgress.getState().achievements.egg_phonk);
  settle(xpBefore, { type: "egg", egg: "phonk" });
  if (unlocked) {
    useToasts.getState().push({
      icon: "headphones",
      title: "PHONK BASS ACTIVATED",
      desc: "Кибер-ядро платформы разогнано до предела.",
      tone: "egg",
    });
  }
}

/**
 * Пересчёт при загрузке и после входа в аккаунт: достижения, заслуженные раньше, выдаются тихо.
 * Если прогресс только что перенесён со старой системы — один раз показываем, сколько опыта начислено.
 */
export function bootstrapGame() {
  const store = useProgress.getState();
  ensureDay();
  settle(currentXp(), undefined, true);
  if (!useProgress.getState().upgradeNotice) return;
  const after = useProgress.getState();
  const xp = totalXp(after);
  useCelebration.setState({
    current: {
      kind: "upgrade",
      xp,
      level: levelInfo(xp).level,
      achievements: Object.keys(after.achievements).length,
    },
  });
  store.dismissUpgradeNotice();
}
