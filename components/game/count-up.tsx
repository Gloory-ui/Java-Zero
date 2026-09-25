"use client";

import { animate, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

const format = new Intl.NumberFormat("ru-RU");

/**
 * Число, которое досчитывает до нового значения, а не подменяется. Пишет прямо в DOM, без ререндеров на кадр.
 * При prefers-reduced-motion значение ставится сразу.
 */
export function CountUp({
  value,
  duration = 0.6,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(value);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const from = shown.current;
    if (reduceMotion || from === value) {
      shown.current = value;
      el.textContent = format.format(value);
      return;
    }
    const controls = animate(from, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        shown.current = Math.round(v);
        el.textContent = format.format(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [value, duration, reduceMotion]);

  return (
    <span ref={ref} className={className}>
      {format.format(shown.current)}
    </span>
  );
}
