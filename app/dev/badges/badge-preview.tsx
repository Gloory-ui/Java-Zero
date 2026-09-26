"use client";

import { type CSSProperties, useState } from "react";
import { AchievementBadge } from "@/components/game/achievement-badge";
import { badgeArt } from "@/components/game/badge-art";
import { RankBadge } from "@/components/game/rank-badge";
import { sound } from "@/lib/audio";
import type { QuestOutline } from "@/lib/content/outline";
import {
  type Achievement,
  type AchievementGroup,
  achievementCatalog,
  GROUP_LABEL,
  RARITY_LABEL,
  RARITY_ORDER,
} from "@/lib/game/achievements";
import { useToasts } from "@/lib/game/events";
import { RANKS } from "@/lib/game/ranks";

const GROUPS: readonly AchievementGroup[] = ["course", "mastery", "exam", "streak", "daily", "secret"];
const NEONS = [
  { id: "default", label: "Фирменный", color: "" },
  { id: "cyan", label: "Циан", color: "#22d3ee" },
  { id: "lime", label: "Лайм", color: "#a3e635" },
  { id: "gold", label: "Золото", color: "#f5a524" },
  { id: "violet", label: "Фиолет", color: "#c084fc" },
];

function effects(a: Achievement): string {
  const fx = badgeArt(a).fx;
  return [fx.iridescent && "перелив", fx.halo && "ореол", fx.glitch && "глитч", fx.orbit && "орбита"]
    .filter(Boolean)
    .join(" · ");
}

function Cell({ children, title, sub }: { children: React.ReactNode; title: string; sub?: string }) {
  return (
    <li className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface px-2 pt-8 pb-3 text-center">
      {children}
      <span className="mt-2 text-sm leading-tight font-semibold">{title}</span>
      {sub && <span className="text-xs leading-tight text-muted">{sub}</span>}
    </li>
  );
}

export function BadgePreview({ course }: { course: QuestOutline[] }) {
  const catalog = achievementCatalog(course);
  const [neon, setNeon] = useState(NEONS[0]?.id ?? "default");
  const neonColor = NEONS.find((n) => n.id === neon)?.color;
  const push = useToasts((s) => s.push);

  const sample = (rarity: Achievement["rarity"]) => catalog.find((a) => a.rarity === rarity && !a.secret);

  return (
    <main
      className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-10"
      style={neonColor ? ({ "--neon-user": neonColor } as CSSProperties) : undefined}
    >
      <header>
        <h1 className="font-display text-3xl font-semibold">Витрина значков</h1>
        <p className="mt-2 text-muted">
          {catalog.length} достижений и {RANKS.length} рангов. Страница только для разработки, на сайте её нет.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-semibold">Звуки</h2>
        <div className="flex flex-wrap gap-2">
          {RARITY_ORDER.toReversed().map((r) => (
            <button
              key={r}
              type="button"
              className="rounded-lg border border-border-strong px-3 py-2 text-sm hover:bg-card"
              onClick={() => sound.achievement(r)}
            >
              Достижение: {RARITY_LABEL[r]}
            </button>
          ))}
          <button
            type="button"
            className="rounded-lg border border-border-strong px-3 py-2 text-sm hover:bg-card"
            onClick={() => sound.achievement("rare", { glitch: true })}
          >
            Тайный знак
          </button>
          <button
            type="button"
            className="rounded-lg border border-border-strong px-3 py-2 text-sm hover:bg-card"
            onClick={() => sound.levelUp()}
          >
            Новый уровень
          </button>
          {[1, 2, 3, 4, 5].map((t) => (
            <button
              key={t}
              type="button"
              className="rounded-lg border border-border-strong px-3 py-2 text-sm hover:bg-card"
              onClick={() => sound.rankUp(t)}
            >
              Новый ранг, ступень {t}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {RARITY_ORDER.toReversed().map((r) => (
            <button
              key={r}
              type="button"
              className="rounded-lg border border-border-strong px-3 py-2 text-sm hover:bg-card"
              onClick={() => {
                const a = sample(r);
                if (!a) return;
                push({
                  icon: a.icon,
                  title: a.title,
                  desc: a.desc,
                  tone: "achievement",
                  rarity: a.rarity,
                  xp: a.xp,
                  badge: a,
                });
                sound.achievement(r);
              }}
            >
              Тост: {RARITY_LABEL[r]}
            </button>
          ))}
          <button
            type="button"
            className="rounded-lg border border-border-strong px-3 py-2 text-sm hover:bg-card"
            onClick={() => {
              const rank = RANKS[3] ?? RANKS[0];
              push({ icon: rank.icon, title: "Уровень 18", desc: rank.title, tone: "level", rank });
              sound.levelUp();
            }}
          >
            Тост: новый уровень
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-xl font-semibold">Ранги</h2>
          <fieldset className="flex flex-wrap gap-2">
            <legend className="sr-only">Цвет неона</legend>
            {NEONS.map((n) => (
              <button
                key={n.id}
                type="button"
                aria-pressed={neon === n.id}
                onClick={() => setNeon(n.id)}
                className="rounded-full border border-border-strong px-3 py-1 text-xs aria-pressed:bg-card aria-pressed:font-semibold"
              >
                {n.label}
              </button>
            ))}
          </fieldset>
        </div>
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {RANKS.map((r, i) => (
            <Cell key={r.title} title={r.title} sub={`с ${r.level} уровня · ступень ${Math.floor(i / 5) + 1}`}>
              <RankBadge rank={r} size={96} />
            </Cell>
          ))}
        </ol>
      </section>

      {GROUPS.map((g) => (
        <section key={g} className="flex flex-col gap-4">
          <h2 className="font-display text-xl font-semibold">{GROUP_LABEL[g]}</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {catalog
              .filter((a) => a.group === g)
              .map((a) => (
                <Cell key={a.id} title={a.title} sub={[RARITY_LABEL[a.rarity], effects(a)].filter(Boolean).join(" · ")}>
                  <AchievementBadge achievement={a} unlocked size={96} />
                </Cell>
              ))}
          </ul>
        </section>
      ))}

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-semibold">Закрытые и тайные</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {catalog
            .filter((a) => a.secret)
            .map((a) => (
              <Cell key={a.id} title="Тайный знак" sub="ещё не найден">
                <AchievementBadge achievement={a} unlocked={false} size={96} />
              </Cell>
            ))}
          {RARITY_ORDER.map((r) => {
            const a = sample(r);
            return a ? (
              <Cell key={r} title={a.title} sub={`закрыто · ${RARITY_LABEL[r]}`}>
                <AchievementBadge achievement={a} unlocked={false} size={96} />
              </Cell>
            ) : null;
          })}
          <Cell title={RANKS[10]?.title ?? ""} sub="ранг закрыт">
            <RankBadge rank={RANKS[10] ?? RANKS[0]} unlocked={false} size={96} />
          </Cell>
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-semibold">Размеры на сайте</h2>
        <p className="-mt-2 text-sm text-muted">
          Тост 44, список рангов 48, панель 40–56, каталог 60, карточка уровня 68.
        </p>
        <div className="flex flex-wrap items-center gap-6 rounded-xl border border-border bg-surface p-6">
          {[40, 44, 48, 56, 60, 68].map((size) => (
            <div key={size} className="flex items-center gap-4">
              <AchievementBadge achievement={sample("legendary") ?? catalog[0]} unlocked size={size} />
              <RankBadge rank={RANKS[22] ?? RANKS[0]} size={size} chip={false} />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
