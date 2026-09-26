"use client";

import { useEffect, useState } from "react";
import { AchievementBadge } from "@/components/game/achievement-badge";
import { LevelCardView } from "@/components/game/level-card";
import { ButtonLink } from "@/components/ui/button";
import type { QuestOutline } from "@/lib/content/outline";
import { achievementCatalog, RARITY_ORDER } from "@/lib/game/achievements";
import { rankForLevel } from "@/lib/game/ranks";
import { levelInfo } from "@/lib/game/xp";
import { accentById } from "@/lib/profile/cosmetics";
import { safeMediaUrl } from "@/lib/profile/media";
import { fetchPublicProfile, PublicDataError } from "@/lib/profile/public";
import type { PublicProfile } from "@/lib/supabase/database";
import { type HeroData, ProfileHero } from "./profile-hero";
import { Showcase } from "./showcase";
import { StatCards } from "./stat-cards";

export type PublicView = HeroData & {
  xp: number;
  stagesPassed: number;
  streakDays: number;
  bestStreak: number;
  showcase: string[];
  achievementIds: string[];
};

/** Данные из get_public_profile → то, что рисует страница. Ссылки на картинки проверяются: их задаёт владелец */
export function viewFromPublic(p: PublicProfile, course: QuestOutline[]): PublicView {
  const level = levelInfo(p.xp_total).level;
  const catalog = achievementCatalog(course);
  const ids = p.achievements.map((a) => a.id).filter((id) => catalog.some((a) => a.id === id));
  return {
    name: p.display_name || `@${p.handle}`,
    handle: p.handle,
    avatarUrl: safeMediaUrl(p.avatar_url),
    banner: p.banner ?? "grid",
    bannerUrl: safeMediaUrl(p.banner_url),
    frame: p.frame ?? "neon",
    color: accentById(p.accent).color,
    rank: rankForLevel(level),
    level,
    title: p.title,
    bio: p.bio ?? "",
    since: p.created_at,
    seed: p.handle ?? "guest",
    achievements: { got: ids.length, total: catalog.length },
    xp: p.xp_total,
    stagesPassed: p.stages_passed,
    streakDays: p.streak_days,
    bestStreak: p.best_streak,
    showcase: (p.showcase ?? []).filter((id) => ids.includes(id)).slice(0, 4),
    achievementIds: ids,
  };
}

/** Профиль глазами других: шапка, уровень, статистика, витрина и все открытые достижения */
export function PublicProfileView({ view, course }: { view: PublicView; course: QuestOutline[] }) {
  const stagesTotal = course.reduce((n, q) => n + q.stages.length, 0);
  const earned = achievementCatalog(course)
    .filter((a) => view.achievementIds.includes(a.id))
    .sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity));

  return (
    <div className="flex flex-col gap-8">
      <ProfileHero data={view} />
      <LevelCardView xp={view.xp} />
      <StatCards
        items={[
          {
            icon: "circle-check",
            tone: "var(--success)",
            label: "Этапов сдано",
            value: `${view.stagesPassed} из ${stagesTotal}`,
          },
          { icon: "flame", tone: "var(--gold)", label: "Серия дней", value: String(view.streakDays) },
          { icon: "medal", tone: "#38bdf8", label: "Лучшая серия", value: String(view.bestStreak) },
          {
            icon: "trophy",
            tone: "#a855f7",
            label: "Достижений",
            value: `${view.achievements.got} из ${view.achievements.total}`,
          },
        ]}
      />
      <Showcase ids={view.showcase} course={course} />
      {earned.length > 0 && (
        <section aria-labelledby="public-achievements" className="flex flex-col gap-4">
          <h2 id="public-achievements" className="font-display text-lg font-semibold">
            Достижения
          </h2>
          <ul className="flex flex-wrap gap-3">
            {earned.map((a) => (
              <li key={a.id} title={`${a.title}: ${a.desc}`}>
                <AchievementBadge achievement={a} unlocked size={56} />
                <span className="sr-only">{a.title}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; view: PublicView }
  | { kind: "missing" }
  | { kind: "error"; message: string };

/** Страница /u/ник: данные грузятся в браузере через публичную SQL-функцию */
export function PublicProfilePage({ handle, course }: { handle: string; course: QuestOutline[] }) {
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    let alive = true;
    setState({ kind: "loading" });
    fetchPublicProfile(handle)
      .then((p) => {
        if (alive) setState(p ? { kind: "ready", view: viewFromPublic(p, course) } : { kind: "missing" });
      })
      .catch((error: unknown) => {
        if (alive) {
          setState({
            kind: "error",
            message: error instanceof PublicDataError ? error.message : "Не получилось загрузить профиль.",
          });
        }
      });
    return () => {
      alive = false;
    };
  }, [handle, course]);

  if (state.kind === "loading") {
    return (
      <output className="flex flex-col gap-6" aria-busy="true" aria-label="Профиль загружается">
        <div className="h-36 animate-pulse rounded-2xl bg-card sm:h-52" />
        <div className="-mt-20 ml-6 size-32 animate-pulse rounded-full border-4 border-bg bg-card" />
        <div className="h-8 w-56 animate-pulse rounded-md bg-card" />
        <div className="h-28 animate-pulse rounded-xl bg-card" />
      </output>
    );
  }
  if (state.kind === "ready") return <PublicProfileView view={state.view} course={course} />;
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <h1 className="font-display text-2xl font-semibold">
        {state.kind === "missing" ? "Профиль не найден" : "Профиль не загрузился"}
      </h1>
      <p className="text-muted">
        {state.kind === "missing" ? `Студента с ником @${handle} нет, или он скрыл свой профиль.` : state.message}
      </p>
      <ButtonLink href="/leaderboard" variant="secondary">
        Открыть таблицу лидеров
      </ButtonLink>
    </div>
  );
}
