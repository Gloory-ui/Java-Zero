import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/server";
import { getCourse } from "@/lib/content/load";
import { forgetOverrides, type OverrideRow, QUEST_FIELDS, STAGE_FIELDS } from "@/lib/content/overrides";
import { supabaseAdmin } from "@/lib/supabase/server";

// Тексты курса отдаются только админу: среди них задания «Группы», поэтому они не вшиты в страницу админки.
// Маршруты в Next 16 не кэшируются по умолчанию, каждый запрос проходит requireAdmin
const noStore = { "Cache-Control": "no-store" };

/** Тексты курса из файлов (то, что правится) и текущие правки */
export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  if (!supabaseAdmin) return Response.json({ error: "Аккаунты на сайте не настроены" }, { status: 503 });

  const { data, error } = await supabaseAdmin
    .from("content_overrides")
    .select("quest_id, stage_id, field, value, updated_at");
  if (error) return Response.json({ error: "База недоступна" }, { status: 503, headers: noStore });

  const quests = getCourse().map((q) => ({
    id: q.id,
    num: q.num,
    track: q.track,
    title: q.title,
    subtitle: q.subtitle,
    stages: q.stages.map((s) => ({
      id: s.id,
      badge: s.badge,
      title: s.title,
      theory: s.theory,
      pitfalls: s.pitfalls,
      hints: s.hints.join("\n"),
      "quiz.question": s.quiz.question,
      "quiz.hint": s.quiz.hint,
    })),
  }));
  return Response.json({ quests, overrides: data as (OverrideRow & { updated_at: string })[] }, { headers: noStore });
}

const saveSchema = z.object({
  quest_id: z.string().regex(/^[a-z0-9_-]{1,40}$/),
  stage_id: z.string().regex(/^([a-z0-9_-]{1,60})?$/),
  field: z.string().min(1).max(40),
  /** null — убрать правку и вернуть текст из файла */
  value: z.string().max(50_000).nullable(),
});

/** Сохранить правку одного поля (или убрать её) и сразу обновить затронутые страницы */
export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  if (!supabaseAdmin) return Response.json({ error: "Аккаунты на сайте не настроены" }, { status: 503 });

  const parsed = saveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Неверный запрос" }, { status: 400, headers: noStore });
  const { quest_id, stage_id, field, value } = parsed.data;

  const quest = getCourse().find((q) => q.id === quest_id);
  const stage = stage_id ? quest?.stages.find((s) => s.id === stage_id) : undefined;
  if (!quest || (stage_id && !stage)) return Response.json({ error: "Нет такого квеста или этапа" }, { status: 404 });
  const allowed: readonly string[] = stage_id ? STAGE_FIELDS : QUEST_FIELDS;
  if (!allowed.includes(field)) return Response.json({ error: "Это поле не правится" }, { status: 400 });

  const table = supabaseAdmin.from("content_overrides");
  const { error } =
    value === null || !value.trim()
      ? await table.delete().match({ quest_id, stage_id, field })
      : await table.upsert(
          { quest_id, stage_id, field, value, updated_by: admin.userId, updated_at: new Date().toISOString() },
          { onConflict: "quest_id,stage_id,field" },
        );
  if (error) return Response.json({ error: "Не сохранилось: база недоступна" }, { status: 503, headers: noStore });

  forgetOverrides();
  // Название квеста видно на карте курса и на всех его этапах; текст этапа — только на его странице
  if (stage_id) revalidatePath(`/learn/${quest_id}/${stage_id}`);
  else for (const s of quest.stages) revalidatePath(`/learn/${quest_id}/${s.id}`);
  revalidatePath("/course");
  return Response.json({ ok: true }, { headers: noStore });
}
