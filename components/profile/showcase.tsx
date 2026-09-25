"use client";

import { motion, useReducedMotion } from "motion/react";
import { AchievementBadge, RARITY_COLOR } from "@/components/game/achievement-badge";
import { rarityText } from "@/components/game/achievements-panel";
import { Icon } from "@/components/ui/icon";
import type { QuestOutline } from "@/lib/content/outline";
import { findAchievement } from "@/lib/game/achievements";
import { useRarity } from "@/lib/game/rarity";

/**
 * Витрина: до четырёх достижений, которыми студент гордится. Пустая витрина в своём профиле
 * подсказывает, где её собрать; в чужом профиле не показывается.
 */
export function Showcase({
  ids,
  course,
  onEdit,
}: {
  ids: string[];
  course: QuestOutline[];
  /** Свой профиль: кнопка «Собрать витрину» */
  onEdit?: () => void;
}) {
  const rarity = useRarity();
  const reduceMotion = useReducedMotion();
  const items = ids.map((id) => findAchievement(course, id)).filter((a) => a !== undefined);
  if (items.length === 0 && !onEdit) return null;

  return (
    <section aria-labelledby="showcase-title" className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="showcase-title" className="font-display text-lg font-semibold">
          Витрина
        </h2>
        {onEdit && items.length > 0 && (
          <button type="button" onClick={onEdit} className="text-sm text-accent hover:underline">
            Изменить
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <button
          type="button"
          onClick={onEdit}
          className="group flex items-center gap-4 rounded-xl border border-dashed border-border-strong p-5 text-left transition-colors duration-200 hover:border-accent"
        >
          <motion.span
            className="grid size-12 shrink-0 place-items-center rounded-xl bg-card text-gold"
            animate={reduceMotion ? {} : { y: [0, -4, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            <Icon name="trophy" className="size-6" />
          </motion.span>
          <span>
            <span className="block font-semibold">Собери витрину</span>
            <span className="block text-sm text-muted">
              Выбери до четырёх достижений: их первыми увидят в твоём профиле.
            </span>
          </span>
          <Icon
            name="arrow-right"
            className="ml-auto size-5 text-muted transition-transform group-hover:translate-x-1"
          />
        </button>
      ) : (
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {items.map((a, i) => (
            <motion.li
              key={a.id}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center gap-2 rounded-xl border bg-surface px-3 pt-5 pb-4 text-center"
              style={{
                borderColor: `color-mix(in oklab, ${RARITY_COLOR[a.rarity]} 45%, transparent)`,
                boxShadow: `0 0 24px color-mix(in oklab, ${RARITY_COLOR[a.rarity]} 14%, transparent)`,
              }}
            >
              <AchievementBadge achievement={a} unlocked size={64} />
              <p className="text-sm leading-tight font-semibold">{a.title}</p>
              <p className="text-[11px] text-muted">{rarityText(a, rarity)}</p>
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
}
