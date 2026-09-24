import type { IoTest, SourceTest, StageTest } from "@/lib/content/schema";

/** Ответ драйвера на compile() — см. java/JavaZeroRunner.java */
export type Diagnostic = { severity: "error" | "warning"; line: number; start: number; end: number; message: string };
export type CompileResult = { compiled: boolean; ms: number; diagnostics: Diagnostic[]; fatal?: string };

/** Ответ драйвера на run() для одного ввода */
export type RunStatus = "ok" | "exception" | "timeout" | "exit" | "output_limit" | "error";
export type RunResult = { status: RunStatus; exitCode: number; ms: number; stdout: string; error: string };

export type TestVerdict = {
  name: string;
  kind: "io" | "source";
  passed: boolean;
  /** Для io: что вывела программа и чего ждали */
  expected?: string;
  actual?: string;
  status?: RunStatus;
  error?: string;
  /** Для source: подсказка */
  message?: string;
};

/** Убирает комментарии, не трогая строки и char-литералы: подсказки в стартовом коде не должны засчитываться. */
export function stripJavaComments(code: string): string {
  return code.replace(/"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|\/\/[^\n]*|\/\*[\s\S]*?\*\//g, (m) =>
    m.startsWith("//") || m.startsWith("/*") ? "" : m,
  );
}

export function normalizeNewlines(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}

/** Строки без хвостовых пробелов и без пустых строк в конце. */
function lines(text: string): string[] {
  const result = normalizeNewlines(text)
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""));
  while (result.length > 0 && result[result.length - 1] === "") result.pop();
  return result;
}

export function outputMatches(expected: string, actual: string, mode: IoTest["match"]): boolean {
  switch (mode) {
    case "exact":
      return normalizeNewlines(actual) === normalizeNewlines(expected);
    case "contains":
      return lines(actual).join("\n").includes(lines(expected).join("\n"));
    case "regex":
      return new RegExp(expected, "m").test(normalizeNewlines(actual));
    default: {
      const a = lines(actual);
      const e = lines(expected);
      return a.length === e.length && a.every((line, i) => line === e[i]);
    }
  }
}

/** Вводы для io-тестов в порядке их следования: драйвер запускает программу по одному разу на каждый. */
export function ioInputs(tests: StageTest[]): string[] {
  return tests.filter((t): t is IoTest => t.kind === "io").map((t) => t.stdin);
}

/** Сводит результаты компиляции и запусков с тестами этапа. */
export function judge(tests: StageTest[], source: string, runs: RunResult[]): TestVerdict[] {
  const code = stripJavaComments(source);
  let ioIndex = 0;
  return tests.map((test): TestVerdict => {
    if (test.kind === "source") return judgeSource(test, code);
    const run = runs[ioIndex++];
    if (!run)
      return { name: test.name, kind: "io", passed: false, expected: test.stdout, error: "программа не запускалась" };
    // System.exit(0) после вывода — законное завершение программы
    const finished = run.status === "ok" || (run.status === "exit" && run.exitCode === 0);
    const passed = finished && outputMatches(test.stdout, run.stdout, test.match);
    return {
      name: test.name,
      kind: "io",
      passed,
      expected: test.stdout,
      actual: normalizeNewlines(run.stdout),
      status: run.status,
      error: run.error || undefined,
    };
  });
}

function judgeSource(test: SourceTest, code: string): TestVerdict {
  return {
    name: test.name,
    kind: "source",
    passed: new RegExp(test.pattern, "m").test(code),
    message: test.message,
  };
}
