"use client";

import { Icon } from "@/components/ui/icon";
import { type GroupRank, groupRankIndex } from "@/lib/game/group";
import { type Rank, rankIndex } from "@/lib/game/ranks";
import { ArtBadge } from "./art-badge";
import { groupRankArt, groupRankTier, rankArt, rankTier, type Tier } from "./badge-art";

/**
 * Значок ранга. 100 рангов: 10 эпох по 10, у каждой эпохи своя рамка — пятиугольник, семиугольник и звёзды
 * на 10, 7, 8, 9, 6, 5, 12 и 16 лучей. Эффекты растут пятью ступенями: орбита, перелив, ореол и лавры,
 * на последней корона и глитч. Цвет — неон студента (--neon-user): значок перекрашивается вместе с профилем.
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
  return (
    <ArtBadge
      art={rankArt(rank, rankIndex(rank))}
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
  return rankTier(rankIndex(rank));
}

/**
 * Значок звания раздела «Группа»: гербы и печати в академическом золоте на тёмно-синем.
 * Пять ступеней по четыре звания: вымпел, щит, геральдический ромб, печать-розетка, коронованный герб.
 */
export function GroupRankBadge({
  rank,
  unlocked = true,
  size = 64,
  chip = true,
  className,
}: {
  rank: GroupRank;
  unlocked?: boolean;
  size?: number;
  chip?: boolean;
  className?: string;
}) {
  return (
    <ArtBadge
      art={groupRankArt(rank, groupRankIndex(rank))}
      unlocked={unlocked}
      size={size}
      className={className}
      kind="group-rank"
      iconScale={0.36}
      chip={chip ? String(rank.level) : undefined}
      glyph={<Icon name={rank.icon} className="size-full" strokeWidth={1.75} />}
    />
  );
}

export function groupRankTierOf(rank: GroupRank): Tier {
  return groupRankTier(groupRankIndex(rank));
}
