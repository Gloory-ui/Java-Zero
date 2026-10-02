import { supabaseAdmin } from "@/lib/supabase/server";
import { getCourse } from "./load";
import type { Quest, Stage } from "./schema";

/**
 * Правки текстов курса из админки (таблица content_overrides) поверх файлов в git. Правятся только тексты:
 * новые этапы, тесты и код Java по-прежнему меняются в git с проверкой content:check.
 * Читает правки только сервер секретным ключом: среди них могут быть задания «Группы»
 */

export type OverrideRow = { quest_id: string; stage_id: string; field: string; value: string };

/** Поля квеста, которые можно править */
export const QUEST_FIELDS = ["title", "subtitle"] as const;
/** Поля этапа; hints — подсказки по одной на строку (от 1 до 4) */
export const STAGE_FIELDS = ["title", "theory", "pitfalls", "hints", "quiz.question", "quiz.hint"] as const;

export type QuestField = (typeof QUEST_FIELDS)[number];
export type StageField = (typeof STAGE_FIELDS)[number];

/** «квест/этап» (у правки самого квеста этап пустой) → поле → новый текст */
export type Overrides = ReadonlyMap<string, ReadonlyMap<string, string>>;

export const NO_OVERRIDES: Overrides = new Map();

export const overrideKey = (questId: string, stageId = "") => `${questId}/${stageId}`;

export function toOverrides(rows: readonly OverrideRow[]): Overrides {
  const map = new Map<string, Map<string, string>>();
  for (const r of rows) {
    const key = overrideKey(r.quest_id, r.stage_id);
    const fields = map.get(key) ?? new Map<string, string>();
    fields.set(r.field, r.value);
    map.set(key, fields);
  }
  return map;
}

/** Подсказки из правки: непустые строки, не больше 4. Пустая правка оставляет подсказки из файла */
export function parseHints(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4);
}

/** Текст правки или undefined, если правки нет или она пустая: пустой заголовок сломал бы страницу */
const text = (fields: ReadonlyMap<string, string>, field: string) => {
  const value = fields.get(field);
  return value?.trim() ? value : undefined;
};

export function applyStageOverrides(stage: Stage, overrides: Overrides): Stage {
  const fields = overrides.get(overrideKey(stage.questId, stage.id));
  if (!fields) return stage;
  const hints = parseHints(fields.get("hints") ?? "");
  return {
    ...stage,
    title: text(fields, "title") ?? stage.title,
    theory: text(fields, "theory") ?? stage.theory,
    pitfalls: text(fields, "pitfalls") ?? stage.pitfalls,
    hints: hints.length ? hints : stage.hints,
    quiz: {
      ...stage.quiz,
      question: text(fields, "quiz.question") ?? stage.quiz.question,
      hint: text(fields, "quiz.hint") ?? stage.quiz.hint,
    },
  };
}

export function applyQuestOverrides(quest: Quest, overrides: Overrides): Quest {
  if (overrides.size === 0) return quest;
  const fields = overrides.get(overrideKey(quest.id));
  return {
    ...quest,
    title: (fields && text(fields, "title")) ?? quest.title,
    subtitle: (fields && text(fields, "subtitle")) ?? quest.subtitle,
    stages: quest.stages.map((s) => applyStageOverrides(s, overrides)),
  };
}

/** Сколько живут прочитанные правки. Страницы этапов пересобираются не чаще раза в минуту (revalidate) */
const TTL_MS = 30_000;
let cached: { at: number; value: Overrides } | undefined;

/**
 * Правки из базы (только на сервере). Без секретного ключа или при ошибке базы — последние прочитанные
 * или никаких: страница курса не должна падать из-за правок
 */
export async function loadOverrides(): Promise<Overrides> {
  if (!supabaseAdmin) return NO_OVERRIDES;
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;
  const { data, error } = await supabaseAdmin.from("content_overrides").select("quest_id, stage_id, field, value");
  if (error) {
    console.error("content_overrides:", error.message);
    return cached?.value ?? NO_OVERRIDES;
  }
  cached = { at: Date.now(), value: toOverrides(data as OverrideRow[]) };
  return cached.value;
}

/** Забыть прочитанные правки: после сохранения в админке страницы пересобираются уже с новыми */
export function forgetOverrides(): void {
  cached = undefined;
}

/** Курс с правками админки — для страниц, которые показывают тексты квестов и этапов */
export async function getCourseWithOverrides(): Promise<Quest[]> {
  const overrides = await loadOverrides();
  return getCourse().map((q) => applyQuestOverrides(q, overrides));
}
