"use client";

import { ButtonLink } from "@/components/ui/button";
import type { QuestOutline } from "@/lib/content/outline";
import { nextStage, pathFor, pathQuests } from "@/lib/progress/selectors";
import { useProgress, useProgressHydrated } from "@/lib/progress/store";

/**
 * Главная кнопка: новичка ведёт на первый этап, вернувшегося — на первый несданный.
 * Участника группы ведёт по пути группы, остальных — по общему курсу.
 */
export function StartButton({ course }: { course: QuestOutline[] }) {
  const hydrated = useProgressHydrated();
  const stages = useProgress((s) => s.stages);
  const stats = useProgress((s) => s.stats);
  const progress = { stages, stats };
  const path = pathQuests(course, hydrated ? pathFor(progress, course) : "course");
  const first = path[0];
  const started = hydrated && Object.keys(stages).length > 0;
  const next = hydrated ? nextStage(progress, course, path) : null;
  const target = next ?? { questId: first.id, stageId: first.stages[0].id };
  const title = course.find((q) => q.id === target.questId)?.stages.find((s) => s.id === target.stageId)?.title;

  if (started && !next) {
    return (
      <ButtonLink href="/profile" size="lg">
        Курс пройден: открыть профиль
      </ButtonLink>
    );
  }
  return (
    <ButtonLink href={`/learn/${target.questId}/${target.stageId}`} size="lg" title={title}>
      {started ? "Продолжить с того же места" : "Начать первый этап"}
    </ButtonLink>
  );
}
