import { loadOverrides } from "@/lib/content/overrides";
import { groupStagePayload } from "@/lib/group/content";
import { checkGroupAccess } from "@/lib/group/server";

// Задание КТ: теория, грабли, код, тесты и вопросы защиты. Только участнику группы или админу —
// в статических страницах и бандлах этих данных нет. Ответ личный: кэшировать его нельзя
const SLUG = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

export async function GET(request: Request) {
  const access = await checkGroupAccess(request);
  if (!access.ok) return json({ error: access.error }, access.status);

  const params = new URL(request.url).searchParams;
  const questId = params.get("quest") ?? "";
  const stageId = params.get("stage") ?? "";
  if (!SLUG.test(questId) || !SLUG.test(stageId)) return json({ error: "Некорректный адрес задания." }, 400);

  const payload = groupStagePayload(questId, stageId, await loadOverrides());
  if (!payload) return json({ error: "Такого задания КТ нет." }, 404);
  return json(payload);
}
