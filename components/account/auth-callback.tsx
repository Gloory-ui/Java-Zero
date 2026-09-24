"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { safeNext } from "@/lib/account/actions";
import { loadSupabase } from "@/lib/account/session";

const MESSAGES: Record<string, string> = {
  otp_expired: "Ссылка для входа устарела. Запроси новую.",
  access_denied: "Вход отменён.",
};

/** Обмен кода из ссылки входа на сессию (PKCE). Код одноразовый и работает в том браузере, где начинали вход. */
export function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const next = safeNext(params.get("next"));
    const code = params.get("code");
    const failure = params.get("error_code") ?? hash.get("error_code") ?? params.get("error") ?? hash.get("error");

    if (failure) {
      const description = params.get("error_description") ?? hash.get("error_description");
      setError(MESSAGES[failure] ?? description ?? "Не удалось войти.");
      return;
    }
    if (!code) {
      setError("В ссылке нет кода входа. Начни вход заново.");
      return;
    }

    let cancelled = false;
    loadSupabase()
      .then((supabase) => supabase.auth.exchangeCodeForSession(code))
      .then(({ error: exchangeError }) => {
        if (cancelled) return;
        if (exchangeError) {
          setError(
            /code verifier/i.test(exchangeError.message)
              ? "Открой ссылку из письма в том же браузере, где запрашивал вход."
              : exchangeError.message,
          );
          return;
        }
        router.replace(next);
      })
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (error) {
    return (
      <>
        <h1 className="font-display text-2xl font-semibold">Вход не удался</h1>
        <p className="text-muted">{error}</p>
        <div>
          <ButtonLink href="/login">Попробовать снова</ButtonLink>
        </div>
      </>
    );
  }

  return (
    <p className="flex items-center gap-3 text-muted" aria-live="polite">
      <span
        className="size-4 animate-spin rounded-full border-2 border-accent border-t-transparent"
        aria-hidden="true"
      />
      Входим в аккаунт…
    </p>
  );
}
