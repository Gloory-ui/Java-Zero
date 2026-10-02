import { loadOverrides } from "@/lib/content/overrides";
import { groupTitles } from "@/lib/group/content";
import { checkGroupAccess } from "@/lib/group/server";

// Названия заданий КТ для карты группы, лаборатории и таблицы в админке. В публичном оглавлении их нет
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

export async function GET(request: Request) {
  const access = await checkGroupAccess(request);
  if (!access.ok) return json({ error: access.error }, access.status);
  return json(groupTitles(await loadOverrides()));
}
