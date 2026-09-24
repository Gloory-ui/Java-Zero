// Проверка контента курса настоящим компилятором (тот же драйвер ECJ, что в браузере):
//   — каждое эталонное решение проходит все тесты этапа;
//   — стартовый код компилируется, но проваливает хотя бы один тест (иначе этап сдаётся без работы).
// Запуск: npm run content:check  (нужна Java 17+; JAVA_HOME или java в PATH)
import { loadCourse } from "../lib/content/load";
import type { Stage } from "../lib/content/schema";
import { ioInputs, judge, type TestVerdict } from "../lib/java/judge";
import { runLocal } from "./lib/local-java";

type Check = { stage: string; ok: boolean; problems: string[]; ms: number };

function describeFailure(v: TestVerdict): string {
  if (v.kind === "source") return `«${v.name}»: не найдено в коде`;
  if (v.status && v.status !== "ok") return `«${v.name}»: ${v.status}${v.error ? ` (${v.error.split("\n")[0]})` : ""}`;
  return `«${v.name}»: ждали ${JSON.stringify(v.expected)}, получили ${JSON.stringify(v.actual)}`;
}

function checkStage(fileName: string, stage: Stage): Check {
  const started = Date.now();
  const name = `${stage.questId}/${String(stage.index + 1).padStart(2, "0")}-${stage.id}`;
  const problems: string[] = [];
  const inputs = ioInputs(stage.tests);

  const solution = runLocal(fileName, stage.solution, inputs);
  if (!solution.compile.compiled) {
    problems.push(
      `эталон не компилируется: ${solution.compile.diagnostics.map((d) => `L${d.line} ${d.message}`).join("; ") || solution.compile.fatal}`,
    );
  } else {
    for (const v of judge(stage.tests, stage.solution, solution.run)) {
      if (!v.passed) problems.push(`эталон проваливает ${describeFailure(v)}`);
    }
  }

  const starter = runLocal(fileName, stage.starter, inputs);
  if (!starter.compile.compiled) {
    problems.push(
      `стартовый код не компилируется: ${starter.compile.diagnostics.map((d) => `L${d.line} ${d.message}`).join("; ")}`,
    );
  } else if (judge(stage.tests, stage.starter, starter.run).every((v) => v.passed)) {
    problems.push("стартовый код проходит все тесты — этап сдаётся без работы");
  }

  return { stage: name, ok: problems.length === 0, problems, ms: Date.now() - started };
}

const course = loadCourse();
let failed = 0;
let total = 0;
for (const quest of course) {
  for (const stage of quest.stages) {
    total++;
    const result = checkStage(quest.fileName, stage);
    const tests = `${stage.tests.length} тест${stage.tests.length === 1 ? "" : stage.tests.length < 5 ? "а" : "ов"}`;
    console.log(`${result.ok ? "✓" : "✗"} ${result.stage.padEnd(36)} ${tests.padEnd(9)} ${result.ms} мс`);
    for (const p of result.problems) console.log(`    ${p}`);
    if (!result.ok) failed++;
  }
}
console.log(`\n${total - failed} из ${total} этапов в порядке`);
if (failed > 0) process.exit(1);
