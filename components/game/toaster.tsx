"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect } from "react";
import { cn } from "@/lib/cn";
import { type Toast, useToasts } from "@/lib/game/events";

const SHOW_MS = 4500;

/** Карточки ачивок и нового ранга: появляются снизу, сами уходят через 4,5 с, клик закрывает сразу. */
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

function ToastCard({ toast }: { toast: Toast }) {
  const dismiss = useToasts((s) => s.dismiss);
  const reduceMotion = useReducedMotion();

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
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border bg-surface p-3 text-left shadow-2xl",
        toast.tone === "rank" ? "border-gold/60" : toast.tone === "egg" ? "border-accent/60" : "border-border-strong",
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-card text-xl" aria-hidden="true">
        {toast.icon}
      </span>
      <span className="min-w-0">
        <span className="block font-mono text-[11px] tracking-widest text-gold uppercase">
          {toast.tone === "rank" ? "Ранг" : toast.tone === "egg" ? "Пасхалка" : "Ачивка открыта"}
        </span>
        <span className="block font-semibold">{toast.title}</span>
        <span className="block text-sm text-muted">{toast.desc}</span>
      </span>
    </motion.button>
  );
}
