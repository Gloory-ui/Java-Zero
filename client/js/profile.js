/**
 * Профиль: ранг, статистика, трофеи и табель о рангах
 */
import { initSitePage } from './site.js';
import { getCourseStats } from './progress.js';
import { renderAchievementsGrid } from './achievements.js';

initSitePage("profile");

const stats = getCourseStats();

document.getElementById("profile-rank-icon").textContent = stats.rank.icon;
const rankTitle = document.getElementById("profile-rank-title");
rankTitle.textContent = stats.rank.title;
rankTitle.style.color = stats.rank.color;

document.getElementById("stat-stages").textContent = `${stats.stagesPassed} / ${stats.stagesTotal}`;
document.getElementById("stat-quests").textContent = `${stats.questsCompleted} / ${stats.questsTotal}`;
document.getElementById("stat-streak").textContent = `🔥 ${stats.streak}`;
document.getElementById("stat-trophies").textContent = `${stats.trophies} / ${stats.trophiesTotal}`;

renderAchievementsGrid();

document.querySelector(`.rank-ladder-item[data-rank="${stats.rank.title}"]`)?.classList.add("current");
