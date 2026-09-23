/**
 * Сводка прогресса по курсу для Главной и Профиля
 */
import { QUESTS } from './quests.js';
import { state } from './state.js';
import { getUnlockedAchievements, ACHIEVEMENTS_LIST } from './achievements.js';

// Этапы с индексом меньше открытого максимума сданы; закрытый квест сдан целиком
export function getQuestProgress(questKey) {
  const total = QUESTS[questKey].stages.length;
  const completed = state.isQuestCompleted(questKey);
  const passed = completed ? total : Math.min(state.getUnlockedStageMax(questKey), total);
  return {
    total,
    passed,
    percent: Math.round((passed / total) * 100),
    completed,
    unlocked: state.isQuestUnlocked(questKey)
  };
}

export function getCourseStats() {
  const progress = Object.keys(QUESTS).map(getQuestProgress);
  return {
    stagesPassed: progress.reduce((sum, p) => sum + p.passed, 0),
    stagesTotal: progress.reduce((sum, p) => sum + p.total, 0),
    questsCompleted: progress.filter(p => p.completed).length,
    questsTotal: progress.length,
    streak: state.currentStreak,
    trophies: getUnlockedAchievements().length,
    trophiesTotal: ACHIEVEMENTS_LIST.length,
    rank: state.getUserRank()
  };
}
