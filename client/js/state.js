/**
 * Управление состоянием (State Management с цепочкой аттестации)
 */
export const state = {
  currentQuestKey: localStorage.getItem("java_zero_active_quest") || "basics",
  currentStageIdx: 0,
  currentStreak: parseInt(localStorage.getItem("java_zero_streak") || "0", 10),
  
  hintUsedCurrentStage: false,
  solutionViewedCurrentStage: false,
  failedAttemptsCurrentStage: 0,

  isQuestCompleted(questKey) {
    return localStorage.getItem(`java_zero_quest_done_${questKey}`) === "true";
  },

  setQuestCompleted(questKey, val) {
    localStorage.setItem(`java_zero_quest_done_${questKey}`, val ? "true" : "false");
  },

  // Строгая цепочка разблокировки: Фундамент -> Подготовка -> КТ 1 -> Калькулятор
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

  loadStoredProgress() {
    const savedCurrent = localStorage.getItem(`java_zero_current_${this.currentQuestKey}`);
    this.currentStageIdx = savedCurrent !== null ? parseInt(savedCurrent, 10) : 0;
    this.currentStreak = parseInt(localStorage.getItem("java_zero_streak") || "0", 10);
  },

  saveProgress() {
    localStorage.setItem(`java_zero_current_${this.currentQuestKey}`, this.currentStageIdx);
    localStorage.setItem("java_zero_streak", this.currentStreak);
  },

  resetStageMetrics() {
    this.hintUsedCurrentStage = false;
    this.solutionViewedCurrentStage = false;
    this.failedAttemptsCurrentStage = 0;
  }
};