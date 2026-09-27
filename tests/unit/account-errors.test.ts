import { describe, expect, it } from "vitest";
import { describeEmailLoginError, describeSyncError, retryDelay } from "@/lib/account/errors";

describe("ошибки синхронизации", () => {
  it("ошибка Supabase — объект, а не Error: вместо «[object Object]» понятный текст", () => {
    expect(describeSyncError({ code: "PGRST205", message: "Could not find the table" })).toContain("миграцию");
    expect(describeSyncError({ code: "42501", message: "permission denied" })).toContain("нет доступа");
    expect(describeSyncError({ code: "23514", message: "violates check constraint" })).toBe(
      "violates check constraint (код 23514)",
    );
    expect(describeSyncError(new TypeError("Failed to fetch"))).toBe("нет связи с сервером");
    expect(describeSyncError("строка")).toBe("строка");
    expect(describeSyncError(null)).toBe("неизвестная ошибка");
  });

  it("пауза между попытками растёт и упирается в 5 минут", () => {
    expect([0, 1, 2, 3, 4, 10].map(retryDelay)).toEqual([15_000, 30_000, 60_000, 120_000, 240_000, 300_000]);
  });
});

describe("ошибка письма для входа", () => {
  it("ответы Supabase превращаются в понятный русский текст", () => {
    expect(describeEmailLoginError("Error sending confirmation email")).toContain("Не удалось отправить письмо");
    expect(describeEmailLoginError("Error sending magic link email")).toContain("GitHub или Google");
    expect(describeEmailLoginError("For security purposes, you can only request this after 42 seconds.")).toBe(
      "Письмо уже отправлено. Подожди минуту и попробуй снова.",
    );
    expect(describeEmailLoginError("Что-то своё")).toBe("Что-то своё");
  });
});
