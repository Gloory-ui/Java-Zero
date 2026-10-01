import { describe, expect, it } from "vitest";
import { describeAuthError, describeSyncError, retryDelay } from "@/lib/account/errors";

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

describe("ошибки входа и регистрации", () => {
  it("ответы Supabase превращаются в понятный русский текст", () => {
    expect(describeAuthError("Invalid login credentials")).toBe("Неверный ник, почта или пароль.");
    expect(describeAuthError("Email not confirmed")).toContain("Введи код из письма");
    expect(describeAuthError("User already registered")).toContain("уже зарегистрирована");
    expect(describeAuthError("Token has expired or is invalid")).toBe("Код неверный или устарел. Запроси новый.");
    expect(describeAuthError("Password should be at least 8 characters.")).toBe(
      "Пароль слишком короткий: нужно не меньше 8 символов.",
    );
    expect(describeAuthError("Error sending confirmation email")).toContain("Не удалось отправить письмо");
    expect(describeAuthError("For security purposes, you can only request this after 42 seconds.")).toContain(
      "Подожди минуту",
    );
  });

  it("русский текст с сервера проходит как есть", () => {
    expect(describeAuthError("Неверный ник или пароль.")).toBe("Неверный ник или пароль.");
  });
});
