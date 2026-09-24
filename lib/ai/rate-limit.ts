/**
 * Скользящее окно в памяти процесса. На Render работает один экземпляр сервиса, поэтому этого хватает;
 * при масштабировании лимиты нужно перенести в общее хранилище.
 */
export class RateLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  /** Засчитывает запрос. Если лимит исчерпан, запрос не засчитывается и возвращается время ожидания. */
  hit(key: string): { ok: true; remaining: number } | { ok: false; retryAfterMs: number } {
    const now = this.now();
    const fresh = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (fresh.length >= this.limit) {
      this.hits.set(key, fresh);
      return { ok: false, retryAfterMs: this.windowMs - (now - fresh[0]) };
    }
    fresh.push(now);
    this.hits.set(key, fresh);
    if (this.hits.size > 5000) this.sweep(now);
    return { ok: true, remaining: this.limit - fresh.length };
  }

  private sweep(now: number) {
    for (const [key, times] of this.hits) {
      if (times.every((t) => now - t >= this.windowMs)) this.hits.delete(key);
    }
  }
}

/**
 * IP клиента за прокси Render: берём последний адрес из X-Forwarded-For — его дописал прокси,
 * а левые значения клиент может подделать. Так же работал старый сервер (trust proxy = 1).
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const last = forwarded?.split(",").at(-1)?.trim();
  return last || headers.get("x-real-ip") || "unknown";
}
