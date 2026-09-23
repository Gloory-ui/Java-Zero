/**
 * Управление состоянием: Ранги, HP Босс-файта, Персоны ИИ и Шпоры
 */
export const state = {
  currentQuestKey: localStorage.getItem("java_zero_active_quest") || "basics",
  currentStageIdx: 0,
  currentStreak: parseInt(localStorage.getItem("java_zero_streak") || "0", 10),
  
  // Игровые параметры Босс-файта
  bossMaxHp: 100,
  bossHp: 100,
  playerHp: 100,

  // Характер ментора: chill | dushny | bigtech
  aiPersona: localStorage.getItem("java_zero_ai_persona") || "chill",

  // Флаги качества
  hintUsedCurrentStage: false,
  cheatUsedCurrentStage: false, // Шпора старосты
  solutionViewedCurrentStage: false,
  failedAttemptsCurrentStage: 0,

  // Динамический расчет кибер-ранга
  getUserRank() {
    if (this.currentStreak >= 5) {
      return { title: "СЕНЬОР-КИБЕРДЕД", icon: "👑", color: "#f59e0b" };
    }
    if (this.isQuestCompleted("calc")) {
      return { title: "УКРОТИТЕЛЬ СТЕКА", icon: "⚡", color: "#10b981" };
    }
    if (this.isQuestCompleted("kt1")) {
      return { title: "ГРОЗА СЕССИИ", icon: "⚔️", color: "#ff2a55" };
    }
    if (this.isQuestCompleted("loops_prep")) {
      return { title: "ОПЕРАТОР ЦИКЛА", icon: "🌀", color: "#38bdf8" };
    }
    if (this.isQuestCompleted("basics")) {
      return { title: "СИНТАКСИЧЕСКИЙ ЮНГА", icon: "📦", color: "#a855f7" };
    }
    return { title: "БАЙТ-ПАДАВАН", icon: "🌱", color: "#94a3b8" };
  },

  isQuestCompleted(questKey) {
    return localStorage.getItem(`java_zero_quest_done_${questKey}`) === "true";
  },

  setQuestCompleted(questKey, val) {
    localStorage.setItem(`java_zero_quest_done_${questKey}`, val ? "true" : "false");
  },

  isQuestUnlocked(questKey) {
    if (questKey === "basics") return true;
    if (questKey === "loops_prep") return this.isQuestCompleted("basics");
    if (questKey === "kt1") return this.isQuestCompleted("loops_prep");
    if (questKey === "calc") return this.isQuestCompleted("kt1");
    return false;
  },

  getUnlockedStageMax(questKey = this.currentQuestKey) {
    const saved = localStorage.getItem(`java_zero_unlocked_${questKey}`);
    return saved !== null ? parseInt(saved, 10) : 0;
  },

  setUnlockedStageMax(val, questKey = this.currentQuestKey) {
    localStorage.setItem(`java_zero_unlocked_${questKey}`, val);
  },

  isStageStarted(questKey = this.currentQuestKey, stageIdx = this.currentStageIdx) {
    return localStorage.getItem(`java_zero_started_${questKey}_${stageIdx}`) === "true";
  },

  setStageStarted(questKey, stageIdx, val) {
    localStorage.setItem(`java_zero_started_${questKey}_${stageIdx}`, val ? "true" : "false");
  },

  // Шпора старосты — одноразовый джокер: факт использования хранится между перезагрузками
  isCheatUsed(questKey = this.currentQuestKey, stageIdx = this.currentStageIdx) {
    return localStorage.getItem(`java_zero_cheat_used_${questKey}_${stageIdx}`) === "true";
  },

  setCheatUsed(questKey, stageIdx) {
    localStorage.setItem(`java_zero_cheat_used_${questKey}_${stageIdx}`, "true");
  },

  setAiPersona(persona) {
    this.aiPersona = persona;
    localStorage.setItem("java_zero_ai_persona", persona);
  },

  loadStoredProgress() {
    const savedCurrent = localStorage.getItem(`java_zero_current_${this.currentQuestKey}`);
    this.currentStageIdx = savedCurrent !== null ? parseInt(savedCurrent, 10) : 0;
    this.currentStreak = parseInt(localStorage.getItem("java_zero_streak") || "0", 10);
    this.aiPersona = localStorage.getItem("java_zero_ai_persona") || "chill";
  },

  saveProgress() {
    localStorage.setItem(`java_zero_current_${this.currentQuestKey}`, this.currentStageIdx);
    localStorage.setItem("java_zero_streak", this.currentStreak);
  },

  resetStageMetrics() {
    this.hintUsedCurrentStage = false;
    this.cheatUsedCurrentStage = this.isCheatUsed();
    this.solutionViewedCurrentStage = false;
    this.failedAttemptsCurrentStage = 0;
    this.bossHp = 100;
    this.playerHp = 100;
  }
};