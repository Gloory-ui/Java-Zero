"use client";

import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { QuestOutline } from "@/lib/content/outline";
import { plural, STAGES } from "@/lib/plural";
import {
  isQuestUnlocked,
  isStagePassed,
  isStageUnlocked,
  nextStage,
  questProgress,
  skippedNewStages,
} from "@/lib/progress/selectors";
import { useProgress, useProgressHydrated } from "@/lib/progress/store";
import { EMPTY_PROGRESS, stageKey } from "@/lib/progress/types";

/** Карта курса: квесты по порядку, этапы с отметками «сдан / открыт / закрыт» и кнопка «Продолжить». */
export function CourseMap({ course }: { course: QuestOutline[] }) {
  const hydrated = useProgressHydrated();
  const stored = useProgress();
  // До загрузки прогресса показываем курс «с нуля», чтобы HTML сервера и клиента совпал
  const progress = hydrated ? stored : EMPTY_PROGRESS;
  const next = nextStage(progress, course);
  // «Новый» — только этапы, добавленные позади студента: для новичка новое всё
  const skipped = new Set(skippedNewStages(progress, course));

  return (
    <div className="flex flex-col gap-8">
      {skipped.size > 0 && (
        <p className="rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm leading-relaxed">
          В курсе появились новые этапы: {plural(skipped.size, STAGES)} с пометкой «новый» стоят раньше того, что ты уже
          сдал. Они объясняют темы, которые курс раньше пропускал. Пройди их, когда будет время: сданное остаётся
          сданным.
        </p>
      )}
      {next && (
        <div>
          <ButtonLink href={`/learn/${next.questId}/${next.stageId}`} size="lg">
            {Object.keys(progress.stages).length > 0 ? "Продолжить" : "Начать с первого этапа"}
          </ButtonLink>
        </div>
      )}
      <ol className="flex flex-col gap-4">
        {course.map((quest) => {
          const open = isQuestUnlocked(progress, course, quest);
          const { passed, total, percent } = questProgress(progress, quest);
          const unlockAfter = course.find((q) => q.id === quest.unlockAfter);
          return (
            <li
              key={quest.id}
              className={cn(
                "rounded-lg border bg-surface p-4 sm:p-5",
                open ? "border-border" : "border-dashed border-border-strong",
              )}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="flex items-center gap-2 font-mono text-xs tracking-widest text-muted uppercase">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: quest.rank.color }}
                      aria-hidden="true"
                    />
                    {quest.num} · {open ? `${passed} из ${total}` : "закрыт"}
                  </p>
                  <h2 className="mt-1 font-display text-lg font-semibold">{quest.title}</h2>
                  <p className="text-sm text-muted">{quest.subtitle}</p>
                  {!open && unlockAfter && (
                    <p className="mt-1 text-sm text-muted">Откроется после квеста «{unlockAfter.title}».</p>
                  )}
                </div>
                <span className="text-sm text-muted" title="Ранг за прохождение квеста">
                  <span className={cn(!open && "grayscale")} aria-hidden="true">
                    {open ? quest.rank.icon : "🔒"}
                  </span>{" "}
                  {quest.rank.title}
                </span>
              </div>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-card" aria-hidden="true">
                <div
                  className="h-full origin-left rounded-full motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-snappy"
                  style={{ transform: `scaleX(${percent / 100})`, backgroundColor: quest.rank.color }}
                />
              </div>
              <ol className="mt-4 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {quest.stages.map((stage, index) => {
                  const done = isStagePassed(progress, quest.id, stage.id);
                  const unlocked = isStageUnlocked(progress, course, quest, index);
                  const label = (
                    <>
                      <span
                        aria-hidden="true"
                        className={cn(
                          "font-mono text-xs",
                          done ? "text-success" : unlocked ? "text-accent" : "text-muted",
                        )}
                      >
                        {done ? "✓" : unlocked ? "→" : "·"}
                      </span>
                      <span className="min-w-0 truncate">{stage.title}</span>
                      {skipped.has(stageKey(quest.id, stage.id)) && (
                        <span className="shrink-0 rounded-full border border-gold/50 bg-gold/10 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-text uppercase">
                          новый
                        </span>
                      )}
                      <span className="sr-only">{done ? "(сдан)" : unlocked ? "(открыт)" : "(закрыт)"}</span>
                    </>
                  );
                  return (
                    <li key={stage.id}>
                      {unlocked ? (
                        <Link
                          href={`/learn/${quest.id}/${stage.id}`}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-card"
                        >
                          {label}
                        </Link>
                      ) : (
                        <span className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted">{label}</span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
