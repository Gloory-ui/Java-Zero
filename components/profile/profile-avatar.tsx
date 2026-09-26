"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

const HEX_CLIP = "polygon(50% 0, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)";

function Face({ src, name, size, hex }: { src: string | null; name: string | null; size: number; hex: boolean }) {
  const [broken, setBroken] = useState<string | null>(null);
  const style = { width: size, height: size, clipPath: hex ? HEX_CLIP : undefined };
  if (src && broken !== src) {
    return (
      // biome-ignore lint/performance/noImgElement: аватар из Supabase Storage, GitHub или Google — next/image потребовал бы список доменов
      <img
        src={src}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setBroken(src)}
        className={cn("bg-card object-cover", !hex && "rounded-full")}
        style={style}
      />
    );
  }
  return (
    <span
      className={cn("grid place-items-center bg-card font-display font-bold text-text", !hex && "rounded-full")}
      style={{ ...style, fontSize: size * 0.4 }}
    >
      {(name ?? "?").slice(0, 1).toUpperCase()}
    </span>
  );
}

/**
 * Аватар с рамкой из каталога украшений. Цвет рамки — неон профиля.
 * Анимации рамок (вращение, пульс, орбита) — в app/globals.css, только transform и opacity.
 */
export function ProfileAvatar({
  src,
  name,
  frame,
  color,
  size = 112,
  className,
}: {
  src: string | null;
  name: string | null;
  frame: string;
  color: string;
  size?: number;
  className?: string;
}) {
  const neon = { "--neon": color } as React.CSSProperties;

  if (frame === "hex") {
    return (
      <span className={cn("relative inline-grid place-items-center", className)} style={neon}>
        <svg
          viewBox="0 0 100 100"
          className="absolute -inset-2 size-[calc(100%+1rem)] overflow-visible"
          aria-hidden="true"
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        >
          <path d="M50 2 95 26v48L50 98 5 74V26Z" fill="none" stroke={color} strokeWidth="3" />
        </svg>
        <Face src={src} name={name} size={size} hex />
      </span>
    );
  }

  if (frame === "neon" || frame === "legend") {
    return (
      <span
        className={cn(
          "neon-ring inline-grid rounded-full p-[3px]",
          frame === "legend" && "neon-ring-legend",
          className,
        )}
        // Свечение — статичная тень самого кольца: вращается только слой блика внутри
        style={{ ...neon, boxShadow: `0 0 ${Math.round(size / 5)}px color-mix(in oklab, ${color} 45%, transparent)` }}
      >
        <span className="rounded-full bg-bg p-[2px]">
          <Face src={src} name={name} size={size - 10} hex={false} />
        </span>
      </span>
    );
  }

  const ringed = frame === "pulse" || frame === "dual" || frame === "orbit";
  return (
    <span
      className={cn(
        "relative inline-grid rounded-full p-[3px]",
        ringed ? `frame-${frame}` : "border border-border-strong",
        className,
      )}
      style={{ ...neon, ...(ringed ? { boxShadow: `inset 0 0 0 2px ${color}` } : {}) }}
    >
      <Face src={src} name={name} size={size - 6} hex={false} />
    </span>
  );
}
