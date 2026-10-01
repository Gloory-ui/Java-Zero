import { describe, expect, it } from "vitest";
import { publicOrigin, yandexAuthorizeUrl, yandexProfile } from "@/lib/account/yandex";

describe("вход через Яндекс", () => {
  it("ссылка авторизации: код, наш адрес возврата, state и нужные доступы", () => {
    const url = new URL(
      yandexAuthorizeUrl("client-1", "https://java-zero.onrender.com/api/auth/yandex/callback", "s1"),
    );
    expect(url.origin + url.pathname).toBe("https://oauth.yandex.ru/authorize");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("client_id")).toBe("client-1");
    expect(url.searchParams.get("redirect_uri")).toBe("https://java-zero.onrender.com/api/auth/yandex/callback");
    expect(url.searchParams.get("state")).toBe("s1");
    expect(url.searchParams.get("scope")).toBe("login:email login:info login:avatar");
  });

  it("профиль: почта в нижнем регистре, имя, логин и портрет", () => {
    expect(
      yandexProfile({
        login: "anna.petrova",
        default_email: "Anna@Yandex.ru",
        real_name: "Анна Петрова",
        default_avatar_id: "123/abc",
        is_avatar_empty: false,
      }),
    ).toEqual({
      email: "anna@yandex.ru",
      fullName: "Анна Петрова",
      login: "anna.petrova",
      avatarUrl: "https://avatars.yandex.net/get-yapic/123%2Fabc/islands-200",
    });
  });

  it("без почты войти нельзя, пустой портрет не подставляется", () => {
    expect(yandexProfile({ login: "anna" })).toBeNull();
    expect(yandexProfile({ emails: ["a@ya.ru"], is_avatar_empty: true, default_avatar_id: "1" })?.avatarUrl).toBeNull();
  });

  it("адрес сайта за прокси берётся из X-Forwarded-*", () => {
    const request = new Request("http://localhost:10000/api/auth/yandex", {
      headers: { "x-forwarded-proto": "https", "x-forwarded-host": "java-zero.onrender.com" },
    });
    expect(publicOrigin(request)).toBe("https://java-zero.onrender.com");
    expect(publicOrigin(new Request("http://localhost:3000/api/auth/yandex"))).toBe("http://localhost:3000");
  });
});
