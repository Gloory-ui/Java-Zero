/**
 * Трассировщик вложенных циклов: показывает на сетке, в каком порядке
 * выполняются итерации for i → for j и что вычисляется на каждой (i * j)
 */
const STEP_MS = 35;

let tracerTimer = null;

export function runLoopTracer({ rows, cols }, { reveal = false } = {}) {
  stopLoopTracer();
  const box = document.getElementById("loop-tracer");
  if (!box) return;

  const colHeaders = Array.from({ length: cols }, (_, j) =>
    `<div class="tracer-hdr" data-col="${j + 1}">${j + 1}</div>`).join("");
  const gridRows = Array.from({ length: rows }, (_, i) =>
    `<div class="tracer-hdr" data-row="${i + 1}">${i + 1}</div>` +
    Array.from({ length: cols }, (_, j) =>
      `<div class="tracer-cell" data-i="${i + 1}" data-j="${j + 1}"></div>`).join("")
  ).join("");

  box.innerHTML = `
    <div class="tracer-head">
      <span>ТРАССИРОВКА ЦИКЛОВ: for i → for j</span>
      <span class="tracer-step"></span>
    </div>
    <div class="tracer-grid" style="grid-template-columns: repeat(${cols + 1}, 1fr)">
      <div class="tracer-hdr">i\\j</div>${colHeaders}${gridRows}
    </div>
    <div class="tracer-hint">Внешний цикл идёт по строкам, внутренний — по столбцам. Клик по сетке — досчитать сразу.</div>
  `;
  box.classList.remove("hidden");

  if (reveal) {
    const area = document.getElementById("terminal-scroll-area");
    if (area) area.scrollTop = box.offsetTop - area.offsetTop;
  }

  // Ячейки в DOM идут построчно — ровно в порядке итераций вложенного цикла
  const cells = box.querySelectorAll(".tracer-cell");
  const stepEl = box.querySelector(".tracer-step");
  let k = 0;

  const step = () => {
    box.querySelector(".tracer-cell.current")?.classList.remove("current");
    box.querySelectorAll(".tracer-hdr.active").forEach(h => h.classList.remove("active"));

    if (k >= cells.length) {
      stopLoopTracer({ hide: false });
      stepEl.textContent = `готово: ${cells.length} итераций`;
      return;
    }

    const cell = cells[k++];
    const i = Number(cell.dataset.i);
    const j = Number(cell.dataset.j);
    cell.textContent = i * j;
    cell.classList.add("done", "current");
    box.querySelector(`[data-row="${i}"]`).classList.add("active");
    box.querySelector(`[data-col="${j}"]`).classList.add("active");
    stepEl.textContent = `i = ${i}, j = ${j} → ${i} * ${j} = ${i * j}`;
  };

  box.onclick = () => {
    if (!tracerTimer) return;
    while (k < cells.length) step();
    step();
  };

  tracerTimer = setInterval(step, STEP_MS);
}

export function stopLoopTracer({ hide = true } = {}) {
  clearInterval(tracerTimer);
  tracerTimer = null;
  if (hide) document.getElementById("loop-tracer")?.classList.add("hidden");
}
