"use client";

import { create } from "zustand";
import { sound } from "@/lib/audio";
import type { QuestOutline } from "@/lib/content/outline";
import type { RunResult } from "@/lib/java/judge";
import { useProgress } from "@/lib/progress/store";
import { type AchievementId, achievementsForPass, achievementsForRun, findAchievement } from "./achievements";
import type { Verdict } from "./duel";
import { userRank } from "./ranks";

export type Toast = { id: number; icon: string; title: string; desc: string; tone: "achievement" | "rank" | "egg" };

type ToastStore = { items: Toast[]; push: (toast: Omit<Toast, "id">) => void; dismiss: (id: number) => void };

let nextId = 1;

export const useToasts = create<ToastStore>((set) => ({
  items: [],
  // Больше трёх карточек разом не показываем: старые уходят первыми
  push: (toast) => set((s) => ({ items: [...s.items, { ...toast, id: nextId++ }].slice(-3) })),
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

function grant(id: AchievementId) {
  if (!useProgress.getState().unlockAchievement(id)) return;
  const achievement = findAchievement(id);
  if (!achievement) return;
  useToasts
    .getState()
    .push({ icon: achievement.icon, title: achievement.title, desc: achievement.desc, tone: "achievement" });
  sound.achievement();
}

/** Этап сдан: отметка, серия, ачивки и новый ранг. Возвращает true, если этап сдан впервые. */
export function stagePassed(key: string, course: QuestOutline[]): boolean {
  const store = useProgress.getState();
  const before = store.stages[key] ?? { attempts: [] };
  const rankBefore = userRank(store, course);

  const firstPass = store.markPassed(key);
  sound.success();
  if (!firstPass) return false;

  const after = useProgress.getState();
  for (const id of achievementsForPass(key, before, after.streak)) grant(id);

  const rankAfter = userRank(after, course);
  if (rankAfter.title !== rankBefore.title) {
    useToasts.getState().push({
      icon: rankAfter.icon,
      title: `Новый ранг: ${rankAfter.title}`,
      desc: "Он уже на карте курса и в профиле.",
      tone: "rank",
    });
  }
  return true;
}

/** Проверка провалена: ошибка компиляции или несданные тесты. */
export function checkFailed(key: string) {
  useProgress.getState().failCheck(key);
  sound.error();
}

export function runFinished(source: string, stdin: string, run: RunResult) {
  for (const id of achievementsForRun(source, stdin, run)) grant(id);
}

export function duelFinished(result: Verdict) {
  if (result === "excellent") grant("exam_challenger");
}

/** Пасхалка: три быстрых клика по логотипу */
export function phonkDrop() {
  sound.phonk808();
  useToasts.getState().push({
    icon: "🎧",
    title: "PHONK BASS ACTIVATED",
    desc: "Кибер-ядро платформы разогнано до предела.",
    tone: "egg",
  });
}
