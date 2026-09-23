/**
 * Главная точка входа приложения Java-Zero (v0.2.2 Stability Release)
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
  updateSolutionButtonState,
  isSolutionUnlocked
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
  initMatrixRain();
  initBrandEasterEgg();
  initRankModal();

  state.loadStoredProgress();
  switchQuest(state.currentQuestKey);
  updateAchievementsBadge();
  updateUserRankUI();
  bindGlobalEvents();
});

// --- ОКНО КИБЕР-РАНГОВ ---
function initRankModal() {
  const badgeBtn = document.getElementById("rank-badge");
  const modal = document.getElementById("rank-modal");
  const closeBtn = document.getElementById("modal-rank-close-btn");
  const actionBtn = document.getElementById("btn-rank-close-action");

  if (badgeBtn && modal) {
    badgeBtn.addEventListener("click", () => {
      audio.playClick();
      modal.classList.remove("hidden");
    });
  }

  const closeModal = () => {
    if (modal) modal.classList.add("hidden");
  };

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (actionBtn) actionBtn.addEventListener("click", closeModal);
}

function updateUserRankUI() {
  const rank = state.getUserRank();
  const iconEl = document.getElementById("rank-icon");
  const titleEl = document.getElementById("rank-title");
  const badgeEl = document.getElementById("rank-badge");

  if (iconEl) iconEl.textContent = rank.icon;
  if (titleEl) titleEl.textContent = rank.title;
  if (badgeEl) {
    badgeEl.style.color = rank.color;
    badgeEl.style.borderColor = rank.color;
    badgeEl.style.boxShadow = `0 0 10px ${rank.color}33`;
  }
}

// --- ПАСХАЛКА 3 КЛИКА НА ЛОГОТИП (PHONK 808 DROP) ---
function initBrandEasterEgg() {
  const logo = document.getElementById("brand-logo-badge");
  if (!logo) return;

  let clickCount = 0;
  let clickTimer = null;

  logo.addEventListener("click", () => {
    clickCount++;
    clearTimeout(clickTimer);

    if (clickCount >= 3) {
      audio.playPhonk808Drop();
      logo.classList.add("crit-flash");
      setTimeout(() => logo.classList.remove("crit-flash"), 600);

      const toast = document.getElementById("achievement-toast");
      document.getElementById("toast-icon").textContent = "🎧";
      document.getElementById("toast-title").textContent = "PHONK BASS ACTIVATED";
      document.getElementById("toast-desc").textContent = "Кибер-ядро платформы разогнано до предела!";
      toast.classList.remove("hidden");
      setTimeout(() => toast.classList.add("hidden"), 4000);

      clickCount = 0;
    } else {
      audio.playClick();
      clickTimer = setTimeout(() => { clickCount = 0; }, 700);
    }
  });
}

// --- ХОЛСТ MATRIX RAIN САЛЮТА ---
function initMatrixRain() {
  const canvas = document.getElementById("matrix-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let animationFrame = null;
  let drops = [];
  const chars = "010101JAVA{}<>;/=+*#~";
  const fontSize = 14;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const cols = Math.floor(canvas.width / fontSize);
    drops = Array(cols).fill(1);
  }

  window.addEventListener("resize", resize);
  resize();

  window.addEventListener("matrix-rain", () => {
    canvas.classList.remove("hidden");
    resize();
    let startTime = Date.now();

    function draw() {
      ctx.fillStyle = "rgba(6, 7, 10, 0.12)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#10b981";
      ctx.font = `${fontSize}px 'Fira Code', monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      if (Date.now() - startTime < 3500) {
        animationFrame = requestAnimationFrame(draw);
      } else {
        cancelAnimationFrame(animationFrame);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.classList.add("hidden");
      }
    }

    draw();
  });
}

function switchQuest(questKey) {
  if (!state.isQuestUnlocked(questKey)) {
    audio.playError();
    alert("Этот раздел пока заблокирован! Пройди предыдущие этапы обучения.");
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
  updateUserRankUI();
  renderNav();
}

function loadStage(idx) {
  state.currentStageIdx = idx;
  state.resetStageMetrics();

  const quest = QUESTS[state.currentQuestKey];
  const stage = quest.stages[idx];
  const unlockedMax = state.getUnlockedStageMax();
  const isCompleted = idx < unlockedMax;
  const isStarted = state.isStageStarted();

  document.getElementById("module-badge").textContent = stage.badge.split(" // ")[0];
  document.getElementById("module-title").textContent = stage.title;
  document.getElementById("module-title").title = stage.title;

  const statusText = document.getElementById("stage-status-text");
  const pulseDot = document.getElementById("stage-pulse-dot");
  const gateOverlay = document.getElementById("stage-gate-overlay");

  if (isCompleted) {
    statusText.textContent = "СДАНО НА 100%";
    pulseDot.style.background = "var(--success)";
    pulseDot.style.boxShadow = "0 0 8px var(--success)";
    gateOverlay.classList.add("hidden");
  } else if (isStarted) {
    statusText.textContent = "В ПРОЦЕССЕ";
    pulseDot.style.background = "var(--neon-red)";
    pulseDot.style.boxShadow = "0 0 8px var(--neon-red)";
    gateOverlay.classList.add("hidden");
  } else {
    statusText.textContent = "ГОТОВ К СТАРТУ";
    pulseDot.style.background = "var(--neon-gold)";
    pulseDot.style.boxShadow = "0 0 8px var(--neon-gold)";
    document.getElementById("gate-stage-title").textContent = `${stage.badge.split(" // ")[0]}: ${stage.title}`;
    gateOverlay.classList.remove("hidden");
  }

  document.getElementById("tab-theory").innerHTML = stage.theory;
  document.getElementById("tab-pitfalls").innerHTML = stage.pitfalls;
  renderQuiz(stage.quiz);
  renderMemoryVisualizer();

  const editor = document.getElementById("code-editor");
  editor.value = getCodeForStage(idx, stage.starterCode);

  document.getElementById("hint-box").innerHTML = `<strong>Подсказка:</strong> ${stage.hint}`;
  document.getElementById("hint-box").classList.add("hidden");
  document.getElementById("elder-cheat-box").classList.add("hidden");

  // Сброс состояния дуэли босса к начальному виду
  const introBlock = document.getElementById("exam-arena-intro");
  if (introBlock) introBlock.classList.remove("hidden");
  document.getElementById("exam-duel-box")?.classList.add("hidden");
  document.getElementById("exam-summary-card")?.classList.add("hidden");
  const hpFill = document.getElementById("boss-hp-fill");
  const hpText = document.getElementById("boss-hp-text");
  if (hpFill) hpFill.style.width = "100%";
  if (hpText) hpText.textContent = "100 / 100 HP";

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
  updateUserRankUI();
  renderNav();
}

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
    if (isLocked) btn.title = `Пройди предыдущий этап, чтобы открыть`;

    btn.innerHTML = `
      <div class="nav-item-title-wrap">
        <span class="nav-item-label">${s.badge.split(" // ")[0]}: ${s.title}</span>
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
  const questsList = [
    { key: "basics", item: "quest-item-basics", badge: "quest-badge-basics", req: null },
    { key: "loops_prep", item: "quest-item-loops_prep", badge: "quest-badge-loops_prep", req: "НУЖЕН КВЕСТ 00" },
    { key: "kt1", item: "quest-item-kt1", badge: "quest-badge-kt1", req: "НУЖНА ПОДГОТОВКА" },
    { key: "calc", item: "quest-item-calc", badge: "quest-badge-calc", req: "НУЖНА КТ 1" }
  ];

  questsList.forEach(q => {
    const itemEl = document.getElementById(q.item);
    const badgeEl = document.getElementById(q.badge);
    if (!itemEl || !badgeEl) return;

    const isUnlocked = state.isQuestUnlocked(q.key);
    const isDone = state.isQuestCompleted(q.key);
    const isActive = state.currentQuestKey === q.key;

    if (!isUnlocked) {
      itemEl.classList.add("locked");
      badgeEl.className = "quest-status status-locked";
      badgeEl.textContent = `🔒 ${q.req}`;
    } else {
      itemEl.classList.remove("locked");
      if (isDone) {
        badgeEl.className = "quest-status status-completed";
        badgeEl.textContent = "✓ СДАНО";
      } else if (isActive) {
        badgeEl.className = "quest-status status-active";
        badgeEl.textContent = "АКТИВЕН";
      } else {
        badgeEl.className = "quest-status status-available";
        badgeEl.textContent = "⚡ ДОСТУПЕН";
      }
    }
  });

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
        feedback.innerHTML = `✗ <span>Мимо! Подсказка: ${quiz.hint}</span>`;
      }
    });
  });
}

function bindGlobalEvents() {
  document.getElementById("btn-start-stage-overlay").addEventListener("click", startCurrentStage);

  document.getElementById("btn-ambient").addEventListener("click", () => {
    const isPlaying = audio.toggleAmbient();
    const btn = document.getElementById("btn-ambient");
    btn.classList.toggle("active", isPlaying);
  });

  document.getElementById("btn-cheatsheet").addEventListener("click", () => {
    audio.playClick();
    document.getElementById("cheatsheet-modal").classList.remove("hidden");
  });
  const closeCheat = () => document.getElementById("cheatsheet-modal").classList.add("hidden");
  document.getElementById("modal-cheat-close-btn").addEventListener("click", closeCheat);
  document.getElementById("btn-cheat-close-action").addEventListener("click", closeCheat);

  document.getElementById("btn-achievements").addEventListener("click", () => {
    audio.playClick();
    renderAchievementsModal();
    document.getElementById("achievements-modal").classList.remove("hidden");
  });
  const closeAchieve = () => document.getElementById("achievements-modal").classList.add("hidden");
  document.getElementById("modal-achieve-close-btn").addEventListener("click", closeAchieve);
  document.getElementById("btn-achieve-close-action").addEventListener("click", closeAchieve);

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

  document.getElementById("btn-elder-cheat").addEventListener("click", () => {
    audio.playClick();
    const cheatBox = document.getElementById("elder-cheat-box");
    const isHidden = cheatBox.classList.contains("hidden");

    if (isHidden) {
      if (state.currentStreak > 0) {
        state.currentStreak = 0;
        state.saveProgress();
        document.getElementById("streak-count").textContent = "0";
        updateUserRankUI();
      }

      const quest = QUESTS[state.currentQuestKey];
      const stage = quest.stages[state.currentStageIdx];

      cheatBox.innerHTML = `
        <strong>📜 ШПОРА ОТ СТАРОСТЫ (Стрик сброшен в 0):</strong><br/>
        • <strong>Суть алгоритма:</strong> ${stage.tests.map(t => t.name).join(" → ")}.<br/>
        • <strong>Входные данные:</strong> Обрати внимание на типы переменных и граничные проверки.<br/>
        • <strong>Совет:</strong> Пиши команды последовательно сверху вниз и помни про точку с запятой.
      `;
      cheatBox.classList.remove("hidden");
    } else {
      cheatBox.classList.add("hidden");
    }
  });

  document.getElementById("btn-solution").addEventListener("click", () => {
    const btn = document.getElementById("btn-solution");
    if (!isSolutionUnlocked()) {
      audio.playError();
      btn.classList.add("shake-error");
      setTimeout(() => btn.classList.remove("shake-error"), 500);
      return;
    }
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

  document.getElementById("btn-run").addEventListener("click", () => {
    runCodeValidation(() => {
      updateUserRankUI();
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
      updateUserRankUI();
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
  });
}