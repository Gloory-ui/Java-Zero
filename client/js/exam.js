/**
 * Интерактивный симулятор защиты у преподавателя (Exam Simulator v2.0 Pro)
 */
import { audio } from './audio.js';
import { state } from './state.js';
import { QUESTS } from './quests.js';
import { unlockAchievement } from './achievements.js';
import { CONFIG } from './config.js';
import { sendAiMessage } from './ai-client.js';

let currentQuestionIdx = 0;
let currentQuestionsList = [];
let examScore = { correct: 0, wrong: 0, wrongQuestions: [] };
let examTimer = null;
let timeLeft = CONFIG.EXAM_TIMER_SECONDS;

export function initExamSimulator() {
  const startBtn = document.getElementById("btn-exam-challenge");
  const restartBtn = document.getElementById("btn-restart-exam");
  const nextBtn = document.getElementById("btn-duel-next");

  if (startBtn) startBtn.addEventListener("click", startExamDuel);
  if (restartBtn) restartBtn.addEventListener("click", startExamDuel);
  if (nextBtn) nextBtn.addEventListener("click", advanceToNextQuestion);
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

  // 4 варианта ответов
  optionsBox.innerHTML = q.options.map((opt, i) => `
    <button class="duel-option-btn" data-idx="${i}">
      <span class="code-inline">${String.fromCharCode(65 + i)}</span>
      <span>${opt}</span>
    </button>
  `).join("");

  optionsBox.querySelectorAll(".duel-option-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const selected = parseInt(btn.dataset.idx, 10);
      handleOptionChoice(selected, btn);
    });
  });

  // Таймер обратного отсчета
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
    header.innerHTML = `<span style="color:var(--danger)">✗ НЕВЕРНО! Замечание в лист защиты.</span>`;
  }

  explain.innerHTML = `<strong>Разбор логики:</strong> ${q.explain}`;
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

  header.innerHTML = `<span style="color:var(--danger)">⏱️ Время истекло! На защите требуется оперативный ответ.</span>`;
  explain.innerHTML = `<strong>Разбор логики:</strong> ${q.explain}`;
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

  const percent = Math.round((examScore.correct / total) * 100);
  scoreBadge.textContent = `${examScore.correct} / ${total} (${percent}%)`;

  let gradeMarkup = '';
  if (percent === 100) {
    audio.playAchievement();
    unlockAchievement("exam_challenger");
    title.textContent = "Оценка: ОТЛИЧНО (5 / A) 🎓";
    subtitle.textContent = "Защита принята без единого замечания!";
    gradeMarkup = `
      <p style="color:var(--success); font-weight:700;">Поздравляем! Ты полностью понимаешь происходящее в памяти JVM.</p>
      <button class="btn-primary" id="btn-oral-ai-extra" style="margin-top:10px;">🎙️ Пройти устный допрос у AI-профессора</button>
    `;
  } else if (percent >= 50) {
    title.textContent = "Оценка: ХОРОШО (4 / B) ✍️";
    subtitle.textContent = `Защита зачтена, но есть шероховатости (${examScore.wrong} ошибки).`;
    gradeMarkup = renderMistakesAdvice();
  } else {
    audio.playError();
    title.textContent = "Оценка: НЕЗАЧЁТ (2 / F) ⚠️";
    subtitle.textContent = "Преподаватель отправил вас на пересдачу.";
    gradeMarkup = renderMistakesAdvice();
  }

  adviceBox.innerHTML = gradeMarkup;

  const oralBtn = document.getElementById("btn-oral-ai-extra");
  if (oralBtn) {
    oralBtn.addEventListener("click", () => {
      document.getElementById("ai-drawer").classList.remove("hidden");
      sendAiMessage("Сыграй роль строжайшего преподавателя Java и задай мне один трудный устный вопрос по текущему этапу с подвохом.");
    });
  }
}

function renderMistakesAdvice() {
  const list = examScore.wrongQuestions.map(wq => `
    <li style="margin-bottom:8px;">
      • <strong>Вопрос:</strong> ${wq.q}<br/>
      💡 <span style="color:var(--neon-gold);">${wq.advice}</span>
    </li>
  `).join("");

  return `
    <p><strong>Темы, которые нужно повторить перед сдачей:</strong></p>
    <ul style="list-style:none; padding:0; margin-top:8px;">${list}</ul>
  `;
}