/**
 * Визуализатор памяти JVM (Call Stack & Heap Inspector)
 */
import { QUESTS } from './quests.js';
import { state } from './state.js';

export function renderMemoryVisualizer() {
  const quest = QUESTS[state.currentQuestKey];
  const stage = quest.stages[state.currentStageIdx];
  const stackBox = document.getElementById("stack-display");
  const heapBox = document.getElementById("heap-display");

  if (!stackBox || !heapBox) return;

  const snapshot = stage.memorySnapshot || {
    stack: [{ method: "main()", vars: ["Локальные переменные этапа"] }],
    heap: [{ obj: "JVM Heap", data: "Объекты и константы" }]
  };

  stackBox.innerHTML = snapshot.stack.map(f => `
    <div class="stack-frame">
      <div class="stack-frame-header">${f.method}</div>
      <div class="stack-frame-vars">
        ${f.vars.map(v => `<div>• ${v}</div>`).join("")}
      </div>
    </div>
  `).join("");

  heapBox.innerHTML = snapshot.heap.map(h => `
    <div class="heap-block">
      <div class="heap-block-title">${h.obj}</div>
      <div class="heap-block-content">${h.data}</div>
    </div>
  `).join("");
}