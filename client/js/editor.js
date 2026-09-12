/**
 * Редактор кода (Code UX, IDEA Shortcuts, Formatting)
 */
import { audio } from './audio.js';
import { state } from './state.js';
import { CONFIG } from './config.js';

export function updateLineNumbers() {
  const editor = document.getElementById("code-editor");
  const lineNumbers = document.getElementById("line-numbers");
  if (!editor || !lineNumbers) return;

  const lines = editor.value.split("\n").length;
  lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) => i + 1).join("\n");
}

export function syncEditorScroll() {
  const editor = document.getElementById("code-editor");
  const lineNumbers = document.getElementById("line-numbers");
  if (editor && lineNumbers) {
    lineNumbers.scrollTop = editor.scrollTop;
  }
}

export function handleEditorKeydown(e) {
  const editor = e.target;
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const val = editor.value;

  // Шорткаты sout + Tab и psvm + Tab
  if (e.key === "Tab") {
    e.preventDefault();
    audio.playClick();

    const lineStart = val.lastIndexOf("\n", start - 1) + 1;
    const currentPrefix = val.substring(lineStart, start);

    if (currentPrefix.trim().endsWith("sout")) {
      const soutStart = start - 4;
      const snippet = "System.out.println();";
      editor.value = val.substring(0, soutStart) + snippet + val.substring(end);
      editor.selectionStart = editor.selectionEnd = soutStart + snippet.length - 2;
      updateLineNumbers();
      saveCurrentCode(editor.value);
      return;
    }

    if (currentPrefix.trim().endsWith("psvm")) {
      const psvmStart = start - 4;
      const indentMatch = currentPrefix.match(/^\s*/);
      const indent = indentMatch ? indentMatch[0] : "";
      const snippet = `public static void main(String[] args) {\n${indent}    \n${indent}}`;
      editor.value = val.substring(0, psvmStart) + snippet + val.substring(end);
      editor.selectionStart = editor.selectionEnd = psvmStart + `public static void main(String[] args) {\n${indent}    `.length;
      updateLineNumbers();
      saveCurrentCode(editor.value);
      return;
    }

    editor.value = val.substring(0, start) + "    " + val.substring(end);
    editor.selectionStart = editor.selectionEnd = start + 4;
    updateLineNumbers();
    saveCurrentCode(editor.value);
    return;
  }

  // Автопарные скобки и кавычки
  const pairs = { "(": ")", "{": "}", "[": "]", '"': '"', "'": "'" };
  if (pairs[e.key]) {
    e.preventDefault();
    const closeChar = pairs[e.key];
    const selected = val.substring(start, end);
    editor.value = val.substring(0, start) + e.key + selected + closeChar + val.substring(end);
    editor.selectionStart = start + 1;
    editor.selectionEnd = end + 1;
    updateLineNumbers();
    saveCurrentCode(editor.value);
    return;
  }

  if ([")", "}", "]", '"', "'"].includes(e.key) && val[start] === e.key && start === end) {
    e.preventDefault();
    editor.selectionStart = editor.selectionEnd = start + 1;
    return;
  }

  if (e.key === "Enter") {
    e.preventDefault();
    const lineStart = val.lastIndexOf("\n", start - 1) + 1;
    const currentLine = val.substring(lineStart, start);
    const indentMatch = currentLine.match(/^\s*/);
    let indent = indentMatch ? indentMatch[0] : "";

    const charBefore = val[start - 1];
    const charAfter = val[start];

    if (charBefore === "{" && charAfter === "}") {
      const extraIndent = "    ";
      const insertText = "\n" + indent + extraIndent + "\n" + indent;
      editor.value = val.substring(0, start) + insertText + val.substring(end);
      editor.selectionStart = editor.selectionEnd = start + indent.length + extraIndent.length + 1;
    } else {
      if (charBefore === "{") indent += "    ";
      editor.value = val.substring(0, start) + "\n" + indent + val.substring(end);
      editor.selectionStart = editor.selectionEnd = start + indent.length + 1;
    }

    updateLineNumbers();
    saveCurrentCode(editor.value);
    return;
  }

  if (e.key === "Backspace" && start === end && start > 0) {
    const prev = val[start - 1];
    const next = val[start];
    if (
      (prev === "{" && next === "}") ||
      (prev === "(" && next === ")") ||
      (prev === "[" && next === "]") ||
      (prev === '"' && next === '"') ||
      (prev === "'" && next === "'")
    ) {
      e.preventDefault();
      editor.value = val.substring(0, start - 1) + val.substring(start + 1);
      editor.selectionStart = editor.selectionEnd = start - 1;
      updateLineNumbers();
      saveCurrentCode(editor.value);
    }
  }
}

export function formatJavaCode() {
  audio.playClick();
  const editor = document.getElementById("code-editor");
  if (!editor) return;

  const rawLines = editor.value.split("\n");
  let indentLevel = 0;
  const formatted = [];

  for (let line of rawLines) {
    let trimmed = line.trim();
    if (!trimmed) {
      formatted.push("");
      continue;
    }

    if (trimmed.startsWith("}") || trimmed.startsWith(");")) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    formatted.push("    ".repeat(indentLevel) + trimmed);

    const openBraces = (trimmed.match(/{/g) || []).length;
    const closeBraces = (trimmed.match(/}/g) || []).length;
    const delta = openBraces - closeBraces;

    if (!trimmed.startsWith("}")) {
      indentLevel = Math.max(0, indentLevel + delta);
    }
  }

  editor.value = formatted.join("\n");
  updateLineNumbers();
  saveCurrentCode(editor.value);
}

export function saveCurrentCode(code) {
  const savedCodes = JSON.parse(localStorage.getItem(`java_zero_code_saves_${state.currentQuestKey}`) || "{}");
  savedCodes[state.currentStageIdx] = code;
  localStorage.setItem(`java_zero_code_saves_${state.currentQuestKey}`, JSON.stringify(savedCodes));
}

export function getCodeForStage(stageIdx, defaultCode) {
  const savedCodes = JSON.parse(localStorage.getItem(`java_zero_code_saves_${state.currentQuestKey}`) || "{}");
  if (savedCodes[stageIdx] !== undefined) return savedCodes[stageIdx];
  return defaultCode;
}

export function registerAttempt(rawCode) {
  const normalized = (rawCode || "").trim();
  if (!normalized) return;

  const data = JSON.parse(localStorage.getItem(`java_zero_distinct_attempts_${state.currentQuestKey}`) || "{}");
  if (!Array.isArray(data[state.currentStageIdx])) {
    data[state.currentStageIdx] = [];
  }

  if (!data[state.currentStageIdx].includes(normalized)) {
    data[state.currentStageIdx].push(normalized);
    localStorage.setItem(`java_zero_distinct_attempts_${state.currentQuestKey}`, JSON.stringify(data));
  }

  updateSolutionButtonState();
}

export function updateSolutionButtonState() {
  const data = JSON.parse(localStorage.getItem(`java_zero_distinct_attempts_${state.currentQuestKey}`) || "{}");
  const count = (data[state.currentStageIdx] || []).length;
  const btn = document.getElementById("btn-solution");
  const textSlot = document.getElementById("solution-text");

  if (count >= CONFIG.REQUIRED_DISTINCT_ATTEMPTS) {
    btn.classList.remove("locked");
    btn.classList.add("unlocked");
    btn.title = "Открыть эталонное решение";
    textSlot.textContent = "Решение";
  } else {
    btn.classList.remove("unlocked");
    btn.classList.add("locked");
    btn.title = `Сделай еще ${CONFIG.REQUIRED_DISTINCT_ATTEMPTS - count} попыток для открытия решения`;
    textSlot.textContent = "Решение";
  }
}