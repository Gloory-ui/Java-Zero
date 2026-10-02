// Данные вкладки «Обзор»: строки функций базы (supabase/migrations/20261001140000_admin_stats.sql)
// и их сведение с порядком курса. Чистые функции без React — их проверяют unit-тесты

export type Period = 7 | 30 | 90;
export type Bucket = "day" | "week";

export type OverviewStats = {
  days: number;
  students: number;
  signups: number;
  signups_prev: number;
  active: number;
  active_prev: number;
  active_day: number;
  learners: number;
  stages_passed: number;
  stages_passed_period: number;
  stages_passed_prev: number;
  generated_at: string;
};

export type ActivityRow = { bucket: string; signups: number; active: number; passed: number };

export type FunnelRow = {
  quest_id: string;
  stage_id: string;
  reached: number;
  passed: number;
  here_now: number;
  stuck: number;
  left_after: number;
};

export type HardStageRow = {
  quest_id: string;
  stage_id: string;
  students: number;
  passed: number;
  fails_total: number;
  fails_avg: number;
  attempts_avg: number;
  hint_used: number;
  solution_viewed: number;
};

/** Оглавление общего курса для админки: только номера, названия и порядок этапов */
export type CourseIndex = { id: string; num: string; title: string; stages: { id: string; title: string }[] }[];

/** bigint и numeric приходят из PostgREST числами, но на всякий случай и строками */
const num = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export function normalizeRows<T extends Record<string, unknown>>(rows: unknown, numeric: readonly (keyof T)[]): T[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => {
    const copy = { ...(row as T) };
    for (const key of numeric) (copy as Record<keyof T, unknown>)[key] = num(copy[key]);
    return copy;
  });
}

export type FunnelStage = {
  id: string;
  title: string;
  reached: number;
  passed: number;
  hereNow: number;
  stuck: number;
  leftAfter: number;
};

export type FunnelQuest = {
  id: string;
  num: string;
  title: string;
  stages: FunnelStage[];
  /** Открыли первый этап квеста */
  started: number;
  /** Сдали последний этап */
  finished: number;
  /** Остановились на этапах квеста: застряли или ушли после сданного */
  stopped: number;
};

/** Воронка в порядке курса: каждый этап, даже если его ещё никто не открыл */
export function buildFunnel(course: CourseIndex, rows: FunnelRow[]): FunnelQuest[] {
  const byKey = new Map(rows.map((row) => [`${row.quest_id}/${row.stage_id}`, row]));
  return course.map((quest) => {
    const stages = quest.stages.map((stage) => {
      const row = byKey.get(`${quest.id}/${stage.id}`);
      return {
        id: stage.id,
        title: stage.title,
        reached: row?.reached ?? 0,
        passed: row?.passed ?? 0,
        hereNow: row?.here_now ?? 0,
        stuck: row?.stuck ?? 0,
        leftAfter: row?.left_after ?? 0,
      };
    });
    return {
      id: quest.id,
      num: quest.num,
      title: quest.title,
      stages,
      started: stages[0]?.reached ?? 0,
      finished: stages.at(-1)?.passed ?? 0,
      stopped: stages.reduce((sum, s) => sum + s.stuck + s.leftAfter, 0),
    };
  });
}

export type StopPoint = { questTitle: string; stageTitle: string; stuck: number; leftAfter: number };

/** Где чаще всего перестают учиться: этапы с наибольшим числом остановившихся */
export function topStops(funnel: FunnelQuest[], limit = 3): StopPoint[] {
  return funnel
    .flatMap((quest) =>
      quest.stages.map((stage) => ({
        questTitle: quest.title,
        stageTitle: stage.title,
        stuck: stage.stuck,
        leftAfter: stage.leftAfter,
      })),
    )
    .filter((point) => point.stuck + point.leftAfter > 0)
    .sort((a, b) => b.stuck + b.leftAfter - (a.stuck + a.leftAfter) || b.stuck - a.stuck)
    .slice(0, limit);
}

/**
 * Подпись этапа для таблиц. Этапы общего курса — по названию; этапы группы закрыты, их названий нет
 * в коде страницы, поэтому «КТ 1 · id этапа»
 */
export function stageLabel(course: CourseIndex, questId: string, stageId: string): { quest: string; stage: string } {
  const quest = course.find((q) => q.id === questId);
  const stage = quest?.stages.find((s) => s.id === stageId);
  if (quest && stage) return { quest: quest.title, stage: stage.title };
  // Этап убрали из курса или переименовали, а строки прогресса остались
  if (quest) return { quest: quest.title, stage: stageId };
  const kt = /^kt(\d+)$/.exec(questId);
  return { quest: kt ? `КТ ${kt[1]}` : questId, stage: stageId };
}

/** Изменение к прошлому периоду: «+3», «−2», «0»; null — сравнивать не с чем */
export function delta(current: number, previous: number): string | null {
  if (current === 0 && previous === 0) return null;
  const diff = current - previous;
  if (diff === 0) return "0";
  return diff > 0 ? `+${diff}` : `−${Math.abs(diff)}`;
}

/** Деления оси Y: 0 и «круглые» шаги 1, 2, 5 × 10ⁿ, не больше maxTicks штук над нулём */
export function niceTicks(max: number, maxTicks = 4): number[] {
  if (max <= 0) return [0, 1];
  const rough = max / maxTicks;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((m) => m * power).find((s) => s >= rough) ?? 10 * power;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return ticks;
}

const MONTHS = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

/** «1 окт» из даты базы YYYY-MM-DD; для недели — дата её понедельника */
export function shortDate(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[(m ?? 1) - 1]}`;
}

/** Склонение: plural(3, ["ученик", "ученика", "учеников"]) */
export function plural(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}
