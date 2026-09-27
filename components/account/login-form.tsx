"use client";

import { AtSign, Eye, EyeOff, KeyRound, Lock, Mail, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useEffect, useId, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  type AuthMethods,
  checkSignupHandle,
  confirmPasswordReset,
  confirmSignup,
  fetchAuthMethods,
  type HandleAvailability,
  type OAuthProvider,
  requestPasswordReset,
  resendSignupCode,
  safeNext,
  setNewPassword,
  signInWithPassword,
  signInWithProvider,
  signUp,
} from "@/lib/account/actions";
import { describeAuthError } from "@/lib/account/errors";
import { HANDLE_RE, isEmailLogin, normalizeHandle, PASSWORD_MAX, PASSWORD_MIN } from "@/lib/account/handle";
import { useAccount } from "@/lib/account/store";
import { cn } from "@/lib/cn";

const RESEND_SECONDS = 60;

/**
 * signin — вход по нику или почте; signup — регистрация; confirm — код подтверждения почты;
 * forgot — почта для восстановления; reset — код восстановления; password — новый пароль
 */
type Mode = "signin" | "signup" | "confirm" | "forgot" | "reset" | "password";

const nextFromUrl = () => safeNext(new URLSearchParams(window.location.search).get("next"));
const errorText = (e: unknown) => describeAuthError(e instanceof Error ? e.message : String(e));

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

const inputClass =
  "h-12 w-full rounded-md border border-border bg-card pr-3 pl-10 text-base outline-none transition-colors duration-150 ease-snappy placeholder:text-muted focus:border-accent aria-invalid:border-danger";

type FieldProps = {
  label: string;
  icon: ReactNode;
  hint?: ReactNode;
  children: (id: string, hintId: string | undefined) => ReactNode;
  after?: ReactNode;
};

/** Поле формы: подпись, иконка слева, подсказка под полем. Инпут рисует children, чтобы задать ему свои атрибуты */
function Field({ label, icon, hint, children, after }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden="true">
          {icon}
        </span>
        {children(id, hintId)}
        {after}
      </div>
      {hint && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  hint?: ReactNode;
}) {
  const [shown, setShown] = useState(false);
  return (
    <Field
      label={label}
      icon={<Lock className="size-4" />}
      hint={hint}
      after={
        <button
          type="button"
          onClick={() => setShown((v) => !v)}
          aria-label={shown ? "Скрыть пароль" : "Показать пароль"}
          aria-pressed={shown}
          className="absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center rounded-md text-muted hover:text-text"
        >
          {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      }
    >
      {(id, hintId) => (
        <input
          id={id}
          type={shown ? "text" : "password"}
          required
          minLength={autoComplete === "new-password" ? PASSWORD_MIN : undefined}
          maxLength={PASSWORD_MAX}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={hintId}
          className={cn(inputClass, "pr-12")}
        />
      )}
    </Field>
  );
}

const HANDLE_TEXT: Record<HandleAvailability | "checking", string> = {
  ok: "Ник свободен.",
  taken: "Этот ник уже занят.",
  invalid: "От 3 до 20 символов: латиница, цифры и _.",
  unknown: "От 3 до 20 символов: латиница, цифры и _.",
  checking: "Проверяем ник…",
};

export function LoginForm() {
  const router = useRouter();
  const status = useAccount((s) => s.status);
  const user = useAccount((s) => s.user);
  const [mode, setMode] = useState<Mode>("signin");
  const [login, setLogin] = useState("");
  const [email, setEmail] = useState("");
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [handleState, setHandleState] = useState<HandleAvailability | "checking" | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [methods, setMethods] = useState<AuthMethods | null>(null);

  // Ссылка /login?mode=signup сразу открывает регистрацию
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("mode") === "signup") setMode("signup");
  }, []);

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

  // Ник проверяется, когда студент перестал печатать: без запроса на каждую букву
  useEffect(() => {
    if (mode !== "signup") return;
    const value = normalizeHandle(handle);
    if (!value) return setHandleState(null);
    if (!HANDLE_RE.test(value)) return setHandleState("invalid");
    setHandleState("checking");
    let cancelled = false;
    const id = setTimeout(() => {
      void checkSignupHandle(value).then((result) => !cancelled && setHandleState(result));
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [handle, mode]);

  if (status === "disabled") {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-2xl font-semibold">Вход</h1>
        <p className="text-muted">
          Аккаунты на этой версии сайта ещё не подключены. Учиться можно и так: прогресс хранится в этом браузере.
        </p>
        <div>
          <ButtonLink href="/course">К карте курса</ButtonLink>
        </div>
      </div>
    );
  }

  // После кода восстановления студент уже вошёл, но ещё должен задать пароль
  if (status === "signed-in" && user && mode !== "password" && pending === null) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-2xl font-semibold">Вход</h1>
        <p className="text-muted">Ты уже вошёл как {user.name ?? user.email}.</p>
        {notice && (
          <output className="block rounded-md border border-gold/40 bg-gold/10 px-3 py-2 text-sm">{notice}</output>
        )}
        <div className="flex gap-3">
          <ButtonLink href="/profile">Профиль</ButtonLink>
          <ButtonLink href="/course" variant="secondary">
            К курсу
          </ButtonLink>
        </div>
      </div>
    );
  }

  const go = (next: Mode) => {
    setMode(next);
    setError(null);
    setNotice(null);
    setCode("");
  };

  /** Обёртка действия: крутилка на кнопке, ошибка по-русски */
  const run = async (key: string, action: () => Promise<void>) => {
    setError(null);
    setPending(key);
    try {
      await action();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setPending(null);
    }
  };

  const withProvider = (provider: OAuthProvider) =>
    run(provider, async () => {
      await signInWithProvider(provider, nextFromUrl());
      // Браузер уходит на GitHub или Google: кнопка остаётся в состоянии «переходим»
      setPending(provider);
    });

  const onSignIn = (event: FormEvent) => {
    event.preventDefault();
    void run("signin", async () => {
      try {
        await signInWithPassword(login, password);
        router.replace(nextFromUrl());
      } catch (e) {
        // Почта не подтверждена: сразу шлём новый код и открываем его ввод
        if (isEmailLogin(login) && /not confirmed/i.test(e instanceof Error ? e.message : String(e))) {
          setEmail(login.trim());
          await resendSignupCode(login.trim(), nextFromUrl());
          setCooldown(RESEND_SECONDS);
          go("confirm");
          setNotice("Почта ещё не подтверждена. Мы отправили новый код.");
          return;
        }
        throw e;
      }
    });
  };

  const onSignUp = (event: FormEvent) => {
    event.preventDefault();
    const nick = normalizeHandle(handle);
    if (!HANDLE_RE.test(nick)) return setError(HANDLE_TEXT.invalid);
    if (password.length < PASSWORD_MIN) return setError(`Пароль — не меньше ${PASSWORD_MIN} символов.`);
    void run("signup", async () => {
      const free = await checkSignupHandle(nick);
      if (free === "taken") {
        setHandleState("taken");
        throw new Error(HANDLE_TEXT.taken);
      }
      const created = await signUp(email.trim(), password, nick, nextFromUrl());
      if (!created) throw new Error("User already registered");
      setCooldown(RESEND_SECONDS);
      go("confirm");
    });
  };

  const onConfirm = (event: FormEvent) => {
    event.preventDefault();
    void run("confirm", async () => {
      const saved = await confirmSignup(email.trim(), code, handle);
      if (saved === "ok" || !normalizeHandle(handle)) {
        router.replace(nextFromUrl());
        return;
      }
      // Аккаунт создан, но ник заняли, пока шла регистрация: сказать, где выбрать другой
      setNotice(`Аккаунт создан, но ник @${normalizeHandle(handle)} успели занять. Выбери другой в профиле.`);
    });
  };

  const onResend = () =>
    run("resend", async () => {
      if (mode === "reset") await requestPasswordReset(email.trim());
      else await resendSignupCode(email.trim(), nextFromUrl());
      setCooldown(RESEND_SECONDS);
      setNotice("Новый код отправлен.");
    });

  const onForgot = (event: FormEvent) => {
    event.preventDefault();
    void run("forgot", async () => {
      await requestPasswordReset(email.trim());
      setCooldown(RESEND_SECONDS);
      go("reset");
    });
  };

  const onReset = (event: FormEvent) => {
    event.preventDefault();
    void run("reset", async () => {
      await confirmPasswordReset(email.trim(), code);
      setPassword("");
      go("password");
    });
  };

  const onNewPassword = (event: FormEvent) => {
    event.preventDefault();
    if (password.length < PASSWORD_MIN) return setError(`Пароль — не меньше ${PASSWORD_MIN} символов.`);
    void run("password", async () => {
      await setNewPassword(password);
      router.replace(nextFromUrl());
    });
  };

  const heading: Record<Mode, { title: string; lead: ReactNode }> = {
    signin: {
      title: "Вход",
      lead: "Прогресс сохранится в аккаунте и откроется на любом устройстве. Учиться можно и без входа.",
    },
    signup: { title: "Регистрация", lead: "Придумай ник и пароль. На почту придёт код подтверждения." },
    confirm: {
      title: "Подтверди почту",
      lead: (
        <>
          Мы отправили 6-значный код на <strong className="text-text">{email}</strong>. Письмо обычно приходит за
          минуту; если его нет, проверь «Спам».
        </>
      ),
    },
    forgot: { title: "Восстановление пароля", lead: "Пришлём код на почту, с ним ты задашь новый пароль." },
    reset: {
      title: "Код из письма",
      lead: (
        <>
          Код для восстановления отправлен на <strong className="text-text">{email}</strong>.
        </>
      ),
    },
    password: { title: "Новый пароль", lead: `Придумай новый пароль: не меньше ${PASSWORD_MIN} символов.` },
  };

  const title = (
    <div className="flex flex-col gap-2">
      <h1 className="font-display text-2xl font-semibold">{heading[mode].title}</h1>
      <p className="text-muted">{heading[mode].lead}</p>
    </div>
  );

  if (!methods) {
    return (
      <div className="flex flex-col gap-5">
        {title}
        <div className="h-72 animate-pulse rounded-lg bg-card/60" aria-hidden="true" />
      </div>
    );
  }

  const busy = pending !== null || status === "loading";
  const oauth = (methods.github || methods.google) && (mode === "signin" || mode === "signup");

  const codeField = (
    <Field label="Код из письма" icon={<KeyRound className="size-4" />}>
      {(id) => (
        <input
          id={id}
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,12}"
          maxLength={12}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, ""))}
          placeholder="123456"
          className={cn(inputClass, "font-mono tracking-[0.3em]")}
        />
      )}
    </Field>
  );

  const resend = (
    <Button type="button" variant="ghost" onClick={onResend} disabled={busy || cooldown > 0}>
      {cooldown > 0 ? `Отправить код ещё раз через ${cooldown} с` : "Отправить код ещё раз"}
    </Button>
  );

  return (
    <div className="flex flex-col gap-5 starting:opacity-0 motion-safe:transition-opacity motion-safe:duration-200">
      {title}

      {mode === "signin" && methods.email && (
        <form onSubmit={onSignIn} className="flex flex-col gap-4">
          <Field label="Ник или почта" icon={<User className="size-4" />}>
            {(id) => (
              <input
                id={id}
                required
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="barsik или you@example.com"
                className={inputClass}
              />
            )}
          </Field>
          <div className="flex flex-col gap-1.5">
            <PasswordField label="Пароль" value={password} onChange={setPassword} autoComplete="current-password" />
            <button
              type="button"
              onClick={() => {
                if (isEmailLogin(login)) setEmail(login.trim());
                go("forgot");
              }}
              className="self-end text-sm text-accent underline-offset-2 hover:underline"
            >
              Забыл пароль?
            </button>
          </div>
          <Button type="submit" size="lg" disabled={busy}>
            {pending === "signin" ? "Входим…" : "Войти"}
          </Button>
        </form>
      )}

      {mode === "signup" && methods.email && (
        <form onSubmit={onSignUp} className="flex flex-col gap-4">
          <Field
            label="Ник"
            icon={<AtSign className="size-4" />}
            hint={
              <span className={cn(handleState === "taken" && "text-danger", handleState === "ok" && "text-success")}>
                {HANDLE_TEXT[handleState ?? "invalid"]}
              </span>
            }
          >
            {(id, hintId) => (
              <input
                id={id}
                required
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={21}
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="barsik"
                aria-describedby={hintId}
                aria-invalid={handleState === "taken" || (handleState === "invalid" && handle !== "")}
                className={inputClass}
              />
            )}
          </Field>
          <Field label="Почта" icon={<Mail className="size-4" />}>
            {(id) => (
              <input
                id={id}
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            )}
          </Field>
          <PasswordField
            label="Пароль"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            hint={`Не меньше ${PASSWORD_MIN} символов.`}
          />
          <Button type="submit" size="lg" disabled={busy || handleState === "taken"}>
            {pending === "signup" ? "Отправляем код…" : "Зарегистрироваться"}
          </Button>
        </form>
      )}

      {(mode === "confirm" || mode === "reset") && (
        <form onSubmit={mode === "confirm" ? onConfirm : onReset} className="flex flex-col gap-4">
          {codeField}
          <Button type="submit" size="lg" disabled={busy || code.replace(/\s/g, "").length < 6}>
            {pending === mode ? "Проверяем…" : "Подтвердить"}
          </Button>
          <div className="flex flex-wrap gap-2">
            {resend}
            <Button type="button" variant="ghost" onClick={() => go(mode === "confirm" ? "signup" : "forgot")}>
              Другая почта
            </Button>
          </div>
        </form>
      )}

      {mode === "forgot" && (
        <form onSubmit={onForgot} className="flex flex-col gap-4">
          <Field label="Почта" icon={<Mail className="size-4" />}>
            {(id) => (
              <input
                id={id}
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            )}
          </Field>
          <Button type="submit" size="lg" disabled={busy}>
            {pending === "forgot" ? "Отправляем…" : "Прислать код"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => go("signin")}>
            Вспомнил пароль
          </Button>
        </form>
      )}

      {mode === "password" && (
        <form onSubmit={onNewPassword} className="flex flex-col gap-4">
          <PasswordField label="Новый пароль" value={password} onChange={setPassword} autoComplete="new-password" />
          <Button type="submit" size="lg" disabled={busy}>
            {pending === "password" ? "Сохраняем…" : "Сохранить пароль"}
          </Button>
        </form>
      )}

      {notice && (
        <output className="block rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm">{notice}</output>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      {oauth && (
        <>
          <div className="flex items-center gap-3 text-xs text-muted" aria-hidden="true">
            <span className="h-px flex-1 bg-border" />
            {methods.email ? "или через" : "войти через"}
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
            {methods.github && (
              <Button variant="secondary" size="lg" onClick={() => withProvider("github")} disabled={busy}>
                <GitHubIcon />
                {pending === "github" ? "Переходим…" : "GitHub"}
              </Button>
            )}
            {methods.google && (
              <Button variant="secondary" size="lg" onClick={() => withProvider("google")} disabled={busy}>
                <GoogleIcon />
                {pending === "google" ? "Переходим…" : "Google"}
              </Button>
            )}
          </div>
        </>
      )}

      {methods.email && mode === "signin" && (
        <p className="text-center text-sm text-muted">
          Нет аккаунта?{" "}
          <button type="button" onClick={() => go("signup")} className="text-accent underline-offset-2 hover:underline">
            Зарегистрироваться
          </button>
        </p>
      )}
      {methods.email && mode === "signup" && (
        <p className="text-center text-sm text-muted">
          Уже есть аккаунт?{" "}
          <button type="button" onClick={() => go("signin")} className="text-accent underline-offset-2 hover:underline">
            Войти
          </button>
        </p>
      )}

      {!methods.email && !methods.github && !methods.google && (
        <p className="text-muted">В проекте Supabase не включён ни один способ входа.</p>
      )}
    </div>
  );
}
