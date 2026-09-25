"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { sound } from "@/lib/audio";
import { useCelebration } from "@/lib/game/events";
import { rankForLevel } from "@/lib/game/ranks";
import { plural } from "@/lib/plural";
import { Confetti } from "./confetti";
import { CountUp } from "./count-up";

const ACHIEVEMENTS = ["достижение", "достижения", "достижений"] as const;

/**
 * Новый уровень, новый ранг, переход на систему опыта. Событие редкое, поэтому громкое: затемнение, неоновое
 * кольцо, конфетти. Esc и кнопка закрывают; при prefers-reduced-motion — только прозрачность.
 */
export function Celebration() {
  const current = useCelebration((s) => s.current);
  const close = useCelebration((s) => s.close);
  const ref = useRef<HTMLDialogElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (current && !d.open) {
      d.showModal();
      sound.achievement();
    }
    if (!current && d.open) d.close();
  }, [current]);

  const level = current?.level ?? 1;
  const rank = current?.kind === "level" && current.rank ? current.rank : rankForLevel(level);
  const newRank = current?.kind === "level" && current.rank !== undefined;

  return (
    <dialog
      ref={ref}
      onClose={close}
      aria-labelledby="celebration-title"
      className="m-auto w-[min(440px,calc(100vw-2rem))] overflow-visible rounded-2xl border border-border-strong bg-surface p-0 text-text shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm open:opacity-100 starting:open:opacity-0 motion-safe:open:scale-100 motion-safe:starting:open:scale-[0.95] motion-safe:transition-[opacity,scale] motion-safe:duration-300 motion-safe:ease-snappy"
    >
      {current && (
        <div className="relative flex flex-col items-center gap-4 px-6 pt-10 pb-6 text-center">
          <Confetti />
          <motion.div
            className="neon-ring rounded-3xl p-[3px]"
            initial={reduceMotion ? { opacity: 0 } : { scale: 0.6, rotate: -12, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={reduceMotion ? { duration: 0.2 } : { type: "spring", damping: 14, stiffness: 180 }}
          >
            <div className="grid size-24 place-items-center rounded-[21px] bg-card text-neon-ink">
              <Icon name={rank.icon} className="size-12" strokeWidth={1.5} />
            </div>
          </motion.div>

          {current.kind === "upgrade" ? (
            <>
              <p className="font-mono text-[11px] tracking-[0.25em] text-muted uppercase">Новая система наград</p>
              <h2 id="celebration-title" className="font-display text-2xl font-bold">
                Уровень <CountUp value={level} duration={1.2} />
              </h2>
              <p className="text-sm leading-relaxed text-muted">
                Мы пересчитали всё, что ты уже сдал: <span className="font-semibold text-text">{current.xp} XP</span> и{" "}
                {plural(current.achievements, ACHIEVEMENTS)}. Теперь опыт дают этапы, достижения и квесты дня, а ранг
                растёт вместе с уровнем.
              </p>
            </>
          ) : (
            <>
              <p className="font-mono text-[11px] tracking-[0.25em] text-muted uppercase">
                {newRank ? "Новый ранг" : "Новый уровень"}
              </p>
              <h2
                id="celebration-title"
                className="neon-text font-display text-4xl font-bold"
                style={{ "--neon": "var(--gold)" } as React.CSSProperties}
              >
                Уровень <CountUp value={level} duration={0.8} />
              </h2>
              {newRank && <p className="font-display text-lg font-semibold text-neon-ink">{rank.title}</p>}
            </>
          )}

          <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            {current.kind === "upgrade" && (
              <ButtonLink href="/profile" variant="secondary" onClick={close}>
                Открыть профиль
              </ButtonLink>
            )}
            <button
              type="button"
              onClick={close}
              className="inline-flex h-10 items-center justify-center rounded-md bg-accent-solid px-5 text-sm font-semibold text-white transition-[background-color,scale] duration-150 ease-snappy hover:bg-accent-solid-hover active:scale-[0.97]"
            >
              Продолжить
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
