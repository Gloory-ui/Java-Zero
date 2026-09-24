"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type Persona = "chill" | "dushny" | "bigtech";

export type StageProgress = {
  /** Последний код студента */
  code?: string;
  /** Хэши разных вариантов кода, которые студент запускал (не больше 20) */
  attempts: string[];
  startedAt?: number;
  passedAt?: number;
  hintUsed?: boolean;
  /** Шпора старосты: одноразовый джокер на этап */
  cheatUsed?: boolean;
  solutionViewed?: boolean;
};

export type ProgressData = {
  stages: Record<string, StageProgress>;
  /** Серия сданных подряд этапов без проваленных проверок */
  streak: number;
  /** id ачивки → когда открыта */
  achievements: Record<string, number>;
  persona: Persona;
  sound: boolean;
  lastStage?: string;
};

type Actions = {
  openStage: (key: string) => void;
  saveCode: (key: string, code: string) => void;
  /** Запоминает вариант кода; возвращает число разных попыток */
  recordAttempt: (key: string, code: string) => number;
  markPassed: (key: string) => void;
  failCheck: () => void;
  markHint: (key: string) => void;
  /** true — шпора открыта впервые на этапе (стрик сбрасывается) */
  takeCheat: (key: string) => boolean;
  viewSolution: (key: string) => void;
  /** true — ачивка открыта впервые */
  unlockAchievement: (id: string) => boolean;
  setPersona: (persona: Persona) => void;
  setSound: (on: boolean) => void;
  replace: (data: ProgressData) => void;
  resetQuest: (questId: string) => void;
};

export const stageKey = (questId: string, stageId: string) => `${questId}/${stageId}`;

export const EMPTY_PROGRESS: ProgressData = { stages: {}, streak: 0, achievements: {}, persona: "chill", sound: true };

/** Лимит попыток, после которых открывается эталонное решение */
export const SOLUTION_UNLOCK_ATTEMPTS = 5;

function hashCode(code: string): string {
  const normalized = code.replace(/\s+/g, " ").trim();
  let h = 5381;
  for (let i = 0; i < normalized.length; i++) h = ((h << 5) + h + normalized.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

const touch = (s: ProgressData, key: string): StageProgress => s.stages[key] ?? { attempts: [] };

export const useProgress = create<ProgressData & Actions>()(
  persist(
    (set, get) => ({
      ...EMPTY_PROGRESS,

      openStage: (key) =>
        set((s) => ({
          lastStage: key,
          stages: { ...s.stages, [key]: { ...touch(s, key), startedAt: touch(s, key).startedAt ?? Date.now() } },
        })),

      saveCode: (key, code) => set((s) => ({ stages: { ...s.stages, [key]: { ...touch(s, key), code } } })),

      recordAttempt: (key, code) => {
        const stage = touch(get(), key);
        const hash = hashCode(code);
        const attempts = stage.attempts.includes(hash) ? stage.attempts : [...stage.attempts, hash].slice(-20);
        set((s) => ({ stages: { ...s.stages, [key]: { ...stage, attempts } } }));
        return attempts.length;
      },

      // Серия растёт только за первую сдачу этапа: перепроверка сданного не должна её накручивать
      markPassed: (key) =>
        set((s) => {
          const stage = touch(s, key);
          if (stage.passedAt) return {};
          return { streak: s.streak + 1, stages: { ...s.stages, [key]: { ...stage, passedAt: Date.now() } } };
        }),

      failCheck: () => set({ streak: 0 }),

      markHint: (key) => set((s) => ({ stages: { ...s.stages, [key]: { ...touch(s, key), hintUsed: true } } })),

      takeCheat: (key) => {
        const stage = touch(get(), key);
        if (stage.cheatUsed) return false;
        set((s) => ({ streak: 0, stages: { ...s.stages, [key]: { ...stage, cheatUsed: true } } }));
        return true;
      },

      viewSolution: (key) =>
        set((s) => ({ stages: { ...s.stages, [key]: { ...touch(s, key), solutionViewed: true } } })),

      unlockAchievement: (id) => {
        if (get().achievements[id]) return false;
        set((s) => ({ achievements: { ...s.achievements, [id]: Date.now() } }));
        return true;
      },

      setPersona: (persona) => set({ persona }),
      setSound: (sound) => set({ sound }),
      replace: (data) => set(data),

      resetQuest: (questId) =>
        set((s) => ({
          stages: Object.fromEntries(Object.entries(s.stages).filter(([key]) => !key.startsWith(`${questId}/`))),
        })),
    }),
    {
      name: "java-zero-progress",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Прогресс живёт в браузере: подтягиваем его после монтирования, иначе HTML сервера и клиента разойдутся
      skipHydration: true,
      partialize: ({ stages, streak, achievements, persona, sound, lastStage }) => ({
        stages,
        streak,
        achievements,
        persona,
        sound,
        lastStage,
      }),
    },
  ),
);

const noop = () => {};

function subscribeHydration(onChange: () => void): () => void {
  const api = useProgress.persist;
  if (!api) return noop;
  const unsub = api.onFinishHydration(onChange);
  if (!api.hasHydrated()) void api.rehydrate();
  return unsub;
}

/**
 * true, когда прогресс из localStorage загружен; до этого компоненты показывают нейтральное состояние.
 * На сервере localStorage нет и zustand не подключает persist, поэтому там всегда false.
 */
export function useProgressHydrated(): boolean {
  return useSyncExternalStore(
    subscribeHydration,
    () => useProgress.persist?.hasHydrated() ?? false,
    () => false,
  );
}
