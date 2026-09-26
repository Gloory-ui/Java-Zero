"use client";

import { useEffect, useState } from "react";
import { GroupLevelCard } from "@/components/game/group-level-card";
import { ButtonLink } from "@/components/ui/button";
import type { QuestOutline } from "@/lib/content/outline";
import type { GroupPath } from "@/lib/content/schema";
import { groupPath, isGroupMember, isStagePassed, nextStage, skippedNewStages } from "@/lib/progress/selectors";
import { useProgress, useProgressHydrated } from "@/lib/progress/store";
import { QuestCard } from "./quest-card";

type Props = {
  course: QuestOutline[];
  group: Pick<GroupPath, "invite" | "steps">;
};

type Joined = "joined" | "bad" | null;

/**
 * Раздел «Группа»: вход по ссылке-приглашению /group?join=<код> и путь по шагам — подготовка из общего курса,
 * затем КТ. Кто не в группе, видит только объяснение, как попасть в раздел.
 */
export function GroupMap({ course, group }: Props) {
  const hydrated = useProgressHydrated();
  const progress = useProgress();
  const member = hydrated && isGroupMember(progress, course);
  const [joined, setJoined] = useState<Joined>(null);

  // Код читаем после загрузки прогресса и сразу убираем из адреса: ссылкой без кода можно делиться дальше
  useEffect(() => {
    if (!hydrated) return;
    const code = new URLSearchParams(window.location.search).get("join");
    if (code === null) return;
    window.history.replaceState(null, "", "/group");
    if (code.trim().toLowerCase() === group.invite) {
      if (!member) useProgress.getState().joinGroup();
      setJoined("joined");
    } else if (!member) {
      setJoined("bad");
    }
  }, [hydrated, member, group.invite]);

  if (!hydrated) return null;

  if (!member) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5">
        {joined === "bad" && (
          <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm">
            Ссылка-приглашение не подошла: возможно, код устарел. Попроси свежую ссылку в чате группы.
          </p>
        )}
        <p className="leading-relaxed">
          Этот раздел — для одногруппников: здесь задания контрольных точек из вуза и подготовка к ним по порядку. Чтобы
          открыть раздел, перейди по ссылке-приглашению из чата группы.
        </p>
        <p className="text-sm text-muted">Весь курс Java с нуля открыт и без приглашения.</p>
        <div>
          <ButtonLink href="/course">Открыть курс «Java с нуля»</ButtonLink>
        </div>
      </div>
    );
  }

  const path = groupPath(course);
  const next = nextStage(progress, course, path);
  const skipped = new Set(skippedNewStages(progress, path));
  const byId = new Map(course.map((q) => [q.id, q]));
  const lockedHint = (quest: QuestOutline) => {
    const prev = quest.groupAfter ? byId.get(quest.groupAfter) : undefined;
    return prev && `Откроется после квеста «${prev.title}».`;
  };

  return (
    <div className="flex flex-col gap-8">
      {joined === "joined" && (
        <output className="block rounded-lg border border-success/40 bg-success/10 px-4 py-3 text-sm">
          Готово: ты в группе. Иди по шагам сверху вниз — сначала подготовка, потом сама КТ. Уже сданные этапы
          засчитаны.
        </output>
      )}
      <GroupLevelCard course={course} />
      {next && (
        <div>
          <ButtonLink href={`/learn/${next.questId}/${next.stageId}`} size="lg">
            {path.some((q) => q.stages.some((s) => isStagePassed(progress, q.id, s.id)))
              ? "Продолжить"
              : "Начать с первого шага"}
          </ButtonLink>
        </div>
      )}
      {group.steps.map((step, i) => {
        const kt = byId.get(step.kt);
        if (!kt) return null;
        const quests = [...step.prep, step.kt].flatMap((id) => byId.get(id) ?? []);
        return (
          <section key={step.kt} aria-labelledby={`step-${step.kt}`} className="flex flex-col gap-3">
            <div>
              <p className="font-mono text-xs tracking-widest text-muted uppercase">Шаг {i + 1}</p>
              <h2 id={`step-${step.kt}`} className="font-display text-xl font-semibold">
                {kt.title}
              </h2>
              <p className="text-sm text-muted">
                Сначала {step.prep.length > 1 ? "подготовительные квесты" : "подготовительный квест"}, потом задания КТ.
              </p>
            </div>
            <ol className="flex flex-col gap-4">
              {quests.map((quest) => (
                <QuestCard
                  key={quest.id}
                  heading="h3"
                  quest={quest}
                  course={course}
                  progress={progress}
                  skipped={skipped}
                  lockedHint={lockedHint(quest)}
                />
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
