import rateLimit from 'express-rate-limit';

export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 20, // максимум 20 запросов с одного IP за 15 минут
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Слишком много запросов к AI-ментору. Подождите немного перед следующим вопросом.'
  }
});