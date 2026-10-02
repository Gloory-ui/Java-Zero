"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { adminAuthHeader } from "@/lib/admin/client";
import { cn } from "@/lib/cn";

/** Тексты этапа из файлов курса: то, что отдаёт GET /api/admin/content */
type StageText = {
  id: string;
  badge: string;
  title: string;
  theory: string;
  pitfalls: string;
  hints: string;
  "quiz.question": string;
  "quiz.hint": string;
};
type QuestText = {
  id: string;
  num: string;
  track: "course" | "group";
  title: string;
  subtitle: string;
  stages: StageText[];
};
type Override = { quest_id: string; stage_id: string; field: string; value: string; updated_at: string };

type FieldSpec = { field: string; label: string; rows: number; markdown?: boolean; help?: string };

const QUEST_SPEC: FieldSpec[] = [
  { field: "title", label: "Название квеста", rows: 1 },
  { field: "subtitle", label: "Подзаголовок", rows: 2 },
];

const STAGE_SPEC: FieldSpec[] = [
  { field: "title", label: "Название этапа", rows: 1 },
  {
    field: "theory",
    label: "Теория",
    rows: 16,
    markdown: true,
    help: "Markdown: ## заголовок, **жирный**, ```java код```",
  },
  { field: "pitfalls", label: "Частые ошибки", rows: 10, markdown: true },
  { field: "hints", label: "Подсказки", rows: 5, help: "По одной на строку, не больше четырёх" },
  { field: "quiz.question", label: "Вопрос квиза", rows: 2, help: "Варианты ответа меняются в файлах курса" },
  { field: "quiz.hint", label: "Подсказка к квизу", rows: 2 },
];

const key = (questId: string, stageId: string, field: string) => `${questId}/${stageId}/${field}`;

type SaveState = { kind: "idle" } | { kind: "saving" } | { kind: "saved" } | { kind: "error"; message: string };

async function save(questId: string, stageId: string, field: string, value: string | null): Promise<void> {
  const res = await fetch("/api/admin/content", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await adminAuthHeader()) },
    body: JSON.stringify({ quest_id: questId, stage_id: stageId, field, value }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Не сохранилось.");
  }
}

function FieldEditor({
  spec,
  original,
  override,
  onSave,
}: {
  spec: FieldSpec;
  original: string;
  override: string | undefined;
  onSave: (value: string | null) => Promise<void>;
}) {
  const current = override ?? original;
  const [draft, setDraft] = useState(current);
  const [preview, setPreview] = useState(false);
  const [state, setState] = useState<SaveState>({ kind: "idle" });
  const id = useId();

  // Правка сохранилась или убрана — поле показывает новый текст. Другой этап или поле — новый компонент (key),
  // поэтому статус «Сохранено» здесь не сбрасывается: иначе он пропадал бы сразу после сохранения
  useEffect(() => {
    setDraft(current);
  }, [current]);

  const run = async (value: string | null) => {
    setState({ kind: "saving" });
    try {
      await onSave(value);
      setState({ kind: "saved" });
    } catch (e) {
      setState({ kind: "error", message: e instanceof Error ? e.message : "Не сохранилось." });
    }
  };

  const changed = draft !== current;
  const Field = spec.rows === 1 ? "input" : "textarea";

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={id} className="font-semibold">
          {spec.label}
        </label>
        {override !== undefined && (
          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">изменено</span>
        )}
        {spec.markdown && (
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            aria-pressed={preview}
            className="ml-auto inline-flex min-h-11 items-center gap-1 text-sm text-muted hover:text-text sm:min-h-0"
          >
            <Icon name="eye" />
            {preview ? "Редактор" : "Предпросмотр"}
          </button>
        )}
      </div>
      {spec.help && <p className="text-sm text-muted">{spec.help}</p>}
      {preview ? (
        <div className="max-h-[32rem] overflow-y-auto rounded-md border border-border bg-surface p-4">
          <Markdown>{draft}</Markdown>
        </div>
      ) : (
        <Field
          id={id}
          value={draft}
          rows={spec.rows === 1 ? undefined : spec.rows}
          maxLength={50_000}
          onChange={(e) => setDraft(e.target.value)}
          className={cn(
            "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm",
            spec.rows === 1 ? "h-11 sm:h-10" : "font-mono leading-relaxed",
          )}
        />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button disabled={!changed || !draft.trim() || state.kind === "saving"} onClick={() => run(draft)}>
          Сохранить
        </Button>
        {changed && (
          <Button variant="ghost" onClick={() => setDraft(current)}>
            Отменить
          </Button>
        )}
        {override !== undefined && (
          <Button variant="ghost" disabled={state.kind === "saving"} onClick={() => run(null)}>
            <Icon name="rotate-ccw" />
            Вернуть из файла
          </Button>
        )}
        <span aria-live="polite" className="text-sm">
          {state.kind === "saving" && <span className="text-muted">Сохраняю…</span>}
          {state.kind === "saved" && <span className="text-success">Сохранено, на сайте — при следующем открытии</span>}
          {state.kind === "error" && <span className="text-danger">{state.message}</span>}
        </span>
      </div>
    </div>
  );
}

type Load = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; quests: QuestText[] };

/**
 * Правки текстов курса поверх файлов: названия, теория, ошибки, подсказки, вопрос квиза. Код, тесты и новые
 * этапы меняются в git с проверкой настоящей Java — здесь их нет
 */
export function AdminQuests() {
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [overrides, setOverrides] = useState<Map<string, string>>(new Map());
  const [questId, setQuestId] = useState<string>("");
  const [stageId, setStageId] = useState<string>("");
  const questSelectId = useId();

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await fetch("/api/admin/content", { headers: await adminAuthHeader() });
      const body = (await res.json().catch(() => null)) as {
        quests?: QuestText[];
        overrides?: Override[];
        error?: string;
      } | null;
      if (!alive) return;
      if (!res.ok || !body?.quests) {
        setLoad({ kind: "error", message: body?.error ?? "Не получилось загрузить курс." });
        return;
      }
      setOverrides(new Map((body.overrides ?? []).map((o) => [key(o.quest_id, o.stage_id, o.field), o.value])));
      setLoad({ kind: "ready", quests: body.quests });
      setQuestId((q) => q || body.quests?.[0]?.id || "");
    })().catch(() => {
      if (alive) setLoad({ kind: "error", message: "Не получилось загрузить курс." });
    });
    return () => {
      alive = false;
    };
  }, []);

  const quests = load.kind === "ready" ? load.quests : [];
  const quest = quests.find((q) => q.id === questId);
  const stage = quest?.stages.find((s) => s.id === stageId);

  /** Сколько правок у квеста: видно в списке, что уже менялось */
  const editedCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const k of overrides.keys()) {
      const q = k.split("/")[0];
      counts.set(q, (counts.get(q) ?? 0) + 1);
    }
    return counts;
  }, [overrides]);

  const onSave = (field: string) => async (value: string | null) => {
    if (!quest) return;
    await save(quest.id, stage?.id ?? "", field, value);
    setOverrides((prev) => {
      const next = new Map(prev);
      const k = key(quest.id, stage?.id ?? "", field);
      if (value === null || !value.trim()) next.delete(k);
      else next.set(k, value);
      return next;
    });
  };

  if (load.kind === "loading")
    return <div className="h-64 animate-pulse rounded-2xl bg-card motion-reduce:animate-none" />;
  if (load.kind === "error") {
    return (
      <p role="alert" className="rounded-xl border border-border bg-card p-4 text-danger">
        {load.message}
      </p>
    );
  }

  const specs = stage ? STAGE_SPEC : QUEST_SPEC;
  const source: Record<string, string> | undefined = stage
    ? stage
    : quest
      ? { title: quest.title, subtitle: quest.subtitle }
      : undefined;

  return (
    <section className="flex flex-col gap-4" aria-labelledby="admin-quests-title">
      <div className="flex flex-col gap-1">
        <h2 id="admin-quests-title" className="font-display text-xl font-semibold">
          Квесты
        </h2>
        <p className="text-sm text-muted">
          Правки текстов поверх файлов курса. На сайте они появляются при следующем открытии страницы. Код, тесты и
          новые этапы меняются в репозитории.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[16rem_1fr]">
        <div className="flex flex-col gap-3">
          <label htmlFor={questSelectId} className="text-sm font-semibold">
            Квест
          </label>
          <select
            id={questSelectId}
            value={questId}
            onChange={(e) => {
              setQuestId(e.target.value);
              setStageId("");
            }}
            className="h-11 rounded-md border border-border bg-surface px-3 text-sm sm:h-10"
          >
            {quests.map((q) => (
              <option key={q.id} value={q.id}>
                {q.num} · {q.title}
                {q.track === "group" ? " (Группа)" : ""}
                {editedCount.get(q.id) ? ` — правок: ${editedCount.get(q.id)}` : ""}
              </option>
            ))}
          </select>

          {quest && (
            <nav aria-label="Этапы квеста">
              <ul className="flex flex-col gap-1">
                <li>
                  <button
                    type="button"
                    onClick={() => setStageId("")}
                    aria-current={stageId === "" ? "true" : undefined}
                    className={cn(
                      "flex min-h-11 w-full items-center rounded-md px-3 text-left text-sm sm:min-h-10",
                      stageId === "" ? "bg-card font-semibold text-text" : "text-muted hover:text-text",
                    )}
                  >
                    Сам квест
                  </button>
                </li>
                {quest.stages.map((s) => {
                  const edited = STAGE_SPEC.some((f) => overrides.has(key(quest.id, s.id, f.field)));
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => setStageId(s.id)}
                        aria-current={stageId === s.id ? "true" : undefined}
                        className={cn(
                          "flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-left text-sm sm:min-h-10",
                          stageId === s.id ? "bg-card font-semibold text-text" : "text-muted hover:text-text",
                        )}
                      >
                        <span className="truncate">{s.title}</span>
                        {edited && (
                          <>
                            <span className="ml-auto size-2 shrink-0 rounded-full bg-accent" aria-hidden />
                            <span className="sr-only">есть правки</span>
                          </>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          {quest && source && (
            <>
              <p className="font-mono text-xs tracking-widest text-gold uppercase">
                {stage ? `${quest.title} · ${stage.badge}` : `Квест ${quest.num}`}
              </p>
              {specs.map((spec) => (
                <FieldEditor
                  key={`${quest.id}/${stage?.id ?? ""}/${spec.field}`}
                  spec={spec}
                  original={source[spec.field] ?? ""}
                  override={overrides.get(key(quest.id, stage?.id ?? "", spec.field))}
                  onSave={onSave(spec.field)}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
