"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { type EngineStatus as Status, useEngine } from "@/lib/java/engine";

const LABELS: Record<Status, string> = {
  off: "Java не запущена",
  booting: "Java запускается",
  warming: "Java прогревается",
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

/** Статус Java-движка: первые секунды он прогревается, и студенту важно видеть почему. */
export function EngineStatus() {
  const { status, since, error } = useEngine();
  const [now, setNow] = useState(() => Date.now());
  const waiting = status === "booting" || status === "warming" || status === "restarting";

  useEffect(() => {
    if (!waiting) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [waiting]);

  const seconds = Math.max(0, Math.round((now - since) / 1000));
  return (
    <output
      title={error}
      className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 font-mono text-xs text-muted"
    >
      <span className={cn("size-2 rounded-full", DOT[status])} aria-hidden="true" />
      {LABELS[status]}
      {waiting && seconds > 1 ? ` · ${seconds} с` : ""}
    </output>
  );
}
