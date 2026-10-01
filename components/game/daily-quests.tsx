"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { CHEST_ID, CHEST_XP, dailyCount, dailyKey, findDaily } from "@/lib/game/daily";
import { localDay, msUntilMidnight } from "@/lib/game/day";
import { ensureDay } from "@/lib/game/events";
import { useProgress, useProgressHydrated } from "@/lib/progress/store";

function resetText(ms: number): string {
  const minutes = Math.max(1, Math.ceil(ms / 60_000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} ч ${m} мин` : `${m} мин`;
}

/** Три квеста дня и сундук за все три. Квесты выбираются при первом открытии дня и обновляются в полночь */
export function DailyQuests({ className }: { className?: string }) {
  const hydrated = useProgressHydrated();
  const daily = useProgress((s) => s.daily);
  const dailyDone = useProgress((s) => s.dailyDone);
  const reduceMotion = useReducedMotion();
  const [now, setNow] = useState(() => Date.now());

  // Раз в минуту: таймер сброса и смена дня, если вкладка открыта через полночь
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const today = localDay(now);
  useEffect(() => {
    if (hydrated && daily?.day !== today) ensureDay();
  }, [hydrated, daily?.day, today]);

  const quests = daily?.day === today ? daily.quests : [];
  const doneCount = quests.filter((id) => dailyDone[dailyKey(today, id)]).length;
  const chestOpen = Boolean(dailyDone[dailyKey(today, CHEST_ID)]);

  return (
    <section
      aria-labelledby="daily-title"
      className={cn("rounded-xl border border-border bg-surface p-4 sm:p-5", !hydrated && "opacity-0", className)}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="daily-title" className="font-display text-lg font-semibold">
          Квесты дня
        </h2>
        {/* Время известно только в браузере: на сервере страница собрана заранее */}
        {hydrated && (
          <p className="font-mono text-[11px] text-muted">Обновятся через {resetText(msUntilMidnight(now))}</p>
        )}
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {quests.map((id, i) => {
          const t = findDaily(id);
          if (!t) return null;
          const count = dailyCount(daily, t);
          const done = Boolean(dailyDone[dailyKey(today, id)]);
          return (
            <motion.li
              key={id}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 transition-colors duration-300",
                done ? "neon-glow border-transparent" : "border-border",
              )}
              style={done ? ({ "--neon": "var(--success)" } as React.CSSProperties) : undefined}
            >
              <span
                className="grid size-9 shrink-0 place-items-center rounded-md bg-surface text-lg"
                aria-hidden="true"
              >
                <Icon name={done ? "check" : t.icon} className={cn("size-5", done ? "text-success" : "text-muted")} />
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-medium", done && "text-success")}>{t.title}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-success transition-[width] duration-500 ease-snappy motion-reduce:transition-none"
                      style={{ width: `${(count / t.goal) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-[11px] text-muted tabular-nums">
                    {count}/{t.goal}
                  </span>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-gold/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-text">
                +{t.xp} XP
              </span>
            </motion.li>
          );
        })}
      </ul>

      <div
        className={cn(
          "mt-3 flex items-center gap-3 rounded-lg border border-dashed px-3 py-2.5",
          chestOpen ? "neon-glow border-transparent" : "border-border-strong",
        )}
        style={chestOpen ? ({ "--neon": "var(--gold)" } as React.CSSProperties) : undefined}
      >
        <motion.span
          className={cn("grid size-9 place-items-center", chestOpen ? "text-gold" : "text-muted")}
          animate={chestOpen && !reduceMotion ? { rotate: [0, -8, 8, 0], scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 0.6 }}
        >
          <Icon name="gift" className="size-5" />
        </motion.span>
        <p className="min-w-0 flex-1 text-sm">
          {chestOpen ? (
            <span className="font-medium">Сундук дня открыт</span>
          ) : (
            <>
              <span className="font-medium">Сундук дня</span>
              <span className="text-muted"> — выполни все три квеста</span>
            </>
          )}
        </p>
        <span className="sr-only">
          Выполнено {doneCount} из {quests.length}
        </span>
        <span className="flex gap-1" aria-hidden="true">
          {quests.map((id) => (
            <span
              key={id}
              className={cn("size-2 rounded-full", dailyDone[dailyKey(today, id)] ? "bg-gold" : "bg-border-strong")}
            />
          ))}
        </span>
        <span className="shrink-0 font-mono text-[11px] font-semibold">+{CHEST_XP} XP</span>
      </div>
    </section>
  );
}
