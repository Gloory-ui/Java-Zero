"use client";

import { type CSSProperties, useEffect, useId, useRef } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { type Achievement, type Rarity, roman } from "@/lib/game/achievements";
import s from "./achievement-badge.module.css";
import { badgeArt, PALETTE, svgMask } from "./badge-art";

export const RARITY_COLOR: Record<Rarity, string> = {
  common: PALETTE.common.color,
  rare: PALETTE.rare.color,
  epic: PALETTE.epic.color,
  legendary: PALETTE.legendary.color,
};

const INNER = "translate(50 50) scale(0.84) translate(-50 -50)";
const SPARKLE = "M12 0c1 7 5 11 12 12-7 1-11 5-12 12-1-7-5-11-12-12 7-1 11-5 12-12Z";

/** Анимации значка встают на паузу, пока его не видно на экране */
function usePauseOffscreen() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
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
 * Значок достижения. Форма рамки — по группе, цвет и анимации — по редкости, узор, оттенок и темп — от id,
 * поэтому двух одинаковых значков нет. Эпические и легендарные переливаются, у легендарных, тайных и части
 * эпических бывает глитч.
 */
export function AchievementBadge({
  achievement,
  unlocked,
  size = 64,
  className,
}: {
  achievement: Achievement;
  unlocked: boolean;
  size?: number;
  className?: string;
}) {
  const id = useId();
  const ref = usePauseOffscreen();
  const art = badgeArt(achievement);
  const { palette, ornament: orn } = art;
  const hidden = achievement.secret && !unlocked;
  const rich = unlocked && size >= 48;
  const glitch = art.glitch && (unlocked || hidden);
  const rarity = achievement.rarity;
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
  const iconSize = size * 0.4;
  const glyph = hidden ? (
    <span className="font-display leading-none font-bold" style={{ fontSize: size * 0.32 }}>
      ?
    </span>
  ) : (
    <Icon name={achievement.icon} className="size-full" strokeWidth={1.75} />
  );

  return (
    <span ref={ref} className={cn(s.badge, className)} style={vars} aria-hidden="true" data-rarity={rarity}>
      {unlocked && rarity !== "common" && <span className={cn(s.layer, s.glow)} />}
      {rich && rarity === "legendary" && (
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
                  <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
                ))}
              </linearGradient>
            </defs>
            <g fill="none" stroke={`url(#${id}-decor)`} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
              {art.decor.still.map((d) => (
                <path key={d} d={d} />
              ))}
            </g>
            {art.decor.leaves.map((d) => (
              <path key={d} d={d} fill={`url(#${id}-decor)`} opacity="0.9" />
            ))}
          </svg>
          <span className={s.decorSpin}>
            <svg viewBox="-20 -20 140 140" aria-hidden="true" className="size-full overflow-visible">
              <g fill="none" stroke={`url(#${id}-decor)`} strokeWidth="0.9" strokeLinecap="round">
                {art.decor.spin.map((d) => (
                  <path key={d} d={d} />
                ))}
              </g>
              {art.decor.shards.map((p) => (
                <path
                  key={p.d}
                  d={p.d}
                  fill={p.fill ? palette.icon : "none"}
                  stroke={palette.stroke[0]}
                  strokeWidth="0.8"
                  opacity="0.8"
                />
              ))}
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
            <stop offset="0" stopColor={palette.stroke[0]} />
            <stop offset="1" stopColor={palette.stroke[1]} />
          </linearGradient>
          <radialGradient id={`${id}-face`} cx="0.5" cy="0.3" r="0.75">
            <stop offset="0" stopColor={`hsl(${art.faceHue} ${palette.sat}% 34%)`} />
            <stop offset="0.6" stopColor={`hsl(${art.faceHue} ${palette.sat * 0.8}% 16%)`} />
            <stop offset="1" stopColor={`hsl(${art.faceHue} ${palette.sat * 0.6}% 8%)`} />
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
          stroke={unlocked ? palette.stroke[0] : "var(--border)"}
          strokeOpacity={unlocked ? 0.35 : 1}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {unlocked &&
          art.decor.inner.map((d) => (
            <path key={d} d={d} fill="none" stroke={palette.stroke[0]} strokeOpacity="0.22" strokeWidth="0.9" />
          ))}
      </svg>

      {unlocked && (
        <span className={cn(s.layer, s.masked)} style={faceMask}>
          <span className={s.ornament} style={{ opacity: size >= 48 ? 0.32 : 0.2 }}>
            <svg
              viewBox="0 0 100 100"
              aria-hidden="true"
              className="size-full overflow-visible"
              style={{ rotate: `${orn.rotate}deg` }}
              fill="none"
              stroke={palette.icon}
              strokeWidth="1.2"
              strokeLinecap="round"
            >
              {orn.paths.map((d) => (
                <path key={d} d={d} strokeDasharray={orn.kind === "rings" ? "2 3" : undefined} />
              ))}
              {orn.dots.map(([x, y, r]) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={palette.icon} stroke="none" />
              ))}
            </svg>
          </span>
          {rarity !== "common" && <span className={s.sheen} />}
        </span>
      )}

      {unlocked && art.iridescent && (
        <span className={cn(s.layer, s.masked)} style={strokeMask}>
          <span className={cn(s.spin, s.conic)} />
        </span>
      )}

      {rich && rarity === "rare" && <span className={cn(s.layer, s.orbitDot)} />}

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
            <path d={SPARKLE} fill={palette.icon} />
          </svg>
        ))}

      {achievement.series && (
        <span
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border bg-card px-1.5 font-mono text-[9px] leading-4 font-bold"
          style={{ borderColor: unlocked ? palette.color : "var(--border-strong)", color: "var(--text)" }}
        >
          {roman(achievement.series.tier)}
        </span>
      )}
    </span>
  );
}
