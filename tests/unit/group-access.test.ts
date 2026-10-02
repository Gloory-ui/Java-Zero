import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadCourse } from "@/lib/content/load";
import { hiddenStageTitle, toOutline, withGroupTitles } from "@/lib/content/outline";
import { toOverrides } from "@/lib/content/overrides";
import { groupStagePayload, groupTitles } from "@/lib/group/content";

// Проверка доступа ходит в Supabase: подменяем секретный клиент и проверки админки
const db = vi.hoisted(() => ({ member: false as boolean | "error", admin: false, userId: "u1" as string | null }));

vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: {
    from: () => ({
      // Правки текстов (loadOverrides) — пустые, проверка участника — по db.member
      select: (columns: string) =>
        columns.includes("field")
          ? Promise.resolve({ data: [], error: null })
          : {
              eq: () => ({
                maybeSingle: async () =>
                  db.member === "error"
                    ? { data: null, error: { message: "relation does not exist" } }
                    : { data: db.member ? { user_id: db.userId } : null, error: null },
              }),
            },
    }),
  },
  supabaseAnon: () => null,
}));

vi.mock("@/lib/admin/server", () => ({
  userIdFromRequest: async (request: Request) =>
    request.headers.get("authorization") === "Bearer good" ? db.userId : null,
  isAdminUser: async () => db.admin,
}));

const course = loadCourse();
const kt = course.filter((q) => q.track === "group");
const firstKt = kt[0];

describe("задания «Группы» не попадают в публичное оглавление", () => {
  it("у этапов КТ вместо названий «Задание N», у курса — настоящие названия", () => {
    const outline = toOutline(course);
    for (const quest of outline.filter((q) => q.track === "group")) {
      expect(quest.stages.map((s) => s.title)).toEqual(quest.stages.map((_, i) => hiddenStageTitle(i)));
    }
    const basics = outline.find((q) => q.id === "basics");
    expect(basics?.stages[0].title).toBe(course.find((q) => q.id === "basics")?.stages[0].title);
  });

  it("ни название, ни теория, ни код заданий КТ не встречаются в оглавлении", () => {
    const json = JSON.stringify(toOutline(course));
    for (const stage of kt.flatMap((q) => q.stages)) {
      expect(json).not.toContain(`"${stage.title}"`);
      expect(json).not.toContain(stage.solution.slice(0, 60));
    }
  });

  it("участник получает настоящие названия с сервера", () => {
    const named = withGroupTitles(toOutline(course), groupTitles(toOverrides([]), course));
    const quest = named.find((q) => q.id === firstKt.id);
    expect(quest?.stages.map((s) => s.title)).toEqual(firstKt.stages.map((s) => s.title));
  });
});

describe("задание КТ для API", () => {
  it("собирается целиком только для квестов «Группы»", () => {
    const stage = firstKt.stages[1];
    const payload = groupStagePayload(firstKt.id, stage.id, undefined, course);
    expect(payload?.stageIndex).toBe(1);
    expect(payload?.stage.solution).toBe(stage.solution);
    expect(payload?.stage.tests).toEqual(stage.tests);
    expect(payload?.theory).toBe(stage.theory);
    expect(payload?.stage.duel.length).toBeGreaterThan(0);
    expect(groupStagePayload("basics", "program-structure", undefined, course)).toBeNull();
    expect(groupStagePayload(firstKt.id, "nope", undefined, course)).toBeNull();
  });

  it("правки текстов из админки доходят до задания", () => {
    const stage = firstKt.stages[0];
    const overrides = toOverrides([
      { quest_id: firstKt.id, stage_id: stage.id, field: "theory", value: "Новая теория" },
    ]);
    expect(groupStagePayload(firstKt.id, stage.id, overrides, course)?.theory).toBe("Новая теория");
  });
});

describe("доступ к /api/group/*", () => {
  beforeEach(() => {
    db.member = false;
    db.admin = false;
    db.userId = "u1";
  });

  const request = (auth?: string, query = "") =>
    new Request(`http://localhost/api/group/stage${query}`, auth ? { headers: { Authorization: auth } } : {});

  it("без входа — 401, не участник — 403, и в ответе нет задания", async () => {
    const { GET } = await import("@/app/api/group/stage/route");
    const stage = firstKt.stages[0];
    const query = `?quest=${firstKt.id}&stage=${stage.id}`;

    const guest = await GET(request(undefined, query));
    expect(guest.status).toBe(401);

    const stranger = await GET(request("Bearer good", query));
    expect(stranger.status).toBe(403);
    const body = await stranger.text();
    expect(body).not.toContain(stage.solution.slice(0, 40));
    expect(stranger.headers.get("Cache-Control")).toContain("no-store");
  });

  it("участник и админ получают задание", async () => {
    const { GET } = await import("@/app/api/group/stage/route");
    const stage = firstKt.stages[0];
    const query = `?quest=${firstKt.id}&stage=${stage.id}`;

    db.member = true;
    const member = await GET(request("Bearer good", query));
    expect(member.status).toBe(200);
    expect((await member.json()).stage.solution).toBe(stage.solution);

    db.member = false;
    db.admin = true;
    expect((await GET(request("Bearer good", query))).status).toBe(200);
  });

  it("квест не из «Группы» и кривой адрес не отдаются", async () => {
    const { GET } = await import("@/app/api/group/stage/route");
    db.member = true;
    expect((await GET(request("Bearer good", "?quest=basics&stage=program-structure"))).status).toBe(404);
    expect((await GET(request("Bearer good", "?quest=../etc&stage=x"))).status).toBe(400);
  });

  it("без таблицы участников (миграция не выполнена) — 503, а не отказ студенту", async () => {
    const { GET } = await import("@/app/api/group/outline/route");
    db.member = "error";
    expect((await GET(request("Bearer good"))).status).toBe(503);
    db.member = true;
    const titles = await (await GET(request("Bearer good"))).json();
    expect(titles[firstKt.id]).toHaveLength(firstKt.stages.length);
  });
});
