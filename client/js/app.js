/**
 * Главная точка входа приложения Java-Zero (ES6 Modules)
 */
import { audio } from './audio.js';
import { state } from './state.js';
import { QUESTS } from './quests.js';
import { initExamSimulator } from './exam.js';
import { renderMemoryVisualizer } from './memory.js';
import { initAiClient } from './ai-client.js';
import {
  updateAchievementsBadge,
  renderAchievementsModal
} from './achievements.js';
import {
  updateLineNumbers,
  syncEditorScroll,
  handleEditorKeydown,
  formatJavaCode,
  getCodeForStage,
  updateSolutionButtonState
} from './editor.js';
import {
  runCodeValidation,
  startInteractiveSimulation,
  handleInteractiveSubmit,
  setTermStatus
} from './terminal.js';

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initSoundUI();
  initDropdown();
  initExamSimulator();
  initAiClient();

  state.loadStoredProgress();
  switchQuest(state.currentQuestKey);
  updateAchievementsBadge();
  bindGlobalEvents();
});

// Переключение квестов
function switchQuest(questKey) {
  if (!state.isQuestUnlocked(questKey)) {
    audio.playError();
    alert("Сначала заверши Квест 00 (Фундамент Java), чтобы разблокировать Калькулятор!");
    return;
  }

  state.currentQuestKey = questKey;
  localStorage.setItem("java_zero_active_quest", questKey);

  const quest = QUESTS[questKey];
  document.getElementById("dropdown-selected-num").textContent = quest.num;
  document.getElementById("dropdown-selected-label").textContent = `${quest.title}: ${quest.subTitle}`;
  document.getElementById("editor-file-name").textContent = quest.fileName;
  document.getElementById("btn-export-label").textContent = `Экспорт ${quest.fileName}`;

  state.loadStoredProgress();
  loadStage(state.currentStageIdx);
  updateQuestDropdownUI();
  renderNav();
}

// Загрузка этапа
function loadStage(idx) {
  state.currentStageIdx = idx;
  state.resetStageMetrics();

  const quest = QUESTS[state.currentQuestKey];
  const stage = quest.stages[idx];
  const unlockedMax = state.getUnlockedStageMax();
  const isCompleted = idx < unlockedMax;
  const isStarted = state.isStageStarted();

  document.getElementById("module-badge").textContent = stage.badge;
  document.getElementById("module-title").textContent = stage.title;

  // Синхронизация статуса в шапке и оверлея старта
  const statusText = document.getElementById("stage-status-text");
  const pulseDot = document.getElementById("stage-pulse-dot");
  const gateOverlay = document.getElementById("stage-gate-overlay");

  if (isCompleted) {
    statusText.textContent = "СДАНО НА 100%";
    pulseDot.style.background = "var(--success)";
    pulseDot.style.boxShadow = "0 0 8px var(--success)";
    gateOverlay.classList.add("hidden");
  } else if (isStarted) {
    statusText.textContent = "В ПРОЦЕССЕ РЕШЕНИЯ";
    pulseDot.style.background = "var(--neon-red)";
    pulseDot.style.boxShadow = "0 0 8px var(--neon-red)";
    gateOverlay.classList.add("hidden");
  } else {
    statusText.textContent = "ГОТОВ К СТАРТУ";
    pulseDot.style.background = "var(--neon-gold)";
    pulseDot.style.boxShadow = "0 0 8px var(--neon-gold)";
    document.getElementById("gate-stage-title").textContent = `${stage.badge.split(" / ")[0]}: ${stage.title}`;
    gateOverlay.classList.remove("hidden");
  }

  // Обновление контента теории и квиза
  document.getElementById("tab-theory").innerHTML = stage.theory;
  document.getElementById("tab-pitfalls").innerHTML = stage.pitfalls;
  renderQuiz(stage.quiz);
  renderMemoryVisualizer();

  // Редактор
  const editor = document.getElementById("code-editor");
  editor.value = getCodeForStage(idx, stage.starterCode);

  document.getElementById("hint-box").innerHTML = `<strong>Подсказка:</strong> ${stage.hint}`;
  document.getElementById("hint-box").classList.add("hidden");

  // Статический список вопросов к защите
  const staticList = document.getElementById("exam-static-list");
  if (stage.examTest && stage.examTest.length > 0) {
    staticList.innerHTML = stage.examTest.map((item, i) => `
      <div class="exam-qa-card">
        <div class="exam-q-header">
          <span class="exam-q-tag">ВОПРОС 0${i + 1}</span>
          <span>${item.q}</span>
        </div>
        <div class="exam-a-body">
          <strong>Ответ:</strong> ${item.options[item.correct]}<br/>
          <span style="font-size:0.8rem; color:var(--text-secondary);">${item.explain}</span>
        </div>
      </div>
    `).join("");
  } else {
    staticList.innerHTML = `<p style="color:var(--text-secondary); font-size:0.86rem;">Для данного этапа вопросов защиты нет.</p>`;
  }

  document.getElementById("btn-prev").disabled = idx === 0;
  document.getElementById("btn-next").disabled = (idx >= unlockedMax || idx === quest.stages.length - 1);

  document.getElementById("terminal-input-form").classList.add("hidden");
  document.getElementById("diff-inspector").classList.add("hidden");
  document.getElementById("btn-toggle-diff").classList.add("hidden");
  setTermStatus("IDLE", "idle");

  updateLineNumbers();
  updateSolutionButtonState();
  renderNav();
}

// Отрисовка сайдбара со статусами
function renderNav() {
  const nav = document.getElementById("module-nav");
  nav.innerHTML = "";

  const quest = QUESTS[state.currentQuestKey];
  const unlockedMax = state.getUnlockedStageMax();

  quest.stages.forEach((s, idx) => {
    const isCompleted = idx < unlockedMax;
    const isCurrent = idx === state.currentStageIdx;
    const isStarted = state.isStageStarted(state.currentQuestKey, idx);
    const isNextAvailable = (idx === unlockedMax && !isStarted);
    const isLocked = idx > unlockedMax;

    let statusItemClass = "status-locked";
    let badgeClass = "badge-locked";
    let badgeText = "🔒 ЗАКРЫТО";
    let isActionBtn = false;

    // Сданный этап ВСЕГДА остается в статусе "СДАНО"
    if (isCompleted) {
      statusItemClass = "status-completed";
      badgeClass = "badge-completed";
      badgeText = "✓ СДАНО";
    } else if (isCurrent) {
      if (isStarted) {
        statusItemClass = "status-in-progress";
        badgeClass = "badge-in-progress";
        badgeText = "● В ПРОЦЕССЕ";
      } else {
        statusItemClass = "status-available";
        badgeClass = "badge-start-action";
        badgeText = "▶ НАЧАТЬ ЭТАП";
        isActionBtn = true;
      }
    } else if (isNextAvailable) {
      statusItemClass = "status-available";
      badgeClass = "badge-available";
      badgeText = "⚡ СЛЕДУЮЩИЙ";
    }

    const btn = document.createElement("div");
    btn.className = `nav-item ${statusItemClass} ${isCurrent ? 'selected-active' : ''}`;
    if (isLocked) btn.title = `Пройди Этап 0${idx}, чтобы открыть`;

    btn.innerHTML = `
      <div class="nav-item-title-wrap">
        <span class="nav-item-label">${s.badge.split(" / ")[0]}: ${s.title}</span>
      </div>
      <span class="stage-status-badge ${badgeClass}" id="badge-stage-${idx}">${badgeText}</span>
    `;

    btn.addEventListener("click", (e) => {
      if (isLocked) {
        audio.playError();
        return;
      }

      if (isActionBtn && (e.target.id === `badge-stage-${idx}` || e.target.closest(`#badge-stage-${idx}`))) {
        startCurrentStage();
        return;
      }

      audio.playClick();
      loadStage(idx);
      state.saveProgress();
    });

    nav.appendChild(btn);
  });

  const totalStages = quest.stages.length;
  const passedCount = state.isQuestCompleted(state.currentQuestKey) ? totalStages : Math.min(unlockedMax, totalStages);
  const progress = Math.round((passedCount / totalStages) * 100);
  document.getElementById("progress-percent").textContent = `${progress}%`;
  document.getElementById("progress-fill").style.width = `${progress}%`;
}

function startCurrentStage() {
  audio.playClick();
  state.setStageStarted(state.currentQuestKey, state.currentStageIdx, true);
  loadStage(state.currentStageIdx);
}

function updateQuestDropdownUI() {
  const basicsBadge = document.getElementById("quest-badge-basics");
  const calcItem = document.getElementById("quest-item-calc");
  const calcBadge = document.getElementById("quest-badge-calc");

  if (state.isQuestCompleted("basics")) {
    basicsBadge.className = "quest-status status-completed";
    basicsBadge.textContent = "✓ ПРОЙДЕН";
  } else if (state.currentQuestKey === "basics") {
    basicsBadge.className = "quest-status status-active";
    basicsBadge.textContent = "АКТИВЕН";
  }

  const calcUnlocked = state.isQuestUnlocked("calc");
  if (!calcUnlocked) {
    calcItem.classList.add("locked");
    calcBadge.className = "quest-status status-locked";
    calcBadge.innerHTML = `🔒 НУЖЕН КВЕСТ 00`;
  } else {
    calcItem.classList.remove("locked");
    if (state.isQuestCompleted("calc")) {
      calcBadge.className = "quest-status status-completed";
      calcBadge.textContent = "✓ ПРОЙДЕН";
    } else if (state.currentQuestKey === "calc") {
      calcBadge.className = "quest-status status-active";
      calcBadge.textContent = "АКТИВЕН";
    } else {
      calcBadge.className = "quest-status status-available";
      calcBadge.textContent = "⚡ ДОСТУПЕН";
    }
  }

  document.querySelectorAll(".dropdown-item").forEach(item => {
    item.classList.toggle("active", item.dataset.val === state.currentQuestKey);
  });
}

function renderQuiz(quiz) {
  const container = document.getElementById("quiz-container");
  container.innerHTML = `
    <div class="quiz-question">${quiz.question}</div>
    <div class="quiz-options">
      ${quiz.options.map((opt, i) => `
        <button class="quiz-btn" data-idx="${i}">
          <span class="code-inline">${i + 1}</span> ${opt}
        </button>
      `).join("")}
    </div>
    <div id="quiz-feedback" class="quiz-feedback hidden"></div>
  `;

  container.querySelectorAll(".quiz-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const selected = parseInt(btn.dataset.idx, 10);
      const feedback = document.getElementById("quiz-feedback");
      feedback.classList.remove("hidden", "success", "error");

      if (selected === quiz.correct) {
        audio.playSuccess();
        feedback.classList.add("success");
        feedback.innerHTML = `✓ <span>В яблочко! Теперь закодируй это в редакторе справа.</span>`;
      } else {
        audio.playError();
        feedback.classList.add("error");
        feedback.innerHTML = `✗ <span>Мимо! Чекни подсказку: ${quiz.hint}</span>`;
      }
    });
  });
}

// Привязка глобальных обработчиков
function bindGlobalEvents() {
  document.getElementById("btn-start-stage-overlay").addEventListener("click", startCurrentStage);

  // Lo-Fi переключатель
  document.getElementById("btn-ambient").addEventListener("click", () => {
    const isPlaying = audio.toggleAmbient();
    const btn = document.getElementById("btn-ambient");
    btn.classList.toggle("active", isPlaying);
  });

  // Шпаргалка
  document.getElementById("btn-cheatsheet").addEventListener("click", () => {
    audio.playClick();
    document.getElementById("cheatsheet-modal").classList.remove("hidden");
  });
  const closeCheat = () => document.getElementById("cheatsheet-modal").classList.add("hidden");
  document.getElementById("modal-cheat-close-btn").addEventListener("click", closeCheat);
  document.getElementById("btn-cheat-close-action").addEventListener("click", closeCheat);

  // Ачивки
  document.getElementById("btn-achievements").addEventListener("click", () => {
    audio.playClick();
    renderAchievementsModal();
    document.getElementById("achievements-modal").classList.remove("hidden");
  });
  const closeAchieve = () => document.getElementById("achievements-modal").classList.add("hidden");
  document.getElementById("modal-achieve-close-btn").addEventListener("click", closeAchieve);
  document.getElementById("btn-achieve-close-action").addEventListener("click", closeAchieve);

  // Редактор и клавиши
  const editor = document.getElementById("code-editor");
  editor.addEventListener("keydown", handleEditorKeydown);
  editor.addEventListener("input", updateLineNumbers);
  editor.addEventListener("scroll", syncEditorScroll);

  document.getElementById("btn-format").addEventListener("click", formatJavaCode);
  document.getElementById("btn-hint").addEventListener("click", () => {
    audio.playClick();
    state.hintUsedCurrentStage = true;
    document.getElementById("hint-box").classList.toggle("hidden");
  });

  document.getElementById("btn-solution").addEventListener("click", () => {
    audio.playClick();
    const modal = document.getElementById("solution-modal");
    const codeViewer = document.getElementById("modal-solution-code");
    state.solutionViewedCurrentStage = true;
    codeViewer.textContent = QUESTS[state.currentQuestKey].stages[state.currentStageIdx].solutionCode;
    modal.classList.remove("hidden");
  });
  const closeSolution = () => document.getElementById("solution-modal").classList.add("hidden");
  document.getElementById("modal-close-btn").addEventListener("click", closeSolution);
  document.getElementById("btn-modal-close-action").addEventListener("click", closeSolution);

  // Запуск тестов и интерактив
  document.getElementById("btn-run").addEventListener("click", () => {
    runCodeValidation(() => {
      loadStage(state.currentStageIdx);
    });
  });

  document.getElementById("btn-interactive-run").addEventListener("click", startInteractiveSimulation);
  document.getElementById("terminal-input-form").addEventListener("submit", handleInteractiveSubmit);

  document.getElementById("btn-clear-term").addEventListener("click", () => {
    audio.playClick();
    document.getElementById("terminal-output").textContent = "// Лог очищен.";
    document.getElementById("terminal-input-form").classList.add("hidden");
    document.getElementById("diff-inspector").classList.add("hidden");
    setTermStatus("IDLE", "idle");
  });

  document.getElementById("btn-toggle-diff").addEventListener("click", () => {
    audio.playClick();
    document.getElementById("diff-inspector").classList.toggle("hidden");
  });

  // Навигация
  document.getElementById("btn-prev").addEventListener("click", () => {
    if (state.currentStageIdx > 0) {
      audio.playClick();
      loadStage(state.currentStageIdx - 1);
      state.saveProgress();
    }
  });

  document.getElementById("btn-next").addEventListener("click", () => {
    const quest = QUESTS[state.currentQuestKey];
    const unlockedMax = state.getUnlockedStageMax();
    if (state.currentStageIdx < quest.stages.length - 1 && state.currentStageIdx < unlockedMax) {
      audio.playClick();
      loadStage(state.currentStageIdx + 1);
      state.saveProgress();
    }
  });

  // Вкладки
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      audio.playClick();
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(tc => tc.classList.add("hidden"));
      btn.classList.add("active");
      const target = document.getElementById(`tab-${btn.dataset.tab}`);
      target.classList.remove("hidden");
      if (btn.dataset.tab === "memory") renderMemoryVisualizer();
    });
  });

  // Экспорт кода
  document.getElementById("btn-export-code").addEventListener("click", () => {
    audio.playClick();
    const quest = QUESTS[state.currentQuestKey];
    const editor = document.getElementById("code-editor");
    const code = editor.value || quest.stages[quest.stages.length - 1].solutionCode;
    const blob = new Blob([code], { type: "text/x-java-source;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = quest.fileName;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Сброс прогресса
  document.getElementById("btn-reset").addEventListener("click", () => {
    audio.playClick();
    if (confirm(`Сбросить весь прогресс квеста "${QUESTS[state.currentQuestKey].title}"?`)) {
      state.setUnlockedStageMax(0);
      state.setQuestCompleted(state.currentQuestKey, false);
      state.currentStageIdx = 0;
      localStorage.removeItem(`java_zero_current_${state.currentQuestKey}`);
      localStorage.removeItem(`java_zero_code_saves_${state.currentQuestKey}`);
      localStorage.removeItem(`java_zero_distinct_attempts_${state.currentQuestKey}`);
      QUESTS[state.currentQuestKey].stages.forEach((_, sIdx) => {
        localStorage.removeItem(`java_zero_started_${state.currentQuestKey}_${sIdx}`);
      });
      loadStage(0);
      updateQuestDropdownUI();
      renderNav();
    }
  });
}

function initDropdown() {
  const trigger = document.getElementById("dropdown-trigger");
  const menu = document.getElementById("dropdown-menu");

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    audio.playClick();
    const isOpen = trigger.classList.toggle("open");
    menu.classList.toggle("hidden", !isOpen);
  });

  document.addEventListener("click", () => {
    trigger.classList.remove("open");
    menu.classList.add("hidden");
  });

  menu.querySelectorAll(".dropdown-item").forEach(item => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      const questKey = item.dataset.val;
      if (!state.isQuestUnlocked(questKey)) {
        audio.playError();
        return;
      }
      audio.playClick();
      switchQuest(questKey);
      trigger.classList.remove("open");
      menu.classList.add("hidden");
    });
  });
}

function initTheme() {
  const savedTheme = localStorage.getItem("java_zero_theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  document.getElementById("btn-theme").addEventListener("click", () => {
    audio.playClick();
    const curr = document.documentElement.getAttribute("data-theme");
    const next = curr === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("java_zero_theme", next);
  });
}

function initSoundUI() {
  const soundBtn = document.getElementById("btn-sound");
  soundBtn.addEventListener("click", () => {
    const isEnabled = audio.toggleSound();
    if (isEnabled) audio.playClick();
    document.getElementById("sound-text").textContent = isEnabled ? "Звук" : "Без звука";
  });
}