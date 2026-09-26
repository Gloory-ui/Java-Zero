// Типы таблиц из supabase/migrations: 20260924120000_progress.sql, 20260926120000_gamification.sql,
// 20260927120000_profile.sql.
// После изменения схемы обновить вручную или командой `supabase gen types typescript`.

type Table<Row, Required extends keyof Row> = {
  Row: Row;
  Insert: Pick<Row, Required> & Partial<Omit<Row, Required>>;
  Update: Partial<Row>;
  Relationships: [];
};

export type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  persona: "chill" | "dushny" | "bigtech";
  /** Сданные подряд этапы без проваленных проверок */
  streak: number;
  /** Счётчики для достижений с уровнями */
  stats: Record<string, number>;
  sound: boolean;
  last_stage: string | null;
  handle: string | null;
  bio: string;
  accent: string | null;
  frame: string | null;
  banner: string | null;
  banner_url: string | null;
  title: string | null;
  showcase: string[];
  is_public: boolean;
  xp_total: number;
  level: number;
  stages_passed: number;
  streak_days: number;
  best_streak: number;
  created_at: string;
  updated_at: string;
};

/** Публичный профиль из get_public_profile(): только поля для показа */
export type PublicProfile = Pick<
  ProfileRow,
  | "handle"
  | "display_name"
  | "avatar_url"
  | "bio"
  | "accent"
  | "frame"
  | "banner"
  | "banner_url"
  | "title"
  | "showcase"
  | "xp_total"
  | "stages_passed"
  | "streak_days"
  | "best_streak"
  | "created_at"
> & { achievements: { id: string; at: string }[] };

/** Строка таблицы лидеров: xp — за период, xp_total — весь опыт (по нему считается уровень). Оба считает база */
export type LeaderRow = Pick<ProfileRow, "handle" | "display_name" | "avatar_url" | "accent" | "frame" | "title"> & {
  xp_total: number;
  xp: number;
};

export type StageProgressRow = {
  user_id: string;
  quest_id: string;
  stage_id: string;
  code: string | null;
  attempts: string[];
  fails: number;
  started_at: string | null;
  passed_at: string | null;
  hint_used: boolean;
  cheat_used: boolean;
  solution_viewed: boolean;
  xp: number;
  updated_at: string;
};

export type AchievementRow = { user_id: string; achievement_id: string; unlocked_at: string; xp: number };

export type DailyQuestRow = { user_id: string; day: string; quest_id: string; xp: number; completed_at: string };

export type RarityRow = { achievement_id: string; holders: number; total: number };

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow, "id">;
      stage_progress: Table<StageProgressRow, "user_id" | "quest_id" | "stage_id">;
      achievements: Table<AchievementRow, "user_id" | "achievement_id">;
      daily_quests: Table<DailyQuestRow, "user_id" | "day" | "quest_id" | "xp">;
    };
    Views: { [_ in never]: never };
    Functions: {
      achievement_rarity: { Args: Record<string, never>; Returns: RarityRow[] };
      handle_available: { Args: { p_handle: string }; Returns: boolean };
      get_public_profile: { Args: { p_handle: string }; Returns: PublicProfile | null };
      leaderboard: { Args: { p_period: "week" | "all" }; Returns: LeaderRow[] };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
