/**
 * Система жестко контролируемых ачивок (Anti-Cheat & Skill Check)
 */
import { audio } from './audio.js';

export const ACHIEVEMENTS_LIST = [
  { id: "first_var", icon: "📦", title: "Архитектор памяти", desc: "Сдай Этап 01 в Квесте 00 самостоятельно (без читов и подглядываний в решение)." },
  { id: "division_safe", icon: "➗", title: "Знаток типов", desc: "Реши задачу с ловушкой деления 7.0/2 с первой попытки без единой ошибки." },
  { id: "input_master", icon: "⌨️", title: "Живой ввод", desc: "Успешно подключи Scanner и запусти живой диалог в Интерактивном режиме терминала." },
  { id: "zero_shield", icon: "🛡️", title: "Щит от нуля", desc: "Построй защиту от деления на 0 в switch, не открывая блок подсказки (хинты)." },
  { id: "exam_challenger", icon: "⚔️", title: "Гроза преподов", desc: "Пройди экзаменационную дуэль «Бросить вызов» на 100% без ошибок." },
  { id: "stack_safe", icon: "🌀", title: "Укротитель стека", desc: "Напиши факториал с рекурсией и сдай все стресс-тесты без переполнения стека." },
  { id: "streak_master", icon: "🔥", title: "Снайпер Java", desc: "Достигни непрерывной серии (Streak) из 3 этапов подряд без единой ошибки." }
];

export function getUnlockedAchievements() {
  try {
    return JSON.parse(localStorage.getItem("java_zero_achievements") || "[]");
  } catch (e) {
    return [];
  }
}

export function unlockAchievement(id) {
  const unlocked = getUnlockedAchievements();
  if (unlocked.includes(id)) return;

  unlocked.push(id);
  localStorage.setItem("java_zero_achievements", JSON.stringify(unlocked));

  const ach = ACHIEVEMENTS_LIST.find(a => a.id === id);
  if (ach) {
    showAchievementToast(ach);
    audio.playAchievement();
    window.dispatchEvent(new CustomEvent("matrix-rain"));
  }

  updateAchievementsBadge();
}

export function showAchievementToast(ach) {
  const toast = document.getElementById("achievement-toast");
  const icon = document.getElementById("toast-icon");
  const title = document.getElementById("toast-title");
  const desc = document.getElementById("toast-desc");

  icon.textContent = ach.icon;
  title.textContent = ach.title;
  desc.textContent = ach.desc;

  toast.classList.remove("hidden");
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 4500);
}

export function updateAchievementsBadge() {
  const counter = document.getElementById("achieve-counter");
  if (!counter) return;
  const unlocked = getUnlockedAchievements();
  counter.textContent = `${unlocked.length}/${ACHIEVEMENTS_LIST.length}`;
}

export function renderAchievementsGrid() {
  const grid = document.getElementById("achievements-grid");
  if (!grid) return;
  const unlocked = getUnlockedAchievements();

  grid.innerHTML = ACHIEVEMENTS_LIST.map(a => {
    const isUnlocked = unlocked.includes(a.id);
    return `
      <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
        <div class="achieve-badge-icon">${a.icon}</div>
        <div class="achieve-info">
          <h5>${a.title}</h5>
          <p>${a.desc}</p>
          <span class="achieve-status">${isUnlocked ? 'ОТКРЫТО' : 'ЗАБЛОКИРОВАНО'}</span>
        </div>
      </div>
    `;
  }).join("");
}