"use client";

import { type CSSProperties, type ReactNode, useId, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import s from "./achievement-badge.module.css";
import { type BadgeArt, svgMask } from "./badge-art";

const INNER = "translate(50 50) scale(0.84) translate(-50 -50)";
const SPARKLE = "M12 0c1 7 5 11 12 12-7 1-11 5-12 12-1-7-5-11-12-12 7-1 11-5 12-12Z";

/**
 * Анимации значка стоят на паузе, пока его не видно на экране. Пауза ставится до первой отрисовки, иначе
 * на странице с сотней значков все они успевают запуститься разом. Атрибут не в JSX: перерисовка React его не сбросит.
 */
function usePauseOffscreen() {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    el.dataset.paused = "";
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) delete el.dataset.paused;
      else el.dataset.paused = "";
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/**
 * Отрисовка значка по готовому рисунку (badge-art): рамка, лицо с узором, перелив, декор, искры и глитч.
 * Цвета могут быть CSS-переменными и color-mix, поэтому в SVG они идут через style, а не через атрибуты.
 */
export function ArtBadge({
  art,
  glyph,
  unlocked,
  size,
  chip,
  hidden = false,
  iconScale = 0.4,
  className,
  kind,
}: {
  art: BadgeArt;
  /** Иконка или знак внутри значка: наследует цвет через currentColor */
  glyph: ReactNode;
  unlocked: boolean;
  size: number;
  /** Подпись под значком: уровень серии или ранга */
  chip?: string;
  /** Тайный знак ещё не найден: вместо иконки «?», глитч работает и на закрытом */
  hidden?: boolean;
  iconScale?: number;
  className?: string;
  kind?: string;
}) {
  const id = useId();
  const ref = usePauseOffscreen();
  const { palette, ornament: orn, fx } = art;
  const rich = unlocked && size >= 48;
  const glitch = fx.glitch && (unlocked || hidden);
  // Декор вокруг рамки: на мелких значках (чипы, списки) он превращается в шум
  const decorOn = unlocked && size >= 44;
  const decorColors = palette.conic ? palette.conic.split(", ") : [...palette.stroke];
  const decorStops = decorColors.map((color, i) => ({ color, offset: i / (decorColors.length - 1) }));

  const vars = {
    width: size,
    height: size,
    "--spin": `${art.spinSec}s`,
    "--sheen": `${art.sheenSec}s`,
    "--delay": `${art.delaySec}s`,
    "--glitch": `${art.glitchSec}s`,
    "--conic": palette.conic,
    "--halo": `color-mix(in oklab, ${palette.color} 55%, transparent)`,
    "--glow": `color-mix(in oklab, ${palette.color} 45%, transparent)`,
    "--dot": palette.icon,
  } as CSSProperties;

  const faceMask = { maskImage: svgMask(art.shape), WebkitMaskImage: svgMask(art.shape) };
  const strokeMask = { maskImage: svgMask(art.shape, 5), WebkitMaskImage: svgMask(art.shape, 5) };
  const iconSize = size * iconScale;
  // Все пути слоя склеены в один <path>: DOM в десятки раз меньше, перерисовка слоя дешёвая
  const { decor } = art;
  const still = decor.still.join("");
  const spinning = decor.spin.join("");
  const filledShards = decor.shards
    .filter((p) => p.fill)
    .map((p) => p.d)
    .join("");
  const outlineShards = decor.shards
    .filter((p) => !p.fill)
    .map((p) => p.d)
    .join("");
  const leaves = decor.leaves.join("");
  const inner = decor.inner.join("");
  const ornamentLines = orn.paths.join("");
  const ornamentDots = orn.dots
    .map(([x, y, r]) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`)
    .join("");

  return (
    <span ref={ref} className={cn(s.badge, className)} style={vars} aria-hidden="true" data-badge={kind}>
      {unlocked && fx.glow && <span className={cn(s.layer, s.glow)} />}
      {rich && fx.halo && (
        <span className={cn(s.layer, s.halo)}>
          <span className={s.haloRays} />
        </span>
      )}

      {decorOn && (
        <span className={cn(s.layer, s.decor)}>
          <svg viewBox="-20 -20 140 140" aria-hidden="true" className="absolute inset-0 size-full overflow-visible">
            <defs>
              <linearGradient id={`${id}-decor`} x1="0" y1="0" x2="1" y2="1">
                {decorStops.map((stop) => (
                  <stop key={stop.offset} offset={stop.offset} style={{ stopColor: stop.color }} />
                ))}
              </linearGradient>
            </defs>
            {still && (
              <path
                d={still}
                fill="none"
                stroke={`url(#${id}-decor)`}
                strokeWidth="1.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {leaves && <path d={leaves} fill={`url(#${id}-decor)`} opacity="0.9" />}
          </svg>
          <span className={s.decorSpin}>
            <svg viewBox="-20 -20 140 140" aria-hidden="true" className="size-full overflow-visible">
              {spinning && (
                <path d={spinning} fill="none" stroke={`url(#${id}-decor)`} strokeWidth="0.9" strokeLinecap="round" />
              )}
              {filledShards && (
                <path
                  d={filledShards}
                  style={{ fill: palette.icon, stroke: palette.stroke[0] }}
                  strokeWidth="0.8"
                  opacity="0.8"
                />
              )}
              {outlineShards && (
                <path
                  d={outlineShards}
                  style={{ fill: "none", stroke: palette.stroke[0] }}
                  strokeWidth="0.8"
                  opacity="0.8"
                />
              )}
            </svg>
          </span>
        </span>
      )}

      <svg
        viewBox="0 0 100 100"
        aria-hidden="true"
        className={cn(s.layer, "size-full overflow-visible", !unlocked && "grayscale")}
      >
        <defs>
          <linearGradient id={`${id}-stroke`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: palette.stroke[0] }} />
            <stop offset="1" style={{ stopColor: palette.stroke[1] }} />
          </linearGradient>
          <radialGradient id={`${id}-face`} cx="0.5" cy="0.3" r="0.75">
            <stop offset="0" style={{ stopColor: art.face[0] }} />
            <stop offset="0.6" style={{ stopColor: art.face[1] }} />
            <stop offset="1" style={{ stopColor: art.face[2] }} />
          </radialGradient>
        </defs>
        <path
          d={art.shape}
          fill={unlocked ? `url(#${id}-face)` : "var(--card)"}
          stroke={unlocked ? `url(#${id}-stroke)` : "var(--border-strong)"}
          strokeWidth="4"
          strokeLinejoin="round"
          strokeDasharray={unlocked ? undefined : "6 5"}
        />
        <path
          d={art.shape}
          transform={INNER}
          fill="none"
          style={{ stroke: unlocked ? palette.stroke[0] : "var(--border)" }}
          strokeOpacity={unlocked ? 0.35 : 1}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {unlocked && inner && (
          <path d={inner} fill="none" style={{ stroke: palette.stroke[0] }} strokeOpacity="0.22" strokeWidth="0.9" />
        )}
      </svg>

      {unlocked && (
        <span className={cn(s.layer, s.masked)} style={faceMask}>
          <span className={s.ornament} style={{ opacity: size >= 48 ? 0.32 : 0.2 }}>
            <svg
              viewBox="0 0 100 100"
              aria-hidden="true"
              className="size-full overflow-visible"
              style={{ rotate: `${orn.rotate}deg`, stroke: palette.icon }}
              fill="none"
              strokeWidth="1.2"
              strokeLinecap="round"
            >
              {ornamentLines && <path d={ornamentLines} strokeDasharray={orn.kind === "rings" ? "2 3" : undefined} />}
              {ornamentDots && <path d={ornamentDots} style={{ fill: palette.icon }} stroke="none" />}
            </svg>
          </span>
          {fx.sheen && <span className={s.sheen} />}
        </span>
      )}

      {unlocked && fx.iridescent && (
        <span className={cn(s.layer, s.masked)} style={strokeMask}>
          <span className={cn(s.spin, s.conic)} />
        </span>
      )}

      {rich && fx.orbit && <span className={cn(s.layer, s.orbitDot)} />}

      <span
        className={s.icon}
        style={{ width: iconSize, height: iconSize, color: unlocked ? palette.icon : "var(--muted)" }}
      >
        <span className={cn("grid size-full place-items-center", glitch && s.glitchBase, !unlocked && "opacity-60")}>
          {glyph}
        </span>
        {glitch && (
          <>
            <span className={cn("grid size-full place-items-center", s.glitchA)}>{glyph}</span>
            <span className={cn("grid size-full place-items-center", s.glitchB)}>{glyph}</span>
            <span className={cn("grid size-full place-items-center", s.glitchSlice)}>{glyph}</span>
          </>
        )}
      </span>

      {rich &&
        art.sparkles.map((p) => (
          <svg
            key={`${p.x}-${p.y}`}
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={s.sparkle}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: (size * p.s) / 100,
              height: (size * p.s) / 100,
              animationDelay: `${p.delay}s`,
            }}
          >
            <path d={SPARKLE} style={{ fill: palette.icon }} />
          </svg>
        ))}

      {chip && (
        <span
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border bg-card px-1.5 font-mono text-[9px] leading-4 font-bold whitespace-nowrap"
          style={{ borderColor: unlocked ? palette.color : "var(--border-strong)", color: "var(--text)" }}
        >
          {chip}
        </span>
      )}
    </span>
  );
}
