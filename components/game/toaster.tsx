"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import { RARITY_LABEL } from "@/lib/game/achievements";
import { type Toast, useToasts } from "@/lib/game/events";
import { RARITY_COLOR } from "./achievement-badge";

const SHOW_MS = 4500;

/** Карточки наград: появляются снизу, сами уходят через 4,5 с, клик закрывает сразу. */
export function Toaster() {
  const items = useToasts((s) => s.items);
  return (
    <section
      aria-label="Награды"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end"
    >
      <AnimatePresence initial={false}>
        {items.map((toast) => (
          <ToastCard key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </section>
  );
}

function kicker(toast: Toast): string {
  if (toast.tone === "daily") return "Квест дня";
  if (toast.tone === "level") return "Новый уровень";
  if (toast.tone === "egg") return toast.rarity ? "Тайный знак найден" : "Пасхалка";
  return toast.rarity ? `Достижение · ${RARITY_LABEL[toast.rarity]}` : "Достижение";
}

function ToastCard({ toast }: { toast: Toast }) {
  const dismiss = useToasts((s) => s.dismiss);
  const reduceMotion = useReducedMotion();
  const color = toast.rarity
    ? RARITY_COLOR[toast.rarity]
    : toast.tone === "daily"
      ? "var(--success)"
      : "var(--neon-user)";

  useEffect(() => {
    const id = setTimeout(() => dismiss(toast.id), SHOW_MS);
    return () => clearTimeout(id);
  }, [dismiss, toast.id]);

  return (
    <motion.button
      type="button"
      layout={!reduceMotion}
      onClick={() => dismiss(toast.id)}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className="neon-glow pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg bg-surface p-3 text-left shadow-2xl"
      style={{ "--neon": color } as React.CSSProperties}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-card" style={{ color }}>
        <Icon name={toast.icon} className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-mono text-[11px] tracking-widest text-muted uppercase">{kicker(toast)}</span>
        <span className="block font-semibold">{toast.title}</span>
        <span className="block text-sm text-muted">{toast.desc}</span>
      </span>
      {toast.xp !== undefined && (
        <span className="shrink-0 self-center rounded-full bg-gold/15 px-2 py-0.5 font-mono text-xs font-bold text-text">
          +{toast.xp} XP
        </span>
      )}
    </motion.button>
  );
}
