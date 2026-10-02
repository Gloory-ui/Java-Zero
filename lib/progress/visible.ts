"use client";

import { useMemo } from "react";
import type { QuestOutline } from "@/lib/content/outline";
import { coursePath, isGroupMember } from "./selectors";
import { useProgress, useProgressHydrated } from "./store";

/** Участник ли группы этот аккаунт (по ответу сервера). До загрузки прогресса — нет: так HTML сервера и клиента совпадают */
export function useGroupMember(): boolean {
  const hydrated = useProgressHydrated();
  const member = useProgress(isGroupMember);
  return hydrated && member;
}

/**
 * Курс, который видит студент: участник группы — весь, остальные — без КТ. Массив мемоизирован:
 * каталог достижений кэшируется по объекту курса.
 */
export function useVisibleCourse(course: QuestOutline[]): QuestOutline[] {
  const member = useGroupMember();
  return useMemo(() => (member ? course : coursePath(course)), [member, course]);
}
