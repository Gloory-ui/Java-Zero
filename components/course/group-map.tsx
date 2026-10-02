"use client";

import { useEffect, useMemo } from "react";
import { GroupLevelCard } from "@/components/game/group-level-card";
import { ButtonLink } from "@/components/ui/button";
import { useAccount } from "@/lib/account/store";
import { type QuestOutline, withGroupTitles } from "@/lib/content/outline";
import type { GroupPath } from "@/lib/content/schema";
import { joinWithCode, useGroupAccess, useGroupTitles } from "@/lib/group/access";
import { groupPath, isGroupMember, isStagePassed, nextStage, skippedNewStages } from "@/lib/progress/selectors";
import { useProgress, useProgressHydrated } from "@/lib/progress/store";
import { QuestCard } from "./quest-card";

type Props = {
  course: QuestOutline[];
  steps: GroupPath["steps"];
};

/**
 * Раздел «Группа»: вход по ссылке-приглашению /group?join=<код> и путь по шагам — подготовка из общего курса,
 * затем КТ. Кто в группе, решает сервер: нужен аккаунт и ссылка из чата группы (или доступ от админа).
 */
export function GroupMap({ course: publicCourse, steps }: Props) {
  const hydrated = useProgressHydrated();
  const progress = useProgress();
  const member = hydrated && isGroupMember(progress);
  const account = useAccount((s) => s.status);
  const { status, pendingJoin, join } = useGroupAccess();
  const titles = useGroupTitles(member);
  const course = useMemo(() => withGroupTitles(publicCourse, titles), [publicCourse, titles]);

  // Код сразу убираем из адреса: ссылкой без кода можно делиться дальше. Проверяет его сервер
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("join");
    if (code === null) return;
    window.history.replaceState(null, "", "/group");
    void joinWithCode(code);
  }, []);

  if (!hydrated) return null;

  if (!member) {
    const checking = account === "loading" || (account === "signed-in" && status !== "ready" && status !== "error");
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5" aria-busy={checking}>
        {join === "bad" && (
          <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm">
            Ссылка-приглашение не подошла: возможно, код устарел. Попроси свежую ссылку в чате группы.
          </p>
        )}
        {join === "error" && (
          <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm">
            Не удалось проверить приглашение: нет связи с сервером. Открой ссылку ещё раз чуть позже.
          </p>
        )}
        {checking ? (
          <p className="text-muted">Проверяем доступ к разделу…</p>
        ) : account === "signed-in" ? (
          <p className="leading-relaxed">
            Этот раздел — для одногруппников: здесь задания контрольных точек из вуза и подготовка к ним по порядку.
            Чтобы открыть раздел, перейди по ссылке-приглашению из чата группы.
          </p>
        ) : account === "disabled" ? (
          <p className="leading-relaxed">
            Этот раздел — для одногруппников, а на этой версии сайта нет аккаунтов, поэтому раздел здесь закрыт.
          </p>
        ) : (
          <>
            <p className="leading-relaxed">
              {pendingJoin
                ? "Приглашение принято. Войди в аккаунт или зарегистрируйся — и раздел группы откроется."
                : "Этот раздел — для одногруппников: здесь задания контрольных точек из вуза и подготовка к ним по порядку. Войди в аккаунт и открой ссылку-приглашение из чата группы."}
            </p>
            <div>
              <ButtonLink href="/login?next=/group">Войти в аккаунт</ButtonLink>
            </div>
          </>
        )}
        <p className="text-sm text-muted">Весь курс Java с нуля открыт и без приглашения.</p>
        <div>
          <ButtonLink href="/course" variant="secondary">
            Открыть курс «Java с нуля»
          </ButtonLink>
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
      {join === "joined" && (
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
      {steps.map((step, i) => {
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
