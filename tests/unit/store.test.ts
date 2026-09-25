import { beforeEach, describe, expect, it } from "vitest";
import { useProgress } from "@/lib/progress/store";
import { EMPTY_PROGRESS } from "@/lib/progress/types";

describe("стор прогресса", () => {
  beforeEach(() => {
    useProgress.getState().replace({ ...EMPTY_PROGRESS });
    useProgress.getState().setOwner(null);
  });

  it("выход из аккаунта очищает прогресс и владельца, звук остаётся настройкой устройства", () => {
    const store = useProgress.getState();
    store.openStage("basics/memory-boxes");
    store.markPassed("basics/memory-boxes", 70);
    store.unlockAchievements(["first_var"]);
    store.completeDaily({ "2026-09-25/pass_one": { at: 1, xp: 30 } });
    store.addStats({ runs: 3 });
    store.setPersona("dushny");
    store.setSound(false);
    store.setOwner("user-a");

    useProgress.getState().clearAfterSignOut();

    const after = useProgress.getState();
    expect(after.stages).toEqual({});
    expect(after.achievements).toEqual({});
    expect(after.cleanRun).toBe(0);
    expect(after.dailyDone).toEqual({});
    expect(after.stats).toEqual({});
    expect(after.persona).toBe("chill");
    expect(after.lastStage).toBeUndefined();
    expect(after.owner).toBeNull();
    expect(after.sound).toBe(false);
  });

  it("replace не оставляет последний этап прошлого аккаунта", () => {
    useProgress.getState().openStage("kt1/guess-number");
    expect(useProgress.getState().lastStage).toBe("kt1/guess-number");
    useProgress.getState().replace({ ...EMPTY_PROGRESS });
    expect(useProgress.getState().lastStage).toBeUndefined();
  });

  it("первая сдача фиксирует опыт этапа и растит серию без ошибок, повторная — нет", () => {
    const store = useProgress.getState();
    expect(store.markPassed("basics/arithmetic", 70)).toBe(true);
    expect(useProgress.getState().markPassed("basics/arithmetic", 999)).toBe(false);
    expect(useProgress.getState().stages["basics/arithmetic"].xp).toBe(70);
    expect(useProgress.getState().cleanRun).toBe(1);
    useProgress.getState().failCheck("basics/strings");
    expect(useProgress.getState().cleanRun).toBe(0);
  });

  it("счётчики дня: разовое событие засчитывается один раз", () => {
    const store = useProgress.getState();
    store.startDay("2026-09-25", ["quiz_two"]);
    store.bumpDaily(["quizRight"], "quiz:basics/strings");
    store.bumpDaily(["quizRight"], "quiz:basics/strings");
    store.bumpDaily(["run"]);
    store.bumpDaily(["run"]);
    expect(useProgress.getState().daily?.counters).toEqual({ quizRight: 1, run: 2 });
  });

  it("достижения открываются один раз", () => {
    expect(useProgress.getState().unlockAchievements(["first_var", "first_var"])).toEqual(["first_var"]);
    expect(useProgress.getState().unlockAchievements(["first_var", "egg_phonk"])).toEqual(["egg_phonk"]);
  });
});
