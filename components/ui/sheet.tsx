"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

const CLOSE_MS = 220;

/**
 * Выдвижная панель на нативном <dialog>: справа на широком экране, снизу на телефоне.
 * Появление — сдвиг с iOS-кривой; закрытие тоже анимируется, а не обрывается. Esc и клик по фону закрывают.
 * height — высота на телефоне: у разных панелей она разная, чтобы было видно, что открыто.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  height = "max-h-[85dvh]",
  width = "sm:w-[460px]",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  height?: string;
  /** Ширина на широком экране */
  width?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setClosing(false);
      d.showModal();
    }
    if (!open && d.open) d.close();
  }, [open]);

  const requestClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      ref.current?.close();
      setClosing(false);
      onClose();
    }, CLOSE_MS);
  }, [onClose]);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: с клавиатуры панель закрывает Esc (событие cancel) и кнопка «Закрыть»
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
      onClick={(e) => {
        // Клик по затемнению: событие приходит на сам <dialog>, а не на панель внутри
        if (e.target === e.currentTarget) requestClose();
      }}
      data-closing={closing || undefined}
      className={cn(
        "m-0 hidden flex-col overflow-hidden border-border-strong bg-surface p-0 text-text shadow-2xl backdrop:bg-black/60 open:flex",
        // Телефон: снизу, на всю ширину
        "inset-x-0 top-auto bottom-0 w-full max-w-none rounded-t-2xl border-t",
        height,
        // Широкий экран: справа, на всю высоту
        "sm:inset-y-0 sm:right-0 sm:left-auto sm:h-dvh sm:max-h-none sm:rounded-none sm:rounded-l-2xl sm:border-t-0 sm:border-l",
        width,
        "motion-safe:transition-[translate,opacity,display,overlay] motion-safe:transition-discrete motion-safe:duration-[400ms] motion-safe:ease-drawer",
        "translate-y-0 opacity-100 starting:open:translate-y-full sm:translate-x-0 sm:translate-y-0 sm:starting:open:translate-x-full sm:starting:open:translate-y-0",
        "data-closing:translate-y-full data-closing:duration-[220ms] data-closing:ease-exit sm:data-closing:translate-x-full sm:data-closing:translate-y-0",
        "backdrop:transition-opacity backdrop:duration-300 starting:open:backdrop:opacity-0 data-closing:backdrop:opacity-0",
      )}
    >
      <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border-strong sm:hidden" aria-hidden="true" />
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
        <button
          type="button"
          onClick={requestClose}
          aria-label="Закрыть"
          className="grid size-9 shrink-0 place-items-center rounded-md text-muted transition-colors duration-150 hover:bg-card hover:text-text"
        >
          <Icon name="x" className="size-4" />
        </button>
      </header>
      {/* Содержимое живёт, только пока панель открыта или закрывается: закрытые панели не нагружают страницу */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">{(open || closing) && children}</div>
    </dialog>
  );
}
