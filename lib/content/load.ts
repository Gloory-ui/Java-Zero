import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { type ZodType, z } from "zod";
import { type GroupPath, groupSchema, type Quest, questSchema, type Stage, stageSchema } from "./schema";

export const CONTENT_ROOT = path.join(process.cwd(), "content", "quests");

/** Путь группы лежит рядом с папкой квестов: content/group.yaml */
const groupFile = (root: string) => path.join(path.dirname(root), "group.yaml");

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

const pad = (n: number) => String(n).padStart(2, "0");

/** «ЭТАП {n} / {total}» → «ЭТАП 03 / 08»: при вставке этапа номера не нужно переписывать руками */
export function stageBadge(template: string, index: number, total: number): string {
  return template.replaceAll("{n}", pad(index + 1)).replaceAll("{total}", pad(total));
}

function loadStage(
  questDir: string,
  questId: string,
  dirName: string,
  index: number,
  total: number,
  badgeTemplate: string,
): Stage {
  const dir = path.join(questDir, dirName);
  const match = STAGE_DIR.exec(dirName);
  if (!match) throw new Error(`${dir}: папка этапа должна называться NN-id, например 01-memory-boxes`);
  if (Number(match[1]) !== index + 1) throw new Error(`${dir}: ожидался номер ${String(index + 1).padStart(2, "0")}`);

  const meta = parseYaml(stageSchema, path.join(dir, "stage.yaml"));
  if (meta.id !== match[2]) throw new Error(`${dir}: id «${meta.id}» не совпадает с именем папки «${match[2]}»`);

  return {
    ...meta,
    badge: meta.badge ?? stageBadge(badgeTemplate, index, total),
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
  const names = subdirs(dir);
  const stages = names.map((name, index) => loadStage(dir, id, name, index, names.length, meta.stageBadge));
  if (stages.length === 0) throw new Error(`${dir}: в квесте нет этапов`);
  return { ...meta, stages };
}

function validateCourse(quests: Quest[]): void {
  const byId = new Map(quests.map((q) => [q.id, q]));
  const orders = new Set<number>();
  for (const q of quests) {
    if (orders.has(q.order)) throw new Error(`Два квеста с order ${q.order}`);
    orders.add(q.order);
    if (q.track === "group" && q.unlockAfter !== null) {
      throw new Error(`${q.id}: квест группы открывается по content/group.yaml, у него unlockAfter: null`);
    }
    if (q.unlockAfter !== null) {
      const prev = byId.get(q.unlockAfter);
      if (!prev) throw new Error(`${q.id}: unlockAfter ссылается на несуществующий квест «${q.unlockAfter}»`);
      if (prev.track !== "course") throw new Error(`${q.id}: unlockAfter должен указывать на квест общего курса`);
      if (prev.order >= q.order) throw new Error(`${q.id}: unlockAfter должен указывать на более ранний квест`);
    }
    const stageIds = new Set<string>();
    for (const s of q.stages) {
      if (stageIds.has(s.id)) throw new Error(`${q.id}: два этапа с id «${s.id}»`);
      stageIds.add(s.id);
    }
  }
  const first = quests.find((q) => q.track === "course");
  if (first?.unlockAfter !== null)
    throw new Error("Первый квест общего курса должен быть открыт сразу (unlockAfter: null)");
}

/**
 * Путь группы: подготовка из общего курса и КТ, строго по порядку. Каждый квест пути получает groupAfter —
 * квест, после которого он открывается у участника группы. Каждая КТ стоит на пути ровно один раз.
 */
function applyGroupPath(quests: Quest[], group: GroupPath): void {
  const byId = new Map(quests.map((q) => [q.id, q]));
  const chain = group.steps.flatMap((step) => [...step.prep, step.kt]);
  const seen = new Set<string>();
  for (const step of group.steps) {
    for (const id of [...step.prep, step.kt]) {
      const quest = byId.get(id);
      if (!quest) throw new Error(`content/group.yaml: нет квеста «${id}»`);
      if (seen.has(id)) throw new Error(`content/group.yaml: квест «${id}» стоит на пути дважды`);
      seen.add(id);
    }
    if (byId.get(step.kt)?.track !== "group") throw new Error(`content/group.yaml: «${step.kt}» — не квест группы`);
    for (const id of step.prep) {
      if (byId.get(id)?.track !== "course")
        throw new Error(`content/group.yaml: подготовка «${id}» — не квест общего курса`);
    }
  }
  for (const q of quests) {
    if (q.track === "group" && !seen.has(q.id)) throw new Error(`${q.id}: квест группы не стоит в content/group.yaml`);
  }
  chain.forEach((id, i) => {
    (byId.get(id) as Quest).groupAfter = chain[i - 1] ?? null;
  });
}

export function loadGroupPath(root: string = CONTENT_ROOT): GroupPath {
  return parseYaml(groupSchema, groupFile(root));
}

/** Весь курс, упорядоченный по quest.order. Бросает понятную ошибку, если контент нарушает схему. */
export function loadCourse(root: string = CONTENT_ROOT): Quest[] {
  const quests = subdirs(root)
    .map((name) => loadQuest(path.join(root, name)))
    .sort((a, b) => a.order - b.order);
  validateCourse(quests);
  applyGroupPath(quests, loadGroupPath(root));
  return quests;
}

let cached: Quest[] | undefined;

/** Курс для страниц: в продакшене читается один раз, в разработке — заново, чтобы правки были видны сразу. */
export function getCourse(): Quest[] {
  if (process.env.NODE_ENV !== "production") return loadCourse();
  cached ??= loadCourse();
  return cached;
}

let cachedGroup: GroupPath | undefined;

/** Путь группы для страниц; кэш — как у курса */
export function getGroupPath(): GroupPath {
  if (process.env.NODE_ENV !== "production") return loadGroupPath();
  cachedGroup ??= loadGroupPath();
  return cachedGroup;
}

export function findStage(questId: string, stageId: string): { quest: Quest; stage: Stage } | undefined {
  const quest = getCourse().find((q) => q.id === questId);
  const stage = quest?.stages.find((s) => s.id === stageId);
  return quest && stage ? { quest, stage } : undefined;
}
