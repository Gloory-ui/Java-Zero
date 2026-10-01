import { describe, expect, it } from "vitest";
import { buildContents, systemInstruction, userTurn } from "@/lib/ai/prompt";
import { clientIp, RateLimiter } from "@/lib/ai/rate-limit";
import { mentorRequestSchema } from "@/lib/ai/schema";

const stage = { title: "Оператор остатка", questTitle: "Фундамент Java", task: "Выведи 7 % 2." };

const request = mentorRequestSchema.parse({
  persona: "dushny",
  stageKey: "basics/remainder",
  code: "int a = 7 % 2",
  compileErrors: [{ line: 1, message: 'Syntax error, insert ";"' }],
  failedTests: [{ name: "Выводит остаток", expected: "1", actual: "", status: "ok" }],
  message: "  Что не так?  ",
  history: [{ role: "user", text: "Привет" }],
});

describe("промпт ментора", () => {
  it("характер и правило «не писать решение целиком» в системной инструкции", () => {
    const text = systemInstruction("dushny");
    expect(text).toContain("душный профессор");
    expect(text).toContain("Никогда не пиши готовое решение");
  });

  it("сообщение студента содержит условие, код, настоящие ошибки компилятора и расхождение вывода", () => {
    const text = userTurn(request, stage);
    expect(text).toContain("ЭТАП: Фундамент Java — Оператор остатка");
    expect(text).toContain("Выведи 7 % 2.");
    expect(text).toContain("int a = 7 % 2");
    expect(text).toContain('- строка 1: Syntax error, insert ";"');
    expect(text).toContain("НЕ ПРОЙДЕН ТЕСТ «Выводит остаток»");
    expect(text).toContain("Ожидаемый вывод:\n1");
    expect(text).not.toContain("Статус запуска");
    expect(text.endsWith("ВОПРОС СТУДЕНТА:\nЧто не так?")).toBe(true);
  });

  it("история идёт перед новым вопросом", () => {
    const contents = buildContents(request, stage);
    expect(contents.map((c) => c.role)).toEqual(["user", "user"]);
    expect(contents[0].parts[0].text).toBe("Привет");
  });

  it("схема отсекает чужие ключи этапов и слишком длинный код", () => {
    const base = { stageKey: "basics/remainder", code: "", message: "?" };
    expect(mentorRequestSchema.safeParse(base).success).toBe(true);
    expect(mentorRequestSchema.safeParse({ ...base, stageKey: "../../etc/passwd" }).success).toBe(false);
    expect(mentorRequestSchema.safeParse({ ...base, code: "x".repeat(20_001) }).success).toBe(false);
    expect(mentorRequestSchema.safeParse({ ...base, message: "   " }).success).toBe(false);
  });
});

describe("лимит запросов", () => {
  it("скользящее окно: лишний запрос отклоняется, через окно снова можно", () => {
    let now = 0;
    const limiter = new RateLimiter(2, 1000, () => now);
    expect(limiter.hit("a")).toEqual({ ok: true, remaining: 1 });
    now = 100;
    expect(limiter.hit("a")).toEqual({ ok: true, remaining: 0 });
    now = 500;
    expect(limiter.hit("a")).toEqual({ ok: false, retryAfterMs: 500 });
    expect(limiter.hit("b").ok).toBe(true);
    now = 1001;
    expect(limiter.hit("a").ok).toBe(true);
  });

  it("IP берётся из последнего звена X-Forwarded-For", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "6.6.6.6, 1.2.3.4" }))).toBe("1.2.3.4");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
