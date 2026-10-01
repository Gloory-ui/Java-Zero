"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { useXpGain } from "@/lib/game/events";
import { plural } from "@/lib/plural";
import { useGame } from "./use-game";

const DAYS = ["день", "дня", "дней"] as const;
const RING = 2 * Math.PI * 12;

/** «+60 XP» поднимается над чипом уровня и гаснет: опыт «прилетает» туда, где его видно */
function XpFloat() {
  const gain = useXpGain((s) => s.gain);
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState<typeof gain>(null);

  useEffect(() => {
    if (!gain) return;
    setVisible(gain);
    const id = setTimeout(() => setVisible(null), 1400);
    return () => clearTimeout(id);
  }, [gain]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.span
          key={visible.id}
          aria-hidden="true"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.9 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: -22, scale: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="neon-text pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 font-display text-xs font-bold whitespace-nowrap text-gold"
          style={{ "--neon": "var(--gold)" } as React.CSSProperties}
        >
          +{visible.xp} XP
        </motion.span>
      )}
    </AnimatePresence>
  );
}

/** Уровень с кольцом прогресса и огонь серии дней. Ведёт в профиль. compact — на телефоне только кольцо уровня */
export function LevelChip({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { hydrated, level, rank, streak } = useGame();
  const gain = useXpGain((s) => s.gain);
  const offset = RING * (1 - level.percent / 100);

  return (
    <Link
      href="/profile"
      className={cn(
        "relative inline-flex h-11 items-center gap-2 sm:h-9 rounded-full border border-border bg-surface/60 pr-3 pl-1 font-mono text-xs transition-colors duration-150 ease-snappy hover:border-border-strong",
        compact && "max-sm:min-w-11 max-sm:pr-1",
        !hydrated && "invisible",
        className,
      )}
      title={`${rank.title} · уровень ${level.level}: ${level.into} из ${level.need} XP. Серия: ${plural(streak.current, DAYS)}`}
    >
      <span className="relative grid size-7 place-items-center text-neon-ink">
        <svg viewBox="0 0 28 28" className="absolute inset-0 -rotate-90" aria-hidden="true">
          <circle cx="14" cy="14" r="12" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
          <circle
            cx="14"
            cy="14"
            r="12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={RING}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700 ease-snappy motion-reduce:transition-none"
          />
        </svg>
        <span className="relative text-[11px] font-bold text-text tabular-nums">{level.level}</span>
      </span>
      <span className="sr-only">
        Уровень {level.level}, ранг {rank.title}. Серия:
      </span>
      <span
        className={cn(
          "flex items-center gap-0.5 tabular-nums",
          streak.current > 0 ? "text-text" : "text-muted",
          compact && "max-sm:sr-only",
        )}
      >
        <Icon
          name="flame"
          className={cn("size-3.5", streak.current > 0 ? (streak.today ? "text-gold" : "text-gold/50") : "text-muted")}
        />
        {streak.current}
        <span className="sr-only">{plural(streak.current, DAYS).replace(/^\d+ /, "")}</span>
      </span>
      {gain && <XpFloat />}
    </Link>
  );
}
