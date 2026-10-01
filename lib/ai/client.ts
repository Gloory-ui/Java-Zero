"use client";

import { create } from "zustand";
import { loadSupabase } from "@/lib/account/session";
import { useAccount } from "@/lib/account/store";
import type { MentorRequestInput } from "./schema";

export class MentorError extends Error {}

async function authHeader(): Promise<Record<string, string>> {
  if (useAccount.getState().status !== "signed-in") return {};
  try {
    const { data } = await (await loadSupabase()).auth.getSession();
    return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
  } catch {
    return {};
  }
}

/** Вопрос ментору. Ответ приходит потоком: onText вызывается с накопленным текстом. */
export async function askMentor(req: MentorRequestInput, onText: (text: string) => void, signal?: AbortSignal) {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify(req),
    signal,
  });
  if (!res.ok || !res.body) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new MentorError(data?.error ?? `Ментор не ответил (код ${res.status}).`);
  }
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    text += value;
    onText(text);
  }
  return text;
}

type MentorPanel = {
  open: boolean;
  /** Вопрос, который панель задаст сама после открытия (например, из защиты) */
  queued: string | null;
  show: (prompt?: string) => void;
  hide: () => void;
  takeQueued: () => string | null;
};

export const useMentor = create<MentorPanel>((set, get) => ({
  open: false,
  queued: null,
  show: (prompt) => set({ open: true, queued: prompt ?? null }),
  hide: () => set({ open: false }),
  takeQueued: () => {
    const prompt = get().queued;
    if (prompt) set({ queued: null });
    return prompt;
  },
}));
