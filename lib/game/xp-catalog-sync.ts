import { getCourse } from "@/lib/content/load";
import { toOutline } from "@/lib/content/outline";
import { supabaseAdmin } from "@/lib/supabase/server";
import { buildXpCatalog } from "./xp-catalog";

/**
 * Каталог честного опыта в базе — по курсу этой сборки. Новые этапы и достижения сразу идут в лидерборд,
 * без ручного SQL. Строки удалённых этапов не стираются: опыт, заработанный на них раньше, остаётся честным
 */
export async function syncXpCatalog(): Promise<number> {
  if (!supabaseAdmin) return 0;
  const rows = buildXpCatalog(toOutline(getCourse())).map((r) => ({ ...r, synced_at: new Date().toISOString() }));
  const { error } = await supabaseAdmin.from("xp_catalog").upsert(rows, { onConflict: "kind,id" });
  if (error) throw new Error(`xp_catalog: ${error.message}`);
  return rows.length;
}
