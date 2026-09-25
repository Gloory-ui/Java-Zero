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
    store.markPassed("basics/memory-boxes");
    store.unlockAchievement("first_var");
    store.setPersona("dushny");
    store.setSound(false);
    store.setOwner("user-a");

    useProgress.getState().clearAfterSignOut();

    const after = useProgress.getState();
    expect(after.stages).toEqual({});
    expect(after.achievements).toEqual({});
    expect(after.streak).toBe(0);
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
});
