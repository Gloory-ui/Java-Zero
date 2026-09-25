import type { RunResult } from "@/lib/java/judge";
import { stripJavaComments } from "@/lib/java/judge";
import type { StageProgress } from "@/lib/progress/types";

export type AchievementId =
  | "first_var"
  | "division_safe"
  | "input_master"
  | "zero_shield"
  | "exam_challenger"
  | "stack_safe"
  | "streak_master";

export type Achievement = { id: AchievementId; icon: string; title: string; desc: string };

// id совпадают со старым сайтом: открытые там ачивки переносятся как есть
export const ACHIEVEMENTS: readonly Achievement[] = [
  {
    id: "first_var",
    icon: "📦",
    title: "Архитектор памяти",
    desc: "Сдай первый этап курса сам: без шпоры и без эталонного решения.",
  },
  {
    id: "division_safe",
    icon: "➗",
    title: "Знаток типов",
    desc: "Сдай этап про целое и дробное деление с первой проверки.",
  },
  {
    id: "input_master",
    icon: "⌨️",
    title: "Живой ввод",
    desc: "Запусти программу со Scanner на своих входных данных так, чтобы она отработала без ошибок.",
  },
  {
    id: "zero_shield",
    icon: "🛡️",
    title: "Щит от нуля",
    desc: "Сдай этап с защитой от деления на ноль, не открывая подсказку.",
  },
  {
    id: "exam_challenger",
    icon: "⚔️",
    title: "Гроза преподов",
    desc: "Пройди защиту у профессора без единой ошибки.",
  },
  { id: "stack_safe", icon: "🌀", title: "Укротитель стека", desc: "Сдай этап с рекурсивным факториалом." },
  { id: "streak_master", icon: "🔥", title: "Снайпер Java", desc: "Сдай три этапа подряд без проваленных проверок." },
];

export const STREAK_MASTER_AT = 3;

export function findAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/** Ачивки за сдачу этапа. stage — состояние этапа до отметки о сдаче, streak — серия после неё. */
export function achievementsForPass(key: string, stage: StageProgress, streak: number): AchievementId[] {
  const earned: AchievementId[] = [];
  // Первый этап курса и этап про деление; id этапов, а не номера — порядок курса может меняться
  if (key === "basics/program-structure" && !stage.cheatUsed && !stage.solutionViewed) earned.push("first_var");
  if (key === "basics/arithmetic" && !stage.fails) earned.push("division_safe");
  if (key === "calc/switch-zero" && !stage.hintUsed) earned.push("zero_shield");
  if (key === "calc/factorial") earned.push("stack_safe");
  if (streak >= STREAK_MASTER_AT) earned.push("streak_master");
  return earned;
}

const USES_SCANNER = /new\s+Scanner\s*\(\s*System\.in\s*\)/;

/** Ачивка за ручной запуск: программа читала ввод через Scanner и завершилась нормально. */
export function achievementsForRun(source: string, stdin: string, run: RunResult): AchievementId[] {
  const finished = run.status === "ok" || (run.status === "exit" && run.exitCode === 0);
  return finished && stdin.trim() !== "" && USES_SCANNER.test(stripJavaComments(source)) ? ["input_master"] : [];
}
