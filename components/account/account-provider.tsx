"use client";

import { useEffect } from "react";
import { startAccount } from "@/lib/account/session";

/** Поднимает сессию Supabase и синхронизацию прогресса. Без настроек Supabase ничего не делает. */
export function AccountProvider() {
  useEffect(() => {
    void startAccount();
  }, []);
  return null;
}
