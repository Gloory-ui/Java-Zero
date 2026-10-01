import { z } from "zod";
import { HANDLE_RE, normalizeHandle, PASSWORD_MAX } from "@/lib/account/handle";
import { clientIp, RateLimiter } from "@/lib/ai/rate-limit";
import { supabaseAdmin, supabaseAnon } from "@/lib/supabase/server";

// Вход по нику. По нику сервер находит аккаунт секретным ключом и входит паролем от имени пользователя, а в браузер
// возвращает только сессию. Почта в ответ не попадает: иначе по нику можно было бы узнать чужой адрес.
// Вход по почте идёт из браузера напрямую в Supabase, этот маршрут для него не нужен
const WINDOW_MS = 15 * 60 * 1000;
const byIp = new RateLimiter(10, WINDOW_MS);
const byHandle = new RateLimiter(10, WINDOW_MS);

const bodySchema = z.object({
  handle: z.string().max(40),
  password: z
    .string()
    .min(1)
    .max(PASSWORD_MAX * 4),
});

// На «нет такого ника» и «неверный пароль» ответ одинаковый: так по маршруту не проверить, какие ники заняты
const WRONG = "Неверный ник или пароль.";

const json = (body: unknown, status = 200, headers?: HeadersInit) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ error: "Запрос должен быть в формате JSON." }, 400);
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return json({ error: WRONG }, 400);
  const handle = normalizeHandle(parsed.data.handle);
  if (!HANDLE_RE.test(handle)) return json({ error: WRONG }, 400);

  for (const limit of [byIp.hit(clientIp(request.headers)), byHandle.hit(handle)]) {
    if (!limit.ok) {
      const minutes = Math.ceil(limit.retryAfterMs / 60_000);
      return json({ error: `Слишком много попыток входа. Попробуй через ${minutes} мин.` }, 429, {
        "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)),
      });
    }
  }

  const anon = supabaseAnon();
  if (!supabaseAdmin || !anon) return json({ error: "Вход по нику пока не настроен. Войди по почте." }, 503);

  const { data: profile, error: lookupError } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("handle", handle)
    .maybeSingle();
  if (lookupError) return json({ error: "Не удалось войти, попробуй ещё раз." }, 502);
  if (!profile) return json({ error: WRONG }, 400);

  const { data: account } = await supabaseAdmin.auth.admin.getUserById(profile.id);
  const email = account.user?.email;
  if (!email) return json({ error: WRONG }, 400);

  const { data, error } = await anon.auth.signInWithPassword({ email, password: parsed.data.password });
  if (error || !data.session) {
    if (error && /not confirmed/i.test(error.message)) {
      return json({ error: "Почта не подтверждена. Войди по почте, чтобы получить код." }, 403);
    }
    if (error?.status === 429) return json({ error: "Слишком много попыток входа. Подожди немного." }, 429);
    return json({ error: WRONG }, 400);
  }
  return json({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
}
