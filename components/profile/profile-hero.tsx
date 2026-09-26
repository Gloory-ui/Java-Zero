"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { hashString } from "@/lib/game/day";
import type { Rank } from "@/lib/game/ranks";
import { ProfileAvatar } from "./profile-avatar";
import { ProfileBanner } from "./profile-banner";

export type HeroData = {
  name: string;
  handle: string | null;
  avatarUrl: string | null;
  banner: string;
  bannerUrl: string | null;
  frame: string;
  color: string;
  rank: Rank;
  level: number;
  title: string | null;
  bio: string;
  /** ISO-дата, с которой студент учится */
  since: string | null;
  /** Любой устойчивый id: из него строится строка «CAFE BABE …» */
  seed: string;
  achievements: { got: number; total: number };
};

// Intl без числа даёт «сентябрь 2026 г.», а после «С» нужен родительный падеж
const MONTHS = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

export function sinceText(iso: string): string {
  const d = new Date(iso);
  return `С ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Строка под именем: первые два слова — CAFE BABE, магическое число class-файлов Java, дальше — hex из id.
 * Пасхалка для тех, кто знает, как начинается любой .class.
 */
export function hexLine(seed: string): string {
  const hex = seed.replace(/[^0-9a-f]/gi, "").toUpperCase();
  const tail =
    hex.length >= 24 ? hex.slice(0, 24) : hashString(seed).toString(16).toUpperCase().padStart(8, "0").repeat(3);
  return ["CAFE", "BABE", ...(tail.match(/.{4}/g) ?? [])].join(" ");
}

function Chip({ children, color, className }: { children: ReactNode; color?: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-lg border bg-card/80 px-2.5 font-mono text-[11px] font-semibold tracking-wide uppercase backdrop-blur",
        className,
      )}
      style={
        color
          ? {
              borderColor: `color-mix(in oklab, ${color} 55%, transparent)`,
              boxShadow: `0 0 12px color-mix(in oklab, ${color} 25%, transparent)`,
            }
          : { borderColor: "var(--border-strong)" }
      }
    >
      {children}
    </span>
  );
}

/** Шапка профиля: баннер, аватар в рамке, имя, ник, чипы и кнопки */
export function ProfileHero({ data, actions }: { data: HeroData; actions?: ReactNode }) {
  const reduceMotion = useReducedMotion();
  const enter = (delay: number) =>
    reduceMotion
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } }
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <section aria-label="Профиль" className="relative">
      <ProfileBanner
        banner={data.banner}
        bannerUrl={data.bannerUrl}
        color={data.color}
        className="h-36 rounded-2xl sm:h-52"
      />
      <div className="relative -mt-16 flex flex-col gap-4 px-2 sm:-mt-20 sm:flex-row sm:items-end sm:gap-6 sm:px-6">
        <motion.div {...enter(0)} className="shrink-0 self-start sm:self-auto">
          <ProfileAvatar
            src={data.avatarUrl}
            name={data.name}
            frame={data.frame}
            color={data.color}
            size={120}
            className="sm:hidden"
          />
          <ProfileAvatar
            src={data.avatarUrl}
            name={data.name}
            frame={data.frame}
            color={data.color}
            size={152}
            className="hidden sm:inline-grid"
          />
        </motion.div>
        <motion.div {...enter(0.06)} className="min-w-0 flex-1 pb-1">
          <h1 className="font-display text-3xl leading-tight font-bold break-words sm:text-5xl">{data.name}</h1>
          {data.handle && <p className="mt-1 text-muted">@{data.handle}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip color={data.color}>
              <span style={{ color: data.color }}>
                <Icon name={data.rank.icon} className="size-3.5" />
              </span>
              {data.rank.title}
            </Chip>
            {data.title && <Chip color={data.color}>{data.title}</Chip>}
            <Chip>
              <Icon name="zap" className="size-3.5 text-gold" />
              ур. {data.level}
            </Chip>
            <Chip>
              <Icon name="trophy" className="size-3.5 text-gold" />
              {data.achievements.got}/{data.achievements.total}
            </Chip>
            {data.since && (
              <Chip className="normal-case">
                <Icon name="calendar-days" className="size-3.5 text-muted" />
                {sinceText(data.since)}
              </Chip>
            )}
          </div>
          <p className="mt-3 font-mono text-[11px] tracking-[0.3em] text-muted" aria-hidden="true">
            {hexLine(data.seed)}
          </p>
        </motion.div>
      </div>
      {data.bio && (
        <motion.p {...enter(0.12)} className="mt-4 max-w-2xl px-2 leading-relaxed text-text/90 sm:px-6">
          {data.bio}
        </motion.p>
      )}
      {actions && (
        <motion.div {...enter(0.16)} className="mt-5 flex flex-wrap gap-2 px-2 sm:justify-end sm:px-6">
          {actions}
        </motion.div>
      )}
    </section>
  );
}
