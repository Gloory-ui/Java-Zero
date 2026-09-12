/**
 * Клиент AI-ментора с парсером Markdown и плавным появлением текста
 */
import { CONFIG } from './config.js';
import { QUESTS } from './quests.js';
import { state } from './state.js';
import { audio } from './audio.js';

export function initAiClient() {
  const drawer = document.getElementById("ai-drawer");
  const openBtn = document.getElementById("btn-ai-tutor");
  const closeBtn = document.getElementById("btn-close-ai");
  const form = document.getElementById("ai-input-form");
  const promptInput = document.getElementById("ai-prompt-input");

  openBtn.addEventListener("click", () => {
    audio.playClick();
    drawer.classList.remove("hidden");
  });

  closeBtn.addEventListener("click", () => {
    audio.playClick();
    drawer.classList.add("hidden");
  });

  document.getElementById("btn-ai-analyze").addEventListener("click", () => {
    sendAiMessage("Проанализируй мой код и кратко подскажи, где ошибка.");
  });

  document.getElementById("btn-ai-explain-error").addEventListener("click", () => {
    sendAiMessage("Кратко объясни ошибку из терминала простыми словами.");
  });

  document.getElementById("btn-ai-exam-prep").addEventListener("click", () => {
    sendAiMessage("Задай 2 кратких каверзных вопроса по этому коду для защиты.");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const txt = promptInput.value.trim();
    if (!txt) return;
    promptInput.value = "";
    sendAiMessage(txt);
  });
}

export async function sendAiMessage(userMessage) {
  audio.playClick();
  const quest = QUESTS[state.currentQuestKey];
  const stage = quest.stages[state.currentStageIdx];
  const currentCode = document.getElementById("code-editor").value;
  const terminalLog = document.getElementById("terminal-output").textContent;

  appendChatMessage(userMessage, 'user');

  // Минималистичный лоадер с точками
  const loadingEl = appendChatMessage(`
    <div class="ai-typing">
      <span class="ai-typing-dot"></span>
      <span class="ai-typing-dot"></span>
      <span class="ai-typing-dot"></span>
    </div>
  `, 'bot');

  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.AI_ANALYZE_ENDPOINT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stageTitle: `${stage.badge}: ${stage.title}`,
        userCode: currentCode,
        compilerError: terminalLog.includes("error:") ? terminalLog : null,
        failedTest: terminalLog.includes("FAILED") ? terminalLog : null,
        userMessage: userMessage
      })
    });

    const data = await res.json();
    loadingEl.remove();

    if (data.reply) {
      animateAiResponse(data.reply);
    } else if (data.error) {
      appendChatMessage(`⚠️ ${data.error}`, 'bot');
    }
  } catch (err) {
    loadingEl.remove();
    appendChatMessage("⚠️ Ошибка связи с сервером.", 'bot');
  }
}

function appendChatMessage(htmlText, type) {
  const chatBody = document.getElementById("ai-chat-body");
  const div = document.createElement("div");
  div.className = `ai-msg ${type}`;
  div.innerHTML = htmlText;
  chatBody.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;
  return div;
}

// Потоковое появление текста
function animateAiResponse(rawMarkdown) {
  const html = formatMarkdown(rawMarkdown);
  const botBubble = appendChatMessage('', 'bot');
  
  // Разделяем на смысловые фразы для быстрой анимации без задержек
  const tokens = html.split(/(<pre[\s\S]*?<\/pre>|<br\/>|\n)/g).filter(Boolean);
  let idx = 0;

  function streamStep() {
    if (idx < tokens.length) {
      botBubble.innerHTML += tokens[idx];
      idx++;
      const chatBody = document.getElementById("ai-chat-body");
      chatBody.scrollTop = chatBody.scrollHeight;
      setTimeout(streamStep, 25);
    }
  }
  streamStep();
}

// Парсер Markdown
function formatMarkdown(text) {
  return text
    .replace(/```java([\s\S]*?)```/g, '<pre>$1</pre>')
    .replace(/```([\s\S]*?)```/g, '<pre>$1</pre>')
    .replace(/###\s+(.*?)(\n|$)/g, '<h5>$1</h5>')
    .replace(/^>\s*(.*?)$/gm, '<div class="ai-quote">$1</div>')
    .replace(/---/g, '<hr class="ai-divider" />')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<span class="code-inline">$1</span>')
    .replace(/\n/g, '<br/>');
}