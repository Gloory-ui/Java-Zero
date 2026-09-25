"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { explainCompileError, explainRuntimeError, runtimeErrorLine } from "@/lib/java/explain";
import type { CompileResult, Diagnostic, RunResult, RunStatus, TestVerdict } from "@/lib/java/judge";

export type Outcome =
  | { kind: "idle" }
  | { kind: "running"; mode: "check" | "run"; cold: boolean }
  | { kind: "compile-error"; compile: CompileResult }
  | { kind: "checked"; verdicts: TestVerdict[]; passed: boolean }
  | { kind: "ran"; run: RunResult; stdin: string }
  | { kind: "engine-error"; message: string };

const STATUS_TEXT: Partial<Record<RunStatus, string>> = {
  timeout: "Программа не уложилась в 3 секунды: похоже на бесконечный цикл. Проверь, меняется ли условие выхода.",
  output_limit: "Программа напечатала больше 64 КБ и была остановлена: похоже, вывод стоит внутри бесконечного цикла.",
  error: "Программу не удалось запустить.",
};

/** Что случилось при запуске: по-русски, со строкой кода и советом; английский текст JVM — мелко, для справки. */
function RunProblem({ status, error, exitCode = 0 }: { status?: RunStatus; error?: string; exitCode?: number }) {
  if (!status || status === "ok") return null;
  if (status === "exit") {
    return exitCode === 0 ? null : (
      <p className="text-sm text-danger">Программа завершилась через System.exit({exitCode}).</p>
    );
  }
  if (status !== "exception") return <p className="text-sm text-danger">{STATUS_TEXT[status] ?? status}</p>;

  const explained = error ? explainRuntimeError(error) : null;
  const line = error ? runtimeErrorLine(error) : null;
  return (
    <div className="flex flex-col gap-1 text-sm">
      <p className="text-danger">
        Программа упала{line ? ` в строке ${line}` : ""}
        {explained ? `: ${explained.title.toLowerCase()}.` : "."}
      </p>
      {explained && <p>{explained.fix}</p>}
      {error && <p className="font-mono text-xs break-words text-muted">{error.split("\n")[0]}</p>}
    </div>
  );
}

function Output({
  label,
  text,
  tone,
  highlight,
}: {
  label: string;
  text: string;
  tone?: "muted";
  /** Номер строки с 1, на которой вывод разошёлся с ожидаемым */
  highlight?: number | null;
}) {
  const rows = text === "" ? [] : text.replace(/\n$/, "").split("\n");
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 font-mono text-[11px] tracking-widest text-muted uppercase">{label}</div>
      <pre
        className={cn(
          "max-h-48 overflow-auto rounded-sm border border-border bg-code-bg py-2 font-mono text-[13px] leading-relaxed whitespace-pre",
          tone === "muted" && "text-muted",
        )}
      >
        {rows.length === 0 ? (
          <span className="px-2">(пусто)</span>
        ) : (
          rows.map((row, i) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: строки вывода статичны
              key={i}
              className={cn("block px-2", highlight === i + 1 && "bg-danger/15 text-text")}
            >
              {row === "" ? " " : row.replace(/\t/g, "→\t")}
            </span>
          ))
        )}
      </pre>
    </div>
  );
}

function Diagnostics({ diagnostics, onReveal }: { diagnostics: Diagnostic[]; onReveal: (offset: number) => void }) {
  const errors = diagnostics.filter((d) => d.severity === "error");
  return (
    <div className="flex flex-col gap-2">
      <p className="font-medium text-danger">
        Код не компилируется: {errors.length === 1 ? "одна ошибка" : `ошибок: ${errors.length}`}.
      </p>
      <ul className="flex flex-col gap-1.5">
        {errors.map((d) => {
          const explained = explainCompileError(d.message);
          return (
            <li key={`${d.start}-${d.message}`}>
              <button
                type="button"
                onClick={() => onReveal(d.start)}
                className="flex w-full flex-col gap-1 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-card-hover"
              >
                <span className="flex items-baseline gap-3">
                  <span className="shrink-0 font-mono text-xs text-danger">строка {d.line}</span>
                  <span className={explained ? "font-medium" : "font-mono text-[13px]"}>
                    {explained ? explained.title : d.message}
                  </span>
                </span>
                {explained && (
                  <>
                    <span className="pl-[4.5rem] text-muted">{explained.fix}</span>
                    <span className="pl-[4.5rem] font-mono text-xs text-muted">{d.message}</span>
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted">Нажми на ошибку, чтобы перейти к строке в редакторе.</p>
    </div>
  );
}

function Verdicts({ verdicts }: { verdicts: TestVerdict[] }) {
  const passed = verdicts.filter((v) => v.passed).length;
  return (
    <div className="flex flex-col gap-2">
      <p className={cn("font-medium", passed === verdicts.length ? "text-success" : "text-text")}>
        Тесты: {passed} из {verdicts.length}
      </p>
      <ul className="flex flex-col gap-2">
        {verdicts.map((v) => (
          <li key={v.name} className="rounded-md border border-border bg-card px-3 py-2">
            <div className="flex items-baseline gap-2 text-sm">
              <span aria-hidden="true" className={v.passed ? "text-success" : "text-danger"}>
                {v.passed ? "✓" : "✗"}
              </span>
              <span className={v.passed ? "text-muted" : "font-medium"}>{v.name}</span>
              <span className="sr-only">{v.passed ? "пройден" : "не пройден"}</span>
            </div>
            {!v.passed && v.kind === "source" && v.message && (
              <p className="mt-1 pl-5 text-sm text-muted">{v.message}</p>
            )}
            {!v.passed && v.kind === "io" && (
              <div className="mt-2 flex flex-col gap-2 pl-5">
                <RunProblem status={v.status} error={v.error} />
                {v.diff && (
                  <p className="text-sm">
                    Первое расхождение: ждали <code className="font-mono text-code-text">«{v.diff.expected}»</code>,
                    получили <code className="font-mono text-code-text">«{v.diff.actual}»</code>.
                  </p>
                )}
                <div className="flex flex-col gap-2 md:flex-row">
                  <Output label="Ждали" text={v.expected ?? ""} tone="muted" highlight={v.diff?.expectedLine} />
                  <Output label="Получили" text={v.actual ?? ""} highlight={v.diff?.actualLine} />
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ResultsPanel({
  outcome,
  onReveal,
  success,
}: {
  outcome: Outcome;
  onReveal: (offset: number) => void;
  /** Блок «этап сдан»: следующий шаг и трассировка */
  success?: ReactNode;
}) {
  return (
    <div aria-live="polite" className="flex flex-col gap-3 p-4 text-sm">
      {outcome.kind === "idle" && (
        <p className="text-muted">
          Напиши код и нажми «Проверить» (<kbd className="font-mono">Ctrl</kbd> + <kbd className="font-mono">Enter</kbd>
          ). Тесты запустят программу настоящим компилятором Java.
        </p>
      )}
      {outcome.kind === "running" && (
        <p className="flex items-center gap-2 text-muted">
          <span
            className="size-3 animate-spin rounded-full border-2 border-accent border-t-transparent"
            aria-hidden="true"
          />
          {outcome.mode === "check" ? "Компилирую и запускаю тесты…" : "Компилирую и запускаю…"}
          {outcome.cold && " Первая компиляция после загрузки страницы занимает до минуты."}
        </p>
      )}
      {outcome.kind === "engine-error" && <p className="text-danger">{outcome.message}</p>}
      {outcome.kind === "compile-error" && (
        <Diagnostics diagnostics={outcome.compile.diagnostics} onReveal={onReveal} />
      )}
      {outcome.kind === "checked" && (
        <>
          {outcome.passed && success}
          <Verdicts verdicts={outcome.verdicts} />
        </>
      )}
      {outcome.kind === "ran" && (
        <div className="flex flex-col gap-2">
          <RunProblem status={outcome.run.status} error={outcome.run.error} exitCode={outcome.run.exitCode} />
          <Output
            label={outcome.stdin ? "Вывод программы" : "Вывод программы (ввод пустой)"}
            text={outcome.run.stdout}
          />
        </div>
      )}
    </div>
  );
}
