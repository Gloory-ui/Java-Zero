"use client";

import { useEffect } from "react";
import type { QuestOutline } from "@/lib/content/outline";
import { bootstrapGame, registerCourse } from "@/lib/game/events";
import { useProgress, useProgressHydrated } from "@/lib/progress/store";
import { Celebration } from "./celebration";

/**
 * Подключает игровую систему на всех страницах: регистрирует курс для проверки достижений и после загрузки
 * прогресса (и после входа в аккаунт) тихо выдаёт уже заслуженные награды.
 */
export function GameBootstrap({ course }: { course: QuestOutline[] }) {
  const hydrated = useProgressHydrated();
  const owner = useProgress((s) => s.owner);

  registerCourse(course);

  // biome-ignore lint/correctness/useExhaustiveDependencies: пересчёт нужен и после входа в аккаунт, когда меняется owner
  useEffect(() => {
    if (hydrated) bootstrapGame();
  }, [hydrated, owner]);

  return <Celebration />;
}
