import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { type ZodType, z } from "zod";
import { type Quest, questSchema, type Stage, stageSchema } from "./schema";

export const CONTENT_ROOT = path.join(process.cwd(), "content", "quests");

// Папка этапа: 01-memory-boxes → порядковый номер и id
const STAGE_DIR = /^(\d{2})-([a-z0-9]+(?:[-_][a-z0-9]+)*)$/;

function read(file: string): string {
  return readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

function parseYaml<T>(schema: ZodType<T>, file: string): T {
  const result = schema.safeParse(parse(read(file)));
  if (!result.success) throw new Error(`${path.relative(process.cwd(), file)}:\n${z.prettifyError(result.error)}`);
  return result.data;
}

function subdirs(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

function loadStage(questDir: string, questId: string, dirName: string, index: number): Stage {
  const dir = path.join(questDir, dirName);
  const match = STAGE_DIR.exec(dirName);
  if (!match) throw new Error(`${dir}: папка этапа должна называться NN-id, например 01-memory-boxes`);
  if (Number(match[1]) !== index + 1) throw new Error(`${dir}: ожидался номер ${String(index + 1).padStart(2, "0")}`);

  const meta = parseYaml(stageSchema, path.join(dir, "stage.yaml"));
  if (meta.id !== match[2]) throw new Error(`${dir}: id «${meta.id}» не совпадает с именем папки «${match[2]}»`);

  return {
    ...meta,
    questId,
    index,
    theory: read(path.join(dir, "theory.md")),
    pitfalls: read(path.join(dir, "pitfalls.md")),
    starter: read(path.join(dir, "Starter.java")),
    solution: read(path.join(dir, "Solution.java")),
  };
}

function loadQuest(dir: string): Quest {
  const meta = parseYaml(questSchema, path.join(dir, "quest.yaml"));
  const id = path.basename(dir);
  if (meta.id !== id) throw new Error(`${dir}: id «${meta.id}» не совпадает с именем папки`);
  const stages = subdirs(dir).map((name, index) => loadStage(dir, id, name, index));
  if (stages.length === 0) throw new Error(`${dir}: в квесте нет этапов`);
  return { ...meta, stages };
}

function validateCourse(quests: Quest[]): void {
  const byId = new Map(quests.map((q) => [q.id, q]));
  const orders = new Set<number>();
  for (const q of quests) {
    if (orders.has(q.order)) throw new Error(`Два квеста с order ${q.order}`);
    orders.add(q.order);
    if (q.unlockAfter !== null) {
      const prev = byId.get(q.unlockAfter);
      if (!prev) throw new Error(`${q.id}: unlockAfter ссылается на несуществующий квест «${q.unlockAfter}»`);
      if (prev.order >= q.order) throw new Error(`${q.id}: unlockAfter должен указывать на более ранний квест`);
    }
    const stageIds = new Set<string>();
    for (const s of q.stages) {
      if (stageIds.has(s.id)) throw new Error(`${q.id}: два этапа с id «${s.id}»`);
      stageIds.add(s.id);
    }
  }
  if (quests[0]?.unlockAfter !== null) throw new Error("Первый квест должен быть открыт сразу (unlockAfter: null)");
}

/** Весь курс, упорядоченный по quest.order. Бросает понятную ошибку, если контент нарушает схему. */
export function loadCourse(root: string = CONTENT_ROOT): Quest[] {
  const quests = subdirs(root)
    .map((name) => loadQuest(path.join(root, name)))
    .sort((a, b) => a.order - b.order);
  validateCourse(quests);
  return quests;
}

let cached: Quest[] | undefined;

/** Курс для страниц: в продакшене читается один раз, в разработке — заново, чтобы правки были видны сразу. */
export function getCourse(): Quest[] {
  if (process.env.NODE_ENV !== "production") return loadCourse();
  cached ??= loadCourse();
  return cached;
}

export function findStage(questId: string, stageId: string): { quest: Quest; stage: Stage } | undefined {
  const quest = getCourse().find((q) => q.id === questId);
  const stage = quest?.stages.find((s) => s.id === stageId);
  return quest && stage ? { quest, stage } : undefined;
}
