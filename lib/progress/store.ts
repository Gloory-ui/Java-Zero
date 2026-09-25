"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { readLegacyProgress } from "./legacy";
import {
  codeHash,
  type DailyMetric,
  type DailyState,
  EMPTY_PROGRESS,
  type GameStats,
  MAX_ATTEMPTS_KEPT,
  type Persona,
  type ProgressData,
  type StageProgress,
} from "./types";

type Ownership = {
  /**
   * Чей прогресс лежит в браузере: id аккаунта или null, если это прогресс гостя.
   * Без этой отметки прогресс вышедшего аккаунта считался гостевым и копировался в следующий аккаунт.
   */
  owner: string | null;
  /** Прогресс перенесён со старой системы наград: один раз показать, сколько опыта начислено */
  upgradeNotice?: boolean;
};

type Actions = {
  openStage: (key: string) => void;
  saveCode: (key: string, code: string) => void;
  /** Запоминает вариант кода; возвращает число разных попыток */
  recordAttempt: (key: string, code: string) => number;
  /** true — этап сдан впервые; xp фиксируется у этапа */
  markPassed: (key: string, xp: number) => boolean;
  /** Проваленная проверка: серия без ошибок обнуляется, у этапа растёт счётчик провалов */
  failCheck: (key: string) => void;
  markHint: (key: string) => void;
  /** true — шпора открыта впервые на этапе (серия сбрасывается) */
  takeCheat: (key: string) => boolean;
  viewSolution: (key: string) => void;
  /** Открывает достижения, которых ещё нет; возвращает открытые сейчас */
  unlockAchievements: (ids: string[]) => string[];
  /** Начало дня: квесты дня выбраны, счётчики с нуля */
  startDay: (day: string, quests: string[]) => void;
  /** События дня. seen — ключ разового события: второй раз за день не засчитывается */
  bumpDaily: (metrics: DailyMetric[], seen?: string) => void;
  addStats: (delta: GameStats) => void;
  completeDaily: (done: Record<string, { at: number; xp: number }>) => void;
  dismissUpgradeNotice: () => void;
  setPersona: (persona: Persona) => void;
  setSound: (on: boolean) => void;
  replace: (data: ProgressData) => void;
  setOwner: (owner: string | null) => void;
  /** Выход из аккаунта: прогресс аккаунта остаётся в облаке, браузер снова «чистый гость». Звук — настройка устройства */
  clearAfterSignOut: () => void;
  resetQuest: (questId: string) => void;
};

export const STORAGE_KEY = "java-zero-progress";
export const STORAGE_VERSION = 2;

/**
 * Версия 1 → 2: серия этапов без ошибок переименована в cleanRun, появились квесты дня и счётчики.
 * Опыт сданных этапов досчитывается по их флагам, достижения — при первой загрузке (GameBootstrap).
 */
export function migrateProgress(persisted: unknown, version: number): unknown {
  if (version >= 2 || typeof persisted !== "object" || persisted === null) return persisted;
  const { streak, ...rest } = persisted as { streak?: unknown; stages?: Record<string, StageProgress> };
  const passedAny = Object.values(rest.stages ?? {}).some((s) => s.passedAt);
  return {
    ...rest,
    cleanRun: typeof streak === "number" ? streak : 0,
    dailyDone: {},
    stats: {},
    ...(passedAny ? { upgradeNotice: true } : {}),
  };
}

const touch = (s: ProgressData, key: string): StageProgress => s.stages[key] ?? { attempts: [] };

/**
 * localStorage с разовым переносом прогресса старого сайта: если нового ключа ещё нет, а старые java_zero_* есть,
 * они переводятся в новую схему и сразу сохраняются. В приватном режиме хранилище может бросать ошибки — тогда
 * прогресс живёт только до перезагрузки.
 */
const storage: StateStorage = {
  getItem(name) {
    try {
      const current = localStorage.getItem(name);
      if (current !== null) return current;
      const legacy = readLegacyProgress((key) => localStorage.getItem(key));
      if (!legacy) return null;
      const upgradeNotice = Object.values(legacy.stages).some((st) => st.passedAt);
      const migrated = JSON.stringify({ state: { ...legacy, upgradeNotice }, version: STORAGE_VERSION });
      localStorage.setItem(name, migrated);
      return migrated;
    } catch {
      return null;
    }
  },
  setItem(name, value) {
    try {
      localStorage.setItem(name, value);
    } catch {
      // Хранилище переполнено или запрещено: прогресс останется в памяти вкладки
    }
  },
  removeItem(name) {
    try {
      localStorage.removeItem(name);
    } catch {}
  },
};

export const useProgress = create<ProgressData & Ownership & Actions>()(
  persist(
    (set, get) => ({
      ...EMPTY_PROGRESS,
      owner: null,

      openStage: (key) =>
        set((s) => ({
          lastStage: key,
          stages: { ...s.stages, [key]: { ...touch(s, key), startedAt: touch(s, key).startedAt ?? Date.now() } },
        })),

      saveCode: (key, code) => set((s) => ({ stages: { ...s.stages, [key]: { ...touch(s, key), code } } })),

      recordAttempt: (key, code) => {
        const stage = touch(get(), key);
        const hash = codeHash(code);
        const attempts = stage.attempts.includes(hash)
          ? stage.attempts
          : [...stage.attempts, hash].slice(-MAX_ATTEMPTS_KEPT);
        set((s) => ({ stages: { ...s.stages, [key]: { ...stage, attempts } } }));
        return attempts.length;
      },

      // Серия растёт только за первую сдачу этапа: перепроверка сданного не должна её накручивать
      markPassed: (key, xp) => {
        const stage = touch(get(), key);
        if (stage.passedAt) return false;
        set((s) => ({
          cleanRun: s.cleanRun + 1,
          stages: { ...s.stages, [key]: { ...stage, passedAt: Date.now(), xp } },
        }));
        return true;
      },

      failCheck: (key) =>
        set((s) => {
          const stage = touch(s, key);
          return { cleanRun: 0, stages: { ...s.stages, [key]: { ...stage, fails: (stage.fails ?? 0) + 1 } } };
        }),

      markHint: (key) => set((s) => ({ stages: { ...s.stages, [key]: { ...touch(s, key), hintUsed: true } } })),

      takeCheat: (key) => {
        const stage = touch(get(), key);
        if (stage.cheatUsed) return false;
        set((s) => ({ cleanRun: 0, stages: { ...s.stages, [key]: { ...stage, cheatUsed: true } } }));
        return true;
      },

      viewSolution: (key) =>
        set((s) => ({ stages: { ...s.stages, [key]: { ...touch(s, key), solutionViewed: true } } })),

      unlockAchievements: (ids) => {
        const fresh = [...new Set(ids)].filter((id) => !get().achievements[id]);
        if (fresh.length === 0) return [];
        const now = Date.now();
        set((s) => ({ achievements: { ...s.achievements, ...Object.fromEntries(fresh.map((id) => [id, now])) } }));
        return fresh;
      },

      startDay: (day, quests) => set({ daily: { day, quests, counters: {}, seen: [] } }),

      bumpDaily: (metrics, seen) =>
        set((s) => {
          const daily = s.daily;
          if (!daily || (seen && daily.seen.includes(seen))) return {};
          const counters = { ...daily.counters };
          for (const m of metrics) counters[m] = (counters[m] ?? 0) + 1;
          const next: DailyState = { ...daily, counters, seen: seen ? [...daily.seen, seen] : daily.seen };
          return { daily: next };
        }),

      addStats: (delta) =>
        set((s) => {
          const stats = { ...s.stats };
          for (const [k, v] of Object.entries(delta) as [keyof GameStats, number][]) stats[k] = (stats[k] ?? 0) + v;
          return { stats };
        }),

      completeDaily: (done) => set((s) => ({ dailyDone: { ...s.dailyDone, ...done } })),

      dismissUpgradeNotice: () => set({ upgradeNotice: false }),

      setPersona: (persona) => set({ persona }),
      setSound: (sound) => set({ sound }),
      // lastStage и daily задаём явно: set сливает объекты, и без этого остались бы данные предыдущего аккаунта
      replace: (data) => set({ ...data, lastStage: data.lastStage, daily: data.daily }),
      setOwner: (owner) => set({ owner }),
      clearAfterSignOut: () =>
        set((s) => ({
          stages: {},
          cleanRun: 0,
          achievements: {},
          dailyDone: {},
          stats: {},
          daily: undefined,
          upgradeNotice: false,
          persona: EMPTY_PROGRESS.persona,
          sound: s.sound,
          lastStage: undefined,
          owner: null,
        })),

      resetQuest: (questId) =>
        set((s) => ({
          stages: Object.fromEntries(Object.entries(s.stages).filter(([key]) => !key.startsWith(`${questId}/`))),
        })),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => storage),
      migrate: migrateProgress,
      // Прогресс живёт в браузере: подтягиваем его после монтирования, иначе HTML сервера и клиента разойдутся
      skipHydration: true,
      partialize: (s) => ({
        stages: s.stages,
        cleanRun: s.cleanRun,
        achievements: s.achievements,
        dailyDone: s.dailyDone,
        stats: s.stats,
        daily: s.daily,
        persona: s.persona,
        sound: s.sound,
        lastStage: s.lastStage,
        owner: s.owner,
        upgradeNotice: s.upgradeNotice,
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
