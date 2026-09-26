"use client";

import { Icon } from "@/components/ui/icon";
import { type Achievement, type Rarity, roman } from "@/lib/game/achievements";
import { ArtBadge } from "./art-badge";
import { badgeArt, PALETTE } from "./badge-art";

export const RARITY_COLOR: Record<Rarity, string> = {
  common: PALETTE.common.color,
  rare: PALETTE.rare.color,
  epic: PALETTE.epic.color,
  legendary: PALETTE.legendary.color,
};

/**
 * Значок достижения. Форма рамки — по группе, цвет и анимации — по редкости, узор, оттенок, декор и темп — от id,
 * поэтому двух одинаковых значков нет. Эпические и легендарные переливаются, у легендарных, тайных и части
 * эпических бывает глитч.
 */
export function AchievementBadge({
  achievement,
  unlocked,
  size = 64,
  className,
}: {
  achievement: Pick<Achievement, "id" | "group" | "rarity" | "secret" | "series" | "icon">;
  unlocked: boolean;
  size?: number;
  className?: string;
}) {
  const hidden = Boolean(achievement.secret) && !unlocked;
  return (
    <ArtBadge
      art={badgeArt(achievement)}
      unlocked={unlocked}
      hidden={hidden}
      size={size}
      className={className}
      kind={achievement.rarity}
      chip={achievement.series ? roman(achievement.series.tier) : undefined}
      glyph={
        hidden ? (
          <span className="font-display leading-none font-bold" style={{ fontSize: size * 0.32 }}>
            ?
          </span>
        ) : (
          <Icon name={achievement.icon} className="size-full" strokeWidth={1.75} />
        )
      }
    />
  );
}
