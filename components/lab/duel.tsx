"use client";

import { motion, useAnimationControls, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useMentor } from "@/lib/ai/client";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/cn";
import {
  answer,
  DUEL_SECONDS,
  type DuelQuestion,
  type DuelState,
  isLastStep,
  next,
  startDuel,
  type Verdict,
  verdict,
} from "@/lib/game/duel";
import { duelFinished } from "@/lib/game/events";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

const ORAL_EXAM =
  "Сыграй строгого преподавателя Java и задай мне один трудный устный вопрос с подвохом по этому этапу. Дождись моего ответа и оцени его.";

const VERDICTS: Record<Verdict, { title: string; tone: string }> = {
  "knocked-out": { title: "Незачёт: нервы на нуле", tone: "text-danger" },
  excellent: { title: "Профессор повержен. Оценка 5", tone: "text-success" },
  good: { title: "Профессор устоял. Оценка 4", tone: "text-gold" },
  fail: { title: "Незачёт. Оценка 2", tone: "text-danger" },
};

function subtitle(result: Verdict, mistakes: number): string {
  if (result === "knocked-out") return `Ошибок: ${mistakes}. Профессор выставил тебя с защиты досрочно.`;
  if (result === "excellent") return "Зачётка подписана без единого вопроса.";
  if (result === "good") return `Защита зачтена с замечаниями, ошибок: ${mistakes}.`;
  return "Профессор отправил учить теорию заново.";
}

function HpBar({ label, hp, tone }: { label: string; hp: number; tone: "boss" | "player" }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 flex justify-between font-mono text-[11px] tracking-widest text-muted uppercase">
        <span>{label}</span>
        <span className="tabular-nums">{hp} HP</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-card-hover">
        <div
          className={cn(
            "h-full origin-left rounded-full motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-snappy",
            tone === "boss" ? (hp <= 25 ? "bg-danger" : hp <= 50 ? "bg-gold" : "bg-accent") : "bg-success",
          )}
          style={{ transform: `scaleX(${hp / 100})` }}
        />
      </div>
    </div>
  );
}

/**
 * Защита у профессора: вопросы на время, верный ответ бьёт по HP профессора, ошибка — по нервам студента.
 * Нервы обнуляются ровно тогда, когда незачёт уже неизбежен (правило из lib/game/duel.ts).
 */
export function Duel({ questions }: { questions: DuelQuestion[] }) {
  const [duel, setDuel] = useState<DuelState | null>(null);
  const [left, setLeft] = useState(DUEL_SECONDS);
  const startedAt = useRef(0);
  const hud = useAnimationControls();
  const reduceMotion = useReducedMotion();
  const nextButton = useRef<HTMLButtonElement>(null);

  const respond = useCallback(
    (choice: number | null) => {
      if (!duel || duel.phase !== "question") return;
      const seconds = Math.min(DUEL_SECONDS, Math.round((performance.now() - startedAt.current) / 1000));
      const after = answer(duel, choice, seconds);
      setDuel(after);
      if (after.last?.right) {
        if (after.last.crit) sound.critHit();
        else sound.bossHit();
      } else {
        sound.error();
        if (!reduceMotion) void hud.start({ x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.3 } });
      }
    },
    [duel, hud, reduceMotion],
  );

  // Таймер вопроса: отсчёт от момента показа, по нулю засчитывается ошибка
  const questionIndex = duel?.phase === "question" ? duel.index : -1;
  useEffect(() => {
    if (questionIndex < 0) return;
    startedAt.current = performance.now();
    setLeft(DUEL_SECONDS);
    const id = setInterval(() => {
      const remaining = DUEL_SECONDS - Math.floor((performance.now() - startedAt.current) / 1000);
      setLeft(Math.max(0, remaining));
    }, 250);
    return () => clearInterval(id);
  }, [questionIndex]);

  useEffect(() => {
    if (left === 0 && duel?.phase === "question") respond(null);
  }, [left, duel?.phase, respond]);

  // Ответ цифрой 1–4 с клавиатуры
  useEffect(() => {
    if (duel?.phase !== "question") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const index = Number.parseInt(e.key, 10) - 1;
      if (index >= 0 && index < duel.questions[duel.index].options.length) respond(index);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [duel, respond]);

  useEffect(() => {
    if (duel?.phase === "feedback") nextButton.current?.focus();
  }, [duel?.phase]);

  const advance = () => {
    if (!duel) return;
    const after = next(duel);
    setDuel(after);
    if (after.phase === "summary") {
      const result = verdict(after).verdict;
      if (result === "excellent") sound.success();
      else if (result !== "good") sound.error();
      duelFinished(result);
    }
  };

  const begin = () => {
    sound.click();
    setDuel(startDuel(questions));
  };

  if (!duel) {
    return (
      <div className="flex flex-col gap-4">
        <p className="font-mono text-xs tracking-widest text-gold uppercase">Босс-файт сессии</p>
        <h2 className="font-display text-lg font-semibold">Защита у профессора Душнова</h2>
        <p className="leading-relaxed text-text/90">
          Верный ответ бьёт по профессору, ответ быстрее 5 секунд — критический удар. Ошибка или истёкшие {DUEL_SECONDS}{" "}
          секунд бьют по твоим нервам: обнулятся — незачёт.
        </p>
        {questions.length > 1 && (
          <p className="text-sm text-muted">
            Вопросов: {questions.length}. Первый по этому этапу, остальные по прошлым этапам квеста. Отвечать можно
            цифрами 1–4.
          </p>
        )}
        <div>
          <Button onClick={begin} size="lg">
            Бросить вызов
          </Button>
        </div>
      </div>
    );
  }

  if (duel.phase === "summary") {
    const { verdict: result, percent } = verdict(duel);
    const view = VERDICTS[result];
    return (
      <div className="flex flex-col gap-4 starting:opacity-0 motion-safe:transition-opacity motion-safe:duration-300">
        <p className="font-mono text-xs tracking-widest text-muted uppercase">
          Итог: {duel.correct} из {duel.questions.length} ({percent}%)
        </p>
        <h2 className={cn("font-display text-lg font-semibold", view.tone)}>{view.title}</h2>
        <p className="text-text/90">{subtitle(result, duel.mistakes.length)}</p>
        {duel.mistakes.length > 0 && (
          <div className="rounded-md border border-border bg-card p-4">
            <p className="mb-2 text-sm font-medium">Повтори перед пересдачей:</p>
            <ul className="flex flex-col gap-3 text-sm">
              {duel.mistakes.map((q) => (
                <li key={q.q}>
                  <p className="text-muted">{q.q}</p>
                  <p className="mt-0.5 text-gold">{q.advice}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={begin}>
            Ещё раз
          </Button>
          {result === "excellent" && (
            <Button variant="ghost" onClick={() => useMentor.getState().show(ORAL_EXAM)}>
              Устный допрос у AI-профессора
            </Button>
          )}
        </div>
        <details className="rounded-md border border-border">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Разбор всех вопросов</summary>
          <ol className="flex flex-col gap-3 px-4 pb-4 text-sm">
            {duel.questions.map((q, i) => (
              <li key={q.q}>
                <p className="font-medium">
                  {i + 1}. {q.q}
                </p>
                <p className="mt-1">
                  <span className="text-muted">Ответ:</span> {q.options[q.correct]}
                </p>
                <p className="mt-1 text-muted">{q.explain}</p>
              </li>
            ))}
          </ol>
        </details>
      </div>
    );
  }

  const question = duel.questions[duel.index];
  const last = duel.last;
  const feedback = duel.phase === "feedback";

  return (
    <div className="flex flex-col gap-4">
      <motion.div
        animate={hud}
        className={cn(
          "flex gap-4 rounded-md border bg-card p-3 transition-colors duration-300",
          last?.crit ? "border-gold" : "border-border",
        )}
      >
        <HpBar label="Профессор" hp={duel.bossHp} tone="boss" />
        <HpBar label="Твои нервы" hp={duel.playerHp} tone="player" />
      </motion.div>

      <div className="flex items-center justify-between font-mono text-xs text-muted">
        <span>
          Вопрос {duel.index + 1} из {duel.questions.length}
        </span>
        <span className={cn("tabular-nums", !feedback && left <= 5 && "text-danger")} aria-live="off">
          {feedback ? "" : `⏱ ${left} с`}
        </span>
      </div>

      <p className="font-medium leading-relaxed">{question.q}</p>

      <div className="flex flex-col gap-2">
        {question.options.map((option, i) => {
          const isCorrect = i === question.correct;
          const isChosen = last?.choice === i;
          return (
            <button
              key={option}
              type="button"
              disabled={feedback}
              onClick={() => respond(i)}
              className={cn(
                "flex items-start gap-3 rounded-md border px-4 py-3 text-left text-sm transition-[background-color,border-color,transform] duration-150 ease-snappy active:scale-[0.99] motion-reduce:active:scale-100",
                !feedback && "border-border bg-card hover:border-border-strong hover:bg-card-hover",
                feedback && isCorrect && "border-success bg-success/10",
                feedback && isChosen && !isCorrect && "border-danger bg-danger/10",
                feedback && !isCorrect && !isChosen && "border-border opacity-60",
              )}
            >
              <span className="font-mono text-xs text-muted">{LETTERS[i]}</span>
              <span>{option}</span>
            </button>
          );
        })}
      </div>

      {feedback && last && (
        <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4 text-sm starting:opacity-0 motion-safe:transition-opacity motion-safe:duration-200">
          <output
            className={cn("block font-medium", last.right ? (last.crit ? "text-gold" : "text-success") : "text-danger")}
          >
            {last.right
              ? last.crit
                ? `⚡ Критический удар! −${last.damage} HP, ответ за ${last.seconds} с.`
                : `✓ Верно, −${last.damage} HP профессору.`
              : last.choice === null
                ? "⏱ Время вышло: на защите отвечают быстро."
                : "✗ Неверно. Замечание в лист защиты."}
            {last.knockedOut && " Нервы на нуле: профессор ставит незачёт."}
          </output>
          <p className="leading-relaxed text-text/90">
            <span className="font-medium">Разбор: </span>
            {question.explain}
          </p>
          <div>
            <Button ref={nextButton} onClick={advance}>
              {isLastStep(duel) ? "К итогам →" : "Следующий вопрос →"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
