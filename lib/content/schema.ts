import { z } from "zod";

const slug = z.string().regex(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/, "латиница, цифры, - или _");
const javaFileName = z.string().regex(/^[A-Z][A-Za-z0-9_]*\.java$/, "имя публичного класса + .java");
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

/** Ввод → ожидаемый вывод. Сравнение по умолчанию построчное, без хвостовых пробелов. */
export const ioTestSchema = z.object({
  kind: z.literal("io").default("io"),
  name: z.string().min(1),
  stdin: z.string().default(""),
  stdout: z.string(),
  match: z.enum(["lines", "exact", "contains", "regex"]).default("lines"),
});

/** Проверка структуры кода, когда по выводу её не видно (например, «используй break»). */
export const sourceTestSchema = z.object({
  kind: z.literal("source"),
  name: z.string().min(1),
  pattern: z.string().min(1),
  /** Подсказка, если проверка не прошла */
  message: z.string().optional(),
});

export const stageTestSchema = z.union([sourceTestSchema, ioTestSchema]);

const choiceQuestion = {
  options: z.array(z.string().min(1)).min(2),
  correct: z.number().int().nonnegative(),
};

const correctInRange = (q: { options: string[]; correct: number }) => q.correct < q.options.length;

export const stageSchema = z.object({
  id: slug,
  badge: z.string().min(1),
  title: z.string().min(1),
  hint: z.string().min(1),
  /** Ввод, подставленный в поле stdin при ручном запуске */
  sampleInput: z.string().optional(),
  quiz: z
    .object({ question: z.string().min(1), ...choiceQuestion, hint: z.string().min(1) })
    .refine(correctInRange, "quiz.correct вне списка вариантов"),
  exam: z
    .array(
      z
        .object({ q: z.string().min(1), ...choiceQuestion, explain: z.string().min(1), advice: z.string().min(1) })
        .refine(correctInRange, "exam.correct вне списка вариантов"),
    )
    .min(1),
  memory: z
    .object({
      stack: z.array(z.object({ method: z.string(), vars: z.array(z.string()) })),
      heap: z.array(z.object({ obj: z.string(), data: z.string() })),
    })
    .optional(),
  loopTracer: z.object({ rows: z.number().int().min(1).max(12), cols: z.number().int().min(1).max(12) }).optional(),
  tests: z.array(stageTestSchema).min(1),
});

export const questSchema = z.object({
  id: slug,
  num: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  fileName: javaFileName,
  order: z.number().int(),
  /** Квест, который нужно закрыть, чтобы открыть этот; null — открыт сразу */
  unlockAfter: slug.nullable(),
  /** Звание за закрытие квеста */
  rank: z.object({ title: z.string().min(1), icon: z.string().min(1), color: hexColor }),
});

export type IoTest = z.infer<typeof ioTestSchema>;
export type SourceTest = z.infer<typeof sourceTestSchema>;
export type StageTest = z.infer<typeof stageTestSchema>;
export type StageMeta = z.infer<typeof stageSchema>;
export type QuestMeta = z.infer<typeof questSchema>;

export type Stage = StageMeta & {
  questId: string;
  index: number;
  theory: string;
  pitfalls: string;
  starter: string;
  solution: string;
};

export type Quest = QuestMeta & { stages: Stage[] };
