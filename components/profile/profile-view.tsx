"use client";

import { useState } from "react";
import { AchievementsPanel } from "@/components/game/achievements-panel";
import { DailyQuests } from "@/components/game/daily-quests";
import { LevelCard } from "@/components/game/level-card";
import { RankBadge } from "@/components/game/rank-badge";
import { useGame } from "@/components/game/use-game";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Sheet } from "@/components/ui/sheet";
import { useAccount } from "@/lib/account/store";
import { cn } from "@/lib/cn";
import type { QuestOutline } from "@/lib/content/outline";
import { achievementCatalog } from "@/lib/game/achievements";
import { dailyQuestsDone } from "@/lib/game/daily";
import { RANKS } from "@/lib/game/ranks";
import type { Owned } from "@/lib/profile/cosmetics";
import { profileUrl } from "@/lib/profile/public";
import { useProfile, useProfileHydrated } from "@/lib/profile/store";
import { useProgress, useProgressHydrated } from "@/lib/progress/store";
import { EMPTY_PROGRESS } from "@/lib/progress/types";
import { AppearanceSheet } from "./appearance-sheet";
import type { HeroData } from "./profile-hero";
import { ProfileHero } from "./profile-hero";
import { PublicProfileView, type PublicView } from "./public-profile";
import { AccountCard, SettingsSheet } from "./settings-sheet";
import { Showcase } from "./showcase";
import { StatCards } from "./stat-cards";
import { useLook } from "./use-look";

type SheetId = "appearance" | "settings" | "preview" | null;

export function ProfileView({ course }: { course: QuestOutline[] }) {
  const hydrated = useProgressHydrated();
  const profileReady = useProfileHydrated();
  const stored = useProgress();
  const progress = hydrated ? stored : EMPTY_PROGRESS;
  const profile = useProfile();
  const user = useAccount((s) => s.user);
  const signedIn = useAccount((s) => s.status === "signed-in");
  const { xp, level, rank, streak } = useGame();
  const [sheet, setSheet] = useState<SheetId>(null);
  const [copied, setCopied] = useState(false);

  const owned: Owned = { level: level.level, achievements: progress.achievements };
  const look = useLook(owned);
  const catalog = achievementCatalog(course);
  const unlocked = catalog.filter((a) => progress.achievements[a.id]);
  const stagesTotal = course.reduce((sum, q) => sum + q.stages.length, 0);
  const stagesPassed = Object.values(progress.stages).filter((s) => s.passedAt).length;
  const name = profile.displayName || user?.name || "Гость";
  const firstStart = Math.min(...Object.values(progress.stages).map((s) => s.startedAt ?? Number.POSITIVE_INFINITY));
  const showcase = profile.showcase.filter((id) => progress.achievements[id]);
  const canShare = signedIn && Boolean(profile.handle) && profile.isPublic;

  const hero: HeroData = {
    name,
    handle: profile.handle,
    avatarUrl: profile.avatarUrl ?? user?.avatar ?? null,
    banner: look.banner,
    bannerUrl: profile.bannerUrl,
    frame: look.frame,
    color: look.color,
    rank,
    level: level.level,
    title: profile.title,
    bio: profile.bio,
    since: user?.createdAt ?? (Number.isFinite(firstStart) ? new Date(firstStart).toISOString() : null),
    seed: user?.id ?? "guest",
    achievements: { got: unlocked.length, total: catalog.length },
  };

  const preview: PublicView = {
    ...hero,
    xp,
    stagesPassed,
    streakDays: streak.current,
    bestStreak: streak.best,
    showcase,
    achievementIds: unlocked.map((a) => a.id),
  };

  const share = async () => {
    if (!profile.handle) return;
    const url = profileUrl(profile.handle);
    try {
      if (navigator.share) await navigator.share({ title: `${name} · Java-Zero`, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Студент закрыл окно «Поделиться» — это не ошибка
    }
  };

  const actions = (
    <>
      <Button
        variant="secondary"
        disabled={!canShare}
        onClick={() => void share()}
        title={canShare ? undefined : "Задай ник и включи публичный профиль в настройках"}
      >
        <Icon name={copied ? "check" : "globe"} className="size-4" />
        {copied ? "Ссылка скопирована" : "Поделиться"}
      </Button>
      <Button variant="secondary" onClick={() => setSheet("preview")}>
        <Icon name="crosshair" className="size-4" />
        Как видят другие
      </Button>
      <Button variant="secondary" onClick={() => setSheet("appearance")}>
        <Icon name="sparkles" className="size-4" />
        Внешний вид
      </Button>
      <Button onClick={() => setSheet("settings")}>
        <Icon name="wrench" className="size-4" />
        Настройки
      </Button>
    </>
  );

  return (
    <div className={cn("flex flex-col gap-10", (!hydrated || !profileReady) && "opacity-0")}>
      <ProfileHero data={hero} actions={actions} />

      {!signedIn && <AccountCard />}

      <LevelCard />

      <StatCards
        items={[
          {
            icon: "circle-check",
            tone: "var(--success)",
            label: "Этапов сдано",
            value: `${stagesPassed} из ${stagesTotal}`,
          },
          {
            icon: "flame",
            tone: "var(--gold)",
            label: "Серия дней",
            value: String(streak.current),
            note: `лучшая ${streak.best}${streak.freezes > 0 ? ` · заморозок: ${streak.freezes}` : ""}`,
          },
          { icon: "map", tone: "#38bdf8", label: "Квестов дня", value: String(dailyQuestsDone(progress)) },
          { icon: "trophy", tone: "#a855f7", label: "Достижений", value: `${unlocked.length} из ${catalog.length}` },
        ]}
      />

      <Showcase ids={showcase} course={course} onEdit={() => setSheet("appearance")} />

      <DailyQuests />

      <AchievementsPanel course={course} />

      <section aria-labelledby="ranks-title" className="flex flex-col gap-4">
        <h2 id="ranks-title" className="font-display text-lg font-semibold">
          Ранги
        </h2>
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
              >
                <RankBadge rank={r} unlocked={reached} size={48} chip={false} className="m-1.5" />
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
      </section>

      <AppearanceSheet
        open={sheet === "appearance"}
        onClose={() => setSheet(null)}
        course={course}
        owned={owned}
        providerAvatar={user?.avatar ?? null}
        name={name}
      />
      <SettingsSheet open={sheet === "settings"} onClose={() => setSheet(null)} course={course} />
      <Sheet
        open={sheet === "preview"}
        onClose={() => setSheet(null)}
        title="Как видят другие"
        description={
          canShare
            ? `Так выглядит твоя страница /u/${profile.handle}`
            : "Так будет выглядеть страница, когда откроешь профиль в настройках"
        }
        height="h-[95dvh]"
        width="sm:w-[min(900px,100vw)]"
      >
        <PublicProfileView view={preview} course={course} />
      </Sheet>
    </div>
  );
}
