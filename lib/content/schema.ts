import { z } from "zod";
import { ICON_NAMES } from "@/lib/icons";

const slug = z.string().regex(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/, "латиница, цифры, - или _");
const javaFileName = z.string().regex(/^[A-Z][A-Za-z0-9_]*\.java$/, "имя публичного класса + .java");
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

/** Ввод → ожидаемый вывод. Сравнение по умолчанию построчное, без хвостовых пробелов. */
export const ioTestSchema = z.object({
  kind: z.literal("io").default("io"),
  name: z.string().min(1),
  stdin: z.string().default(""),
  stdout: z.string(),
  /**
   * lines — построчно без хвостовых пробелов; tokens — построчно по словам: число пробелов, табуляции и пустые строки
   * не важны (таблицы, числа через пробел); exact, contains, regex — для особых случаев. «ё» везде равна «е».
   */
  match: z.enum(["lines", "tokens", "exact", "contains", "regex"]).default("lines"),
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
  /** Метка этапа; обычно не нужна — её собирает загрузчик по шаблону stageBadge из quest.yaml */
  badge: z.string().min(1).optional(),
  /** Этап добавлен в уже идущий курс: на карте для студентов с прогрессом он помечен «Новый» */
  isNew: z.boolean().optional(),
  title: z.string().min(1),
  /**
   * Подсказки по шагам: от направления мысли к почти готовому коду. Студент открывает их по одной;
   * целиком код показывает только «Решение» после пяти попыток.
   */
  hints: z.array(z.string().min(1)).min(1).max(4),
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
  /** Картина памяти в один момент; note объясняет, какой это момент и что видно */
  memory: z
    .object({
      note: z.string().optional(),
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
  // Титул за квест; icon — имя SVG-иконки из lib/icons.ts
  rank: z.object({ title: z.string().min(1), icon: z.enum(ICON_NAMES), color: hexColor }),
  /** Шаблон метки этапа: {n} — номер, {total} — число этапов (оба с ведущим нулём) */
  stageBadge: z.string().min(1).default("ЭТАП {n} / {total}"),
});

export type IoTest = z.infer<typeof ioTestSchema>;
export type SourceTest = z.infer<typeof sourceTestSchema>;
export type StageTest = z.infer<typeof stageTestSchema>;
export type StageMeta = z.infer<typeof stageSchema>;
export type QuestMeta = z.infer<typeof questSchema>;

export type Stage = Omit<StageMeta, "badge"> & {
  /** Всегда задана: из stage.yaml или по шаблону квеста */
  badge: string;
  questId: string;
  index: number;
  theory: string;
  pitfalls: string;
  starter: string;
  solution: string;
};

export type Quest = QuestMeta & { stages: Stage[] };
