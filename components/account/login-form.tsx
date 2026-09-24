"use client";

import { type FormEvent, useEffect, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  type AuthMethods,
  fetchAuthMethods,
  type OAuthProvider,
  safeNext,
  sendMagicLink,
  signInWithProvider,
} from "@/lib/account/actions";
import { useAccount } from "@/lib/account/store";

const RESEND_SECONDS = 60;

const nextFromUrl = () => safeNext(new URLSearchParams(window.location.search).get("next"));

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z" />
    </svg>
  );
}

export function LoginForm() {
  const status = useAccount((s) => s.status);
  const user = useAccount((s) => s.user);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState<OAuthProvider | "email" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [methods, setMethods] = useState<AuthMethods | null>(null);

  useEffect(() => {
    if (status === "disabled") return;
    fetchAuthMethods()
      .then(setMethods)
      // Не узнали — показываем всё, Supabase сам объяснит, если способ выключен
      .catch(() => setMethods({ github: true, google: true, email: true }));
  }, [status]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  if (status === "disabled") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-muted">
          Аккаунты на этой версии сайта ещё не подключены. Учиться можно и так: прогресс хранится в этом браузере.
        </p>
        <div>
          <ButtonLink href="/course">К карте курса</ButtonLink>
        </div>
      </div>
    );
  }

  if (status === "signed-in" && user) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-muted">Ты уже вошёл как {user.name ?? user.email}.</p>
        <div className="flex gap-3">
          <ButtonLink href="/profile">Профиль</ButtonLink>
          <ButtonLink href="/course" variant="secondary">
            К курсу
          </ButtonLink>
        </div>
      </div>
    );
  }

  const withProvider = async (provider: OAuthProvider) => {
    setError(null);
    setPending(provider);
    try {
      await signInWithProvider(provider, nextFromUrl());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPending(null);
    }
  };

  const withEmail = async (event: FormEvent) => {
    event.preventDefault();
    const address = email.trim();
    if (!address) return;
    setError(null);
    setPending("email");
    try {
      await sendMagicLink(address, nextFromUrl());
      setSentTo(address);
      setCooldown(RESEND_SECONDS);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(
        /rate limit|seconds/i.test(message) ? "Письмо уже отправлено. Подожди минуту и попробуй снова." : message,
      );
    } finally {
      setPending(null);
    }
  };

  if (sentTo) {
    return (
      <div className="flex flex-col gap-4 starting:opacity-0 motion-safe:transition-opacity motion-safe:duration-200">
        <p>
          Ссылка для входа отправлена на <strong>{sentTo}</strong>. Открой письмо в этом же браузере.
        </p>
        <p className="text-sm text-muted">Письмо обычно приходит за минуту. Если его нет, проверь «Спам».</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" disabled={cooldown > 0 || pending !== null} onClick={withEmail}>
            {cooldown > 0 ? `Отправить ещё раз через ${cooldown} с` : "Отправить ещё раз"}
          </Button>
          <Button variant="ghost" onClick={() => setSentTo(null)}>
            Другая почта
          </Button>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    );
  }

  const busy = pending !== null || status === "loading";

  if (!methods) {
    return <div className="h-48 animate-pulse rounded-lg bg-card/60" aria-hidden="true" />;
  }

  const oauth = methods.github || methods.google;

  return (
    <div className="flex flex-col gap-5 starting:opacity-0 motion-safe:transition-opacity motion-safe:duration-200">
      {oauth && (
        <div className="flex flex-col gap-2">
          {methods.github && (
            <Button variant="secondary" size="lg" onClick={() => withProvider("github")} disabled={busy}>
              <GitHubIcon />
              {pending === "github" ? "Переходим на GitHub…" : "Войти через GitHub"}
            </Button>
          )}
          {methods.google && (
            <Button variant="secondary" size="lg" onClick={() => withProvider("google")} disabled={busy}>
              <GoogleIcon />
              {pending === "google" ? "Переходим в Google…" : "Войти через Google"}
            </Button>
          )}
        </div>
      )}

      {oauth && methods.email && (
        <div className="flex items-center gap-3 text-xs text-muted" aria-hidden="true">
          <span className="h-px flex-1 bg-border" />
          или по почте
          <span className="h-px flex-1 bg-border" />
        </div>
      )}

      {methods.email && (
        <form onSubmit={withEmail} className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium">
            Почта
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-12 rounded-md border border-border bg-card px-3 text-base outline-none transition-colors duration-150 ease-snappy placeholder:text-muted focus:border-accent"
          />
          <Button type="submit" size="lg" disabled={busy || email.trim() === ""}>
            {pending === "email" ? "Отправляем…" : "Прислать ссылку для входа"}
          </Button>
        </form>
      )}

      {!oauth && !methods.email && <p className="text-muted">В проекте Supabase не включён ни один способ входа.</p>}

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
