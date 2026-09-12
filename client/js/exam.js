/**
 * Интерактивный симулятор защиты у преподавателя (Exam Simulator)
 */
import { audio } from './audio.js';
import { state } from './state.js';
import { QUESTS } from './quests.js';
import { unlockAchievement } from './achievements.js';
import { CONFIG } from './config.js';

let currentQuestionIdx = 0;
let currentQuestionsList = [];
let examScore = { correct: 0, wrong: 0, wrongQuestions: [] };
let examTimer = null;
let timeLeft = CONFIG.EXAM_TIMER_SECONDS;

export function initExamSimulator() {
  const startBtn = document.getElementById("btn-exam-challenge");
  const restartBtn = document.getElementById("btn-restart-exam");
  const nextBtn = document.getElementById("btn-duel-next");

  startBtn.addEventListener("click", startExamDuel);
  restartBtn.addEventListener("click", startExamDuel);
  nextBtn.addEventListener("click", advanceToNextQuestion);
}

export function startExamDuel() {
  audio.playClick();
  const quest = QUESTS[state.currentQuestKey];
  const stage = quest.stages[state.currentStageIdx];
  currentQuestionsList = stage.examTest || [];

  if (currentQuestionsList.length === 0) {
    alert("Для этого этапа тестовые вопросы защиты не требуются.");
    return;
  }

  currentQuestionIdx = 0;
  examScore = { correct: 0, wrong: 0, wrongQuestions: [] };

  document.getElementById("exam-duel-box").classList.remove("hidden");
  document.getElementById("exam-summary-card").classList.add("hidden");

  renderCurrentQuestion();
}

function renderCurrentQuestion() {
  const q = currentQuestionsList[currentQuestionIdx];
  const counterEl = document.getElementById("duel-question-counter");
  const textEl = document.getElementById("duel-question-text");
  const optionsBox = document.getElementById("duel-options-list");
  const feedbackBox = document.getElementById("duel-feedback-box");

  feedbackBox.classList.add("hidden");
  counterEl.textContent = `ВОПРОС ${currentQuestionIdx + 1} ИЗ ${currentQuestionsList.length}`;
  textEl.textContent = q.q;

  // Рендерим 4 варианта выбора
  optionsBox.innerHTML = q.options.map((opt, i) => `
    <button class="duel-option-btn" data-idx="${i}">
      <span class="code-inline">${String.fromCharCode(65 + i)}</span>
      <span>${opt}</span>
    </button>
  `).join("");

  optionsBox.querySelectorAll(".duel-option-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const selected = parseInt(btn.dataset.idx, 10);
      handleOptionChoice(selected, btn);
    });
  });

  // Запуск таймера на 30 сек
  clearInterval(examTimer);
  timeLeft = CONFIG.EXAM_TIMER_SECONDS;
  const timerEl = document.getElementById("duel-timer");
  timerEl.textContent = `⏱️ ${timeLeft} сек`;

  examTimer = setInterval(() => {
    timeLeft--;
    timerEl.textContent = `⏱️ ${timeLeft} сек`;
    if (timeLeft <= 0) {
      clearInterval(examTimer);
      handleTimeout();
    }
  }, 1000);
}

function handleOptionChoice(selectedIdx, btnEl) {
  clearInterval(examTimer);
  const q = currentQuestionsList[currentQuestionIdx];
  const optionsBox = document.getElementById("duel-options-list");
  const feedbackBox = document.getElementById("duel-feedback-box");
  const header = document.getElementById("duel-feedback-header");
  const explain = document.getElementById("duel-feedback-explain");

  // Блокируем повторные клики
  optionsBox.querySelectorAll(".duel-option-btn").forEach(b => b.disabled = true);

  if (selectedIdx === q.correct) {
    audio.playSuccess();
    btnEl.classList.add("selected-correct");
    examScore.correct++;
    header.innerHTML = `<span style="color:var(--success)">✓ ВЕРНО! Преподаватель удовлетворен ответом.</span>`;
  } else {
    audio.playError();
    btnEl.classList.add("selected-wrong");
    optionsBox.querySelector(`[data-idx="${q.correct}"]`).classList.add("selected-correct");
    examScore.wrong++;
    examScore.wrongQuestions.push(q);
    header.innerHTML = `<span style="color:var(--danger)">✗ НЕВЕРНО! Замечание от преподавателя.</span>`;
  }

  explain.innerHTML = `<strong>Разбор:</strong> ${q.explain}`;
  feedbackBox.classList.remove("hidden");
}

function handleTimeout() {
  audio.playError();
  const q = currentQuestionsList[currentQuestionIdx];
  const optionsBox = document.getElementById("duel-options-list");
  const feedbackBox = document.getElementById("duel-feedback-box");
  const header = document.getElementById("duel-feedback-header");
  const explain = document.getElementById("duel-feedback-explain");

  optionsBox.querySelectorAll(".duel-option-btn").forEach(b => b.disabled = true);
  optionsBox.querySelector(`[data-idx="${q.correct}"]`).classList.add("selected-correct");

  examScore.wrong++;
  examScore.wrongQuestions.push(q);

  header.innerHTML = `<span style="color:var(--danger)">⏱️ Время вышло! На защите важна скорость реакции.</span>`;
  explain.innerHTML = `<strong>Разбор:</strong> ${q.explain}`;
  feedbackBox.classList.remove("hidden");
}

function advanceToNextQuestion() {
  audio.playClick();
  currentQuestionIdx++;
  if (currentQuestionIdx < currentQuestionsList.length) {
    renderCurrentQuestion();
  } else {
    showExamSummary();
  }
}

function showExamSummary() {
  document.getElementById("exam-duel-box").classList.add("hidden");
  const summaryCard = document.getElementById("exam-summary-card");
  summaryCard.classList.remove("hidden");

  const total = currentQuestionsList.length;
  const scoreBadge = document.getElementById("summary-score-badge");
  const title = document.getElementById("summary-verdict-title");
  const subtitle = document.getElementById("summary-verdict-subtitle");
  const adviceBox = document.getElementById("summary-advice-box");

  scoreBadge.textContent = `${examScore.correct}/${total}`;

  if (examScore.correct === total) {
    audio.playAchievement();
    unlockAchievement("exam_challenger");
    title.textContent = "Защита сдана на Отлично! 🎉";
    subtitle.textContent = "Преподаватель не нашел пробелов в ваших знаниях.";
    adviceBox.innerHTML = `<strong>Совет наставника:</strong> Ты прекрасно понимаешь архитектуру Java и механику памяти. Можешь смело переходить к следующему этапу!`;
  } else {
    title.textContent = "Требуется доработка ⚠️";
    subtitle.textContent = `Правильных ответов: ${examScore.correct}, ошибок: ${examScore.wrong}.`;
    
    const adviceList = examScore.wrongQuestions.map(wq => `<li>• <strong>${wq.q}</strong><br/>💡 ${wq.advice}</li>`).join("");
    adviceBox.innerHTML = `
      <p><strong>Что нужно повторить перед реальной защитой:</strong></p>
      <ul style="list-style:none; padding:0; margin-top:8px; display:flex; flex-direction:column; gap:8px;">${adviceList}</ul>
    `;
  }
}