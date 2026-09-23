/**
 * Главная: сводка прогресса и карта курса
 */
import { QUESTS } from './quests.js';
import { state } from './state.js';
import { initSitePage } from './site.js';
import { getQuestProgress, getCourseStats } from './progress.js';

initSitePage("home");
renderStats();
renderQuestGrid();
renderContinueButton();

function renderStats() {
  const stats = getCourseStats();
  const rankEl = document.getElementById("stat-rank");
  rankEl.textContent = `${stats.rank.icon} ${stats.rank.title}`;
  rankEl.style.color = stats.rank.color;
  document.getElementById("stat-stages").textContent = `${stats.stagesPassed} / ${stats.stagesTotal}`;
  document.getElementById("stat-streak").textContent = `🔥 ${stats.streak}`;
  document.getElementById("stat-trophies").textContent = `${stats.trophies} / ${stats.trophiesTotal}`;
}

function renderQuestGrid() {
  const keys = Object.keys(QUESTS);

  document.getElementById("quest-grid").innerHTML = keys.map((key, i) => {
    const quest = QUESTS[key];
    const p = getQuestProgress(key);
    const isActive = key === state.currentQuestKey && !p.completed;

    let cls = "";
    let label = "⚡ ДОСТУПЕН";
    let meta = `Сдано: ${p.passed} из ${p.total}`;
    if (!p.unlocked) {
      cls = "locked";
      label = "🔒 ЗАКРЫТ";
      meta = `Откроется после «${QUESTS[keys[i - 1]].title}»`;
    } else if (p.completed) {
      cls = "completed";
      label = "✓ СДАНО";
    } else if (isActive) {
      cls = "active";
      label = "● В ПРОЦЕССЕ";
    }

    const body = `
      <div class="quest-card-top">
        <span class="quest-num">${quest.num}</span>
        <span class="quest-state">${label}</span>
      </div>
      <h3>${quest.title}</h3>
      <p>${quest.subTitle}</p>
      <div class="quest-progress"><div class="quest-progress-fill" style="width: ${p.percent}%"></div></div>
      <span class="quest-meta">${meta}</span>
    `;

    return p.unlocked
      ? `<a class="quest-card ${cls}" href="lab.html?quest=${key}">${body}</a>`
      : `<div class="quest-card ${cls}" title="Сначала пройди предыдущий квест">${body}</div>`;
  }).join("");
}

// Ведёт в активный квест, а если он уже закрыт — в первый доступный незакрытый
function renderContinueButton() {
  const btn = document.getElementById("btn-continue");
  const keys = Object.keys(QUESTS);
  if (getCourseStats().stagesPassed === 0) return;

  let key = state.currentQuestKey;
  if (getQuestProgress(key).completed) {
    key = keys.find(k => getQuestProgress(k).unlocked && !getQuestProgress(k).completed);
  }
  if (!key) {
    btn.textContent = "🎓 Курс пройден — повторить материал";
    return;
  }

  const saved = parseInt(localStorage.getItem(`java_zero_current_${key}`) || "0", 10);
  btn.href = `lab.html?quest=${key}`;
  btn.textContent = `▶ Продолжить: ${QUESTS[key].title} — этап ${saved + 1}`;
}
