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

// 3.6 в приоритете для мгновенного ответа
const MODELS_PRIORITY = [
  'gemini-3.6-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash'
];

const SYSTEM_INSTRUCTION = `
Ты — Cyber AI Mentor на платформе "Java-Zero".
Твоя цель: лаконично и быстро направлять студента по Java 21.

ПРАВИЛА:
1. Пиши емко, структурированно, без воды и длинных приветствий.
2. Не давай готовое решение целиком. Укажи строку и механику ошибки в 1-2 предложениях.
3. Оформляй код в одинарные (\`код\`) или тройные бэктики (\`\`\`java).
4. Используй жирный шрифт для ключевых терминов.
`;

router.post('/analyze', aiRateLimiter, async (req, res) => {
  const { stageTitle, userCode, compilerError, failedTest, userMessage } = req.body;

  if (!userCode && !userMessage) {
    return res.status(400).json({ error: 'Код или сообщение отсутствуют.' });
  }

  const prompt = `
КОНТЕКСТ:
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
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.2, // Низкая температура для максимальной скорости генерации
          maxOutputTokens: 600
        }
      });

      if (response?.text) {
        return res.json({ reply: response.text });
      }
    } catch (err) {
      lastError = err;
      console.warn(`[AI] ${modelName} вернула статус ${err?.status || err?.code}. Переключение...`);
    }
  }

  console.error('[AI Final Error]:', lastError);
  res.status(503).json({
    error: 'Серверы Gemini временно перегружены. Попробуйте снова через 3 секунды.'
  });
});

export default router;