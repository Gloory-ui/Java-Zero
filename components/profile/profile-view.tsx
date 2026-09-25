"use client";

import { useState } from "react";
import { Avatar } from "@/components/account/account-menu";
import { AchievementsPanel } from "@/components/game/achievements-panel";
import { DailyQuests } from "@/components/game/daily-quests";
import { LevelCard } from "@/components/game/level-card";
import { useGame } from "@/components/game/use-game";
import { Button, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { signOut } from "@/lib/account/actions";
import { useAccount } from "@/lib/account/store";
import { PERSONA_INFO } from "@/lib/ai/personas";
import { cn } from "@/lib/cn";
import type { QuestOutline } from "@/lib/content/outline";
import { achievementCatalog } from "@/lib/game/achievements";
import { dailyQuestsDone } from "@/lib/game/daily";
import { RANKS } from "@/lib/game/ranks";
import { questProgress } from "@/lib/progress/selectors";
import { useProgress, useProgressHydrated } from "@/lib/progress/store";
import { EMPTY_PROGRESS } from "@/lib/progress/types";

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
  const { level, rank, streak } = useGame();

  const stagesTotal = course.reduce((sum, q) => sum + q.stages.length, 0);
  const stagesPassed = Object.values(progress.stages).filter((s) => s.passedAt).length;
  const catalog = achievementCatalog(course);
  const unlocked = catalog.filter((a) => progress.achievements[a.id]).length;

  const stats = [
    {
      icon: "circle-check" as const,
      tone: "var(--success)",
      label: "Этапов сдано",
      value: `${stagesPassed} из ${stagesTotal}`,
    },
    {
      icon: "flame" as const,
      tone: "var(--gold)",
      label: "Серия дней",
      value: String(streak.current),
      note: `лучшая ${streak.best}${streak.freezes > 0 ? ` · заморозок: ${streak.freezes}` : ""}`,
    },
    { icon: "map" as const, tone: "#38bdf8", label: "Квестов дня", value: String(dailyQuestsDone(progress)) },
    { icon: "trophy" as const, tone: "#a855f7", label: "Достижений", value: `${unlocked} из ${catalog.length}` },
  ];

  return (
    <div className={cn("flex flex-col gap-10", !hydrated && "opacity-0")}>
      <div className="flex items-center gap-4">
        <div
          className="neon-ring shrink-0 rounded-full p-[3px]"
          style={{ "--neon": rank.color } as React.CSSProperties}
        >
          {user ? (
            <Avatar name={user.name} src={user.avatar} size="lg" />
          ) : (
            <span className="grid size-16 place-items-center rounded-full bg-card" style={{ color: rank.color }}>
              <Icon name={rank.icon} className="size-8" strokeWidth={1.5} />
            </span>
          )}
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-semibold">{user?.name ?? "Профиль"}</h1>
          <p className="mt-1 flex items-center gap-2 font-mono text-sm tracking-wide">
            <span className="size-2 rounded-full" style={{ backgroundColor: rank.color }} aria-hidden="true" />
            {rank.title} · уровень {level.level}
          </p>
        </div>
      </div>

      <AccountCard />

      <LevelCard />

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Статистика">
        {stats.map((s) => (
          <li
            key={s.label}
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface px-3 py-5 text-center"
          >
            <span
              className="grid size-10 place-items-center rounded-lg"
              style={{ backgroundColor: `color-mix(in oklab, ${s.tone} 16%, transparent)`, color: s.tone }}
            >
              <Icon name={s.icon} className="size-5" />
            </span>
            <p className="font-display text-2xl font-bold tabular-nums">{s.value}</p>
            <p className="font-mono text-[11px] tracking-widest text-muted uppercase">{s.label}</p>
            {s.note && <p className="text-xs text-muted">{s.note}</p>}
          </li>
        ))}
      </ul>

      <DailyQuests />

      <AchievementsPanel course={course} />

      <Section title="Ранги">
        <p className="-mt-2 text-sm text-muted">
          Ранг растёт вместе с уровнем. Опыт дают этапы, достижения и квесты дня.
        </p>
        <ol className="grid gap-2 sm:grid-cols-2">
          {RANKS.map((r) => {
            const current = r.title === rank.title;
            const reached = level.level >= r.level;
            return (
              <li
                key={r.title}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2",
                  current ? "neon-glow border-transparent bg-card" : "border-border",
                )}
                style={current ? ({ "--neon": r.color } as React.CSSProperties) : undefined}
              >
                <span className={cn(!reached && "opacity-40")} style={{ color: reached ? r.color : undefined }}>
                  <Icon name={r.icon} className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block font-mono text-sm", !reached && "text-muted")}>{r.title}</span>
                  <span className="block text-xs text-muted">с {r.level} уровня</span>
                </span>
                {current ? (
                  <span className="text-xs font-semibold">сейчас</span>
                ) : (
                  reached && <span className="text-xs text-success">получен</span>
                )}
              </li>
            );
          })}
        </ol>
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
                <span className="inline-flex items-center gap-2">
                  <Icon name={p.icon} className="size-4 text-muted" />
                  {p.label}
                </span>
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
