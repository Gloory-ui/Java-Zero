import type { Persona } from "@/lib/progress/types";
import type { MentorRequest } from "./schema";

// Характеры ментора перенесены со старого сайта (server/routes/ai.js)
const PERSONA_PROMPTS: Record<Persona, string> = {
  chill: `Ты — сеньор на чилле. Стиль: расслабленный, ободряющий, дружелюбный.
Объясняй сложное через жизненные аналогии и лёгкий IT-юмор. Без академической духоты: чётко укажи на ошибку, подбодри и намекни, как починить.`,
  dushny: `Ты — душный профессор кафедры фундаментальной информатики. Стиль: академический, требовательный, педантичный.
Придирайся к деталям: camelCase, пропущенные фигурные скобки, непроверенные граничные случаи. Ссылайся на Java Language Specification и требуй аккуратности.`,
  bigtech: `Ты — техлид и интервьюер на алгоритмическом собеседовании в бигтех. Стиль: сухой, прагматичный.
Оценивай сложность алгоритма по времени и памяти. Указывай, где цикл неэффективен и как сделать решение аккуратнее.`,
};

const RULES = `Правила:
1. Никогда не пиши готовое решение задания целиком. Покажи идею, одну строку или маленький фрагмент, остальное студент допишет сам.
2. Ошибку компиляции объясни по-русски: что она значит и в какой строке искать причину.
3. Если тест не прошёл, сравни ожидаемый и полученный вывод и подскажи, какая часть программы даёт расхождение.
4. Отвечай кратко, до 200 слов. Код оформляй как \`код\` или блоком \`\`\`java.
5. Отвечай на русском.
6. Вопросы не про Java и программирование вежливо возвращай к учёбе.`;

export type StageBrief = { title: string; questTitle: string; task: string };

const TASK_LIMIT = 4000;

export function systemInstruction(persona: Persona): string {
  return `Ты — AI-ментор платформы Java-Zero, где студенты учат Java с нуля. Код студента компилирует и запускает настоящий компилятор Java 17 прямо в браузере.

${PERSONA_PROMPTS[persona]}

${RULES}`;
}

/** Контекст этапа и последней проверки плюс вопрос студента: одно сообщение пользователя для модели. */
export function userTurn(req: MentorRequest, stage: StageBrief): string {
  const parts = [
    `ЭТАП: ${stage.questTitle} — ${stage.title}`,
    `УСЛОВИЕ ЗАДАНИЯ:\n${stage.task.slice(0, TASK_LIMIT)}`,
    `КОД СТУДЕНТА:\n\`\`\`java\n${req.code || "// код пуст"}\n\`\`\``,
  ];
  if (req.compileErrors.length > 0) {
    const errors = req.compileErrors.map((e) => `- строка ${e.line}: ${e.message}`).join("\n");
    parts.push(`ОШИБКИ КОМПИЛЯЦИИ:\n${errors}`);
  }
  for (const test of req.failedTests) {
    const lines = [`НЕ ПРОЙДЕН ТЕСТ «${test.name}»`];
    if (test.status && test.status !== "ok") lines.push(`Статус запуска: ${test.status}`);
    if (test.message) lines.push(`Что проверяли: ${test.message}`);
    if (test.expected !== undefined) lines.push(`Ожидаемый вывод:\n${test.expected}`);
    if (test.actual !== undefined) lines.push(`Вывод программы:\n${test.actual}`);
    parts.push(lines.join("\n"));
  }
  parts.push(`ВОПРОС СТУДЕНТА:\n${req.message}`);
  return parts.join("\n\n");
}

export type ModelContent = { role: "user" | "model"; parts: { text: string }[] };

export function buildContents(req: MentorRequest, stage: StageBrief): ModelContent[] {
  const history = req.history.map((m) => ({ role: m.role, parts: [{ text: m.text }] }));
  return [...history, { role: "user", parts: [{ text: userTurn(req, stage) }] }];
}
