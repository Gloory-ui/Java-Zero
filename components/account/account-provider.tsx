"use client";

import { useEffect } from "react";
import { startAccount } from "@/lib/account/session";
import { startGroupAccess } from "@/lib/group/access";

/** Поднимает сессию Supabase, синхронизацию прогресса и проверку членства в группе. Без настроек Supabase ничего не делает. */
export function AccountProvider() {
  useEffect(() => {
    startGroupAccess();
    void startAccount();
  }, []);
  return null;
}
