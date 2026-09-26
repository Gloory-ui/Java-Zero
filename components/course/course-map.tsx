"use client";

import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { QuestOutline } from "@/lib/content/outline";
import { plural, STAGES } from "@/lib/plural";
import { coursePath, isGroupMember, nextStage, skippedNewStages } from "@/lib/progress/selectors";
import { useProgress, useProgressHydrated } from "@/lib/progress/store";
import { EMPTY_PROGRESS } from "@/lib/progress/types";
import { QuestCard } from "./quest-card";

/** Карта общего курса «Java с нуля»: квесты по порядку и кнопка «Продолжить». КТ здесь нет — они в разделе «Группа». */
export function CourseMap({ course }: { course: QuestOutline[] }) {
  const hydrated = useProgressHydrated();
  const stored = useProgress();
  // До загрузки прогресса показываем курс «с нуля», чтобы HTML сервера и клиента совпал
  const progress = hydrated ? stored : EMPTY_PROGRESS;
  const path = coursePath(course);
  const next = nextStage(progress, course, path);
  // «Новый» — только этапы, добавленные позади студента: для новичка новое всё
  const skipped = new Set(skippedNewStages(progress, path));
  const member = isGroupMember(progress, course);

  return (
    <div className="flex flex-col gap-8">
      {member && (
        <Link
          href="/group"
          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm hover:bg-card"
        >
          <span>
            <span className="font-semibold">Раздел «Группа»</span>
            <span className="text-muted"> — контрольные точки и подготовка к ним по порядку</span>
          </span>
          <Icon name="arrow-right" className="size-4 shrink-0 text-accent" />
        </Link>
      )}
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
        {path.map((quest) => {
          const unlockAfter = course.find((q) => q.id === quest.unlockAfter);
          return (
            <QuestCard
              key={quest.id}
              quest={quest}
              course={course}
              progress={progress}
              skipped={skipped}
              lockedHint={unlockAfter && `Откроется после квеста «${unlockAfter.title}».`}
            />
          );
        })}
      </ol>
    </div>
  );
}
