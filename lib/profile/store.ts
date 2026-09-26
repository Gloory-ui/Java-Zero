"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { DEFAULT_LOOK } from "./cosmetics";

/** Оформление и данные профиля. Гость меняет оформление локально, аккаунт синхронизирует всё с Supabase */
export type ProfileData = {
  accent: string;
  frame: string;
  banner: string;
  /** Свой баннер и аватар — ссылки на картинки в хранилище Supabase */
  bannerUrl: string | null;
  avatarUrl: string | null;
  /** Выбранный титул; null — показываем ранг */
  title: string | null;
  /** До четырёх достижений на витрине */
  showcase: string[];
  handle: string | null;
  displayName: string | null;
  bio: string;
  isPublic: boolean;
};

export const EMPTY_PROFILE: ProfileData = {
  ...DEFAULT_LOOK,
  bannerUrl: null,
  avatarUrl: null,
  title: null,
  showcase: [],
  handle: null,
  displayName: null,
  bio: "",
  isPublic: false,
};

type State = ProfileData & {
  /** Чей профиль в браузере: id аккаунта или null у гостя — как у прогресса */
  owner: string | null;
  set: (patch: Partial<ProfileData>) => void;
  replace: (data: ProfileData, owner: string | null) => void;
  clearAfterSignOut: () => void;
};

const storage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {}
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {}
  },
};

export const PROFILE_KEY = "java-zero-profile";

export const useProfile = create<State>()(
  persist(
    (set) => ({
      ...EMPTY_PROFILE,
      owner: null,
      set: (patch) => set(patch),
      replace: (data, owner) => set({ ...data, owner }),
      // Оформление гостя после выхода не наследует чужой профиль
      clearAfterSignOut: () => set({ ...EMPTY_PROFILE, owner: null }),
    }),
    {
      name: PROFILE_KEY,
      version: 1,
      storage: createJSONStorage(() => storage),
      skipHydration: true,
      partialize: ({ set: _set, replace: _replace, clearAfterSignOut: _clear, ...data }) => data,
    },
  ),
);

export function profileData(s: ProfileData): ProfileData {
  return {
    accent: s.accent,
    frame: s.frame,
    banner: s.banner,
    bannerUrl: s.bannerUrl,
    avatarUrl: s.avatarUrl,
    title: s.title,
    showcase: s.showcase,
    handle: s.handle,
    displayName: s.displayName,
    bio: s.bio,
    isPublic: s.isPublic,
  };
}

const noop = () => {};

function subscribeHydration(onChange: () => void): () => void {
  const api = useProfile.persist;
  if (!api) return noop;
  const unsub = api.onFinishHydration(onChange);
  if (!api.hasHydrated()) void api.rehydrate();
  return unsub;
}

/** Профиль загружается после монтирования, как прогресс: HTML сервера и клиента должен совпасть */
export function useProfileHydrated(): boolean {
  return useSyncExternalStore(
    subscribeHydration,
    () => useProfile.persist?.hasHydrated() ?? false,
    () => false,
  );
}
