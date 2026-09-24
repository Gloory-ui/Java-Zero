"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";
import type { QuestOutline } from "@/lib/content/outline";
import { userRank } from "@/lib/game/ranks";
import { useProgress, useProgressHydrated } from "@/lib/progress/store";

/** Серия, ранг и звук в шапке лаборатории. До загрузки прогресса место зарезервировано, чтобы шапка не прыгала. */
export function LabStatus({ course }: { course: QuestOutline[] }) {
  const hydrated = useProgressHydrated();
  const streak = useProgress((s) => s.streak);
  const stages = useProgress((s) => s.stages);
  const soundOn = useProgress((s) => s.sound);
  const reduceMotion = useReducedMotion();
  const rank = userRank({ streak, stages }, course);

  return (
    <div className={cn("flex items-center gap-1", !hydrated && "invisible")}>
      <span
        className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-2.5 font-mono text-xs"
        title={`Серия: ${streak} ${streak === 1 ? "этап" : "этапов"} подряд без проваленных проверок. Ранг: ${rank.title}`}
      >
        <span aria-hidden="true">{rank.icon}</span>
        <span className="sr-only">Ранг {rank.title}. Серия:</span>
        <span aria-hidden="true" className={streak > 0 ? "text-gold" : "text-muted"}>
          🔥
        </span>
        <span className="relative inline-grid overflow-hidden tabular-nums">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={streak}
              initial={reduceMotion ? { opacity: 0 } : { y: "-100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { y: "100%", opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            >
              {streak}
            </motion.span>
          </AnimatePresence>
        </span>
      </span>
      <button
        type="button"
        onClick={() => useProgress.getState().setSound(!soundOn)}
        aria-pressed={soundOn}
        aria-label={soundOn ? "Выключить звуки" : "Включить звуки"}
        title={soundOn ? "Звуки включены" : "Звуки выключены"}
        className="grid size-9 place-items-center rounded-md text-muted transition-colors duration-150 ease-snappy hover:bg-card hover:text-text"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="size-[18px]"
          aria-hidden="true"
        >
          <path d="M11 5 6 9H2v6h4l5 4V5Z" />
          {soundOn ? <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /> : <path d="m22 9-6 6M16 9l6 6" />}
        </svg>
      </button>
    </div>
  );
}
