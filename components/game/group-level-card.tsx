"use client";

import { motion, useReducedMotion } from "motion/react";
import { useMemo } from "react";
import { cn } from "@/lib/cn";
import type { QuestOutline } from "@/lib/content/outline";
import { groupLevelInfo, groupRankForLevel, groupXp, nextGroupRank } from "@/lib/game/group";
import { plural } from "@/lib/plural";
import { useProgress, useProgressHydrated } from "@/lib/progress/store";
import { CountUp } from "./count-up";
import { GroupRankBadge } from "./rank-badge";

const LEVELS = ["уровень", "уровня", "уровней"] as const;
const GOLD = "#f5a524";

/**
 * Уровень и звание раздела «Группа». Опыт считается только по контрольным точкам: задания КТ и знаки группы.
 * course — полный курс: квесты группы берутся из него.
 */
export function GroupLevelCard({ course, className }: { course: QuestOutline[]; className?: string }) {
  const hydrated = useProgressHydrated();
  const stages = useProgress((s) => s.stages);
  const achievements = useProgress((s) => s.achievements);
  const xp = useMemo(() => groupXp({ stages, achievements }, course), [stages, achievements, course]);
  return <GroupLevelCardView xp={xp} className={cn(!hydrated && "opacity-0", className)} />;
}

export function GroupLevelCardView({ xp, className }: { xp: number; className?: string }) {
  const level = groupLevelInfo(xp);
  const rank = groupRankForLevel(level.level);
  const next = nextGroupRank(level.level);
  const reduceMotion = useReducedMotion();
  return (
    <section
      aria-label="Уровень группы"
      className={cn("relative overflow-hidden rounded-xl border border-border bg-surface p-4 sm:p-5", className)}
      style={{
        backgroundImage: `radial-gradient(120% 140% at 0% 0%, color-mix(in oklab, ${GOLD} 14%, transparent), transparent 60%)`,
      }}
    >
      <div className="flex items-center gap-4 sm:gap-5">
        <GroupRankBadge rank={rank} size={68} chip={false} className="m-1 shrink-0" />

        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-[11px] font-semibold tracking-widest uppercase">
            <span className="text-muted">Группа · </span>
            <span className="text-gold">{rank.title}</span>
          </p>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
            <p className="font-display text-3xl leading-none font-bold tabular-nums">
              <span className="sr-only">Уровень группы </span>
              <CountUp value={level.level} />
              <span
                aria-hidden="true"
                className="ml-2 align-middle font-mono text-[11px] font-normal tracking-widest text-muted uppercase"
              >
                уровень группы
              </span>
            </p>
            <p className="text-right font-display text-sm font-semibold whitespace-nowrap tabular-nums sm:text-base">
              <CountUp value={level.into} /> <span className="text-muted">/ {level.need} XP</span>
            </p>
          </div>

          <div
            className="xp-stripes relative mt-3 h-2.5 overflow-hidden rounded-full bg-card"
            style={{ "--neon": GOLD } as React.CSSProperties}
            role="progressbar"
            aria-label="Опыт группы до следующего уровня"
            aria-valuemin={0}
            aria-valuemax={level.need}
            aria-valuenow={level.into}
          >
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: "linear-gradient(90deg, #b45309, #fde68a)",
                boxShadow: `0 0 12px color-mix(in oklab, ${GOLD} 55%, transparent)`,
              }}
              initial={false}
              animate={{ width: `${Math.max(level.percent, level.into > 0 ? 2 : 0)}%` }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <div className="mt-1.5 flex flex-wrap justify-between gap-x-3 gap-y-0.5 font-mono text-[10px] text-muted tabular-nums">
            <span>
              Опыт КТ <CountUp value={xp} /> XP
            </span>
            <span>
              {level.max
                ? "Максимальный уровень группы"
                : next
                  ? `До «${next.title}»: ${plural(next.level - level.level, LEVELS)}`
                  : "Высшее звание"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
