"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import type { QuestOutline } from "@/lib/content/outline";
import { type AchievementGroup, achievementCatalog, facts, GROUP_LABEL } from "@/lib/game/achievements";
import { useRarity } from "@/lib/game/rarity";
import { useProgress, useProgressHydrated } from "@/lib/progress/store";
import { useVisibleCourse } from "@/lib/progress/visible";
import { AchievementBadge, RARITY_COLOR } from "./achievement-badge";
import { rarityText, whenText } from "./achievements-panel";

type Filter = "all" | AchievementGroup;

const FILTERS: readonly Filter[] = ["all", "course", "mastery", "exam", "streak", "daily", "group", "secret"];

/** Все достижения курса по группам: условие, редкость, прогресс серии и дата получения */
export function AchievementsCatalog({ course: fullCourse }: { course: QuestOutline[] }) {
  // КТ видят только участники группы
  const course = useVisibleCourse(fullCourse);
  const hydrated = useProgressHydrated();
  const progress = useProgress();
  const rarity = useRarity();
  const reduceMotion = useReducedMotion();
  const [filter, setFilter] = useState<Filter>("all");

  const catalog = achievementCatalog(course);
  const f = useMemo(() => facts(progress, course), [progress, course]);
  const shown = catalog.filter((a) => filter === "all" || a.group === filter);
  const got = (group: Filter) =>
    catalog.filter((a) => (group === "all" || a.group === group) && progress.achievements[a.id]).length;
  const total = (group: Filter) => catalog.filter((a) => group === "all" || a.group === group).length;

  return (
    <div className={cn("flex flex-col gap-6", !hydrated && "opacity-0")}>
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Фильтр по группам</legend>
        {/* Пустые группы не показываем: «Группа» видна только участникам раздела с КТ */}
        {FILTERS.filter((id) => total(id) > 0).map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors duration-150 ease-snappy active:scale-[0.97]",
              filter === id
                ? "border-accent bg-accent-soft text-text"
                : "border-border text-muted hover:border-border-strong hover:text-text",
            )}
          >
            {id === "all" ? "Все" : GROUP_LABEL[id]}{" "}
            <span className="font-mono text-xs tabular-nums">
              {got(id)}/{total(id)}
            </span>
          </button>
        ))}
      </fieldset>

      <ul className="grid gap-3 sm:grid-cols-2">
        <AnimatePresence initial={false} mode="popLayout">
          {shown.map((a) => {
            const at = progress.achievements[a.id];
            const hidden = a.secret && !at;
            const count = a.count && a.goal ? Math.min(a.goal, a.count(f)) : null;
            return (
              <motion.li
                key={a.id}
                layout={!reduceMotion}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "flex items-start gap-4 rounded-xl border bg-surface p-4",
                  at ? "" : "border-dashed border-border-strong",
                )}
                style={
                  at ? { borderColor: `color-mix(in oklab, ${RARITY_COLOR[a.rarity]} 45%, transparent)` } : undefined
                }
              >
                <AchievementBadge achievement={a} unlocked={Boolean(at)} size={60} />
                <div className="min-w-0 flex-1">
                  <p className={cn("font-semibold", !at && "text-muted")}>{hidden ? "Тайный знак" : a.title}</p>
                  <p className="mt-0.5 text-sm text-muted">
                    {hidden ? "Условие откроется, когда найдёшь этот знак." : a.desc}
                  </p>
                  {count !== null && !at && a.goal && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-card">
                        <div
                          className="h-full rounded-full transition-[width] duration-500 ease-snappy"
                          style={{ width: `${(count / a.goal) * 100}%`, backgroundColor: RARITY_COLOR[a.rarity] }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-muted tabular-nums">
                        {count}/{a.goal}
                      </span>
                    </div>
                  )}
                  <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                    <span>{rarityText(a, rarity)}</span>
                    <span className="font-mono font-semibold text-text">+{a.xp} XP</span>
                    {at && <span>Получено {whenText(at)}</span>}
                    {a.titleReward && <span>Титул: {a.titleReward}</span>}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
