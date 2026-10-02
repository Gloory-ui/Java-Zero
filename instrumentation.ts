// Выполняется один раз при запуске сервера Next.js
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // Каталог опыта пишет в боевую базу, поэтому только на Render (там RENDER=true) или по явному флагу:
  // локальный запуск с ветки, где курс другой, не должен менять лидерборд сайта
  if (process.env.RENDER !== "true" && process.env.XP_CATALOG_SYNC !== "1") return;
  const { syncXpCatalog } = await import("@/lib/game/xp-catalog-sync");
  // Не ждём: запуск сайта не должен зависеть от базы. Ошибка видна в логах Render
  syncXpCatalog()
    .then((n) => console.log(`xp_catalog: ${n} строк`))
    .catch((e: unknown) => console.error("xp_catalog: не обновлён", e));
}
