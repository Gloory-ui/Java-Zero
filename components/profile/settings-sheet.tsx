"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useId, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Sheet } from "@/components/ui/sheet";
import { signOut } from "@/lib/account/actions";
import { useAccount } from "@/lib/account/store";
import { PERSONA_INFO } from "@/lib/ai/personas";
import { cn } from "@/lib/cn";
import type { QuestOutline } from "@/lib/content/outline";
import { checkHandle, type HandleCheck, normalizeHandle, saveHandle } from "@/lib/profile/actions";
import { BIO_MAX } from "@/lib/profile/cosmetics";
import { useProfile } from "@/lib/profile/store";
import { questProgress } from "@/lib/progress/selectors";
import { useProgress } from "@/lib/progress/store";

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

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors duration-150 placeholder:text-muted focus:border-accent focus:outline-none";

/** Вход, синхронизация и выход. Гостю — приглашение войти */
export function AccountCard() {
  const status = useAccount((s) => s.status);
  const user = useAccount((s) => s.user);
  const sync = useAccount((s) => s.sync);
  const error = useAccount((s) => s.error);
  const [leaving, setLeaving] = useState(false);

  if (status === "disabled") {
    return <p className="text-sm text-muted">Прогресс хранится в этом браузере.</p>;
  }
  if (status !== "signed-in" || !user) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-4">
        <p className="min-w-0 flex-1 text-sm text-muted">
          Прогресс хранится только в этом браузере. Войди, чтобы не потерять его, задать ник и открыть профиль другим.
        </p>
        <ButtonLink href="/login?next=/profile">Войти</ButtonLink>
      </div>
    );
  }

  const syncText =
    sync === "syncing"
      ? "Сохраняем прогресс в аккаунт…"
      : sync === "error"
        ? `Не удалось сохранить в аккаунт: ${error ?? "ошибка сети"}. Прогресс в браузере цел, повторим при следующем изменении.`
        : "Прогресс сохранён в аккаунте.";

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-4">
      <p className={cn("min-w-0 flex-1 text-sm", sync === "error" ? "text-danger" : "text-muted")} aria-live="polite">
        {user.email && <span className="block text-text">{user.email}</span>}
        {syncText}
      </p>
      <Button
        variant="secondary"
        disabled={leaving}
        onClick={async () => {
          setLeaving(true);
          try {
            await signOut();
          } finally {
            setLeaving(false);
          }
        }}
      >
        {leaving ? "Выходим…" : "Выйти"}
      </Button>
    </div>
  );
}

const HANDLE_TEXT: Record<Exclude<HandleCheck, "ok">, string> = {
  invalid: "От 3 до 20 символов: латиница, цифры и «_».",
  taken: "Этот ник уже занят.",
  error: "Не получилось проверить ник. Попробуй ещё раз.",
};

function HandleField() {
  const id = useId();
  const saved = useProfile((s) => s.handle);
  const [draft, setDraft] = useState(saved ?? "");
  const [status, setStatus] = useState<{ kind: "idle" | "busy" | "saved" } | { kind: "bad"; text: string }>({
    kind: "idle",
  });

  useEffect(() => setDraft(saved ?? ""), [saved]);

  const value = normalizeHandle(draft);
  const unchanged = value === (saved ?? "");

  const save = async () => {
    setStatus({ kind: "busy" });
    const check = await checkHandle(value);
    const result = check === "ok" ? await saveHandle(value) : check;
    setStatus(result === "ok" ? { kind: "saved" } : { kind: "bad", text: HANDLE_TEXT[result] });
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm text-muted">
        Ник для ссылки на профиль
      </label>
      <div className="flex gap-2">
        <span className="relative flex-1">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted">@</span>
          <input
            id={id}
            value={draft}
            maxLength={21}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => {
              setDraft(e.target.value);
              setStatus({ kind: "idle" });
            }}
            className={cn(inputClass, "pl-7 font-mono")}
            placeholder="java_hero"
          />
        </span>
        <Button variant="secondary" disabled={unchanged || status.kind === "busy"} onClick={() => void save()}>
          {status.kind === "busy" ? "Проверяем…" : "Сохранить"}
        </Button>
      </div>
      <p aria-live="polite" className="min-h-5 text-sm">
        {status.kind === "bad" && <span className="text-danger">{status.text}</span>}
        {status.kind === "saved" && saved && (
          <span className="text-success">
            Готово. Ссылка:{" "}
            <Link href={`/u/${saved}`} className="underline">
              /u/{saved}
            </Link>
          </span>
        )}
      </p>
    </div>
  );
}

function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full border transition-colors duration-200 disabled:opacity-40",
        checked ? "border-accent bg-accent-solid" : "border-border-strong bg-card",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200 ease-snappy",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}

/** Настройки профиля и аккаунта в выдвижной панели */
export function SettingsSheet({
  open,
  onClose,
  course,
}: {
  open: boolean;
  onClose: () => void;
  course: QuestOutline[];
}) {
  const nameId = useId();
  const bioId = useId();
  const status = useAccount((s) => s.status);
  const signedIn = status === "signed-in";
  const profile = useProfile();
  const progress = useProgress();
  const [confirmReset, setConfirmReset] = useState<string | null>(null);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Настройки"
      description="Имя, ник, публичность и аккаунт"
      height="h-[78dvh]"
    >
      <div className="flex flex-col gap-6">
        <Group title="О тебе">
          <label htmlFor={nameId} className="text-sm text-muted">
            Имя в профиле
          </label>
          <input
            id={nameId}
            value={profile.displayName ?? ""}
            maxLength={80}
            onChange={(e) => profile.set({ displayName: e.target.value || null })}
            className={inputClass}
            placeholder="Как тебя называть"
          />
          <label htmlFor={bioId} className="text-sm text-muted">
            Пара слов о себе
          </label>
          <textarea
            id={bioId}
            value={profile.bio}
            maxLength={BIO_MAX}
            rows={3}
            onChange={(e) => profile.set({ bio: e.target.value })}
            className={cn(inputClass, "resize-none")}
            placeholder="Например: готовлюсь к КТ 2, люблю рекурсию"
          />
          <p className="text-right font-mono text-[11px] text-muted tabular-nums">
            {profile.bio.length}/{BIO_MAX}
          </p>
        </Group>

        <Group
          title="Публичный профиль"
          hint={
            signedIn
              ? "Открытый профиль видят по ссылке, он попадает в таблицу лидеров. Код и ошибки никто не видит."
              : "Ник и публичный профиль доступны после входа в аккаунт."
          }
        >
          {signedIn ? (
            <>
              <HandleField />
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3">
                <span className="text-sm">
                  <span className="block font-medium">Показывать профиль всем</span>
                  <span className="block text-muted">
                    {profile.handle ? `Ссылка: /u/${profile.handle}` : "Сначала сохрани ник"}
                  </span>
                </span>
                <Switch
                  label="Показывать профиль всем"
                  checked={profile.isPublic}
                  disabled={!profile.handle}
                  onChange={(isPublic) => profile.set({ isPublic })}
                />
              </div>
            </>
          ) : (
            <ButtonLink href="/login?next=/profile" variant="secondary" className="self-start">
              Войти
            </ButtonLink>
          )}
        </Group>

        <Group title="AI-ментор" hint="Характер ментора в лаборатории">
          <fieldset className="grid gap-2">
            <legend className="sr-only">Характер ментора</legend>
            {PERSONA_INFO.map((p) => (
              <label
                key={p.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors duration-150 ease-snappy has-focus-visible:outline-2 has-focus-visible:outline-accent",
                  progress.persona === p.id ? "border-accent bg-card" : "border-border hover:border-border-strong",
                )}
              >
                <input
                  type="radio"
                  name="persona"
                  value={p.id}
                  checked={progress.persona === p.id}
                  onChange={() => useProgress.getState().setPersona(p.id)}
                  className="sr-only"
                />
                <Icon name={p.icon} className="mt-0.5 size-4 text-muted" />
                <span>
                  <span className="block font-medium">{p.label}</span>
                  <span className="block text-sm text-muted">{p.desc}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm">Звуки: сдача этапа, ошибки, защита</span>
            <Switch
              label="Звуки интерфейса"
              checked={progress.sound}
              onChange={(on) => useProgress.getState().setSound(on)}
            />
          </div>
        </Group>

        <Group title="Аккаунт">
          <AccountCard />
        </Group>

        <Group title="Прогресс по квестам" hint="Сброс удаляет код и отметки квеста. Опыт за его этапы тоже пропадёт.">
          <ul className="flex flex-col gap-2">
            {course.map((quest) => {
              const { passed, total } = questProgress(progress, quest);
              const touched = Object.keys(progress.stages).some((key) => key.startsWith(`${quest.id}/`));
              return (
                <li
                  key={quest.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2.5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{quest.title}</span>
                    <span className="text-xs text-muted">
                      сдано {passed} из {total}
                    </span>
                  </span>
                  {touched &&
                    (confirmReset === quest.id ? (
                      <span className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            useProgress.getState().resetQuest(quest.id);
                            setConfirmReset(null);
                          }}
                        >
                          Точно сбросить
                        </Button>
                        <Button variant="ghost" onClick={() => setConfirmReset(null)}>
                          Нет
                        </Button>
                      </span>
                    ) : (
                      <Button variant="ghost" onClick={() => setConfirmReset(quest.id)}>
                        Сбросить
                      </Button>
                    ))}
                </li>
              );
            })}
          </ul>
        </Group>
      </div>
    </Sheet>
  );
}
