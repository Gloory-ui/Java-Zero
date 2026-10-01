"use client";

import { useMemo } from "react";
import type { QuestOutline } from "@/lib/content/outline";
import { coursePath, isGroupMember } from "./selectors";
import { useProgress, useProgressHydrated } from "./store";

/** Участник ли группы этот браузер. До загрузки прогресса — нет: так HTML сервера и клиента совпадают */
export function useGroupMember(course: QuestOutline[]): boolean {
  const hydrated = useProgressHydrated();
  const member = useProgress((s) => isGroupMember(s, course));
  return hydrated && member;
}

/**
 * Курс, который видит студент: участник группы — весь, остальные — без КТ. Массив мемоизирован:
 * каталог достижений кэшируется по объекту курса.
 */
export function useVisibleCourse(course: QuestOutline[]): QuestOutline[] {
  const member = useGroupMember(course);
  return useMemo(() => (member ? course : coursePath(course)), [member, course]);
}
