"use client";

import { type ReactNode, useRef, useState } from "react";
import { AchievementBadge } from "@/components/game/achievement-badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Sheet } from "@/components/ui/sheet";
import { useAccount } from "@/lib/account/store";
import { cn } from "@/lib/cn";
import type { QuestOutline } from "@/lib/content/outline";
import { achievementCatalog, RARITY_ORDER } from "@/lib/game/achievements";
import { uploadProfileImage } from "@/lib/profile/actions";
import {
  ACCENTS,
  accentById,
  availableTitles,
  BANNERS,
  CUSTOM_BANNER,
  FRAMES,
  isUnlocked,
  type Owned,
  SHOWCASE_MAX,
  type Unlock,
  unlockText,
} from "@/lib/profile/cosmetics";
import { MediaError, type MediaKind } from "@/lib/profile/media";
import { useProfile } from "@/lib/profile/store";
import { ProfileAvatar } from "./profile-avatar";
import { ProfileBanner } from "./profile-banner";

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-b border-border pb-6 last:border-0 last:pb-0">
      <div>
        <h3 className="font-semibold">{title}</h3>
        {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

/** Плитка выбора: выбранная подсвечена неоном, закрытая показывает условие открытия */
function Option({
  selected,
  locked,
  unlock,
  course,
  onSelect,
  label,
  color,
  children,
}: {
  selected: boolean;
  locked: boolean;
  unlock: Unlock;
  course: QuestOutline[];
  onSelect: () => void;
  label: string;
  color: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={locked}
      onClick={onSelect}
      className={cn(
        "group relative flex flex-col items-center gap-2 rounded-xl border bg-card p-2.5 text-center transition-[border-color,translate] duration-150 ease-snappy enabled:hover:-translate-y-0.5 enabled:active:scale-[0.97]",
        selected ? "neon-glow border-transparent" : "border-border enabled:hover:border-border-strong",
        locked && "cursor-not-allowed",
      )}
      style={selected ? ({ "--neon": color } as React.CSSProperties) : undefined}
    >
      <span className={cn("grid w-full place-items-center", locked && "opacity-40 grayscale")}>{children}</span>
      <span className="text-xs leading-tight font-medium">{label}</span>
      {locked && (
        <span className="flex items-center gap-1 text-[10px] leading-tight text-muted">
          <Icon name="lock" className="size-3" />
          {unlockText(unlock, course)}
        </span>
      )}
      {selected && (
        <span className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-success text-bg">
          <Icon name="check" className="size-3" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

function Upload({ kind, label }: { kind: MediaKind; label: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<{ kind: "idle" | "busy" } | { kind: "error"; text: string }>({ kind: "idle" });

  return (
    <div className="flex flex-col gap-1.5">
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        tabIndex={-1}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setState({ kind: "busy" });
          try {
            await uploadProfileImage(kind, file);
            setState({ kind: "idle" });
          } catch (error) {
            setState({
              kind: "error",
              text: error instanceof MediaError || error instanceof Error ? error.message : "Не получилось загрузить.",
            });
          }
        }}
      />
      <Button
        variant="secondary"
        disabled={state.kind === "busy"}
        onClick={() => input.current?.click()}
        className="self-start"
      >
        <Icon name="rocket" className="size-4" />
        {state.kind === "busy" ? "Загружаем…" : label}
      </Button>
      {state.kind === "error" && (
        <p className="text-sm text-danger" aria-live="polite">
          {state.text}
        </p>
      )}
    </div>
  );
}

/** Оформление профиля: цвет неона, рамка, баннер, свои картинки, титул и витрина */
export function AppearanceSheet({
  open,
  onClose,
  course,
  owned,
  providerAvatar,
  name,
}: {
  open: boolean;
  onClose: () => void;
  course: QuestOutline[];
  owned: Owned;
  /** Аватар из GitHub/Google: к нему можно вернуться после своей картинки */
  providerAvatar: string | null;
  name: string;
}) {
  const profile = useProfile();
  const signedIn = useAccount((s) => s.status === "signed-in");
  const color = accentById(profile.accent).color;
  const avatar = profile.avatarUrl ?? providerAvatar;
  const titles = availableTitles(course, owned.achievements);
  const earned = achievementCatalog(course)
    .filter((a) => owned.achievements[a.id])
    .sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity));

  const toggleShowcase = (id: string) => {
    const current = profile.showcase;
    profile.set({
      showcase: current.includes(id) ? current.filter((x) => x !== id) : [...current, id].slice(0, SHOWCASE_MAX),
    });
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Внешний вид"
      description="Новые варианты открываются за уровни и достижения"
      height="h-[90dvh]"
    >
      <div className="flex flex-col gap-6">
        <Group title="Цвет неона">
          <div className="grid grid-cols-3 gap-2">
            {ACCENTS.map((a) => (
              <Option
                key={a.id}
                label={a.name}
                color={a.color}
                course={course}
                unlock={a.unlock}
                locked={!isUnlocked(a.unlock, owned)}
                selected={profile.accent === a.id}
                onSelect={() => profile.set({ accent: a.id })}
              >
                <span
                  className="size-8 rounded-full"
                  style={{ backgroundColor: a.color, boxShadow: `0 0 16px ${a.color}` }}
                />
              </Option>
            ))}
          </div>
        </Group>

        <Group title="Рамка аватара">
          <div className="grid grid-cols-3 gap-2">
            {FRAMES.map((f) => (
              <Option
                key={f.id}
                label={f.name}
                color={color}
                course={course}
                unlock={f.unlock}
                locked={!isUnlocked(f.unlock, owned)}
                selected={profile.frame === f.id}
                onSelect={() => profile.set({ frame: f.id })}
              >
                <span className="grid h-16 place-items-center">
                  <ProfileAvatar src={avatar} name={name} frame={f.id} color={color} size={48} />
                </span>
              </Option>
            ))}
          </div>
        </Group>

        <Group title="Баннер">
          <div className="grid grid-cols-2 gap-2">
            {BANNERS.map((b) => (
              <Option
                key={b.id}
                label={b.name}
                color={color}
                course={course}
                unlock={b.unlock}
                locked={!isUnlocked(b.unlock, owned)}
                selected={profile.banner === b.id}
                onSelect={() => profile.set({ banner: b.id })}
              >
                <ProfileBanner banner={b.id} bannerUrl={null} color={color} className="h-14 w-full rounded-lg" />
              </Option>
            ))}
            {profile.bannerUrl && (
              <Option
                label="Свой баннер"
                color={color}
                course={course}
                unlock={{}}
                locked={false}
                selected={profile.banner === CUSTOM_BANNER}
                onSelect={() => profile.set({ banner: CUSTOM_BANNER })}
              >
                <ProfileBanner
                  banner={CUSTOM_BANNER}
                  bannerUrl={profile.bannerUrl}
                  color={color}
                  className="h-14 w-full rounded-lg"
                />
              </Option>
            )}
          </div>
          {signedIn ? (
            <Upload kind="banner" label="Загрузить свой баннер" />
          ) : (
            <p className="text-sm text-muted">Свой баннер и аватар можно загрузить после входа в аккаунт.</p>
          )}
        </Group>

        {signedIn && (
          <Group title="Аватар" hint="Квадратная картинка, мы обрежем её по центру">
            <div className="flex items-center gap-4">
              <ProfileAvatar src={avatar} name={name} frame={profile.frame} color={color} size={64} />
              <div className="flex flex-col gap-2">
                <Upload kind="avatar" label="Загрузить фото" />
                {profile.avatarUrl && providerAvatar && profile.avatarUrl !== providerAvatar && (
                  <Button
                    variant="ghost"
                    className="self-start"
                    onClick={() => profile.set({ avatarUrl: providerAvatar })}
                  >
                    Вернуть фото из аккаунта
                  </Button>
                )}
              </div>
            </div>
          </Group>
        )}

        <Group
          title="Титул"
          hint={titles.length === 0 ? "Титулы дают закрытые квесты и редкие достижения. Пока их нет." : undefined}
        >
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={profile.title === null}
              onClick={() => profile.set({ title: null })}
              className={cn(
                "rounded-lg border px-3 py-1.5 font-mono text-xs tracking-wide uppercase transition-colors",
                profile.title === null ? "border-accent bg-accent-soft" : "border-border hover:border-border-strong",
              )}
            >
              Без титула
            </button>
            {titles.map((t) => (
              <button
                key={t.id}
                type="button"
                title={`За «${t.from}»`}
                aria-pressed={profile.title === t.text}
                onClick={() => profile.set({ title: t.text })}
                className={cn(
                  "rounded-lg border px-3 py-1.5 font-mono text-xs tracking-wide uppercase transition-colors",
                  profile.title === t.text
                    ? "border-accent bg-accent-soft"
                    : "border-border hover:border-border-strong",
                )}
              >
                {t.text}
              </button>
            ))}
          </div>
        </Group>

        <Group
          title="Витрина"
          hint={
            earned.length === 0
              ? "Здесь появятся твои достижения. Первое — за первый сданный этап."
              : `Выбери до ${SHOWCASE_MAX} достижений: выбрано ${profile.showcase.length}.`
          }
        >
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {earned.map((a) => {
              const index = profile.showcase.indexOf(a.id);
              const full = profile.showcase.length >= SHOWCASE_MAX && index < 0;
              return (
                <button
                  key={a.id}
                  type="button"
                  aria-pressed={index >= 0}
                  disabled={full}
                  onClick={() => toggleShowcase(a.id)}
                  className={cn(
                    "relative flex flex-col items-center gap-1.5 rounded-xl border bg-card p-2 text-center transition-[border-color,opacity] duration-150 disabled:opacity-40",
                    index >= 0 ? "neon-glow border-transparent" : "border-border enabled:hover:border-border-strong",
                  )}
                  style={index >= 0 ? ({ "--neon": color } as React.CSSProperties) : undefined}
                >
                  <AchievementBadge achievement={a} unlocked size={44} />
                  <span className="text-[11px] leading-tight">{a.title}</span>
                  {index >= 0 && (
                    <span className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-accent-solid font-mono text-[10px] font-bold text-white">
                      {index + 1}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Group>
      </div>
    </Sheet>
  );
}
