import { describe, expect, it } from "vitest";
import { explainCompileError, explainRuntimeError, HANDBOOK_ERRORS, runtimeErrorLine } from "@/lib/java/explain";
import { firstDifference, judge, outputMatches, type RunResult } from "@/lib/java/judge";

describe("терпимая проверка вывода", () => {
  it("tokens: неважно, табуляция или пробелы, и сколько их", () => {
    const table = "1\t2\t3\t\n2\t4\t6\t\n";
    expect(outputMatches(table, "   1   2   3\n   2   4   6\n", "tokens")).toBe(true);
    expect(outputMatches(table, "1 2 3\n2 4 7\n", "tokens")).toBe(false);
  });

  it("tokens: пустые строки не важны, порядок строк важен", () => {
    const primes = "\nКоличество простых чисел: 0\n";
    expect(outputMatches(primes, "Количество простых чисел: 0\n", "tokens")).toBe(true);
    expect(outputMatches("a\nb\n", "b\na\n", "tokens")).toBe(false);
  });

  it("ё и е — одна буква во всех режимах", () => {
    expect(outputMatches("6 Четное\n", "6 Чётное\n", "lines")).toBe(true);
    expect(outputMatches("6 Четное\n", "6 Чётное\n", "tokens")).toBe(true);
    expect(outputMatches("Ёлка\n", "Елка\n", "exact")).toBe(true);
  });

  it("первое расхождение: строка и номера в обоих выводах", () => {
    expect(firstDifference("1\n2\n3\n", "1\n2\n4\n", "lines")).toEqual({
      expected: "3",
      actual: "4",
      expectedLine: 3,
      actualLine: 3,
    });
    // tokens пропускает пустые строки, но подсвечивает строку по её настоящему номеру
    expect(firstDifference("a\nb\n", "\na\nc\n", "tokens")).toMatchObject({ actual: "c", actualLine: 3 });
    expect(firstDifference("a\nb\n", "a\n", "lines")).toMatchObject({ actual: "(ничего)", actualLine: null });
    expect(firstDifference("a\n", "a\n", "lines")).toBeNull();
  });

  it("вердикт несданного теста несёт расхождение, сданного — нет", () => {
    const run = (stdout: string): RunResult => ({ status: "ok", exitCode: 0, ms: 1, stdout, error: "" });
    const tests = [{ kind: "io" as const, name: "t", stdin: "", stdout: "Попытка 1\n", match: "lines" as const }];
    expect(judge(tests, "", [run("Попытка: 1\n")])[0].diff).toMatchObject({ expected: "Попытка 1" });
    expect(judge(tests, "", [run("Попытка 1\n")])[0].diff).toBeUndefined();
  });
});

describe("ошибки по-русски", () => {
  it("частые сообщения компилятора объяснены", () => {
    expect(explainCompileError('Syntax error, insert ";" to complete BlockStatements')?.title).toBe("Не хватает «;»");
    expect(explainCompileError("sum cannot be resolved to a variable")?.title).toBe("Переменная «sum» не объявлена");
    expect(explainCompileError("Scanner cannot be resolved to a type")?.fix).toContain("import java.util.Scanner;");
    expect(explainCompileError("string cannot be resolved to a type")?.fix).toContain("String");
    expect(explainCompileError("Type mismatch: cannot convert from String to char")?.fix).toContain("case '+'");
    expect(explainCompileError("The operator && is undefined for the argument type(s) int, int")?.fix).toContain(
      "== 0",
    );
  });

  it("незнакомое сообщение не выдумывается", () => {
    expect(explainCompileError("Something completely new")).toBeNull();
  });

  it("исключения при запуске: причина и строка кода", () => {
    const error = "java.lang.ArrayIndexOutOfBoundsException: Index 5 out of bounds for length 5\n\tat main (строка 7)";
    expect(explainRuntimeError(error)?.fix).toContain("от 0 до 4");
    expect(runtimeErrorLine(error)).toBe(7);
    expect(explainRuntimeError("java.util.NoSuchElementException")?.title).toBe("Ввод закончился");
    expect(explainRuntimeError("java.lang.ArithmeticException: / by zero")?.title).toBe("Деление на ноль");
  });

  it("каждый пример справочника действительно объясняется", () => {
    for (const message of HANDBOOK_ERRORS) expect(explainCompileError(message), message).not.toBeNull();
  });
});
