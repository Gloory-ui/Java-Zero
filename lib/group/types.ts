import type { LabStage } from "@/lib/content/lab-stage";

/** Ответ GET /api/group/stage: задание КТ целиком. Теория и грабли — Markdown, их рендерит браузер */
export type GroupStagePayload = {
  questId: string;
  stageIndex: number;
  stage: LabStage;
  theory: string;
  pitfalls: string;
};

/** Ответ GET /api/group/outline: названия заданий КТ по квестам. В публичном оглавлении вместо них «Задание N» */
export type GroupTitles = Record<string, { id: string; title: string }[]>;

/** Ссылка-приглашение: /group?join=<код>. Код до входа в аккаунт ждёт в sessionStorage под этим ключом */
export const PENDING_JOIN_KEY = "java-zero-group-join";

/** Участник группы для админки (admin_group_members): профиль, откуда доступ и кто его выдал */
export type GroupMemberRow = {
  user_id: string;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
  source: "invite" | "admin" | "legacy";
  added_by_handle: string | null;
  joined_at: string;
};

/** Этап КТ участника (admin_group_progress): attempts — разные варианты кода, fails — проваленные проверки */
export type GroupProgressRow = {
  user_id: string;
  quest_id: string;
  stage_id: string;
  started_at: string | null;
  passed_at: string | null;
  attempts: number;
  fails: number;
  hint_used: boolean;
  solution_viewed: boolean;
  updated_at: string;
};
