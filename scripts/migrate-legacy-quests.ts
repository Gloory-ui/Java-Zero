// Одноразовая миграция client/js/quests.js (сайт до v1.0) в content/quests/**.
// Тесты старого сайта искали подстроки в коде; здесь они заменены на «ввод → вывод» и проверки структуры.
// Ожидаемый вывод берётся запуском эталонного решения (метка GOLDEN) — после миграции его нужно вычитать.
// Запуск: npx tsx scripts/migrate-legacy-quests.ts
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import TurndownService from "turndown";
import { stringify } from "yaml";
import { runLocal } from "./lib/local-java";

type LegacyStage = {
  badge: string;
  title: string;
  theory: string;
  pitfalls: string;
  hint: string;
  starterCode: string;
  solutionCode: string;
  quiz: { question: string; options: string[]; correct: number; hint: string };
  examTest: { q: string; options: string[]; correct: number; explain: string; advice: string }[];
  memorySnapshot?: { stack: { method: string; vars: string[] }[]; heap: { obj: string; data: string }[] };
  loopTracer?: { rows: number; cols: number };
};
type LegacyQuest = { num: string; title: string; subTitle: string; fileName: string; stages: LegacyStage[] };

const GOLDEN = "GOLDEN";
type TestDraft =
  | { name: string; stdin?: string; stdout?: string }
  | { kind: "source"; name: string; pattern: string; message?: string };
type StagePlan = { id: string; tests: TestDraft[]; sampleInput?: string };

const src = (name: string, pattern: string, message: string): TestDraft => ({ kind: "source", name, pattern, message });
const nestedFor = src(
  "Два вложенных цикла for",
  "\\bfor\\s*\\([^)]*\\)[\\s\\S]*\\bfor\\s*\\(",
  "Внутри внешнего for нужен второй for",
);
const usesScanner = src(
  "Ввод через Scanner",
  "new\\s+Scanner\\s*\\(\\s*System\\.in\\s*\\)",
  "Создай Scanner sc = new Scanner(System.in)",
);
const usesBreak = src("Выход из цикла через break", "\\bbreak\\s*;", "Останови цикл оператором break");
const usesContinue = src(
  "Пропуск итерации через continue",
  "\\bcontinue\\s*;",
  "Пропусти итерацию оператором continue",
);

const QUESTS: Record<
  string,
  {
    order: number;
    unlockAfter: string | null;
    rank: { title: string; icon: string; color: string };
    stages: StagePlan[];
  }
> = {
  basics: {
    order: 1,
    unlockAfter: null,
    rank: { title: "СИНТАКСИЧЕСКИЙ ЮНГА", icon: "📦", color: "#a855f7" },
    stages: [
      {
        id: "memory-boxes",
        tests: [
          { name: "Выводит a + b" },
          src("int a = 10", "\\bint\\s+a\\s*=\\s*10\\s*;", "Объяви переменную: int a = 10;"),
          src("double b = 2.5", "\\bdouble\\s+b\\s*=\\s*2\\.5\\s*;", "Объяви переменную: double b = 2.5;"),
          src(
            "double result = a + b",
            "\\bdouble\\s+result\\s*=\\s*a\\s*\\+\\s*b\\s*;",
            "Сложи в переменную: double result = a + b;",
          ),
        ],
      },
      {
        id: "remainder",
        tests: [
          { name: "Выводит остаток 7 % 2" },
          src("Остаток через оператор %", "\\b7\\s*%\\s*2\\b", "Посчитай остаток оператором %: 7 % 2"),
        ],
      },
    ],
  },
  loops_prep: {
    order: 2,
    unlockAfter: "basics",
    rank: { title: "ОПЕРАТОР ЦИКЛА", icon: "🌀", color: "#38bdf8" },
    stages: [
      {
        id: "for-anatomy",
        tests: [{ name: "Выводит числа от 1 до 10" }, src("Цикл for", "\\bfor\\s*\\(", "Используй цикл for")],
      },
      {
        id: "break-continue",
        tests: [{ name: "Пропускает кратные 3, останавливается на 15" }, usesBreak, usesContinue],
      },
      {
        id: "accumulators",
        tests: [
          { name: "Выводит сумму чётных и нечётных от 1 до 10" },
          src("Проверка чётности через %", "%\\s*2", "Чётность проверяют так: i % 2 == 0"),
        ],
      },
      { id: "nested-loops", tests: [{ name: "Печатает таблицу 3×3 через табуляцию" }, nestedFor] },
      {
        id: "while-attempts",
        tests: [{ name: "Печатает три попытки" }, src("Цикл while", "\\bwhile\\s*\\(", "Используй цикл while")],
      },
      {
        id: "prime-flag",
        tests: [
          { name: "Для n = 7 выводит «Простое»" },
          src("Флаг boolean isPrime", "\\bboolean\\s+isPrime\\b", "Заведи флаг: boolean isPrime = true;"),
          usesBreak,
        ],
      },
    ],
  },
  kt1: {
    order: 3,
    unlockAfter: "loops_prep",
    rank: { title: "ГРОЗА СЕССИИ", icon: "⚔️", color: "#ff2a55" },
    stages: [
      { id: "multiplication-table", tests: [{ name: "Печатает таблицу умножения 10×10" }, nestedFor] },
      {
        id: "skip-multiples",
        tests: [{ name: "Числа до 40 без кратных 5 и 7, стоп на 41" }, usesBreak, usesContinue],
      },
      { id: "even-and-triple", tests: [{ name: "Подписывает чётные и кратные 3 от 1 до 30" }] },
      { id: "even-odd-sums", tests: [{ name: "Подписывает числа и считает суммы от 1 до 20" }] },
      {
        id: "guess-number",
        sampleInput: "10\n90\n42\n",
        tests: [
          { name: "Подсказки и победа с третьей попытки", stdin: "10\n90\n42\n" },
          { name: "Угадывает с первой попытки", stdin: "42\n" },
          { name: "Останавливается после пяти попыток", stdin: "1\n1\n1\n1\n1\n1\n" },
          usesScanner,
        ],
      },
      {
        id: "primes-to-n",
        sampleInput: "20\n",
        tests: [
          { name: "Простые до 20", stdin: "20\n" },
          { name: "Простые до 30", stdin: "30\n" },
          { name: "N = 2: одно простое число", stdin: "2\n" },
          { name: "N = 1: простых нет", stdin: "1\n" },
          usesScanner,
        ],
      },
    ],
  },
  calc: {
    order: 4,
    unlockAfter: "kt1",
    rank: { title: "УКРОТИТЕЛЬ СТЕКА", icon: "⚡", color: "#10b981" },
    stages: [
      { id: "splash", tests: [{ name: "Выводит заставку" }] },
      {
        id: "switch-zero",
        sampleInput: "10 / 4\n",
        tests: [
          { name: "Сложение: 3 + 4", stdin: "3 + 4\n" },
          { name: "Вычитание: 9 - 12", stdin: "9 - 12\n" },
          { name: "Умножение: 6 * 7", stdin: "6 * 7\n" },
          { name: "Деление: 10 / 4", stdin: "10 / 4\n" },
          { name: "Защита от деления на ноль: 5 / 0", stdin: "5 / 0\n" },
          src("Выбор операции через switch", "\\bswitch\\s*\\(", "Выбери операцию конструкцией switch (op)"),
        ],
      },
      {
        id: "history-array",
        tests: [
          { name: "Выводит длину массива" },
          src(
            "Массив new double[5]",
            "new\\s+double\\s*\\[\\s*5\\s*\\]",
            "Создай массив: double[] history = new double[5];",
          ),
          src(
            "Запись в history[0]",
            "\\bhistory\\s*\\[\\s*0\\s*\\]\\s*=",
            "Запиши значение в первую ячейку: history[0] = 10.5;",
          ),
        ],
      },
      {
        id: "factorial",
        tests: [
          { name: "Выводит 5! = 120" },
          src(
            "Рекурсивный вызов factorial(n - 1)",
            "\\bfactorial\\s*\\(\\s*n\\s*-\\s*1\\s*\\)",
            "Метод должен вызывать сам себя: factorial(n - 1)",
          ),
          src(
            "Базовый случай n <= 1",
            "\\bn\\s*(<=\\s*1|==\\s*[01]|<\\s*2)\\b",
            "Без базового случая рекурсия не остановится: if (n <= 1) return 1;",
          ),
        ],
      },
    ],
  },
};

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "*",
});
turndown.addRule("preCode", {
  filter: "pre",
  replacement: (content) => `\n\n\`\`\`java\n${content.replace(/^\n+|\n+$/g, "")}\n\`\`\`\n\n`,
});

/** Заголовки теории были h3 внутри страницы этапа; в Markdown этапа это второй уровень */
function toMarkdown(html: string): string {
  const md = turndown.turndown(html.replace(/<h3>/g, "<h2>").replace(/<\/h3>/g, "</h2>"));
  return `${md.trim()}\n`;
}

function ensureTrailingNewline(text: string): string {
  return text.endsWith("\n") ? text : `${text}\n`;
}

async function main(): Promise<void> {
  const legacyUrl = pathToFileURL(path.join(process.cwd(), "client/js/quests.js")).href;
  const { QUESTS: legacy } = (await import(legacyUrl)) as { QUESTS: Record<string, LegacyQuest> };
  const root = path.join(process.cwd(), "content", "quests");
  rmSync(root, { recursive: true, force: true });

  for (const [questId, plan] of Object.entries(QUESTS)) {
    const q = legacy[questId];
    if (!q || q.stages.length !== plan.stages.length) throw new Error(`${questId}: число этапов не совпадает`);
    const questDir = path.join(root, questId);
    mkdirSync(questDir, { recursive: true });
    writeFileSync(
      path.join(questDir, "quest.yaml"),
      stringify({
        id: questId,
        num: q.num,
        title: q.title,
        subtitle: q.subTitle,
        fileName: q.fileName,
        order: plan.order,
        unlockAfter: plan.unlockAfter,
        rank: plan.rank,
      }),
    );

    q.stages.forEach((s, i) => {
      const stagePlan = plan.stages[i];
      const dir = path.join(questDir, `${String(i + 1).padStart(2, "0")}-${stagePlan.id}`);
      mkdirSync(dir, { recursive: true });

      // Эталонный вывод для io-тестов — запуском решения тем же драйвером, что в браузере
      const ioDrafts = stagePlan.tests.filter((t) => !("kind" in t)) as {
        name: string;
        stdin?: string;
        stdout?: string;
      }[];
      const golden = runLocal(
        q.fileName,
        s.solutionCode,
        ioDrafts.map((t) => t.stdin ?? ""),
      );
      if (!golden.compile.compiled) throw new Error(`${questId}/${stagePlan.id}: эталон не компилируется`);
      let io = 0;
      const tests = stagePlan.tests.map((t) => {
        if ("kind" in t) return t;
        const run = golden.run[io++];
        if (run.status !== "ok")
          throw new Error(`${questId}/${stagePlan.id}: эталон упал (${run.status}) на «${t.name}»`);
        const stdout = t.stdout && t.stdout !== GOLDEN ? t.stdout : run.stdout.replace(/\r\n/g, "\n");
        return { name: t.name, ...(t.stdin ? { stdin: t.stdin } : {}), stdout };
      });

      const meta = {
        id: stagePlan.id,
        badge: s.badge,
        title: s.title,
        hint: s.hint,
        ...(stagePlan.sampleInput ? { sampleInput: stagePlan.sampleInput } : {}),
        quiz: s.quiz,
        exam: s.examTest,
        ...(s.memorySnapshot ? { memory: s.memorySnapshot } : {}),
        ...(s.loopTracer ? { loopTracer: s.loopTracer } : {}),
        tests,
      };
      writeFileSync(path.join(dir, "stage.yaml"), stringify(meta, { lineWidth: 0 }));
      writeFileSync(path.join(dir, "theory.md"), toMarkdown(s.theory));
      writeFileSync(path.join(dir, "pitfalls.md"), toMarkdown(s.pitfalls));
      writeFileSync(path.join(dir, "Starter.java"), ensureTrailingNewline(s.starterCode));
      writeFileSync(path.join(dir, "Solution.java"), ensureTrailingNewline(s.solutionCode));
      console.log(`${questId}/${path.basename(dir)}: ${tests.length} тестов`);
    });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
