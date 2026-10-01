import { describe, expect, it } from "vitest";
import { HANDLE_RE, isEmailLogin, normalizeHandle } from "@/lib/account/handle";

describe("ник или почта во входе", () => {
  it("почта — с @ в середине, ник — без неё или с @ в начале", () => {
    expect(isEmailLogin("anna@mail.ru")).toBe(true);
    expect(isEmailLogin("  anna@mail.ru ")).toBe(true);
    expect(isEmailLogin("barsik")).toBe(false);
    expect(isEmailLogin("@barsik")).toBe(false);
  });

  it("ник приводится к виду из базы: без @, в нижнем регистре", () => {
    expect(normalizeHandle(" @Barsik_2 ")).toBe("barsik_2");
    expect(HANDLE_RE.test(normalizeHandle("@Barsik_2"))).toBe(true);
    expect(HANDLE_RE.test(normalizeHandle("кот"))).toBe(false);
    expect(HANDLE_RE.test(normalizeHandle("ab"))).toBe(false);
  });
});
