"use client";

import { type CSSProperties, useEffect, useId, useRef, useState } from "react";
import s from "./code-deck.module.css";

/** checking — код ушёл на проверку, ok и bad — ответ сервера */
export type CodeVerdict = "checking" | "ok" | "bad" | null;

type CodeDeckProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  length?: number;
  verdict?: CodeVerdict;
  hint?: string;
};

/**
 * Карта в веере, как в руке: наклон растёт от середины к краям, крайние карты ниже.
 * --i задаёт очередь, в которой карты отвечают на вердикт
 */
function fanStyle(index: number, length: number): CSSProperties {
  const offset = index - (length - 1) / 2;
  return {
    "--tilt": `${offset * 4}deg`,
    "--drop": `${offset * offset * 1.5}px`,
    "--i": index,
  } as CSSProperties;
}

/** Контур карты в координатах viewBox 30×40: карта всегда 3:4, поэтому скругление совпадает с CSS */
function Edge() {
  const rect = { x: 1, y: 1, width: 28, height: 38, rx: 4.5, pathLength: 100 } as const;
  return (
    <svg className={s.edge} viewBox="0 0 30 40" preserveAspectRatio="none" aria-hidden="true">
      <rect {...rect} className={s.trace} />
      <rect {...rect} className={s.comet} />
    </svg>
  );
}

/**
 * Код из письма колодой карт. Вводит одно настоящее поле поверх карт: ввод цифрами, вставка кода целиком,
 * автоподстановка кода из письма (one-time-code), Enter отправляет форму. Карты только рисуют его значение,
 * поэтому экранный диктор слышит обычное поле с подписью
 */
export function CodeDeck({ label, value, onChange, length = 6, verdict = null, hint }: CodeDeckProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const input = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [caret, setCaret] = useState({ from: 0, to: 0 });

  // Шаг с кодом открывается после отправки письма: фокус сразу в поле, а не на исчезнувшей кнопке
  useEffect(() => input.current?.focus(), []);

  const syncCaret = () => {
    const el = input.current;
    if (!el) return;
    const end = el.value.length;
    setCaret({ from: el.selectionStart ?? end, to: el.selectionEnd ?? end });
  };

  // Щелчок по любой карте продолжает ввод с конца: символы в поле прозрачные, и место щелчка
  // не совпадает с картой под пальцем
  const caretToEnd = () => {
    const el = input.current;
    if (!el) return;
    el.setSelectionRange(el.value.length, el.value.length);
    syncCaret();
  };

  const active = (index: number) => {
    if (!focused || verdict) return false;
    if (caret.from !== caret.to) return index >= caret.from && index < caret.to;
    return index === Math.min(caret.from, length - 1);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div
        className={s.deck}
        style={{ "--n": length } as CSSProperties}
        data-verdict={verdict ?? undefined}
        data-focused={focused ? "" : undefined}
      >
        {Array.from({ length }, (_, index) => {
          const digit = value[index];
          return (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: карты не переставляются, позиция цифры и есть ключ
              key={index}
              className={s.card}
              style={fanStyle(index, length)}
              data-filled={digit ? "" : undefined}
              data-active={active(index) ? "" : undefined}
              aria-hidden="true"
            >
              {digit ? (
                <>
                  <span className={s.corner}>{digit}</span>
                  <span className={s.digit}>{digit}</span>
                  <span className={s.corner} data-bottom="">
                    {digit}
                  </span>
                  <Edge />
                </>
              ) : (
                <span className={s.pip} />
              )}
            </div>
          );
        })}
        <input
          ref={input}
          id={id}
          name="code"
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern={`\\d{${length}}`}
          spellCheck={false}
          value={value}
          readOnly={verdict === "checking"}
          aria-invalid={verdict === "bad" || undefined}
          aria-describedby={hintId}
          // Вставка «Код: 123 456» тоже работает: остаются только цифры. maxLength не ставим —
          // браузер обрезал бы вставку с пробелом раньше, чем мы уберём лишнее
          onChange={(event) => {
            onChange(event.target.value.replace(/\D/g, "").slice(0, length));
            requestAnimationFrame(syncCaret);
          }}
          onSelect={syncCaret}
          onFocus={() => {
            setFocused(true);
            requestAnimationFrame(caretToEnd);
          }}
          onBlur={() => setFocused(false)}
          onPointerUp={caretToEnd}
          className={s.input}
        />
      </div>
      {hint && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
