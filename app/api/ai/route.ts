import { type GenerateContentResponse, GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { buildContents, systemInstruction } from "@/lib/ai/prompt";
import { clientIp, RateLimiter } from "@/lib/ai/rate-limit";
import { mentorRequestSchema } from "@/lib/ai/schema";
import { findStage } from "@/lib/content/load";
import { supabaseConfig } from "@/lib/supabase/config";

// Сначала новая модель, при ошибке или перегрузке — следующая; лёгкая lite-модель — последний запасной вариант.
// Список можно переопределить переменной GEMINI_MODELS через запятую, не меняя код
const MODELS = (process.env.GEMINI_MODELS ?? "gemini-3.8-flash,gemini-3.7-flash,gemini-3.6-flash,gemini-3.5-flash-lite")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

const WINDOW_MS = 15 * 60 * 1000;
// Гость — по IP, как на старом сайте; вошедший — по аккаунту и с запасом побольше
const guestLimiter = new RateLimiter(20, WINDOW_MS);
const userLimiter = new RateLimiter(40, WINDOW_MS);

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
const supabase = supabaseConfig
  ? createClient(supabaseConfig.url, supabaseConfig.key, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

function fail(status: number, error: string, headers?: HeadersInit) {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

/** id пользователя из токена Supabase; с неверным или просроченным токеном запрос считается гостевым. */
async function userId(authorization: string | null): Promise<string | null> {
  const token = authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!supabase || !token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  return error ? null : (data.user?.id ?? null);
}

/** Сколько ждать первый фрагмент от модели, прежде чем перейти к следующей */
const FIRST_CHUNK_MS = 20_000;
/** Предел на весь ответ: дольше студент ждать не станет */
const ANSWER_MS = 60_000;

type Params = Omit<Parameters<GoogleGenAI["models"]["generateContentStream"]>[0], "model">;
type Opened = {
  first: IteratorResult<GenerateContentResponse>;
  rest: AsyncIterator<GenerateContentResponse>;
  controller: AbortController;
};

/**
 * Открывает поток у первой модели, которая успела ответить. Перегрузка (503) видна уже на первом фрагменте;
 * у каждой попытки свой AbortController, связанный с запросом клиента, чтобы зависшую модель можно было бросить.
 */
async function openStream(params: Params, clientSignal: AbortSignal): Promise<Opened> {
  if (!ai) throw new Error("AI не настроен");
  let lastError: unknown;
  for (const model of MODELS) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    clientSignal.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(abort, FIRST_CHUNK_MS);
    try {
      const stream = await ai.models.generateContentStream({
        ...params,
        model,
        config: { ...params.config, abortSignal: controller.signal },
      });
      const rest = stream[Symbol.asyncIterator]();
      const first = await rest.next();
      clearTimeout(timer);
      return { first, rest, controller };
    } catch (error) {
      clearTimeout(timer);
      clientSignal.removeEventListener("abort", abort);
      if (clientSignal.aborted) throw error;
      lastError = error;
      const reason = controller.signal.aborted
        ? "нет ответа за 20 с"
        : String(error instanceof Error ? error.message : error);
      console.warn(`[ai] ${model}: ${reason.slice(0, 200)}`);
    }
  }
  throw lastError;
}

export async function POST(request: Request) {
  if (!ai) return fail(503, "AI-ментор на этом сервере пока не подключён.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, "Запрос должен быть в формате JSON.");
  }
  const parsed = mentorRequestSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Некорректный запрос к ментору.");
  const req = parsed.data;

  const uid = await userId(request.headers.get("authorization"));
  const limit = uid ? userLimiter.hit(`user:${uid}`) : guestLimiter.hit(`ip:${clientIp(request.headers)}`);
  if (!limit.ok) {
    const minutes = Math.ceil(limit.retryAfterMs / 60_000);
    return fail(429, `Слишком много вопросов подряд. Ментор снова ответит через ${minutes} мин.`, {
      "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)),
    });
  }

  const [questId, stageId] = req.stageKey.split("/");
  const found = findStage(questId, stageId);
  if (!found) return fail(400, "Неизвестный этап.");

  let opened: Opened;
  try {
    opened = await openStream(
      {
        contents: buildContents(req, {
          title: found.stage.title,
          questTitle: found.quest.title,
          task: found.stage.theory,
        }),
        config: {
          systemInstruction: systemInstruction(req.persona),
          temperature: req.persona === "chill" ? 0.4 : 0.2,
          // В лимит входят и «размышления» модели: при 600 токенах ответ обрывался на полуслове
          maxOutputTokens: 4096,
        },
      },
      request.signal,
    );
  } catch {
    return fail(503, "Нейросеть сейчас перегружена. Попробуй ещё раз через несколько секунд.");
  }

  const encoder = new TextEncoder();
  const deadline = setTimeout(() => opened.controller.abort(), ANSWER_MS);
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        let step = opened.first;
        while (!step.done) {
          const text = step.value.text;
          if (text) controller.enqueue(encoder.encode(text));
          step = await opened.rest.next();
        }
      } catch (error) {
        if (!request.signal.aborted) {
          // Модель оборвала ответ на середине (перегрузка) или не уложилась в минуту
          console.warn(`[ai] поток оборвался: ${String(error).slice(0, 200)}`);
          controller.enqueue(encoder.encode("\n\n_Ответ оборвался. Спроси ещё раз._"));
        }
      } finally {
        clearTimeout(deadline);
        controller.close();
      }
    },
    cancel() {
      clearTimeout(deadline);
      opened.controller.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
