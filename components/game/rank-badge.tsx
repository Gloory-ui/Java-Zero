"use client";

import { Icon } from "@/components/ui/icon";
import { RANKS, type Rank } from "@/lib/game/ranks";
import { ArtBadge } from "./art-badge";
import { rankArt, rankTier, type Tier } from "./badge-art";

/**
 * Значок ранга. 25 рангов идут пятью ступенями: пятиугольник, звёзды на 10, 8, 6 и 12 лучей.
 * С каждой ступенью добавляются слои: орбита, перелив, ореол и лавры, на последней корона и глитч.
 * Цвет — неон студента (--neon-user), поэтому значок перекрашивается вместе с профилем.
 */
export function RankBadge({
  rank,
  unlocked = true,
  size = 64,
  chip = true,
  className,
}: {
  rank: Rank;
  unlocked?: boolean;
  size?: number;
  /** Подпись с уровнем, с которого даётся ранг */
  chip?: boolean;
  className?: string;
}) {
  const index = Math.max(
    0,
    RANKS.findIndex((r) => r.title === rank.title),
  );
  return (
    <ArtBadge
      art={rankArt(rank, index)}
      unlocked={unlocked}
      size={size}
      className={className}
      kind="rank"
      iconScale={0.36}
      chip={chip ? String(rank.level) : undefined}
      glyph={<Icon name={rank.icon} className="size-full" strokeWidth={1.75} />}
    />
  );
}

/** Ступень ранга 1…5: по ней растёт фанфара нового ранга */
export function rankTierOf(rank: Rank): Tier {
  return rankTier(
    Math.max(
      0,
      RANKS.findIndex((r) => r.title === rank.title),
    ),
  );
}
