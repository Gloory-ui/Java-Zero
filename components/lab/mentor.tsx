"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type FormEvent, type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { askMentor, MentorError, useMentor } from "@/lib/ai/client";
import { MENTOR_MESSAGE_MAX } from "@/lib/ai/limits";
import { PERSONA_INFO } from "@/lib/ai/personas";
import type { MentorRequestInput } from "@/lib/ai/schema";
import { cn } from "@/lib/cn";
import { mentorAsked } from "@/lib/game/events";
import { useProgress } from "@/lib/progress/store";
import type { Persona } from "@/lib/progress/types";

export type MentorContext = Pick<MentorRequestInput, "code" | "compileErrors" | "failedTests">;

type Message = { id: number; role: "user" | "model"; text: string; error?: boolean };

const PROMPTS = {
  review: "Сделай ревью моего кода: что работает не так и что стоит улучшить?",
  explain: "Объясни простыми словами, почему не проходит проверка, и подскажи, куда смотреть.",
  quiz: "Задай мне один каверзный вопрос с подвохом по теме этого этапа. Ответ не называй, пока я не отвечу.",
};

const HISTORY_TURNS = 6;

let nextId = 1;

/**
 * AI-ментор: панель справа на широком экране и лист снизу на телефоне. Не модальная: код можно править, пока
 * ментор отвечает. К вопросу автоматически прикладываются код, ошибки компилятора и непройденные тесты.
 */
export function Mentor({ stageKey, getContext }: { stageKey: string; getContext: () => MentorContext }) {
  const open = useMentor((s) => s.open);
  const persona = useProgress((s) => s.persona);
  const reduceMotion = useReducedMotion();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const scroller = useRef<HTMLDivElement>(null);

  // Новый этап — новый разговор
  // biome-ignore lint/correctness/useExhaustiveDependencies: сброс именно при смене этапа
  useEffect(() => {
    abort.current?.abort();
    setMessages([]);
  }, [stageKey]);

  // Прокрутка вниз на каждый новый фрагмент ответа
  // biome-ignore lint/correctness/useExhaustiveDependencies: эффект нужен именно при изменении сообщений
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const message = text.trim().slice(0, MENTOR_MESSAGE_MAX);
      if (!message || streaming) return;
      const history = messages
        .filter((m) => !m.error && m.text)
        .slice(-HISTORY_TURNS)
        .map((m) => ({ role: m.role, text: m.text.slice(0, 4000) }));
      const questionId = nextId++;
      const answerId = nextId++;
      setMessages((list) => [
        ...list,
        { id: questionId, role: "user", text: message },
        { id: answerId, role: "model", text: "" },
      ]);
      setDraft("");
      setStreaming(true);
      const controller = new AbortController();
      abort.current = controller;

      const update = (patch: Partial<Message>) =>
        setMessages((list) => list.map((m) => (m.id === answerId ? { ...m, ...patch } : m)));
      try {
        await askMentor(
          { persona, stageKey, message, history, ...getContext() },
          (partial) => update({ text: partial }),
          controller.signal,
        );
        mentorAsked();
      } catch (error) {
        if (controller.signal.aborted) update({ text: "_Остановлено._" });
        else
          update({
            text: error instanceof MentorError ? error.message : "Нет связи с ментором. Проверь интернет.",
            error: true,
          });
      } finally {
        setStreaming(false);
        abort.current = null;
      }
    },
    [getContext, messages, persona, stageKey, streaming],
  );

  const sendRef = useRef(send);
  sendRef.current = send;

  // Только в момент открытия: фокус в поле или вопрос из другого места («устный допрос» после защиты)
  useEffect(() => {
    if (!open) return;
    const queued = useMentor.getState().takeQueued();
    if (queued) void sendRef.current(queued);
    else input.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") useMentor.getState().hide();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(draft);
  };

  const onInputKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send(draft);
    }
  };

  const context = open ? getContext() : null;
  const failing = Boolean(context && (context.compileErrors?.length || context.failedTests?.length));
  const chips = [
    { label: "Разбери мой код", prompt: PROMPTS.review, show: true },
    { label: "Почему не проходит?", prompt: PROMPTS.explain, show: failing },
    { label: "Каверзный вопрос", prompt: PROMPTS.quiz, show: true },
  ].filter((c) => c.show);

  const offscreen = reduceMotion ? { opacity: 0 } : { opacity: 0.6, x: "100%" };

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          aria-label="AI-ментор"
          initial={offscreen}
          animate={{ opacity: 1, x: 0 }}
          exit={offscreen}
          transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 flex h-[80dvh] flex-col rounded-t-xl border border-border-strong bg-surface shadow-2xl lg:inset-x-auto lg:top-14 lg:right-0 lg:h-auto lg:w-[420px] lg:rounded-none lg:border-y-0 lg:border-r-0"
        >
          <header className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
            <h2 className="font-display text-base font-semibold">AI-ментор</h2>
            <label className="ml-auto">
              <span className="sr-only">Характер ментора</span>
              <select
                value={persona}
                onChange={(e) => useProgress.getState().setPersona(e.target.value as Persona)}
                className="h-8 rounded-md border border-border bg-card px-2 text-sm"
              >
                {PERSONA_INFO.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => useMentor.getState().hide()}
              aria-label="Закрыть ментора"
              className="grid size-8 place-items-center rounded-md text-muted hover:bg-card hover:text-text"
            >
              <Icon name="x" className="size-4" />
            </button>
          </header>

          <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-4 py-4" aria-live="polite">
            {messages.length === 0 ? (
              <div className="flex flex-col gap-3 text-sm text-muted">
                <p>
                  Спроси про свой код или ошибку. Ментор видит условие этапа, твой код и результат последней проверки,
                  но готовое решение не напишет.
                </p>
              </div>
            ) : (
              <ol className="flex flex-col gap-4">
                {messages.map((m) => (
                  <li key={m.id} className={cn("flex", m.role === "user" && "justify-end")}>
                    {m.role === "user" ? (
                      <p className="max-w-[85%] rounded-lg bg-card px-3 py-2 text-sm whitespace-pre-wrap">{m.text}</p>
                    ) : m.text === "" ? (
                      <span className="flex gap-1 py-2">
                        <span className="sr-only">Ментор печатает</span>
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="size-1.5 animate-pulse rounded-full bg-muted"
                            style={{ animationDelay: `${i * 150}ms` }}
                          />
                        ))}
                      </span>
                    ) : (
                      <div
                        className={cn(
                          "min-w-0 text-sm [&_h2]:mt-3 [&_h2]:text-base [&_p]:my-2 [&_pre]:my-2 [&_pre]:p-3",
                          m.error && "text-danger",
                        )}
                      >
                        <Markdown>{m.text}</Markdown>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>

          <form onSubmit={onSubmit} className="flex shrink-0 flex-col gap-2 border-t border-border p-3">
            <div className="flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  disabled={streaming}
                  onClick={() => void send(c.prompt)}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted transition-colors duration-150 ease-snappy hover:border-border-strong hover:text-text disabled:opacity-50"
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="flex items-end gap-2">
              <label htmlFor="mentor-input" className="sr-only">
                Вопрос ментору
              </label>
              <textarea
                id="mentor-input"
                ref={input}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onInputKey}
                rows={2}
                maxLength={MENTOR_MESSAGE_MAX}
                placeholder="Спроси ментора… (Enter — отправить)"
                className="max-h-40 min-h-11 flex-1 resize-none rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
              />
              {streaming ? (
                <Button variant="secondary" onClick={() => abort.current?.abort()}>
                  Стоп
                </Button>
              ) : (
                <Button type="submit" disabled={draft.trim() === ""}>
                  Спросить
                </Button>
              )}
            </div>
          </form>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
