"use client";

import { useMemo } from "react";

const COLORS = ["#ff4d6d", "#f5a524", "#10b981", "#38bdf8", "#a855f7"];
const PIECES = 28;

/**
 * Залп конфетти для редкого события — закрытого квеста. Только CSS: transform и opacity, около секунды.
 * При prefers-reduced-motion не показывается (правило в globals.css).
 */
export function Confetti() {
  // Разлёт считается один раз на залп; детерминированный шаг вместо Math.random, чтобы не было рассинхрона гидрации
  const pieces = useMemo(
    () =>
      Array.from({ length: PIECES }, (_, i) => {
        const angle = (i / PIECES) * Math.PI - Math.PI;
        const spread = 110 + ((i * 37) % 90);
        return {
          dx: Math.cos(angle) * spread,
          dy: Math.sin(angle) * spread * 0.9 + 140,
          rotate: ((i * 83) % 360) - 180,
          delay: (i % 5) * 25,
          color: COLORS[i % COLORS.length],
          wide: i % 3 === 0,
        };
      }),
    [],
  );

  return (
    <div aria-hidden="true" className="confetti pointer-events-none absolute top-6 left-1/2 size-0">
      {pieces.map((p, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: набор частиц фиксирован
          key={i}
          className="confetti-piece absolute rounded-[1px]"
          style={
            {
              width: p.wide ? 10 : 6,
              height: p.wide ? 4 : 8,
              backgroundColor: p.color,
              animationDelay: `${p.delay}ms`,
              "--dx": `${p.dx.toFixed(1)}px`,
              "--dy": `${p.dy.toFixed(1)}px`,
              "--r": `${p.rotate}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
