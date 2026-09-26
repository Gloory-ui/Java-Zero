"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import type { QuestOutline } from "@/lib/content/outline";
import { type Achievement, achievementCatalog, RARITY_LABEL, RARITY_ORDER, trophyScore } from "@/lib/game/achievements";
import { dayNumber, localDay } from "@/lib/game/day";
import { formatRarity, type RarityMap, useRarity } from "@/lib/game/rarity";
import { useProgress, useProgressHydrated } from "@/lib/progress/store";
import { AchievementBadge, RARITY_COLOR } from "./achievement-badge";
import { CountUp } from "./count-up";

const dateFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });

export function whenText(at: number): string {
  const days = dayNumber(localDay()) - dayNumber(localDay(at));
  if (days === 0) return "сегодня";
  if (days === 1) return "вчера";
  return dateFormat.format(at);
}

export function rarityText(a: Achievement, rarity: RarityMap | null): string {
  const percent = rarity?.[a.id];
  return percent === undefined ? RARITY_LABEL[a.rarity] : `${RARITY_LABEL[a.rarity]} · есть у ${formatRarity(percent)}`;
}

/** Сначала самые редкие: по доле студентов, если она известна, иначе по редкости из каталога */
function byRarity(rarity: RarityMap | null) {
  return (a: Achievement, b: Achievement) => {
    const pa = rarity?.[a.id];
    const pb = rarity?.[b.id];
    if (pa !== undefined && pb !== undefined && pa !== pb) return pa - pb;
    return RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity) || b.xp - a.xp;
  };
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.2em] text-muted uppercase">
      <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
      {children}
    </p>
  );
}

const SEGMENTS = 20;

/** Сводка достижений в профиле: трофейный счёт, самые редкие, тайные знаки и последние полученные */
export function AchievementsPanel({ course }: { course: QuestOutline[] }) {
  const hydrated = useProgressHydrated();
  const unlocked = useProgress((s) => s.achievements);
  const rarity = useRarity();
  const catalog = achievementCatalog(course);

  const { earned, rarest, secrets, secretTotal, latest } = useMemo(() => {
    const earned = catalog.filter((a) => unlocked[a.id]);
    return {
      earned,
      rarest: [...earned].sort(byRarity(rarity)).slice(0, 4),
      secrets: earned.filter((a) => a.secret),
      secretTotal: catalog.filter((a) => a.secret).length,
      latest: [...earned].sort((a, b) => unlocked[b.id] - unlocked[a.id]).slice(0, 3),
    };
  }, [catalog, unlocked, rarity]);

  const score = hydrated ? trophyScore({ achievements: unlocked }) : 0;
  const filled = Math.round((earned.length / catalog.length) * SEGMENTS);

  return (
    <section aria-labelledby="achievements-title" className={cn("flex flex-col gap-4", !hydrated && "opacity-0")}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="achievements-title" className="font-display text-lg font-semibold">
          <Icon name="trophy" className="mr-2 inline size-5 align-[-3px] text-gold" />
          Достижения <span className="font-mono text-sm text-muted">· {earned.length}</span>
        </h2>
        <Link
          href="/achievements"
          className="inline-flex min-h-11 items-center text-sm text-accent hover:underline sm:min-h-0"
        >
          Все достижения →
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-border bg-surface p-4 sm:p-6">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, var(--accent), transparent)" }}
          aria-hidden="true"
        />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm">
              Получено <span className="font-semibold">{earned.length}</span>{" "}
              <span className="text-muted">из {catalog.length}</span>
            </p>
            <div className="mt-3 flex gap-1" aria-hidden="true">
              {Array.from({ length: SEGMENTS }, (_, i) => (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: сегменты полосы статичны
                  key={i}
                  className={cn("h-1.5 w-3 rounded-full sm:w-4", i < filled ? "bg-accent" : "bg-card")}
                />
              ))}
            </div>
          </div>
          <div className="text-right">
            <p
              className="neon-text font-display text-4xl leading-none font-bold text-gold tabular-nums"
              style={{ "--neon": "var(--gold)" } as React.CSSProperties}
            >
              <CountUp value={score} duration={0.9} />
            </p>
            <p className="mt-1 font-mono text-[11px] tracking-[0.2em] text-muted uppercase">Трофейный счёт</p>
          </div>
        </div>

        {earned.length === 0 ? (
          <p className="mt-6 text-sm text-muted">
            Первое достижение — за первый сданный этап. Условия всех достижений в разделе «Все достижения».
          </p>
        ) : (
          <>
            <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5">
              <Label>Самое редкое</Label>
              <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {rarest.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-col items-center gap-2 rounded-lg border bg-card px-3 pt-4 pb-3 text-center"
                    style={{ borderColor: `color-mix(in oklab, ${RARITY_COLOR[a.rarity]} 45%, transparent)` }}
                  >
                    <AchievementBadge achievement={a} unlocked size={56} />
                    <p className="text-sm leading-tight font-semibold">{a.title}</p>
                    <p className="text-[11px] text-muted">{rarityText(a, rarity)}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5">
              <Label>Тайные знаки</Label>
              {secrets.length > 0 && (
                <ul className="flex flex-wrap gap-3">
                  {secrets.map((a) => (
                    <li key={a.id} title={`${a.title}: ${a.desc}`}>
                      <AchievementBadge achievement={a} unlocked size={52} />
                      <span className="sr-only">{a.title}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-sm text-muted">
                Найдено <span className="font-semibold text-text">{secrets.length}</span> из {secretTotal}. Условия
                остальных скрыты: их ищут сами.
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5">
              <Label>Последнее полученное</Label>
              <ul className="flex flex-col gap-2">
                {latest.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
                    <AchievementBadge achievement={a} unlocked size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{a.title}</p>
                      <p className="text-xs text-muted">{whenText(unlocked[a.id])}</p>
                    </div>
                    <span className="font-mono text-xs font-semibold text-gold">+{a.xp} XP</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
