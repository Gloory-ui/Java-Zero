"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { safeNext } from "@/lib/account/handle";
import { loadSupabase, startAccount } from "@/lib/account/session";

/**
 * Возврат после входа через Яндекс. Сервер кладёт сессию во фрагмент адреса: берём её, сразу стираем фрагмент
 * из адресной строки и истории, подключаем синхронизацию и идём туда, откуда начинали вход.
 */
export function YandexCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  // Фрагмент читаем один раз: эффект в режиме разработки запускается дважды, а адрес мы сразу чистим
  const [hash] = useState(
    () => new URLSearchParams(typeof window === "undefined" ? "" : window.location.hash.slice(1)),
  );

  useEffect(() => {
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
    const failure = hash.get("error");
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    if (failure || !accessToken || !refreshToken) {
      setError(failure ?? "Не удалось войти через Яндекс.");
      return;
    }
    let cancelled = false;
    loadSupabase()
      .then((supabase) => supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }))
      .then(({ error: sessionError }) => {
        if (sessionError) throw sessionError;
        return startAccount({ force: true });
      })
      .then(() => !cancelled && router.replace(safeNext(hash.get("next"))))
      .catch(() => !cancelled && setError("Не удалось войти через Яндекс. Попробуй ещё раз."));
    return () => {
      cancelled = true;
    };
  }, [router, hash]);

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-2xl font-semibold">Вход не удался</h1>
        <p role="alert" className="text-muted">
          {error}
        </p>
        <div>
          <ButtonLink href="/login">Ко входу</ButtonLink>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-display text-2xl font-semibold">Входим через Яндекс…</h1>
      <p className="text-muted">Секунду: сохраняем вход в этом браузере.</p>
    </div>
  );
}
