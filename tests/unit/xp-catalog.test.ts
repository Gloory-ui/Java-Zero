import { describe, expect, it } from "vitest";
import { loadCourse } from "@/lib/content/load";
import { toOutline } from "@/lib/content/outline";
import { achievementXp } from "@/lib/game/achievements";
import { CHEST_ID, DAILY_TEMPLATES } from "@/lib/game/daily";
import { buildXpCatalog, xpCatalogSql } from "@/lib/game/xp-catalog";

const course = toOutline(loadCourse());
const catalog = buildXpCatalog(course);
const byKind = (kind: string) => catalog.filter((r) => r.kind === kind);

describe("каталог честного опыта для таблицы лидеров", () => {
  it("в нём каждый этап курса, задание КТ дороже обычного этапа", () => {
    const stages = byKind("stage");
    expect(stages).toHaveLength(course.reduce((n, q) => n + q.stages.length, 0));
    expect(stages.find((r) => r.id === "basics/memory-boxes")?.xp).toBe(70);
    expect(stages.find((r) => r.id.startsWith("kt1/"))?.xp).toBe(110);
  });

  it("опыт достижения тот же, что начисляет сайт: иначе честный студент потеряет его в рейтинге", () => {
    for (const a of byKind("achievement")) expect(achievementXp(a.id), a.id).toBe(a.xp);
  });

  it("квесты дня и сундук на месте, id не повторяются", () => {
    expect(byKind("daily").map((r) => r.id)).toEqual([...DAILY_TEMPLATES.map((t) => t.id), CHEST_ID]);
    const keys = catalog.map((r) => `${r.kind}:${r.id}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("SQL экранирует кавычки и обновляет опыт при повторном запуске", () => {
    const sql = xpCatalogSql([{ kind: "stage", id: "a/it's", xp: 70 }]);
    expect(sql).toContain("('stage', 'a/it''s', 70)");
    expect(sql).toContain("on conflict (kind, id) do update set xp = excluded.xp");
  });
});
