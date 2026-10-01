"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { getEngine, type EngineStatus as Status, useEngine } from "@/lib/java/engine";

const LABELS: Record<Status, string> = {
  off: "Java не запущена",
  booting: "Загружаем Java",
  warming: "Прогреваем компилятор",
  ready: "Java готова",
  busy: "Java работает",
  restarting: "Java перезапускается",
  failed: "Java не запустилась",
};

const DOT: Record<Status, string> = {
  off: "bg-muted",
  booting: "bg-gold animate-pulse",
  warming: "bg-gold animate-pulse",
  ready: "bg-success",
  busy: "bg-accent animate-pulse",
  restarting: "bg-gold animate-pulse",
  failed: "bg-danger",
};

/** Подпись к ожиданию: процент загрузки среды или примерное время до готовности по прошлому запуску */
function waitHint(status: Status, seconds: number, loaded?: number, expectMs?: number): string {
  if (status === "booting" && loaded !== undefined && loaded > 0 && loaded < 1)
    return ` · ${Math.round(loaded * 100)}%`;
  if (expectMs !== undefined) {
    const left = Math.round(expectMs / 1000) - seconds;
    if (left > 1) return ` · ещё ~${left} с`;
  }
  return seconds > 1 ? ` · ${seconds} с` : "";
}

/**
 * Статус Java-движка. Первый запуск за визит — около полуминуты: среда загружается, компилятор прогревается.
 * Студенту важно видеть, что происходит и сколько ждать, поэтому показываем процент и оценку по прошлому запуску.
 */
export function EngineStatus() {
  const { status, since, error, loaded, expectMs } = useEngine();
  const [now, setNow] = useState(() => Date.now());
  const waiting = status === "booting" || status === "warming" || status === "restarting";

  useEffect(() => {
    if (!waiting) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [waiting]);

  const seconds = Math.max(0, Math.round((now - since) / 1000));
  return (
    <span className="inline-flex items-center gap-2">
      <output
        title={error}
        className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 font-mono text-xs text-muted"
      >
        <span className={cn("size-2 rounded-full", DOT[status])} aria-hidden="true" />
        {LABELS[status]}
        {waiting ? waitHint(status, seconds, loaded, expectMs) : ""}
      </output>
      {status === "failed" && (
        <button
          type="button"
          onClick={() => getEngine().retry()}
          className="rounded-full border border-border px-3 py-1 text-xs text-text transition-colors duration-150 ease-snappy hover:border-border-strong"
        >
          Перезапустить
        </button>
      )}
    </span>
  );
}
