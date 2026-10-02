"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Markdown } from "@/components/markdown";
import { Button, ButtonLink } from "@/components/ui/button";
import { useAccount } from "@/lib/account/store";
import { type QuestOutline, withGroupTitles } from "@/lib/content/outline";
import { fetchGroupStage, GroupFetchError, useGroupAccess, useGroupTitles } from "@/lib/group/access";
import type { GroupStagePayload } from "@/lib/group/types";
import { isGroupMember } from "@/lib/progress/selectors";
import { useProgress, useProgressHydrated } from "@/lib/progress/store";
import { Lab } from "./lab";

type Props = {
  /** Публичное оглавление: у заданий КТ в нём нет названий */
  course: QuestOutline[];
  questId: string;
  stageId: string;
  badge: string;
};

type Loaded =
  | { kind: "loading" }
  | { kind: "ready"; payload: GroupStagePayload }
  | { kind: "error"; status: number; message: string };

function Screen({ badge, title, children }: { badge: string; title: string; children: ReactNode }) {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-4">
      <p className="font-mono text-xs tracking-widest text-gold uppercase">{badge}</p>
      <h1 className="font-display text-2xl font-semibold">{title}</h1>
      {children}
    </main>
  );
}

/**
 * Задание КТ. В HTML страницы его нет: участник группы получает теорию, код и тесты с сервера
 * (/api/group/stage), остальные видят, как попасть в раздел «Группа».
 */
export function GroupStage({ course: publicCourse, questId, stageId, badge }: Props) {
  const hydrated = useProgressHydrated();
  const member = useProgress(isGroupMember) && hydrated;
  const account = useAccount((s) => s.status);
  const access = useGroupAccess((s) => s.status);
  const titles = useGroupTitles(member);
  const course = useMemo(() => withGroupTitles(publicCourse, titles), [publicCourse, titles]);
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: attempt — повторная загрузка по кнопке «Попробовать ещё раз»
  useEffect(() => {
    if (!member) return;
    const controller = new AbortController();
    setLoaded({ kind: "loading" });
    fetchGroupStage(questId, stageId, controller.signal)
      .then((payload) => setLoaded({ kind: "ready", payload }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof GroupFetchError) {
          // Сервер не считает студента участником: доступ забрали — прячем КТ и в остальном интерфейсе
          if (error.status === 403) useProgress.getState().setGroupMember(false);
          setLoaded({ kind: "error", status: error.status, message: error.message });
        } else {
          setLoaded({ kind: "error", status: 0, message: "Нет связи с сервером." });
        }
      });
    return () => controller.abort();
  }, [member, questId, stageId, attempt]);

  const checking = !hydrated || account === "loading" || (account === "signed-in" && access === "checking");

  if (!member && checking) {
    return (
      <Screen badge={badge} title="Задание КТ">
        <p className="text-muted" aria-busy="true">
          Проверяем доступ к разделу «Группа»…
        </p>
      </Screen>
    );
  }

  if (!member) {
    return (
      <Screen badge={badge} title="Задание для одногруппников">
        <p className="text-muted">
          Это задание из раздела «Группа»: там контрольные точки из вуза. Раздел открывается по ссылке-приглашению из
          чата группы{account === "signed-in" ? "." : " — после входа в аккаунт."}
        </p>
        <div className="flex flex-wrap gap-3">
          {account === "signed-out" ? (
            <ButtonLink href="/login?next=/group">Войти в аккаунт</ButtonLink>
          ) : (
            <ButtonLink href="/course">Курс «Java с нуля»</ButtonLink>
          )}
          <ButtonLink href="/group" variant="secondary">
            О разделе «Группа»
          </ButtonLink>
        </div>
      </Screen>
    );
  }

  if (loaded.kind === "loading") {
    return (
      <Screen badge={badge} title="Задание КТ">
        <p className="text-muted" aria-busy="true">
          Загружаем задание…
        </p>
      </Screen>
    );
  }

  if (loaded.kind === "error") {
    return (
      <Screen badge={badge} title={loaded.status === 401 ? "Нужно войти ещё раз" : "Задание не загрузилось"}>
        <p role="alert" className="text-muted">
          {loaded.message}
        </p>
        <div className="flex flex-wrap gap-3">
          {loaded.status === 401 ? (
            <ButtonLink href={`/login?next=/learn/${questId}/${stageId}`}>Войти</ButtonLink>
          ) : (
            <Button onClick={() => setAttempt((n) => n + 1)}>Попробовать ещё раз</Button>
          )}
          <ButtonLink href="/group" variant="secondary">
            Раздел «Группа»
          </ButtonLink>
        </div>
      </Screen>
    );
  }

  const { payload } = loaded;
  return (
    <Lab
      key={`${payload.questId}/${payload.stage.id}`}
      course={course}
      questId={payload.questId}
      stageIndex={payload.stageIndex}
      stage={payload.stage}
      theory={
        <article>
          <p className="mb-2 font-mono text-xs tracking-widest text-gold uppercase">{payload.stage.badge}</p>
          <Markdown>{payload.theory}</Markdown>
        </article>
      }
      pitfalls={<Markdown>{payload.pitfalls}</Markdown>}
    />
  );
}
