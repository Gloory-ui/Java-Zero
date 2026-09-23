/**
 * Клиент интеграции Cyber AI Mentor (Поддержка 3 персон и шорткатов)
 */
import { state } from './state.js';
import { CONFIG } from './config.js';
import { QUESTS } from './quests.js';
import { audio } from './audio.js';

export function initAiClient() {
  const openBtn = document.getElementById("btn-ai-tutor");
  const closeBtn = document.getElementById("btn-close-ai");
  const drawer = document.getElementById("ai-drawer");
  const form = document.getElementById("ai-input-form");
  const input = document.getElementById("ai-prompt-input");
  const personaSelect = document.getElementById("ai-persona-select");

  if (openBtn) {
    openBtn.addEventListener("click", () => {
      audio.playClick();
      drawer.classList.remove("hidden");
      input.focus();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      audio.playClick();
      drawer.classList.add("hidden");
    });
  }

  if (personaSelect) {
    personaSelect.value = state.aiPersona;
    personaSelect.addEventListener("change", (e) => {
      audio.playClick();
      state.setAiPersona(e.target.value);
      const personaNames = {
        chill: "Сеньор на чилле 😎",
        dushny: "Душный препод (JLS) 🧐",
        bigtech: "Интервьюер в Бигтех 💼"
      };
      appendAiMessage(`[СИСТЕМА] Характер ментора изменен на: <strong>${personaNames[e.target.value]}</strong>`, 'bot');
    });
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      sendAiMessage(text);
    });
  }

  // Быстрые кнопки в HUD
  const btnAnalyze = document.getElementById("btn-ai-analyze");
  const btnExplain = document.getElementById("btn-ai-explain-error");
  const btnExamPrep = document.getElementById("btn-ai-exam-prep");

  if (btnAnalyze) {
    btnAnalyze.addEventListener("click", () => {
      audio.playClick();
      sendAiMessage("Сделай ревью моего текущего кода. Укажи на слабые места и стилистику.");
    });
  }

  if (btnExplain) {
    btnExplain.addEventListener("click", () => {
      audio.playClick();
      const termOutput = document.getElementById("terminal-output")?.textContent || "";
      sendAiMessage(`Объясни эту ошибку компиляции или непройденный тест простыми словами:\n${termOutput.slice(0, 300)}`);
    });
  }

  if (btnExamPrep) {
    btnExamPrep.addEventListener("click", () => {
      audio.playClick();
      sendAiMessage("Задай мне один каверзный вопрос с подвохом по физике JVM и памяти для этого этапа.");
    });
  }
}

export async function sendAiMessage(userText) {
  const drawer = document.getElementById("ai-drawer");
  if (drawer.classList.contains("hidden")) {
    drawer.classList.remove("hidden");
  }

  appendAiMessage(escapeHtml(userText).replace(/\n/g, '<br/>'), 'user');
  const typingId = showTypingIndicator();

  const quest = QUESTS[state.currentQuestKey];
  const stage = quest.stages[state.currentStageIdx];
  const userCode = document.getElementById("code-editor")?.value || "";

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.AI_ANALYZE_ENDPOINT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stageTitle: `${quest.title} — ${stage.title}`,
        userCode: userCode,
        compilerError: null,
        failedTest: null,
        userMessage: userText,
        persona: state.aiPersona
      })
    });

    removeTypingIndicator(typingId);

    if (!response.ok) {
      throw new Error(`Ошибка сервера: ${response.status}`);
    }

    const data = await response.json();
    appendAiMessage(formatMarkdown(data.reply), 'bot');
    audio.playSuccess();
  } catch (err) {
    removeTypingIndicator(typingId);
    appendAiMessage(`⚠️ Ошибка связи с ментором: ${err.message}. Проверьте сервер и ключ GEMINI_API_KEY.`, 'bot');
    audio.playError();
  }
}

function appendAiMessage(htmlContent, sender = 'bot') {
  const chatBody = document.getElementById("ai-chat-body");
  if (!chatBody) return;

  const msg = document.createElement("div");
  msg.className = `ai-msg ${sender}`;
  msg.innerHTML = htmlContent;
  chatBody.appendChild(msg);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function showTypingIndicator() {
  const chatBody = document.getElementById("ai-chat-body");
  const id = `typing-${Date.now()}`;
  const typingEl = document.createElement("div");
  typingEl.className = "ai-msg bot ai-typing";
  typingEl.id = id;
  typingEl.innerHTML = `
    <span class="ai-typing-dot"></span>
    <span class="ai-typing-dot"></span>
    <span class="ai-typing-dot"></span>
  `;
  chatBody.appendChild(typingEl);
  chatBody.scrollTop = chatBody.scrollHeight;
  return id;
}

function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// Сообщения вставляются через innerHTML: без экранирования `List<String>` превращался в `List`,
// а `i<n` ломал разметку чата
function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatMarkdown(text) {
  if (!text) return "";
  return escapeHtml(text)
    .replace(/```java([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<span class="code-inline">$1</span>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}