"use client";

import { useEffect } from "react";
import { useGame } from "@/components/game/use-game";
import {
  ACCENTS,
  accentById,
  BANNERS,
  bannerById,
  CUSTOM_BANNER,
  DEFAULT_LOOK,
  FRAMES,
  frameById,
  isUnlocked,
  type Owned,
} from "@/lib/profile/cosmetics";
import { useProfile, useProfileHydrated } from "@/lib/profile/store";
import { useProgress } from "@/lib/progress/store";

/**
 * Действующее оформление. Украшение, которое перестало быть доступно (например, после сброса квеста),
 * не показывается: вместо него — значение по умолчанию. Выбор студента сохраняется и вернётся, когда условие выполнится.
 */
export function useLook(owned: Owned) {
  const profile = useProfile();
  const accent = accentById(profile.accent);
  const frame = frameById(profile.frame);
  const banner = bannerById(profile.banner);
  const accentOk = isUnlocked(accent.unlock, owned);
  return {
    accentId: accentOk ? accent.id : DEFAULT_LOOK.accent,
    color: (accentOk ? accent : ACCENTS[0]).color,
    frame: (isUnlocked(frame.unlock, owned) ? frame : FRAMES[1]).id,
    banner:
      profile.banner === CUSTOM_BANNER && profile.bannerUrl
        ? CUSTOM_BANNER
        : banner && isUnlocked(banner.unlock, owned)
          ? banner.id
          : BANNERS[0].id,
  };
}

/**
 * Цвет неона из профиля перекрашивает всю игровую систему: уровень, ранг, кольца, праздничные экраны.
 * Ставится CSS-переменной на <html>; фирменный цвет — это отсутствие переменной, тогда работает --accent темы.
 */
export function NeonSync() {
  const profileReady = useProfileHydrated();
  const { hydrated, level } = useGame();
  const achievements = useProgress((s) => s.achievements);
  const { accentId, color } = useLook({ level: level.level, achievements });

  useEffect(() => {
    if (!profileReady || !hydrated) return;
    const root = document.documentElement.style;
    if (accentId === DEFAULT_LOOK.accent) root.removeProperty("--neon-user");
    else root.setProperty("--neon-user", color);
  }, [profileReady, hydrated, accentId, color]);

  return null;
}
