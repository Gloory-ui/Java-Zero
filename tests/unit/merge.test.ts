import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/account/actions";
import {
  diffProgress,
  isSyncableKey,
  mergeProgress,
  mergeStage,
  progressFromRows,
  progressOnSignIn,
  stageToRow,
} from "@/lib/progress/merge";
import { EMPTY_PROGRESS, type ProgressData } from "@/lib/progress/types";

const local: ProgressData = {
  ...EMPTY_PROGRESS,
  persona: "dushny",
  cleanRun: 2,
  stages: {
    "basics/memory-boxes": { attempts: ["a", "b"], passedAt: 200, code: "local", hintUsed: true },
    "basics/remainder": { attempts: ["c"], fails: 1, startedAt: 300 },
  },
  achievements: { first_var: 500 },
  lastStage: "basics/remainder",
};

const remote: ProgressData = {
  ...EMPTY_PROGRESS,
  cleanRun: 4,
  stages: {
    "basics/memory-boxes": { attempts: ["b", "z"], passedAt: 100, code: "cloud", cheatUsed: true },
    "kt1/guess-number": { attempts: [], passedAt: 900 },
  },
  achievements: { first_var: 400, streak_master: 800 },
  lastStage: "kt1/guess-number",
};

describe("слияние локального и облачного прогресса", () => {
  it("по этапу берётся лучшее: ранняя сдача, флаги с обеих сторон, локальный код", () => {
    expect(mergeStage(local.stages["basics/memory-boxes"], remote.stages["basics/memory-boxes"])).toEqual({
      attempts: ["b", "z", "a"],
      passedAt: 100,
      code: "local",
      hintUsed: true,
      cheatUsed: true,
    });
  });

  it("этапы объединяются, серия — максимум, ачивки — самая ранняя дата, настройки — с устройства", () => {
    const merged = mergeProgress(local, remote);
    expect(Object.keys(merged.stages).sort()).toEqual(["basics/memory-boxes", "basics/remainder", "kt1/guess-number"]);
    expect(merged.cleanRun).toBe(4);
    expect(merged.achievements).toEqual({ first_var: 400, streak_master: 800 });
    expect(merged.persona).toBe("dushny");
    expect(merged.lastStage).toBe("basics/remainder");
  });

  it("чистый браузер просто принимает облако, включая настройки", () => {
    const cloud = { ...remote, persona: "bigtech" as const, sound: false };
    expect(mergeProgress(EMPTY_PROGRESS, cloud)).toBe(cloud);
  });

  it("строка БД и обратно — без потерь", () => {
    const stage = local.stages["basics/remainder"];
    const row = { ...stageToRow("u1", "basics/remainder", stage), updated_at: "2026-09-24T00:00:00Z" };
    expect(row).toMatchObject({ quest_id: "basics", stage_id: "remainder", fails: 1, passed_at: null });
    const back = progressFromRows(null, [row], []);
    expect(back.stages["basics/remainder"]).toEqual(stage);
  });

  it("слишком длинный код не уходит в облако, а не ломает синхронизацию", () => {
    const row = stageToRow("u1", "basics/remainder", { attempts: [], code: "x".repeat(20_001) });
    expect(row.code).toBeNull();
  });

  it("diff видит изменённые, удалённые этапы и новые ачивки", () => {
    const next: ProgressData = {
      ...local,
      stages: { "basics/memory-boxes": { ...local.stages["basics/memory-boxes"], code: "new" } },
      achievements: { ...local.achievements, zero_shield: 1 },
    };
    expect(diffProgress(local, next)).toEqual({
      stageKeys: ["basics/memory-boxes"],
      removedStageKeys: ["basics/remainder"],
      achievementIds: ["zero_shield"],
      dailyKeys: [],
      profileChanged: false,
    });
    expect(diffProgress(local, { ...local, cleanRun: 0 }).profileChanged).toBe(true);
  });

  it("ключи этапов проверяются так же, как в схеме БД", () => {
    expect(isSyncableKey("kt1/guess-number")).toBe(true);
    expect(isSyncableKey("../x")).toBe(false);
    expect(isSyncableKey("Basics/Upper")).toBe(false);
  });
});

describe("чей прогресс в браузере при входе", () => {
  it("гостевой прогресс сливается с аккаунтом", () => {
    const merged = progressOnSignIn(local, null, remote, "user-a");
    expect(Object.keys(merged.stages)).toContain("basics/remainder");
    expect(Object.keys(merged.stages)).toContain("kt1/guess-number");
  });

  it("прогресс этого же аккаунта тоже сливается: изменения, сделанные без сети, не теряются", () => {
    expect(progressOnSignIn(local, "user-a", remote, "user-a").cleanRun).toBe(4);
    expect(Object.keys(progressOnSignIn(local, "user-a", remote, "user-a").stages)).toHaveLength(3);
  });

  it("прогресс другого аккаунта не подмешивается: новый аккаунт получает только своё", () => {
    expect(progressOnSignIn(local, "user-a", remote, "user-b")).toBe(remote);
    expect(progressOnSignIn(local, "user-a", EMPTY_PROGRESS, "user-b")).toBe(EMPTY_PROGRESS);
  });
});

describe("адрес возврата после входа", () => {
  it("пускает только пути этого сайта", () => {
    expect(safeNext("/learn/kt1/guess-number")).toBe("/learn/kt1/guess-number");
    expect(safeNext("//evil.example")).toBe("/course");
    expect(safeNext("/\\evil.example")).toBe("/course");
    expect(safeNext("https://evil.example")).toBe("/course");
    expect(safeNext(null)).toBe("/course");
  });
});
