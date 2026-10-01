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
  /** Для io: первая строка, где вывод разошёлся с ожидаемым */
  diff?: OutputDiff;
};

/**
 * expected/actual — строки, на которых вывод разошёлся («(ничего)», если одна сторона кончилась раньше);
 * expectedLine/actualLine — их номера с 1 в исходном выводе, чтобы подсветить (null — строки нет).
 */
export type OutputDiff = { expected: string; actual: string; expectedLine: number | null; actualLine: number | null };

/** Убирает комментарии, не трогая строки и char-литералы: подсказки в стартовом коде не должны засчитываться. */
export function stripJavaComments(code: string): string {
  return code.replace(/"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|\/\/[^\n]*|\/\*[\s\S]*?\*\//g, (m) =>
    m.startsWith("//") || m.startsWith("/*") ? "" : m,
  );
}

export function normalizeNewlines(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}

/** Переводы строк к \n, «ё» к «е»: преподаватель не снимает баллы за «Чётное» вместо «Четное». */
function normalizeText(text: string): string {
  return normalizeNewlines(text).replace(/ё/g, "е").replace(/Ё/g, "Е");
}

type Line = { text: string; source: number };

/** Строки без хвостовых пробелов и без пустых строк в конце. */
function lineRecords(text: string): Line[] {
  const result = normalizeText(text)
    .split("\n")
    .map((l, i) => ({ text: l.replace(/\s+$/, ""), source: i + 1 }));
  while (result.length > 0 && result[result.length - 1].text === "") result.pop();
  return result;
}

const lines = (text: string) => lineRecords(text).map((l) => l.text);

/** Для режима tokens: непустые строки, в каждой слова через один пробел — число пробелов и табуляций не важно. */
function tokenRecords(text: string): Line[] {
  return normalizeText(text)
    .split("\n")
    .map((l, i) => ({ text: l.trim().split(/\s+/).join(" "), source: i + 1 }))
    .filter((l) => l.text !== "");
}

function comparableRecords(text: string, mode: IoTest["match"]): Line[] {
  return mode === "tokens" ? tokenRecords(text) : lineRecords(text);
}

const comparable = (text: string, mode: IoTest["match"]) => comparableRecords(text, mode).map((l) => l.text);

export function outputMatches(expected: string, actual: string, mode: IoTest["match"]): boolean {
  switch (mode) {
    case "exact":
      return normalizeText(actual) === normalizeText(expected);
    case "contains":
      return lines(actual).join("\n").includes(lines(expected).join("\n"));
    case "regex":
      return new RegExp(normalizeText(expected), "m").test(normalizeText(actual));
    default: {
      const a = comparable(actual, mode);
      const e = comparable(expected, mode);
      return a.length === e.length && a.every((line, i) => line === e[i]);
    }
  }
}

/**
 * Первая строка, где вывод разошёлся с ожидаемым: студент сразу видит, куда смотреть, вместо двух длинных
 * столбцов. Для contains и regex строки не сопоставить — там null.
 */
export function firstDifference(expected: string, actual: string, mode: IoTest["match"]): OutputDiff | null {
  if (mode === "contains" || mode === "regex") return null;
  const e = comparableRecords(expected, mode);
  const a = comparableRecords(actual, mode);
  for (let i = 0; i < Math.max(e.length, a.length); i++) {
    if (e[i]?.text !== a[i]?.text) {
      return {
        expected: e[i]?.text ?? "(ничего)",
        actual: a[i]?.text ?? "(ничего)",
        expectedLine: e[i]?.source ?? null,
        actualLine: a[i]?.source ?? null,
      };
    }
  }
  return null;
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
    const diff = passed || !finished ? null : firstDifference(test.stdout, run.stdout, test.match);
    return {
      name: test.name,
      kind: "io",
      passed,
      expected: test.stdout,
      actual: normalizeNewlines(run.stdout),
      status: run.status,
      error: run.error || undefined,
      ...(diff ? { diff } : {}),
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
