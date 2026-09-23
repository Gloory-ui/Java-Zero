import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const router = Router();
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('[ОШИБКА] Переменная GEMINI_API_KEY не найдена в server/.env!');
} else {
  console.log('[JAVA-ZERO] API-ключ Gemini успешно загружен в память сервера.');
}

const ai = new GoogleGenAI({ apiKey });

const MODELS_PRIORITY = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-2.5-flash'
];

// Наборы инструкций под разные характеры
const PERSONA_PROMPTS = {
  chill: `
Ты — Сеньор на чилле. Твой стиль: расслабленный, ободряющий, дружелюбный.
Объясняй сложные концепции простыми жизненными аналогиями и легким IT-юмором.
Никакой академической духоты: четко укажи на ошибку, подбодри и намекни, как починить.
`,
  dushny: `
Ты — Душный профессор кафедры фундаментальной информатики.
Твой стиль: академический, требовательный, педантичный.
Придирайся к деталям: стилю camelCase, пропущенным фигурным скобкам, отсутствию проверок граничных условий.
Цитируй спецификацию Java Language Specification (JLS) и требуй аккуратности.
`,
  bigtech: `
Ты — Техлид и интервьюер на строгом алгоритмическом собеседовании в Бигтех (FAANG).
Твой стиль: сухой, прагматичный, ориентированный на производительность.
Всегда оценивай асимптотическую сложность алгоритма O(N) по времени и расход памяти в байтах.
Указывай, где цикл неэффективен и как сделать решение продакшн-ready.
`
};

router.post('/analyze', aiRateLimiter, async (req, res) => {
  const { stageTitle, userCode, compilerError, failedTest, userMessage, persona = 'chill' } = req.body;

  if (!userCode && !userMessage) {
    return res.status(400).json({ error: 'Код или сообщение отсутствуют.' });
  }

  const selectedPersonaPrompt = PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.chill;

  const systemInstruction = `
Ты — Cyber AI Mentor платформы "Java-Zero".
Твоя задача: направлять студента по Java 21, анализировать ошибки компилятора и теста.
${selectedPersonaPrompt}

ОБЩИЕ ПРАВИЛА:
1. НИКОГДА не пиши готовый код решения целиком. Студент обязан дописать строку сам.
2. Отвечай кратко (до 150-200 слов), структурированно, оформляй код в \`код\` или \`\`\`java.
3. Отвечай на русском языке.
`;

  const prompt = `
КОНТЕКСТ ЭТАПА:
- Этап: ${stageTitle || 'Не указан'}
- Ошибка javac: ${compilerError || 'Нет'}
- Тест: ${failedTest || 'Пройден'}

КОД СТУДЕНТА:
\`\`\`java
${userCode || '// Нет кода'}
\`\`\`

ЗАПРОС СТУДЕНТА:
"${userMessage || 'Проанализируй код и укажи на ошибки.'}"
`;

  let lastError = null;

  for (const modelName of MODELS_PRIORITY) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: persona === 'chill' ? 0.4 : 0.2,
          // Токены «размышлений» модели входят в этот лимит: при 600 на сам ответ
          // оставалось ~20 токенов и он обрывался на полуслове
          maxOutputTokens: 4096
        }
      });

      if (response?.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
        console.warn(`[AI] ${modelName}: ответ обрезан по лимиту токенов`, response.usageMetadata);
      }

      if (response?.text) {
        return res.json({ reply: response.text });
      }
    } catch (err) {
      lastError = err;
      console.warn(`[AI] ${modelName} вернула ошибку ${err.status ?? ''}: ${String(err.message).slice(0, 200)}. Переключение...`);
    }
  }

  console.error('[AI Final Error]:', lastError);
  res.status(503).json({
    error: 'Серверы нейросети перегружены. Попробуйте еще раз через 3 секунды.'
  });
});

export default router;