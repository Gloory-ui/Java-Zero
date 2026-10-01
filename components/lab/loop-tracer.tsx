"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const STEP_MS = 35;

/** 1..n: номера строк и столбцов таблицы */
const range = (n: number) => Array.from({ length: n }, (_, k) => k + 1);

/**
 * Трассировка вложенных циклов после сдачи: ячейки заполняются в порядке итераций for i → for j,
 * подсвечиваются текущие i и j. Клик досчитывает сразу; при prefers-reduced-motion сетка заполнена сразу.
 */
export function LoopTracer({ rows, cols }: { rows: number; cols: number }) {
  const total = rows * cols;
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStep(total);
      return;
    }
    const id = setInterval(() => setStep((s) => (s >= total ? s : s + 1)), STEP_MS);
    return () => clearInterval(id);
  }, [total]);

  const done = step >= total;
  const current = done ? -1 : step - 1;
  const ci = current >= 0 ? Math.floor(current / cols) + 1 : 0;
  const cj = current >= 0 ? (current % cols) + 1 : 0;

  return (
    <button
      type="button"
      onClick={() => setStep(total)}
      className="w-full rounded-md border border-border bg-card p-3 text-left"
      aria-label="Трассировка циклов, нажмите, чтобы досчитать"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
        <span className="tracking-widest text-gold uppercase">Трассировка: for i → for j</span>
        <span aria-live="off">
          {done ? `готово: ${total} итераций` : current >= 0 ? `i = ${ci}, j = ${cj} → ${ci * cj}` : ""}
        </span>
      </div>
      <div
        className="grid gap-0.5 font-mono text-[11px]"
        style={{ gridTemplateColumns: `repeat(${cols + 1}, minmax(0, 1fr))` }}
      >
        <span className="py-0.5 text-center text-muted">i\j</span>
        {range(cols).map((j) => (
          <span
            key={`c${j}`}
            className={cn("rounded-sm py-0.5 text-center text-muted", j === cj && "bg-gold/20 text-gold")}
          >
            {j}
          </span>
        ))}
        {range(rows).map((i) => (
          <Row key={`r${i}`} i={i} cols={cols} step={step} current={current} activeRow={ci} />
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">Внешний цикл идёт по строкам, внутренний — по столбцам.</p>
    </button>
  );
}

function Row({
  i,
  cols,
  step,
  current,
  activeRow,
}: {
  i: number;
  cols: number;
  step: number;
  current: number;
  activeRow: number;
}) {
  return (
    <>
      <span className={cn("rounded-sm py-0.5 text-center text-muted", i === activeRow && "bg-gold/20 text-gold")}>
        {i}
      </span>
      {Array.from({ length: cols }, (_, c) => {
        const index = (i - 1) * cols + c;
        const filled = index < step;
        return (
          <span
            key={index}
            className={cn(
              "rounded-sm py-0.5 text-center",
              filled ? "bg-success/15 text-text" : "bg-card-hover text-transparent",
              index === current && "bg-success text-bg",
            )}
          >
            {filled ? i * (c + 1) : "·"}
          </span>
        );
      })}
    </>
  );
}
