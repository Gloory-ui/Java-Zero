"use client";

import { useState } from "react";
import { Avatar } from "@/components/account/account-menu";
import { Button, ButtonLink } from "@/components/ui/button";
import { signOut } from "@/lib/account/actions";
import { useAccount } from "@/lib/account/store";
import { PERSONA_INFO } from "@/lib/ai/personas";
import { cn } from "@/lib/cn";
import type { QuestOutline } from "@/lib/content/outline";
import { ACHIEVEMENTS } from "@/lib/game/achievements";
import { STARTER_RANK, STREAK_RANK, STREAK_RANK_AT, userRank } from "@/lib/game/ranks";
import { isQuestCompleted, questProgress } from "@/lib/progress/selectors";
import { useProgress, useProgressHydrated } from "@/lib/progress/store";
import { EMPTY_PROGRESS } from "@/lib/progress/types";

const dateFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function AccountCard() {
  const status = useAccount((s) => s.status);
  const user = useAccount((s) => s.user);
  const sync = useAccount((s) => s.sync);
  const error = useAccount((s) => s.error);
  const [leaving, setLeaving] = useState(false);

  if (status === "disabled") {
    return <p className="text-sm text-muted">Прогресс хранится в этом браузере.</p>;
  }
  if (status !== "signed-in" || !user) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-4">
        <p className="min-w-0 flex-1 text-sm text-muted">
          Прогресс хранится только в этом браузере. Войди, чтобы не потерять его и продолжить на другом устройстве.
        </p>
        <ButtonLink href="/login?next=/profile">Войти</ButtonLink>
      </div>
    );
  }

  const syncText =
    sync === "syncing"
      ? "Сохраняем прогресс в аккаунт…"
      : sync === "error"
        ? `Не удалось сохранить в аккаунт: ${error ?? "ошибка сети"}. Прогресс в браузере цел, повторим при следующем изменении.`
        : "Прогресс сохранён в аккаунте.";

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-4">
      <p className={cn("min-w-0 flex-1 text-sm", sync === "error" ? "text-danger" : "text-muted")} aria-live="polite">
        {user.email && <span className="block text-text">{user.email}</span>}
        {syncText}
      </p>
      <Button
        variant="secondary"
        disabled={leaving}
        onClick={async () => {
          setLeaving(true);
          try {
            await signOut();
          } finally {
            setLeaving(false);
          }
        }}
      >
        {leaving ? "Выходим…" : "Выйти"}
      </Button>
    </div>
  );
}

export function ProfileView({ course }: { course: QuestOutline[] }) {
  const hydrated = useProgressHydrated();
  const stored = useProgress();
  const progress = hydrated ? stored : EMPTY_PROGRESS;
  const user = useAccount((s) => s.user);
  const [confirmReset, setConfirmReset] = useState<string | null>(null);

  const rank = userRank(progress, course);
  const stagesTotal = course.reduce((sum, q) => sum + q.stages.length, 0);
  const stagesPassed = Object.values(progress.stages).filter((s) => s.passedAt).length;
  const questsDone = course.filter((q) => isQuestCompleted(progress, q)).length;
  const unlocked = Object.keys(progress.achievements).filter((id) => ACHIEVEMENTS.some((a) => a.id === id)).length;
  const ladder = [STARTER_RANK, ...course.map((q) => q.rank), STREAK_RANK];

  const stats = [
    { label: "Этапов сдано", value: `${stagesPassed} из ${stagesTotal}` },
    { label: "Квестов закрыто", value: `${questsDone} из ${course.length}` },
    { label: "Серия", value: `🔥 ${progress.streak}` },
    { label: "Ачивки", value: `${unlocked} из ${ACHIEVEMENTS.length}` },
  ];

  return (
    <div className={cn("flex flex-col gap-10", !hydrated && "opacity-0")}>
      <div className="flex items-center gap-4">
        {user ? (
          <Avatar name={user.name} src={user.avatar} size="lg" />
        ) : (
          <span className="grid size-16 place-items-center rounded-full bg-card text-3xl" aria-hidden="true">
            {rank.icon}
          </span>
        )}
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-semibold">{user?.name ?? "Профиль"}</h1>
          <p className="mt-1 flex items-center gap-2 font-mono text-sm tracking-wide">
            <span className="size-2 rounded-full" style={{ backgroundColor: rank.color }} aria-hidden="true" />
            {rank.icon} {rank.title}
          </p>
        </div>
      </div>

      <AccountCard />

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-surface p-4">
            <dt className="text-xs text-muted">{s.label}</dt>
            <dd className="mt-1 font-display text-lg font-semibold tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>

      <Section title="Ранги">
        <ol className="flex flex-col gap-2">
          {ladder.map((r, i) => {
            const current = r.title === rank.title;
            const reached = i === 0 || current || (r !== STREAK_RANK && isQuestCompleted(progress, course[i - 1]));
            const condition =
              i === 0
                ? "С первого дня"
                : r === STREAK_RANK
                  ? `Серия от ${STREAK_RANK_AT} этапов подряд без провалов`
                  : `Закрыть квест «${course[i - 1].title}»`;
            return (
              <li
                key={r.title}
                className={cn(
                  "flex items-center gap-3 rounded-md border px-3 py-2",
                  current ? "border-border-strong bg-card" : "border-transparent",
                  !reached && "opacity-50",
                )}
              >
                <span className="text-xl" aria-hidden="true">
                  {r.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-sm">{r.title}</span>
                  <span className="block text-xs text-muted">{condition}</span>
                </span>
                {current ? (
                  <span className="text-xs text-gold">сейчас</span>
                ) : (
                  reached && <span className="text-xs text-success">получен</span>
                )}
              </li>
            );
          })}
        </ol>
      </Section>

      <Section title="Ачивки">
        <ul className="grid gap-3 sm:grid-cols-2">
          {ACHIEVEMENTS.map((a) => {
            const at = progress.achievements[a.id];
            return (
              <li
                key={a.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-4",
                  at ? "border-gold/50 bg-surface" : "border-border opacity-60",
                )}
              >
                <span className={cn("text-2xl", !at && "grayscale")} aria-hidden="true">
                  {a.icon}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">{a.title}</span>
                  <span className="block text-sm text-muted">{a.desc}</span>
                  <span className="mt-1 block text-xs text-muted">
                    {at ? `Открыта ${dateFormat.format(at)}` : "Ещё не открыта"}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="AI-ментор">
        <fieldset className="grid gap-2 sm:grid-cols-3">
          <legend className="sr-only">Характер ментора</legend>
          {PERSONA_INFO.map((p) => (
            <label
              key={p.id}
              className={cn(
                "flex cursor-pointer flex-col gap-1 rounded-lg border p-4 transition-colors duration-150 ease-snappy has-focus-visible:outline-2 has-focus-visible:outline-accent",
                progress.persona === p.id ? "border-accent bg-card" : "border-border hover:border-border-strong",
              )}
            >
              <input
                type="radio"
                name="persona"
                value={p.id}
                checked={progress.persona === p.id}
                onChange={() => useProgress.getState().setPersona(p.id)}
                className="sr-only"
              />
              <span className="font-semibold">
                <span aria-hidden="true">{p.icon}</span> {p.label}
              </span>
              <span className="text-sm text-muted">{p.desc}</span>
            </label>
          ))}
        </fieldset>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={progress.sound}
            onChange={(e) => useProgress.getState().setSound(e.target.checked)}
            className="size-4 accent-accent"
          />
          Звуки интерфейса: сдача этапа, ошибки, защита
        </label>
      </Section>

      <Section title="Прогресс по квестам">
        <ul className="flex flex-col gap-2">
          {course.map((quest) => {
            const { passed, total } = questProgress(progress, quest);
            const touched = Object.keys(progress.stages).some((key) => key.startsWith(`${quest.id}/`));
            return (
              <li
                key={quest.id}
                className="flex flex-wrap items-center gap-3 rounded-md border border-border px-4 py-3"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{quest.title}</span>
                  <span className="text-sm text-muted">
                    сдано {passed} из {total}
                  </span>
                </span>
                {touched &&
                  (confirmReset === quest.id ? (
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-muted">Удалить код и отметки квеста?</span>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          useProgress.getState().resetQuest(quest.id);
                          setConfirmReset(null);
                        }}
                      >
                        Сбросить
                      </Button>
                      <Button variant="ghost" onClick={() => setConfirmReset(null)}>
                        Нет
                      </Button>
                    </span>
                  ) : (
                    <Button variant="ghost" onClick={() => setConfirmReset(quest.id)}>
                      Сбросить
                    </Button>
                  ))}
              </li>
            );
          })}
        </ul>
      </Section>
    </div>
  );
}
