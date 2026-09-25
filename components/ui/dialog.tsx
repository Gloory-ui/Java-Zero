"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { Icon } from "@/components/ui/icon";

/**
 * Модальное окно на нативном <dialog>: фокус внутри, Esc закрывает, фон затемняется.
 * Появление — масштаб от 0.96, не от нуля, 200 мс; при prefers-reduced-motion только прозрачность.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label={title}
      className="m-auto w-[min(720px,calc(100vw-2rem))] rounded-lg border border-border-strong bg-surface p-0 text-text shadow-2xl backdrop:bg-black/60 open:opacity-100 starting:open:opacity-0 motion-safe:open:scale-100 motion-safe:starting:open:scale-[0.96] motion-safe:transition-[opacity,scale] motion-safe:duration-200 motion-safe:ease-snappy"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
        <h2 className="font-display text-base font-semibold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="grid size-8 place-items-center rounded-md text-muted hover:bg-card hover:text-text"
        >
          <Icon name="x" className="size-4" />
        </button>
      </div>
      <div className="max-h-[70vh] overflow-auto p-5">{children}</div>
    </dialog>
  );
}
