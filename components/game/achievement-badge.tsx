import { useId } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { type Achievement, type Rarity, roman } from "@/lib/game/achievements";

export const RARITY_COLOR: Record<Rarity, string> = {
  common: "#94a3b8",
  rare: "#38bdf8",
  epic: "#a855f7",
  legendary: "#f5a524",
};

const HEX = "M50 4 91 27.5v45L50 96 9 72.5v-45Z";
const HEX_INNER = "M50 14 82 32.5v35L50 86 18 67.5v-35Z";

/** Шестигранник достижения: обводка и свечение по редкости, внутри значок, снизу уровень серии */
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
  const color = RARITY_COLOR[achievement.rarity];
  const hidden = achievement.secret && !unlocked;

  return (
    <span
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 100"
        className={cn("absolute inset-0 size-full overflow-visible", !unlocked && "opacity-45 grayscale")}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`${id}-stroke`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={color} />
            <stop offset="1" stopColor={color} stopOpacity="0.35" />
          </linearGradient>
          <radialGradient id={`${id}-fill`} cx="0.5" cy="0.35" r="0.7">
            <stop offset="0" stopColor={color} stopOpacity={unlocked ? 0.35 : 0.1} />
            <stop offset="1" stopColor="var(--card)" stopOpacity="1" />
          </radialGradient>
        </defs>
        {unlocked && achievement.rarity !== "common" && (
          <path d={HEX} fill="none" stroke={color} strokeWidth="6" opacity="0.35" style={{ filter: "blur(6px)" }} />
        )}
        <path
          d={HEX}
          fill={`url(#${id}-fill)`}
          stroke={`url(#${id}-stroke)`}
          strokeWidth="4"
          strokeDasharray={unlocked ? undefined : "6 5"}
        />
        <path d={HEX_INNER} fill="none" stroke={color} strokeOpacity="0.25" strokeWidth="1.5" />
      </svg>
      <span
        className={cn("relative grid place-items-center", !unlocked && "text-muted")}
        style={{ color: unlocked ? color : undefined, width: size * 0.4, height: size * 0.4 }}
      >
        {hidden ? (
          <span className="font-display font-bold" style={{ fontSize: size * 0.32 }}>
            ?
          </span>
        ) : (
          <Icon name={achievement.icon} className={cn("size-full", !unlocked && "opacity-60")} strokeWidth={1.75} />
        )}
      </span>
      {achievement.series && (
        <span
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border bg-card px-1.5 font-mono text-[9px] leading-4 font-bold"
          style={{ borderColor: color, color: "var(--text)" }}
        >
          {roman(achievement.series.tier)}
        </span>
      )}
    </span>
  );
}
