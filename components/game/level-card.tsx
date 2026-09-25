"use client";

import { motion, useReducedMotion } from "motion/react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { plural } from "@/lib/plural";
import { CountUp } from "./count-up";
import { useGame } from "./use-game";

const LEVELS = ["уровень", "уровня", "уровней"] as const;

/** Уровень, ранг и полоса опыта. Заполненная часть — неон ранга, остаток бежит штриховкой */
export function LevelCard({ className }: { className?: string }) {
  const { hydrated, xp, level, rank, next } = useGame();
  const reduceMotion = useReducedMotion();
  const neon = { "--neon": rank.color } as React.CSSProperties;

  return (
    <section
      aria-label="Уровень и опыт"
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-surface p-4 sm:p-5",
        !hydrated && "opacity-0",
        className,
      )}
      style={{
        backgroundImage: `radial-gradient(120% 140% at 0% 0%, color-mix(in oklab, ${rank.color} 18%, transparent), transparent 60%)`,
      }}
    >
      <div className="flex items-center gap-4 sm:gap-5">
        <div className="neon-ring shrink-0 rounded-2xl p-[2px]" style={neon}>
          <div
            className="grid size-16 place-items-center rounded-[14px] bg-card sm:size-[72px]"
            style={{ color: rank.color }}
          >
            <Icon name={rank.icon} className="size-8 sm:size-9" strokeWidth={1.5} />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-[11px] font-semibold tracking-widest uppercase">
            <span
              style={{ "--rank": rank.color } as React.CSSProperties}
              className="text-(--rank) [[data-theme=light]_&]:text-text"
            >
              {rank.title}
            </span>
          </p>
          <div className="mt-1 flex items-end justify-between gap-3">
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
            <p className="text-right font-display text-base font-semibold tabular-nums">
              <CountUp value={level.into} /> <span className="text-muted">/ {level.need} XP</span>
            </p>
          </div>

          <div
            className="xp-stripes relative mt-3 h-2.5 overflow-hidden rounded-full bg-card"
            style={neon}
            role="progressbar"
            aria-label="Опыт до следующего уровня"
            aria-valuemin={0}
            aria-valuemax={level.need}
            aria-valuenow={level.into}
          >
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: `linear-gradient(90deg, color-mix(in oklab, ${rank.color} 70%, var(--gold)), var(--gold))`,
                boxShadow: `0 0 12px color-mix(in oklab, ${rank.color} 60%, transparent)`,
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
            <span>{next ? `До «${next.title}»: ${plural(next.level - level.level, LEVELS)}` : "Высший ранг"}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
