// Каталог честного опыта текущего курса одной SQL-командой: начальное наполнение xp_catalog в миграции.
// Дальше сервер на Render обновляет таблицу сам при каждом запуске (instrumentation.ts).
// Запуск: npx tsx scripts/xp-catalog.ts > catalog.sql
import { loadCourse } from "../lib/content/load";
import { toOutline } from "../lib/content/outline";
import { buildXpCatalog, xpCatalogSql } from "../lib/game/xp-catalog";

process.stdout.write(`${xpCatalogSql(buildXpCatalog(toOutline(loadCourse())))}\n`);
