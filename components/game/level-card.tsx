"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";
import { nextRank, rankForLevel } from "@/lib/game/ranks";
import { levelInfo } from "@/lib/game/xp";
import { plural } from "@/lib/plural";
import { CountUp } from "./count-up";
import { RankBadge } from "./rank-badge";
import { useGame } from "./use-game";

const LEVELS = ["уровень", "уровня", "уровней"] as const;

/** Уровень и опыт этого студента: из прогресса в браузере */
export function LevelCard({ className }: { className?: string }) {
  const { hydrated, xp } = useGame();
  return <LevelCardView xp={xp} className={cn(!hydrated && "opacity-0", className)} />;
}

/** Уровень, ранг и полоса опыта по сумме опыта. Всё в фирменном неоне: заполненная часть светится, остаток бежит штриховкой */
export function LevelCardView({ xp, className }: { xp: number; className?: string }) {
  const level = levelInfo(xp);
  const rank = rankForLevel(level.level);
  const next = nextRank(level.level);
  const reduceMotion = useReducedMotion();
  return (
    <section
      aria-label="Уровень и опыт"
      className={cn("relative overflow-hidden rounded-xl border border-border bg-surface p-4 sm:p-5", className)}
      style={{
        backgroundImage:
          "radial-gradient(120% 140% at 0% 0%, color-mix(in oklab, var(--neon-user) 16%, transparent), transparent 60%)",
      }}
    >
      <div className="flex items-center gap-4 sm:gap-5">
        <RankBadge rank={rank} size={68} chip={false} className="m-1 shrink-0" />

        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-[11px] font-semibold tracking-widest uppercase">
            <span className="text-neon-ink">{rank.title}</span>
          </p>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
            <p className="font-display text-3xl leading-none font-bold tabular-nums">
              <span className="sr-only">Уровень </span>
              <CountUp value={level.level} />
              <span
                aria-hidden="true"
                className="ml-2 align-middle font-mono text-[11px] font-normal tracking-widest text-muted uppercase"
              >
                уровень
              </span>
            </p>
            <p className="text-right font-display text-sm font-semibold whitespace-nowrap tabular-nums sm:text-base">
              <CountUp value={level.into} /> <span className="text-muted">/ {level.need} XP</span>
            </p>
          </div>

          <div
            className="xp-stripes relative mt-3 h-2.5 overflow-hidden rounded-full bg-card"
            style={{ "--neon": "var(--neon-user)" } as React.CSSProperties}
            role="progressbar"
            aria-label="Опыт до следующего уровня"
            aria-valuemin={0}
            aria-valuemax={level.need}
            aria-valuenow={level.into}
          >
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, color-mix(in oklab, var(--neon-user) 70%, black), var(--neon-user))",
                boxShadow: "0 0 12px color-mix(in oklab, var(--neon-user) 55%, transparent)",
              }}
              initial={false}
              animate={{ width: `${Math.max(level.percent, level.into > 0 ? 2 : 0)}%` }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <div className="mt-1.5 flex flex-wrap justify-between gap-x-3 gap-y-0.5 font-mono text-[10px] text-muted tabular-nums">
            <span>
              Всего <CountUp value={xp} /> XP
            </span>
            <span className="hidden sm:inline">{level.percent}%</span>
            <span>
              {level.max
                ? "Максимальный уровень"
                : next
                  ? `До «${next.title}»: ${plural(next.level - level.level, LEVELS)}`
                  : "Высший ранг"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
