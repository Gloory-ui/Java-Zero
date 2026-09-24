// Типы таблиц из supabase/migrations/20260924120000_progress.sql.
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
  streak: number;
  sound: boolean;
  last_stage: string | null;
  created_at: string;
  updated_at: string;
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
  updated_at: string;
};

export type AchievementRow = { user_id: string; achievement_id: string; unlocked_at: string };

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow, "id">;
      stage_progress: Table<StageProgressRow, "user_id" | "quest_id" | "stage_id">;
      achievements: Table<AchievementRow, "user_id" | "achievement_id">;
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
