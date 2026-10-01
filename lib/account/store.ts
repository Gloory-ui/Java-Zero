"use client";

import { create } from "zustand";
import { accountsEnabled } from "@/lib/supabase/config";

export type AccountUser = {
  id: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
  /** Когда создан аккаунт: «С сентября 2026» в профиле */
  createdAt: string | null;
};

export type AccountState = {
  /** disabled — Supabase не настроен, сайт работает только с локальным прогрессом */
  status: "disabled" | "loading" | "signed-out" | "signed-in";
  user: AccountUser | null;
  sync: "idle" | "syncing" | "synced" | "error";
  syncedAt?: number;
  error?: string;
};

export const useAccount = create<AccountState>(() => ({
  status: accountsEnabled ? "loading" : "disabled",
  user: null,
  sync: "idle",
}));
