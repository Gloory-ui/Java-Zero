import type { QuestOutline } from "@/lib/content/outline";
import { achievementCatalog } from "./achievements";
import { CHEST_ID, CHEST_XP, DAILY_TEMPLATES } from "./daily";
import { isKtKey, stageXp } from "./xp";

export type XpCatalogKind = "stage" | "achievement" | "daily";
export type XpCatalogRow = { kind: XpCatalogKind; id: string; xp: number };

/**
 * Честный максимум опыта за каждый факт, который студент записывает в базу: этап, достижение, квест дня.
 * Таблица лидеров на сервере считает только строки из этого списка и не дороже его значений, поэтому
 * выдуманные этапы и достижения или опыт сверх возможного в рейтинг не попадают. Список лежит в таблице
 * xp_catalog: начальный — в миграции, дальше сервер обновляет его при каждом запуске (instrumentation.ts)
 */
export function buildXpCatalog(course: QuestOutline[]): XpCatalogRow[] {
  const rows: XpCatalogRow[] = [];
  for (const quest of course) {
    for (const stage of quest.stages) {
      const id = `${quest.id}/${stage.id}`;
      // Максимум — сдача с первой проверки и без подсказок
      rows.push({ kind: "stage", id, xp: stageXp({ attempts: [] }, isKtKey(id)) });
    }
  }
  for (const a of achievementCatalog(course)) rows.push({ kind: "achievement", id: a.id, xp: a.xp });
  for (const t of DAILY_TEMPLATES) rows.push({ kind: "daily", id: t.id, xp: t.xp });
  rows.push({ kind: "daily", id: CHEST_ID, xp: CHEST_XP });
  return rows;
}

const sqlText = (s: string) => `'${s.replaceAll("'", "''")}'`;

/** Тот же список одной SQL-командой: начальное наполнение таблицы в миграции */
export function xpCatalogSql(rows: XpCatalogRow[]): string {
  const values = rows.map((r) => `  (${sqlText(r.kind)}, ${sqlText(r.id)}, ${r.xp})`).join(",\n");
  return [
    "insert into public.xp_catalog (kind, id, xp) values",
    values,
    "on conflict (kind, id) do update set xp = excluded.xp, synced_at = now();",
  ].join("\n");
}
