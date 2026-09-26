"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CountUp } from "@/components/game/count-up";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { rankForLevel } from "@/lib/game/ranks";
import { levelInfo } from "@/lib/game/xp";
import { accentById } from "@/lib/profile/cosmetics";
import { safeMediaUrl } from "@/lib/profile/media";
import { fetchLeaderboard, PublicDataError } from "@/lib/profile/public";
import { useProfile } from "@/lib/profile/store";
import type { LeaderRow } from "@/lib/supabase/database";
import { ProfileAvatar } from "./profile-avatar";

type Period = "week" | "all";

const PERIODS: { id: Period; label: string }[] = [
  { id: "week", label: "Неделя" },
  { id: "all", label: "Всё время" },
];

const PODIUM = ["#fbbf24", "#cbd5e1", "#f97316"];

type State = { kind: "loading" } | { kind: "ready"; rows: LeaderRow[] } | { kind: "error"; message: string };

/** Таблица лидеров по опыту: только публичные профили с ником */
export function Leaderboard() {
  const [period, setPeriod] = useState<Period>("week");
  const [direction, setDirection] = useState(1);
  const [state, setState] = useState<State>({ kind: "loading" });
  const reduceMotion = useReducedMotion();
  const myHandle = useProfile((s) => s.handle);

  useEffect(() => {
    let alive = true;
    setState({ kind: "loading" });
    fetchLeaderboard(period)
      .then((rows) => {
        if (alive) setState({ kind: "ready", rows });
      })
      .catch((error: unknown) => {
        if (alive) {
          setState({
            kind: "error",
            message: error instanceof PublicDataError ? error.message : "Не получилось загрузить таблицу.",
          });
        }
      });
    return () => {
      alive = false;
    };
  }, [period]);

  const choose = (next: Period) => {
    setDirection(PERIODS.findIndex((p) => p.id === next) > PERIODS.findIndex((p) => p.id === period) ? 1 : -1);
    setPeriod(next);
  };

  return (
    <div className="flex flex-col gap-6">
      <div
        className="inline-flex self-start rounded-xl border border-border bg-surface p-1"
        role="tablist"
        aria-label="Период"
      >
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={period === p.id}
            onClick={() => choose(p.id)}
            className={cn(
              "relative rounded-lg px-4 py-1.5 text-sm font-medium transition-colors duration-150",
              period === p.id ? "text-text" : "text-muted hover:text-text",
            )}
          >
            {period === p.id && (
              <motion.span
                layoutId="leaderboard-tab"
                className="absolute inset-0 rounded-lg bg-card shadow-[inset_0_0_0_1px_var(--border-strong)]"
                transition={reduceMotion ? { duration: 0 } : { type: "spring", damping: 30, stiffness: 400 }}
              />
            )}
            <span className="relative">{p.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.div
          key={period}
          role="tabpanel"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction * 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction * -24, transition: { duration: 0.15 } }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {state.kind === "loading" && (
            <ul className="flex flex-col gap-2" aria-busy="true" aria-label="Таблица загружается">
              {Array.from({ length: 5 }, (_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: заглушки строк
                <li key={i} className="h-16 animate-pulse rounded-xl bg-card" />
              ))}
            </ul>
          )}
          {state.kind === "error" && (
            <p className="rounded-xl border border-border bg-surface p-5 text-muted">{state.message}</p>
          )}
          {state.kind === "ready" && state.rows.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-strong p-8 text-center">
              <Icon name="trophy" className="size-8 text-gold" />
              <p className="font-semibold">
                {period === "week" ? "За эту неделю пока никто не набрал опыт" : "В таблице пока никого"}
              </p>
              <p className="max-w-sm text-sm text-muted">
                Задай ник и включи публичный профиль в настройках профиля — и сдай этап, чтобы попасть сюда первым.
              </p>
            </div>
          )}
          {state.kind === "ready" && state.rows.length > 0 && (
            <ol className="flex flex-col gap-2">
              {state.rows.map((row, i) => {
                const mine = row.handle === myHandle;
                const accent = accentById(row.accent).color;
                const level = levelInfo(Number(row.xp_total)).level;
                const rank = rankForLevel(level);
                const podium = PODIUM[i];
                return (
                  <motion.li
                    key={row.handle}
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(i, 10) * 0.03, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link
                      href={`/u/${row.handle}`}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border bg-surface px-3 py-2.5 transition-[border-color,translate] duration-200 hover:-translate-y-0.5 sm:gap-4 sm:px-4",
                        mine ? "neon-glow border-transparent" : "border-border hover:border-border-strong",
                      )}
                      style={
                        mine
                          ? ({ "--neon": accent } as React.CSSProperties)
                          : podium
                            ? { borderColor: `color-mix(in oklab, ${podium} 45%, transparent)` }
                            : undefined
                      }
                    >
                      <span
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-lg font-display text-sm font-bold tabular-nums",
                          podium ? "text-bg" : "bg-card text-muted",
                        )}
                        style={podium ? { backgroundColor: podium, boxShadow: `0 0 14px ${podium}` } : undefined}
                      >
                        {i + 1}
                      </span>
                      <ProfileAvatar
                        src={safeMediaUrl(row.avatar_url)}
                        name={row.display_name ?? row.handle}
                        frame={row.frame ?? "clean"}
                        color={accent}
                        size={40}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">
                          {row.display_name || `@${row.handle}`}
                          {mine && <span className="ml-2 text-xs font-normal text-muted">это ты</span>}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          @{row.handle} · {row.title ?? rank.title}
                        </span>
                      </span>
                      <span className="hidden shrink-0 items-center gap-1 font-mono text-xs text-muted sm:inline-flex">
                        <Icon name={rank.icon} className="size-3.5 text-neon-ink" />
                        ур. {level}
                      </span>
                      <span className="shrink-0 text-right font-display text-sm font-bold tabular-nums">
                        <CountUp value={Number(row.xp)} /> <span className="text-xs font-normal text-muted">XP</span>
                      </span>
                    </Link>
                  </motion.li>
                );
              })}
            </ol>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
