"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Confetti } from "@/components/game/confetti";
import { Markdown } from "@/components/markdown";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button, ButtonLink, buttonClasses } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useMentor } from "@/lib/ai/client";
import { cn } from "@/lib/cn";
import type { QuestOutline } from "@/lib/content/outline";
import type { Stage } from "@/lib/content/schema";
import type { DuelQuestion } from "@/lib/game/duel";
import { checkFinished, runFinished } from "@/lib/game/events";
import type { XpPart } from "@/lib/game/xp";
import { EngineRestartedError, getEngine, useEngine } from "@/lib/java/engine";
import { type Diagnostic, ioInputs, judge } from "@/lib/java/judge";
import { isQuestCompleted, isStagePassed, isStageUnlocked, nextStage } from "@/lib/progress/selectors";
import { useProgress, useProgressHydrated } from "@/lib/progress/store";
import { SOLUTION_UNLOCK_ATTEMPTS, stageKey } from "@/lib/progress/types";
import { CodeEditor, type CodeEditorHandle } from "./code-editor";
import { Duel } from "./duel";
import { EngineStatus } from "./engine-status";
import { LabStatus } from "./lab-status";
import { LoopTracer } from "./loop-tracer";
import { MemoryView } from "./memory-view";
import { Mentor, type MentorContext } from "./mentor";
import { Quiz } from "./quiz";
import { type Outcome, ResultsPanel } from "./results-panel";

export type LabStage = Pick<
  Stage,
  | "id"
  | "title"
  | "badge"
  | "hints"
  | "sampleInput"
  | "quiz"
  | "memory"
  | "loopTracer"
  | "tests"
  | "starter"
  | "solution"
> & {
  /** Вопросы защиты: этого этапа и предыдущих этапов квеста */
  duel: DuelQuestion[];
};

type Props = {
  course: QuestOutline[];
  questId: string;
  stageIndex: number;
  stage: LabStage;
  theory: ReactNode;
  pitfalls: ReactNode;
};

type TabId = "theory" | "pitfalls" | "quiz" | "duel" | "memory";

const stageHref = (questId: string, stageId: string) => `/learn/${questId}/${stageId}`;

export function Lab({ course, questId, stageIndex, stage, theory, pitfalls }: Props) {
  const quest = course.find((q) => q.id === questId) as QuestOutline;
  const key = stageKey(questId, stage.id);
  const hydrated = useProgressHydrated();
  const progress = useProgress();
  const reduceMotion = useReducedMotion();

  const editor = useRef<CodeEditorHandle>(null);
  const code = useRef(stage.starter);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [tab, setTab] = useState<TabId>("theory");
  const [tabDirection, setTabDirection] = useState(1);
  const [outcome, setOutcome] = useState<Outcome>({ kind: "idle" });
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [stdinOpen, setStdinOpen] = useState(false);
  const [stdin, setStdin] = useState(stage.sampleInput ?? "");
  const [hintOpen, setHintOpen] = useState(false);
  const [hintStep, setHintStep] = useState(0);
  const [cheatOpen, setCheatOpen] = useState(false);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [editorVersion, setEditorVersion] = useState(0);
  /** Этой сдачей закрыт весь квест: редкий момент, его отмечаем громче обычного */
  const [questClosed, setQuestClosed] = useState(false);
  /** Из чего сложился опыт за первую сдачу: показываем в панели «Этап сдан» */
  const [passXp, setPassXp] = useState<XpPart[] | null>(null);

  const saved = progress.stages[key];
  const passed = isStagePassed(progress, questId, stage.id);
  const unlocked = isStageUnlocked(progress, course, quest, stageIndex);
  const attempts = saved?.attempts.length ?? 0;
  const solutionUnlocked = passed || attempts >= SOLUTION_UNLOCK_ATTEMPTS;
  const busy = outcome.kind === "running";

  // Ментору уходит код и результат последней проверки: реальные ошибки компилятора и непройденные тесты
  const outcomeRef = useRef(outcome);
  outcomeRef.current = outcome;
  const mentorContext = useCallback((): MentorContext => {
    const last = outcomeRef.current;
    const cut = (text: string | undefined) => text?.slice(0, 2000);
    return {
      code: code.current,
      compileErrors:
        last.kind === "compile-error"
          ? last.compile.diagnostics
              .filter((d) => d.severity === "error")
              .slice(0, 20)
              .map((d) => ({ line: d.line, message: d.message.slice(0, 500) }))
          : [],
      failedTests:
        last.kind === "checked"
          ? last.verdicts
              .filter((v) => !v.passed)
              .slice(0, 10)
              .map((v) => ({
                name: v.name,
                status: v.status,
                message: v.message?.slice(0, 500),
                expected: cut(v.expected),
                actual: cut(v.actual),
              }))
          : last.kind === "ran" && last.run.status !== "ok"
            ? [
                {
                  name: "Запуск с вводом",
                  status: last.run.status,
                  message: cut(last.run.error),
                  actual: cut(last.run.stdout),
                },
              ]
            : [],
    };
  }, []);

  const tabs = useMemo(() => {
    const list: { id: TabId; label: string }[] = [
      { id: "theory", label: "Теория" },
      { id: "pitfalls", label: "Грабли" },
      { id: "quiz", label: "Квиз" },
      { id: "duel", label: "Защита" },
    ];
    if (stage.memory) list.push({ id: "memory", label: "Память" });
    return list;
  }, [stage.memory]);

  // Движок прогревается, пока студент читает теорию
  useEffect(() => {
    getEngine()
      .start()
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (hydrated && unlocked) useProgress.getState().openStage(key);
  }, [hydrated, unlocked, key]);

  const onCodeChange = useCallback(
    (next: string) => {
      code.current = next;
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => useProgress.getState().saveCode(key, next), 400);
    },
    [key],
  );

  const runCheck = useCallback(async () => {
    if (busy) return;
    const source = code.current;
    const store = useProgress.getState();
    store.saveCode(key, source);
    store.recordAttempt(key, source);
    setOutcome({ kind: "running", mode: "check", cold: useEngine.getState().status !== "ready" });
    setQuestClosed(false);
    setPassXp(null);
    try {
      const { compile, runs } = await getEngine().check(quest.fileName, source, ioInputs(stage.tests));
      setDiagnostics(compile.diagnostics);
      if (!compile.compiled) {
        checkFinished(key, source, false);
        setOutcome(
          compile.fatal && compile.diagnostics.length === 0
            ? { kind: "engine-error", message: `Не удалось подготовить программу к запуску: ${compile.fatal}` }
            : { kind: "compile-error", compile },
        );
        return;
      }
      const verdicts = judge(stage.tests, source, runs);
      const allPassed = verdicts.every((v) => v.passed);
      const result = checkFinished(key, source, allPassed);
      if (result?.firstPass) {
        setPassXp(result.parts);
        setQuestClosed(isQuestCompleted(useProgress.getState(), quest));
      }
      setOutcome({ kind: "checked", verdicts, passed: allPassed });
    } catch (error) {
      setOutcome({
        kind: "engine-error",
        message:
          error instanceof EngineRestartedError
            ? "Программа зависла, и Java пришлось перезапустить. Проверь условия выхода из циклов и нажми «Проверить» ещё раз."
            : `Java-движок не ответил: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }, [busy, key, quest, stage.tests]);

  const runWithInput = useCallback(async () => {
    if (busy) return;
    const source = code.current;
    useProgress.getState().saveCode(key, source);
    setOutcome({ kind: "running", mode: "run", cold: useEngine.getState().status !== "ready" });
    try {
      const { compile, runs } = await getEngine().check(quest.fileName, source, [stdin]);
      setDiagnostics(compile.diagnostics);
      if (!compile.compiled) return setOutcome({ kind: "compile-error", compile });
      setOutcome({ kind: "ran", run: runs[0], stdin });
      runFinished(source, stdin, runs[0]);
    } catch (error) {
      setOutcome({ kind: "engine-error", message: error instanceof Error ? error.message : String(error) });
    }
  }, [busy, key, quest.fileName, stdin]);

  // Один дочерний элемент вместо списка условий: теория приходит с сервера готовыми элементами
  const panel =
    tab === "theory" ? (
      theory
    ) : tab === "pitfalls" ? (
      pitfalls
    ) : tab === "quiz" ? (
      <Quiz quiz={stage.quiz} stageKey={key} />
    ) : tab === "duel" ? (
      <Duel questions={stage.duel} />
    ) : stage.memory ? (
      <MemoryView memory={stage.memory} />
    ) : null;

  const switchTab = (next: TabId) => {
    const from = tabs.findIndex((t) => t.id === tab);
    const to = tabs.findIndex((t) => t.id === next);
    setTabDirection(to >= from ? 1 : -1);
    setTab(next);
  };

  // Подсказки открываются по одной: сначала направление мысли, в конце — почти готовый код
  const hintTotal = stage.hints.length;
  const showHint = () => {
    if (hintStep === 0) useProgress.getState().markHint(key);
    if (hintOpen || hintStep === 0) setHintStep((s) => Math.min(s + 1, hintTotal));
    setHintOpen(true);
  };

  const openSolution = () => {
    if (!solutionUnlocked) return;
    useProgress.getState().viewSolution(key);
    setSolutionOpen(true);
  };

  const toggleCheat = () => {
    if (!cheatOpen) useProgress.getState().takeCheat(key);
    setCheatOpen((v) => !v);
  };

  const resetCode = () => {
    code.current = stage.starter;
    useProgress.getState().saveCode(key, stage.starter);
    setDiagnostics([]);
    setOutcome({ kind: "idle" });
    setConfirmReset(false);
    setEditorVersion((v) => v + 1);
  };

  const next = quest.stages[stageIndex + 1];
  const prev = quest.stages[stageIndex - 1];
  const nextUnlocked = next ? isStageUnlocked(progress, course, quest, stageIndex + 1) : false;
  const continueTo = hydrated ? nextStage(progress, course) : null;

  const success = (
    <div className="relative flex flex-col gap-3 rounded-lg border border-success/40 bg-success/10 p-4 starting:opacity-0 starting:motion-safe:translate-y-1 motion-safe:transition-[opacity,translate] motion-safe:duration-300 motion-safe:ease-snappy">
      {questClosed && <Confetti />}
      <p className="font-display text-base font-semibold text-success">
        {questClosed ? `Квест «${quest.title}» закрыт` : "Этап сдан"}
      </p>
      {questClosed && (
        <p className="text-sm">
          Титул <span className="font-semibold">{quest.rank.title}</span> твой: поставь его в профиль.
        </p>
      )}
      {passXp && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Опыт за этап">
          {passXp.map((part) => (
            <li
              key={part.label}
              className="rounded-full border border-border bg-surface px-2.5 py-0.5 font-mono text-[11px] tabular-nums"
            >
              {part.label}{" "}
              <span className={part.xp < 0 ? "text-danger" : "font-semibold text-text"}>
                {part.xp > 0 ? "+" : ""}
                {part.xp} XP
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        {next ? (
          <ButtonLink href={stageHref(questId, next.id)}>Следующий этап →</ButtonLink>
        ) : (
          <ButtonLink href="/course">Квест пройден: открыть карту курса</ButtonLink>
        )}
      </div>
      {stage.loopTracer && <LoopTracer rows={stage.loopTracer.rows} cols={stage.loopTracer.cols} />}
    </div>
  );

  if (hydrated && !unlocked) {
    return (
      <main id="main" className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-4">
        <p className="font-mono text-xs tracking-widest text-gold uppercase">{stage.badge}</p>
        <h1 className="font-display text-2xl font-semibold">Этап пока закрыт</h1>
        <p className="text-muted">
          Этапы открываются по порядку: сначала сдай предыдущие задания квеста «{quest.title}».
        </p>
        <div className="flex flex-wrap gap-3">
          {continueTo && (
            <ButtonLink href={stageHref(continueTo.questId, continueTo.stageId)}>
              Продолжить с доступного этапа
            </ButtonLink>
          )}
          <ButtonLink href="/course" variant="secondary">
            Карта курса
          </ButtonLink>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col lg:h-dvh">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-3 sm:px-4">
        <Link
          href="/course"
          className={buttonClasses({ variant: "ghost" }, "min-w-11 px-2 sm:min-w-0")}
          aria-label="К карте курса"
        >
          ← <span className="hidden sm:inline">Курс</span>
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-[11px] tracking-widest text-gold uppercase">
            {quest.title} · {stageIndex + 1} из {quest.stages.length}
          </p>
          <h1 className="truncate text-sm font-semibold sm:text-base">{stage.title}</h1>
        </div>
        <nav aria-label="Этапы квеста" className="hidden items-center gap-1 sm:flex">
          {prev ? (
            <Link
              href={stageHref(questId, prev.id)}
              className={buttonClasses({ variant: "ghost" }, "min-w-11 px-2 sm:min-w-0")}
              aria-label="Предыдущий этап"
            >
              ‹
            </Link>
          ) : (
            <span
              className={buttonClasses({ variant: "ghost" }, "min-w-11 px-2 opacity-30 sm:min-w-0")}
              aria-hidden="true"
            >
              ‹
            </span>
          )}
          {next && nextUnlocked ? (
            <Link
              href={stageHref(questId, next.id)}
              className={buttonClasses({ variant: "ghost" }, "min-w-11 px-2 sm:min-w-0")}
              aria-label="Следующий этап"
            >
              ›
            </Link>
          ) : (
            <span
              className={buttonClasses({ variant: "ghost" }, "min-w-11 px-2 opacity-30 sm:min-w-0")}
              title="Сначала сдай этот этап"
            >
              ›
            </span>
          )}
        </nav>
        <LabStatus />
        <div className="hidden md:block">
          <EngineStatus />
        </div>
        <ThemeToggle />
      </header>

      <main
        id="main"
        className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(360px,42%)_minmax(0,1fr)]"
      >
        <section aria-label="Задание" className="flex min-h-0 flex-col border-border lg:border-r">
          <div
            role="tablist"
            aria-label="Материалы этапа"
            className="flex shrink-0 gap-0.5 overflow-x-auto border-b border-border px-2 pt-2 [scrollbar-width:none] sm:gap-1 sm:px-3"
          >
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls="tab-panel"
                onClick={() => switchTab(t.id)}
                className={cn(
                  "relative min-h-11 shrink-0 px-2.5 py-2 text-sm font-medium transition-colors duration-150 ease-snappy sm:min-h-0 sm:px-3",
                  tab === t.id ? "text-text" : "text-muted hover:text-text",
                )}
              >
                {t.label}
                {tab === t.id && (
                  <motion.span
                    layoutId="lab-tab-underline"
                    className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent"
                    transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.23, 1, 0.32, 1] }}
                  />
                )}
              </button>
            ))}
          </div>
          <div className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
            <AnimatePresence mode="popLayout" initial={false} custom={tabDirection}>
              <motion.div
                key={tab}
                id="tab-panel"
                role="tabpanel"
                aria-labelledby={`tab-${tab}`}
                custom={tabDirection}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: tabDirection * 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: tabDirection * -16 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                className="p-4 sm:p-5"
              >
                {panel}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        <section aria-label="Код" className="flex min-h-[70dvh] flex-col lg:min-h-0">
          <div className="min-h-[320px] flex-1 border-b border-border bg-code-bg lg:min-h-0">
            {hydrated ? (
              <CodeEditor
                key={`${key}:${editorVersion}`}
                ref={editor}
                initialValue={saved?.code ?? stage.starter}
                onChange={onCodeChange}
                onSubmit={runCheck}
                diagnostics={diagnostics}
                label={`Редактор кода: ${quest.fileName}`}
              />
            ) : (
              <div className="h-full animate-pulse bg-card/40" aria-hidden="true" />
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-border bg-surface px-3 py-2 [scrollbar-width:none] sm:flex-wrap">
            <Button onClick={runCheck} disabled={busy || !hydrated}>
              {busy && outcome.mode === "check" ? "Проверяю…" : "Проверить"}
            </Button>
            <Button variant="secondary" onClick={() => setStdinOpen((v) => !v)} aria-expanded={stdinOpen}>
              Запуск с вводом
            </Button>
            <Button variant="ghost" onClick={() => useMentor.getState().show()}>
              AI-ментор
            </Button>
            <Button
              variant="ghost"
              onClick={showHint}
              disabled={hintOpen && hintStep >= hintTotal}
              aria-expanded={hintOpen}
              aria-controls="lab-hints"
            >
              {hintStep === 0 || !hintOpen
                ? "Подсказка"
                : hintStep < hintTotal
                  ? `Подсказка ${hintStep + 1} из ${hintTotal}`
                  : "Подсказки открыты"}
            </Button>
            <Button
              variant="ghost"
              onClick={toggleCheat}
              title="Один раз на этап: алгоритм без кода, серия сбрасывается"
            >
              Шпора
            </Button>
            <Button
              variant="ghost"
              onClick={openSolution}
              aria-disabled={!solutionUnlocked}
              title={
                solutionUnlocked ? "Эталонное решение" : `Откроется после ${SOLUTION_UNLOCK_ATTEMPTS} разных попыток`
              }
              className={cn(!solutionUnlocked && "cursor-not-allowed opacity-50")}
            >
              Решение{!solutionUnlocked && hydrated ? ` · ${attempts}/${SOLUTION_UNLOCK_ATTEMPTS}` : ""}
            </Button>
            <div className="ml-auto flex items-center gap-2">
              {confirmReset ? (
                <>
                  <span className="text-xs text-muted">Вернуть стартовый код?</span>
                  <Button variant="secondary" onClick={resetCode}>
                    Да
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirmReset(false)}>
                    Нет
                  </Button>
                </>
              ) : (
                <Button variant="ghost" onClick={() => setConfirmReset(true)}>
                  Сбросить
                </Button>
              )}
            </div>
          </div>

          <div className="max-h-[45%] min-h-40 shrink-0 overflow-y-auto bg-bg">
            {stdinOpen && (
              <div className="flex flex-col gap-2 border-b border-border p-4">
                <label htmlFor="stdin" className="text-sm font-medium">
                  Ввод для программы <span className="font-normal text-muted">(то, что прочитает Scanner)</span>
                </label>
                <textarea
                  id="stdin"
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  rows={3}
                  spellCheck={false}
                  className="rounded-md border border-border bg-code-bg p-2 font-mono text-sm"
                />
                <div>
                  <Button variant="secondary" onClick={runWithInput} disabled={busy || !hydrated}>
                    {busy && outcome.mode === "run" ? "Запускаю…" : "Запустить"}
                  </Button>
                </div>
              </div>
            )}
            {hintOpen && hintStep > 0 && (
              <div id="lab-hints" className="border-b border-border p-4 text-sm">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="font-medium">
                    Подсказки: {hintStep} из {hintTotal}
                  </p>
                  <button
                    type="button"
                    onClick={() => setHintOpen(false)}
                    className="text-xs text-muted underline-offset-2 hover:text-text hover:underline"
                  >
                    Скрыть
                  </button>
                </div>
                <ol className="flex flex-col gap-2">
                  {stage.hints.slice(0, hintStep).map((hint, i) => (
                    <li
                      key={hint}
                      className="flex gap-3 starting:opacity-0 motion-safe:transition-opacity motion-safe:duration-200"
                    >
                      <span className="mt-0.5 font-mono text-xs text-accent">{i + 1}</span>
                      <div className="min-w-0 [&_p]:my-0 [&_pre]:my-2">
                        <Markdown>{hint}</Markdown>
                      </div>
                    </li>
                  ))}
                </ol>
                {hintStep < hintTotal && (
                  <p className="mt-2 text-xs text-muted">
                    Не помогло? Нажми «Подсказка» ещё раз — следующий шаг конкретнее.
                  </p>
                )}
              </div>
            )}
            {cheatOpen && (
              <div className="border-b border-border p-4 text-sm">
                <p className="mb-1 font-medium">Шпора старосты</p>
                <p className="text-muted">Серия сброшена. Вот что проверят тесты:</p>
                <ol className="mt-2 list-decimal pl-5">
                  {stage.tests.map((t) => (
                    <li key={t.name}>{t.name}</li>
                  ))}
                </ol>
              </div>
            )}
            <ResultsPanel
              outcome={outcome}
              onReveal={(offset) => editor.current?.revealOffset(offset)}
              success={success}
            />
          </div>
        </section>
      </main>

      <Mentor stageKey={key} getContext={mentorContext} />

      <Dialog open={solutionOpen} onClose={() => setSolutionOpen(false)} title="Эталонное решение">
        <p className="mb-3 text-sm text-muted">Прочитай и закрой. Перепиши решение сам: так оно останется в голове.</p>
        <pre className="overflow-auto rounded-md border border-border bg-code-bg p-4 font-mono text-[13px] leading-relaxed">
          {stage.solution}
        </pre>
      </Dialog>
    </div>
  );
}
