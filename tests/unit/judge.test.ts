import { describe, expect, it } from "vitest";
import type { StageTest } from "@/lib/content/schema";
import { ioInputs, judge, outputMatches, type RunResult, stripJavaComments } from "@/lib/java/judge";

const ok = (stdout: string): RunResult => ({ status: "ok", exitCode: 0, ms: 1, stdout, error: "" });

describe("stripJavaComments", () => {
  it("убирает комментарии, но не трогает строки и символы", () => {
    const code = "int a = 1; // b == 0\nString s = \"http://x /* не комментарий */\"; /* блок */ char c = '/';";
    expect(stripJavaComments(code)).toBe("int a = 1; \nString s = \"http://x /* не комментарий */\";  char c = '/';");
  });
});

describe("outputMatches", () => {
  it("lines: игнорирует CRLF, хвостовые пробелы и пустые строки в конце", () => {
    expect(outputMatches("1\t2\t3\t\n", "1\t2\t3\r\n\r\n", "lines")).toBe(true);
  });

  it("lines: различает содержимое и порядок строк", () => {
    expect(outputMatches("1\n2\n", "2\n1\n", "lines")).toBe(false);
    expect(outputMatches("12.5\n", "12.50\n", "lines")).toBe(false);
  });

  it("lines: сохраняет пустую первую строку", () => {
    expect(outputMatches("\nИтого: 0\n", "Итого: 0\n", "lines")).toBe(false);
    expect(outputMatches("\nИтого: 0\n", "\nИтого: 0\n", "lines")).toBe(true);
  });

  it("exact, contains и regex", () => {
    expect(outputMatches("a\n", "a\r\n", "exact")).toBe(true);
    expect(outputMatches("a\n", "a \n", "exact")).toBe(false);
    expect(outputMatches("Угадал!", "больше\nУгадал!\n", "contains")).toBe(true);
    expect(outputMatches("^\\d+\\.\\d+$", "3.5\n", "regex")).toBe(true);
  });
});

describe("judge", () => {
  const tests: StageTest[] = [
    { kind: "io", name: "первый ввод", stdin: "1\n", stdout: "1\n", match: "lines" },
    { kind: "source", name: "цикл for", pattern: "\\bfor\\s*\\(" },
    { kind: "io", name: "второй ввод", stdin: "2\n", stdout: "4\n", match: "lines" },
  ];

  it("отдаёт io-тестам запуски по порядку, пропуская source-тесты", () => {
    expect(ioInputs(tests)).toEqual(["1\n", "2\n"]);
    const verdicts = judge(tests, "for (;;) {}", [ok("1\n"), ok("5\n")]);
    expect(verdicts.map((v) => v.passed)).toEqual([true, true, false]);
    expect(verdicts[2]).toMatchObject({ expected: "4\n", actual: "5\n" });
  });

  it("не засчитывает структуру, упомянутую только в комментарии", () => {
    const verdicts = judge(tests, "// здесь нужен for (int i...)\nwhile (true) {}", [ok("1\n"), ok("4\n")]);
    expect(verdicts[1].passed).toBe(false);
  });

  it("System.exit(0) после вывода засчитывается, таймаут — нет", () => {
    const exit0: RunResult = { ...ok("1\n"), status: "exit", exitCode: 0 };
    const timeout: RunResult = { ...ok("4\n"), status: "timeout" };
    const verdicts = judge(tests, "for (;;) {}", [exit0, timeout]);
    expect(verdicts.map((v) => v.passed)).toEqual([true, true, false]);
    expect(verdicts[2].status).toBe("timeout");
  });

  it("без запуска io-тест проваливается", () => {
    expect(judge(tests, "for", [])[0]).toMatchObject({ passed: false, error: "программа не запускалась" });
  });
});
