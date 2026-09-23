/**
 * Терминал, JDK компилятор, интерактивный ввод и Smart Diff
 */
import { audio } from './audio.js';
import { state } from './state.js';
import { QUESTS } from './quests.js';
import { unlockAchievement } from './achievements.js';
import { registerAttempt, saveCurrentCode } from './editor.js';

let interactiveStep = 0;
let interactiveData = {};

export function setTermStatus(statusText, type) {
  const badge = document.getElementById("term-status-badge");
  if (!badge) return;
  badge.textContent = statusText;
  badge.className = `term-status-badge ${type}`;
}

// Комментарии-подсказки в стартовом коде содержат готовые ответы (например, "// Добавь проверку b == 0"),
// поэтому тесты проверяют код без них. Строки и char-литералы сохраняются как есть.
function stripJavaComments(code) {
  return code.replace(
    /"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|\/\/[^\n]*|\/\*[\s\S]*?\*\//g,
    m => (m.startsWith("//") || m.startsWith("/*")) ? "" : m
  );
}

export function performJdkSyntaxCheck(code, fileName) {
  const lines = code.split("\n");
  let braceCount = 0;
  for (let i = 0; i < lines.length; i++) {
    braceCount += (lines[i].match(/{/g) || []).length;
    braceCount -= (lines[i].match(/}/g) || []).length;
  }
  if (braceCount > 0) {
    return {
      error: true,
      line: lines.length,
      msg: "reached end of file while parsing (не закрыта фигурная скобка '}')",
      snippet: lines[lines.length - 1] || "}"
    };
  }

  const expectedClassName = fileName.replace(".java", "");
  if (!code.includes(`class ${expectedClassName}`)) {
    return {
      error: true,
      line: 1,
      msg: `class '${expectedClassName}' is public, should be declared in a file named ${fileName}`,
      snippet: lines[0] || ""
    };
  }

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (
      trimmed &&
      !trimmed.startsWith("//") &&
      !trimmed.startsWith("/*") &&
      !trimmed.startsWith("*") &&
      !trimmed.endsWith("{") &&
      !trimmed.endsWith("}") &&
      !trimmed.endsWith(";") &&
      !trimmed.startsWith("public class") &&
      !trimmed.startsWith("class") &&
      !trimmed.startsWith("import") &&
      (trimmed.includes("System.out") || trimmed.includes("return") || trimmed.includes("=") || trimmed.includes("history["))
    ) {
      return {
        error: true,
        line: i + 1,
        msg: "';' expected",
        snippet: lines[i]
      };
    }
  }

  return { error: false };
}

export function runCodeValidation(onStagePassed) {
  audio.playClick();
  const quest = QUESTS[state.currentQuestKey];
  const stage = quest.stages[state.currentStageIdx];
  const code = document.getElementById("code-editor").value;
  const term = document.getElementById("terminal-output");
  const termBlock = document.getElementById("terminal-block");
  const editorWrapper = document.getElementById("editor-wrapper");
  const inputForm = document.getElementById("terminal-input-form");
  const diffBox = document.getElementById("diff-inspector");
  const diffBtn = document.getElementById("btn-toggle-diff");

  inputForm.classList.add("hidden");
  diffBox.classList.add("hidden");
  diffBtn.classList.add("hidden");

  registerAttempt(code);
  saveCurrentCode(code);

  setTermStatus("COMPILING", "running");
  termBlock.classList.remove("shake-error", "success-glow");
  editorWrapper.classList.remove("shake-error", "success-glow");

  term.className = "terminal-body";
  term.textContent = `$ javac ${quest.fileName}\n$ java -ea TestRunner\n--------------------------------------------------\n`;

  const syntax = performJdkSyntaxCheck(code, quest.fileName);
  if (syntax.error) {
    state.failedAttemptsCurrentStage++;
    setTimeout(() => {
      audio.playError();
      state.currentStreak = 0;
      state.saveProgress();

      setTermStatus("BUILD FAILED", "error");
      term.className = "terminal-body error";
      term.textContent += `${quest.fileName}:${syntax.line}: error: ${syntax.msg}\n    ${syntax.snippet.trim()}\n    ^\n1 error\n[JVM EXIT CODE 1] Компиляция прервана.\n`;

      termBlock.classList.add("shake-error");
      editorWrapper.classList.add("shake-error");
      setTimeout(() => {
        termBlock.classList.remove("shake-error");
        editorWrapper.classList.remove("shake-error");
      }, 500);
    }, 250);
    return;
  }

  setTimeout(() => {
    let allPassed = true;
    let log = "";
    let failedTestExpected = "";
    const testableCode = stripJavaComments(code);

    stage.tests.forEach((t, i) => {
      const ok = t.check(testableCode);
      if (ok) {
        log += `[TEST ${i + 1}/${stage.tests.length}] ${t.name} ... PASSED\n`;
      } else {
        allPassed = false;
        log += `[TEST ${i + 1}/${stage.tests.length}] ${t.name} ... FAILED\n`;
        if (!failedTestExpected) failedTestExpected = t.expected || t.name;
      }
    });

    term.textContent += log;

    if (allPassed) {
      audio.playSuccess();
      state.currentStreak++;
      state.saveProgress();

      // Проверка ачивок
      if (state.currentStreak >= 3) unlockAchievement("streak_master");
      if (state.currentQuestKey === "basics" && state.currentStageIdx === 0 && !state.solutionViewedCurrentStage) {
        unlockAchievement("first_var");
      }
      if (state.currentQuestKey === "basics" && state.currentStageIdx === 1 && state.failedAttemptsCurrentStage === 0) {
        unlockAchievement("division_safe");
      }
      if (state.currentQuestKey === "calc" && state.currentStageIdx === 1 && !state.hintUsedCurrentStage) {
        unlockAchievement("zero_shield");
      }
      if (state.currentQuestKey === "calc" && state.currentStageIdx === 3) {
        unlockAchievement("stack_safe");
      }

      setTermStatus("ALL PASS", "success");
      term.className = "terminal-body success";
      term.textContent += `\n[SUCCESS] Все стресс-тесты пройдены! Этап сдан.\n`;
      termBlock.classList.add("success-glow");
      editorWrapper.classList.add("success-glow");

      const unlockedMax = state.getUnlockedStageMax();
      if (state.currentStageIdx === unlockedMax) {
        if (unlockedMax < quest.stages.length - 1) {
          state.setUnlockedStageMax(unlockedMax + 1);
        } else {
          state.setQuestCompleted(state.currentQuestKey, true);
        }
        state.saveProgress();
      }

      if (onStagePassed) onStagePassed();
    } else {
      state.failedAttemptsCurrentStage++;
      audio.playError();
      state.currentStreak = 0;
      state.saveProgress();

      setTermStatus("TESTS FAILED", "error");
      term.className = "terminal-body error";
      term.textContent += `\n[FAIL] Часть условий не выполнена. Ознакомься с Diff сравнением ниже.\n`;

      diffBtn.classList.remove("hidden");
      document.getElementById("diff-expected").textContent = failedTestExpected;
      document.getElementById("diff-actual").textContent = code.trim().substring(0, 160) + "...";
      diffBox.classList.remove("hidden");

      termBlock.classList.add("shake-error");
      editorWrapper.classList.add("shake-error");
      setTimeout(() => {
        termBlock.classList.remove("shake-error");
        editorWrapper.classList.remove("shake-error");
      }, 500);
    }
  }, 250);
}

export function startInteractiveSimulation() {
  audio.playClick();
  const quest = QUESTS[state.currentQuestKey];
  const stage = quest.stages[state.currentStageIdx];
  const term = document.getElementById("terminal-output");

  interactiveStep = 0;
  interactiveData = {};

  term.className = "terminal-body";
  term.textContent = `=== [ИНТЕРАКТИВНЫЙ ЗАПУСК: ${stage.title}] ===\nЗапуск виртуальной машины Java 21 (${quest.fileName})...\n`;

  if (state.currentQuestKey === "calc" && state.currentStageIdx === 1) {
    unlockAchievement("input_master");
  }

  advanceInteractiveStep();
}

function advanceInteractiveStep() {
  const quest = QUESTS[state.currentQuestKey];
  const stage = quest.stages[state.currentStageIdx];
  const flow = stage.interactiveFlow;
  const term = document.getElementById("terminal-output");
  const inputForm = document.getElementById("terminal-input-form");
  const inputField = document.getElementById("terminal-input");

  if (!flow || interactiveStep >= flow.length) {
    setTermStatus("EXIT 0", "idle");
    inputForm.classList.add("hidden");
    term.textContent += "\n[Процесс завершился с кодом 0]\n";
    return;
  }

  const stepObj = flow[interactiveStep];

  if (stepObj.skipIf && stepObj.skipIf(interactiveData)) {
    interactiveStep++;
    advanceInteractiveStep();
    return;
  }

  if (stepObj.output) {
    term.textContent += stepObj.output + "\n";
    interactiveStep++;
    advanceInteractiveStep();
    return;
  }

  if (stepObj.prompt) {
    setTermStatus("WAITING", "waiting");
    term.textContent += stepObj.prompt + " ";
    inputForm.classList.remove("hidden");
    inputField.value = "";
    inputField.focus();

    const scrollArea = document.getElementById("terminal-scroll-area");
    if (scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
  }
}

export function handleInteractiveSubmit(e) {
  e.preventDefault();
  audio.playClick();
  const quest = QUESTS[state.currentQuestKey];
  const stage = quest.stages[state.currentStageIdx];
  const flow = stage.interactiveFlow;
  const term = document.getElementById("terminal-output");
  const inputField = document.getElementById("terminal-input");

  const val = inputField.value.trim();
  term.textContent += val + "\n";

  const stepObj = flow[interactiveStep];
  if (stepObj.key) interactiveData[stepObj.key] = val;
  if (stepObj.onDone) {
    const res = stepObj.onDone(interactiveData);
    if (res) term.textContent += res + "\n";
  }

  interactiveStep++;
  advanceInteractiveStep();
}