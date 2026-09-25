"use client";

import { LevelChip } from "@/components/game/level-chip";
import { cn } from "@/lib/cn";
import { useProgress, useProgressHydrated } from "@/lib/progress/store";

/** Уровень, серия дней и звук в шапке лаборатории. До загрузки прогресса место зарезервировано, чтобы шапка не прыгала. */
export function LabStatus() {
  const hydrated = useProgressHydrated();
  const soundOn = useProgress((s) => s.sound);

  return (
    <div className={cn("flex items-center gap-1", !hydrated && "invisible")}>
      <LevelChip compact />
      <button
        type="button"
        onClick={() => useProgress.getState().setSound(!soundOn)}
        aria-pressed={soundOn}
        aria-label={soundOn ? "Выключить звуки" : "Включить звуки"}
        title={soundOn ? "Звуки включены" : "Звуки выключены"}
        className="grid size-9 place-items-center rounded-md text-muted transition-colors duration-150 ease-snappy hover:bg-card hover:text-text"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="size-[18px]"
          aria-hidden="true"
        >
          <path d="M11 5 6 9H2v6h4l5 4V5Z" />
          {soundOn ? <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /> : <path d="m22 9-6 6M16 9l6 6" />}
        </svg>
      </button>
    </div>
  );
}
