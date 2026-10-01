import { HANDLE_RE, normalizeHandle } from "@/lib/account/handle";
import { clientIp, RateLimiter } from "@/lib/ai/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/server";

// Проверка «ник свободен» на форме регистрации. Гость ещё не вошёл, а RPC handle_available выдан только
// вошедшим, поэтому смотрим таблицу профилей секретным ключом на сервере. Ответ — только «свободен или нет»
const limiter = new RateLimiter(60, 15 * 60 * 1000);

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request) {
  if (!limiter.hit(clientIp(request.headers)).ok) return json({ error: "Слишком много проверок, подожди." }, 429);
  const handle = normalizeHandle(new URL(request.url).searchParams.get("handle") ?? "");
  if (!HANDLE_RE.test(handle)) return json({ available: false, reason: "invalid" });
  if (!supabaseAdmin) return json({ error: "Проверка ника не настроена." }, 503);

  const { data, error } = await supabaseAdmin.from("profiles").select("id").eq("handle", handle).maybeSingle();
  if (error) return json({ error: "Не удалось проверить ник." }, 502);
  return json({ available: data === null });
}
