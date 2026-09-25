"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import type { StageMeta } from "@/lib/content/schema";
import { quizAnswered } from "@/lib/game/events";

/** Вопрос на понимание перед кодом: ответ сразу с объяснением, выбор можно менять. */
export function Quiz({ quiz, stageKey }: { quiz: StageMeta["quiz"]; stageKey: string }) {
  const name = useId();
  const [picked, setPicked] = useState<number | null>(null);
  const right = picked === quiz.correct;

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-4 font-medium leading-relaxed">{quiz.question}</legend>
      <div className="flex flex-col gap-2">
        {quiz.options.map((option, i) => {
          const state = picked !== i ? "idle" : right ? "right" : "wrong";
          return (
            <label
              // biome-ignore lint/suspicious/noArrayIndexKey: варианты статичны и не переставляются
              key={i}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-md border px-4 py-3 text-sm transition-[background-color,border-color,transform] duration-150 ease-snappy active:scale-[0.99] motion-reduce:active:scale-100",
                "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent",
                state === "idle" && "border-border bg-card hover:border-border-strong hover:bg-card-hover",
                state === "right" && "border-success bg-success/10",
                state === "wrong" && "border-danger bg-danger/10",
              )}
            >
              <input
                type="radio"
                name={name}
                value={i}
                checked={picked === i}
                onChange={() => {
                  setPicked(i);
                  quizAnswered(stageKey, i === quiz.correct);
                }}
                className="sr-only"
              />
              <span className="font-mono text-xs text-muted" aria-hidden="true">
                {i + 1}
              </span>
              <span>{option}</span>
            </label>
          );
        })}
      </div>
      {picked !== null && (
        <p
          className={cn(
            "rounded-md px-4 py-3 text-sm starting:opacity-0 motion-safe:transition-opacity motion-safe:duration-200",
            right ? "bg-success/10 text-success" : "bg-danger/10 text-danger",
          )}
          aria-live="polite"
        >
          {right ? "Верно. Теперь закрепи это в коде." : `Не то. ${quiz.hint}`}
        </p>
      )}
    </fieldset>
  );
}
