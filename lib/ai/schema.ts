import { z } from "zod";
import { MENTOR_MESSAGE_MAX } from "./limits";

export { MENTOR_MESSAGE_MAX };

/** Запрос к AI-ментору. Размеры ограничены: больше в промпт не нужно, а лишнее стоит денег. */
export const mentorRequestSchema = z.object({
  persona: z.enum(["chill", "dushny", "bigtech"]).default("chill"),
  /** «квест/этап»: условие задачи сервер берёт из content/, а не из запроса */
  stageKey: z.string().regex(/^[a-z0-9_-]{1,40}\/[a-z0-9_-]{1,60}$/),
  code: z.string().max(20_000),
  compileErrors: z
    .array(z.object({ line: z.number().int().min(0), message: z.string().max(500) }))
    .max(20)
    .default([]),
  failedTests: z
    .array(
      z.object({
        name: z.string().max(200),
        status: z.string().max(40).optional(),
        message: z.string().max(500).optional(),
        expected: z.string().max(2000).optional(),
        actual: z.string().max(2000).optional(),
      }),
    )
    .max(10)
    .default([]),
  message: z.string().trim().min(1).max(MENTOR_MESSAGE_MAX),
  history: z
    .array(z.object({ role: z.enum(["user", "model"]), text: z.string().max(4000) }))
    .max(8)
    .default([]),
});

export type MentorRequest = z.infer<typeof mentorRequestSchema>;
export type MentorRequestInput = z.input<typeof mentorRequestSchema>;
