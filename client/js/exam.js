/**
 * Интерактивный симулятор защиты и Босс-файт (Exam Boss Duel v2.1)
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

  // Скрываем блок вызова с кнопкой, чтобы исключить случайные перезапуски таймера
  const introBlock = document.getElementById("exam-arena-intro");
  if (introBlock) introBlock.classList.add("hidden");

  // Сброс параметров
  currentQuestionIdx = 0;
  examScore = { correct: 0, wrong: 0, wrongQuestions: [] };
  state.bossHp = 100;
  state.playerHp = 100;
  updateBossHpUI();
  updatePlayerHpUI();

  document.getElementById("exam-duel-box").classList.remove("hidden");
  document.getElementById("exam-summary-card").classList.add("hidden");
  // Шпаргалка содержит ответы — во время боя её не видно
  document.getElementById("exam-cheatsheet").classList.add("hidden");

  renderCurrentQuestion();
}

// Возврат арены к начальному виду при смене этапа; останавливает таймер незавершённой дуэли
export function resetExamDuel() {
  clearInterval(examTimer);
  state.bossHp = 100;
  state.playerHp = 100;
  updateBossHpUI();
  updatePlayerHpUI();
  document.getElementById("exam-arena-intro")?.classList.remove("hidden");
  document.getElementById("exam-duel-box")?.classList.add("hidden");
  document.getElementById("exam-summary-card")?.classList.add("hidden");
  document.getElementById("exam-cheatsheet")?.classList.remove("hidden");
}

function updateBossHpUI() {
  const hpFill = document.getElementById("boss-hp-fill");
  const hpText = document.getElementById("boss-hp-text");
  if (!hpFill || !hpText) return;

  const percent = Math.max(0, state.bossHp);
  hpFill.style.width = `${percent}%`;
  hpText.textContent = `${percent} / 100 HP`;

  if (percent <= 25) {
    hpFill.style.background = "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)";
  } else if (percent <= 50) {
    hpFill.style.background = "linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)";
  } else {
    hpFill.style.background = "linear-gradient(90deg, #ff2a55 0%, #f59e0b 100%)";
  }
}

function updatePlayerHpUI() {
  const hpFill = document.getElementById("player-hp-fill");
  const hpText = document.getElementById("player-hp-text");
  if (!hpFill || !hpText) return;

  const hp = Math.max(0, state.playerHp);
  hpFill.style.width = `${hp}%`;
  hpText.textContent = `${hp} / 100 HP`;
}

// Нервы студента кончаются ровно тогда, когда ошибок столько, что незачёт (< 50%) уже неизбежен
function registerMistake(q) {
  examScore.wrong++;
  examScore.wrongQuestions.push(q);

  const mistakesToFail = Math.floor(currentQuestionsList.length / 2) + 1;
  state.playerHp = Math.max(0, state.playerHp - Math.ceil(100 / mistakesToFail));
  updatePlayerHpUI();

  const hud = document.querySelector(".boss-arena-hud");
  hud.classList.add("shake-error");
  setTimeout(() => hud.classList.remove("shake-error"), 500);

  return state.playerHp <= 0;
}

function showFeedback(q) {
  const isLast = currentQuestionIdx >= currentQuestionsList.length - 1;
  document.getElementById("btn-duel-next").textContent =
    (isLast || state.playerHp <= 0) ? "К итогам →" : "Следующий вопрос →";
  document.getElementById("duel-feedback-explain").innerHTML = `<strong>Разбор логики:</strong> ${q.explain}`;
  document.getElementById("duel-feedback-box").classList.remove("hidden");
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

  // Запуск таймера
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
  const header = document.getElementById("duel-feedback-header");
  const arenaCard = document.getElementById("boss-arena-card");

  optionsBox.querySelectorAll(".duel-option-btn").forEach(b => b.disabled = true);

  const timeElapsed = CONFIG.EXAM_TIMER_SECONDS - timeLeft;
  const isCrit = timeElapsed <= 5;

  if (selectedIdx === q.correct) {
    examScore.correct++;
    btnEl.classList.add("selected-correct");

    const baseDamage = Math.ceil(100 / currentQuestionsList.length);
    state.bossHp = Math.max(0, state.bossHp - baseDamage);
    updateBossHpUI();

    if (isCrit) {
      audio.playCritHit();
      arenaCard.classList.add("crit-flash");
      header.innerHTML = `<span style="color:var(--neon-gold)">⚡ КРИТИЧЕСКИЙ УДАР! (-${baseDamage} HP) Молниеносный ответ за ${timeElapsed} сек!</span>`;
    } else {
      audio.playBossHit();
      header.innerHTML = `<span style="color:var(--success)">✓ ВЕРНО! (-${baseDamage} HP) Преподаватель удовлетворен аргументом.</span>`;
    }

    setTimeout(() => arenaCard.classList.remove("crit-flash"), 400);

  } else {
    audio.playError();
    btnEl.classList.add("selected-wrong");
    optionsBox.querySelector(`[data-idx="${q.correct}"]`).classList.add("selected-correct");
    const knockedOut = registerMistake(q);
    header.innerHTML = `<span style="color:var(--danger)">✗ НЕВЕРНО! Замечание в лист защиты.${knockedOut ? " Нервы на нуле — профессор ставит незачёт." : ""}</span>`;
  }

  showFeedback(q);
}

function handleTimeout() {
  audio.playError();
  const q = currentQuestionsList[currentQuestionIdx];
  const optionsBox = document.getElementById("duel-options-list");
  const header = document.getElementById("duel-feedback-header");

  optionsBox.querySelectorAll(".duel-option-btn").forEach(b => b.disabled = true);
  optionsBox.querySelector(`[data-idx="${q.correct}"]`).classList.add("selected-correct");

  const knockedOut = registerMistake(q);
  header.innerHTML = `<span style="color:var(--danger)">⏱️ Время истекло! На защите требуется оперативный ответ.${knockedOut ? " Нервы на нуле — профессор ставит незачёт." : ""}</span>`;
  showFeedback(q);
}

function advanceToNextQuestion() {
  audio.playClick();
  currentQuestionIdx++;
  if (state.playerHp > 0 && currentQuestionIdx < currentQuestionsList.length) {
    renderCurrentQuestion();
  } else {
    showExamSummary();
  }
}

function showExamSummary() {
  document.getElementById("exam-duel-box").classList.add("hidden");
  document.getElementById("exam-cheatsheet").classList.remove("hidden");
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
  if (state.playerHp <= 0) {
    audio.playError();
    title.textContent = "НЕЗАЧЁТ: НЕРВЫ НА НУЛЕ ⚠️";
    subtitle.textContent = `Ошибок: ${examScore.wrong} — профессор выставил вас с защиты досрочно.`;
    gradeMarkup = renderMistakesAdvice();
  } else if (percent === 100 || state.bossHp <= 0) {
    audio.playAchievement();
    unlockAchievement("exam_challenger");
    window.dispatchEvent(new CustomEvent("matrix-rain"));

    title.textContent = "БОСС ПОВЕРЖЕН! Оценка: 5 (ОТЛИЧНО) 🎓";
    subtitle.textContent = "Профессор Душнов подписал зачетный лист без единого вопроса!";
    gradeMarkup = `
      <p style="color:var(--success); font-weight:700;">Поздравляем! Полная победа на дуэли знаний.</p>
      <button class="btn-primary" id="btn-oral-ai-extra" style="margin-top:10px;">🎙️ Пройти устный допрос у AI-профессора</button>
    `;
  } else if (percent >= 50) {
    title.textContent = "БОСС УСТОЯЛ: Оценка 4 (ХОРОШО) ✍️";
    subtitle.textContent = `Защита зачтена с замечаниями (${examScore.wrong} ошибки).`;
    gradeMarkup = renderMistakesAdvice();
  } else {
    audio.playError();
    title.textContent = "НЕЗАЧЁТ: Оценка 2 (ПЕРЕСДАЧА) ⚠️";
    subtitle.textContent = "Преподаватель отправил вас учить теорию заново.";
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
    <p><strong>Темы, которые нужно повторить перед повторной сдачей:</strong></p>
    <ul style="list-style:none; padding:0; margin-top:8px;">${list}</ul>
  `;
}