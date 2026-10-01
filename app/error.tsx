"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";

/** Сбой при отрисовке страницы. Прогресс хранится отдельно в браузере, поэтому ему ничего не грозит. */
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-5 px-4 py-16">
      <p className="font-mono text-sm text-danger">Exception in thread "main": страница упала</p>
      <h1 className="font-display text-3xl font-semibold">Что-то сломалось</h1>
      <p className="text-muted">
        Прогресс и код сохранены в браузере. Попробуй открыть страницу ещё раз; если ошибка повторится, вернись на карту
        курса.
      </p>
      {error.digest && <p className="font-mono text-xs text-muted">Код ошибки: {error.digest}</p>}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => retry()}>Попробовать ещё раз</Button>
        <ButtonLink href="/course" variant="ghost">
          Карта курса
        </ButtonLink>
      </div>
    </main>
  );
}
