"use client";

import { Table2 } from "lucide-react";
import { type KeyboardEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { niceTicks } from "./model";
import s from "./overview.module.css";

// Графики вкладки «Обзор» на SVG без библиотек (правила — скилл dataviz): тонкие метки, линии 2px,
// столбцы не толще 24px со скруглённым концом, сетка — волосяные линии. Подсказка на наведение и на стрелки
// клавиатуры; у каждого графика есть таблица с теми же числами

/** Ширина контейнера: SVG рисуется в настоящих пикселях, без растяжения текста */
function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

const PAD = { top: 14, right: 34, bottom: 26, left: 34 };

export type Series = {
  key: string;
  label: string;
  /** Класс цвета из overview.module.css: s.seriesActive и т. п. */
  tone: string;
  values: number[];
};

/** Сетка и подписи осей: горизонтальные волосяные линии на «круглых» значениях, даты внизу */
function Axes({
  width,
  height,
  ticks,
  y,
  xLabels,
}: {
  width: number;
  height: number;
  ticks: number[];
  y: (v: number) => number;
  xLabels: { x: number; text: string; anchor: "start" | "middle" | "end" }[];
}) {
  return (
    <g className={s.axis}>
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={PAD.left} x2={width - PAD.right} y1={y(tick)} y2={y(tick)} className={s.grid} />
          <text x={PAD.left - 8} y={y(tick)} dy="0.32em" textAnchor="end">
            {tick.toLocaleString("ru-RU")}
          </text>
        </g>
      ))}
      {xLabels.map((label) => (
        <text key={label.x} x={label.x} y={height - 6} textAnchor={label.anchor}>
          {label.text}
        </text>
      ))}
    </g>
  );
}

/** Подписи дат: первая, последняя и несколько между ними — сколько влезает без наложения */
function pickXLabels(count: number, x: (i: number) => number, text: (i: number) => string, width: number) {
  if (count === 0) return [];
  const room = Math.max(1, Math.floor((width - PAD.left - PAD.right) / 72));
  const step = Math.max(1, Math.ceil((count - 1) / room));
  const picked: number[] = [];
  for (let i = 0; i < count; i += step) picked.push(i);
  if (picked.at(-1) !== count - 1) {
    // Последняя дата важнее соседней: убираем предпоследнюю, если они наезжают
    if (picked.length > 1 && x(count - 1) - x(picked.at(-1) as number) < 64) picked.pop();
    picked.push(count - 1);
  }
  return picked.map((i) => ({
    x: x(i),
    text: text(i),
    anchor: (count === 1 ? "middle" : i === 0 ? "start" : i === count - 1 ? "end" : "middle") as
      | "start"
      | "middle"
      | "end",
  }));
}

/** Подсказка: значение крупно, название серии мельче, ключ — короткая линия цвета серии */
function Tooltip({ x, width, title, rows }: { x: number; width: number; title: string; rows: TooltipRow[] }) {
  const left = Math.min(Math.max(x, 84), width - 84);
  return (
    <output className={s.tooltip} style={{ left }}>
      <p className="text-xs text-muted">{title}</p>
      {rows.map((row) => (
        <p key={row.label} className="flex items-center gap-2 text-sm">
          <span className={cn(s.key, row.tone)} aria-hidden="true" />
          <strong className="font-semibold text-text tabular-nums">{row.value.toLocaleString("ru-RU")}</strong>
          <span className="text-muted">{row.label}</span>
        </p>
      ))}
    </output>
  );
}

type TooltipRow = { label: string; value: number; tone: string };

/** Стрелки двигают выбранную точку, Home и End — к краям; Escape убирает подсказку */
function useKeyboardIndex(count: number, active: number | null, setActive: (i: number | null) => void) {
  return (event: KeyboardEvent) => {
    const current = active ?? count - 1;
    const next =
      event.key === "ArrowLeft"
        ? current - 1
        : event.key === "ArrowRight"
          ? current + 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? count - 1
              : null;
    if (event.key === "Escape") return setActive(null);
    if (next === null) return;
    event.preventDefault();
    setActive(Math.min(count - 1, Math.max(0, next)));
  };
}

type ChartProps = {
  labels: string[];
  /** Подпись точки в подсказке: «1 окт» или «неделя с 29 сен» */
  title: (index: number) => string;
  /** Короткая подпись под осью */
  tick: (index: number) => string;
  ariaLabel: string;
  height?: number;
};

/** Линии по времени: перекрестие ищет ближайшую дату, подсказка показывает все серии сразу */
export function LineChart({ labels, series, title, tick, ariaLabel, height = 220 }: ChartProps & { series: Series[] }) {
  const [ref, width] = useWidth();
  const [active, setActive] = useState<number | null>(null);
  const onKeyDown = useKeyboardIndex(labels.length, active, setActive);
  const count = labels.length;
  const max = Math.max(0, ...series.flatMap((one) => one.values));
  const ticks = niceTicks(max);
  const top = ticks.at(-1) ?? 1;
  const plotW = Math.max(1, width - PAD.left - PAD.right);
  const plotH = height - PAD.top - PAD.bottom;
  const x = (i: number) => (count <= 1 ? PAD.left + plotW / 2 : PAD.left + (i * plotW) / (count - 1));
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH;

  const pick = (clientX: number) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box || count === 0) return;
    const ratio = count <= 1 ? 0 : (clientX - box.left - PAD.left) / plotW;
    setActive(Math.min(count - 1, Math.max(0, Math.round(ratio * (count - 1)))));
  };

  // Значение у конца линии; если концы ближе 14px, подписи наедут друг на друга — тогда только легенда
  const ends = series.map((one) => ({ one, at: y(one.values.at(-1) ?? 0) }));
  const endsApart = ends.every((a, i) => ends.every((b, j) => i === j || Math.abs(a.at - b.at) >= 14));

  return (
    <div ref={ref} className="relative" style={{ height }}>
      {width > 0 && (
        <>
          <svg width={width} height={height} aria-hidden="true" className="block">
            <Axes width={width} height={height} ticks={ticks} y={y} xLabels={pickXLabels(count, x, tick, width)} />
            {active !== null && (
              <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={PAD.top + plotH} className={s.crosshair} />
            )}
            {series.map((one) => (
              <g key={one.key} className={one.tone}>
                <path
                  className={s.line}
                  d={one.values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("")}
                />
                {count > 0 && <circle cx={x(count - 1)} cy={y(one.values.at(-1) ?? 0)} r={4} className={s.dot} />}
                {active !== null && <circle cx={x(active)} cy={y(one.values[active] ?? 0)} r={4} className={s.dot} />}
                {endsApart && count > 0 && (
                  <text x={x(count - 1) + 8} y={y(one.values.at(-1) ?? 0)} dy="0.32em" className={s.endLabel}>
                    {(one.values.at(-1) ?? 0).toLocaleString("ru-RU")}
                  </text>
                )}
              </g>
            ))}
          </svg>
          {active !== null && (
            <Tooltip
              x={x(active)}
              width={width}
              title={title(active)}
              rows={series.map((one) => ({ label: one.label, value: one.values[active] ?? 0, tone: one.tone }))}
            />
          )}
          {/* Поверх графика — одна цель для мыши, пальца и клавиатуры: попадать в линию 2px не нужно */}
          <div
            className={s.hit}
            role="img"
            aria-label={`${ariaLabel}. Стрелки влево и вправо показывают значения по датам.`}
            // biome-ignore lint/a11y/noNoninteractiveTabindex: стрелками с клавиатуры листаются точки графика
            tabIndex={0}
            onPointerMove={(event) => pick(event.clientX)}
            onPointerDown={(event) => pick(event.clientX)}
            onPointerLeave={() => setActive(null)}
            onBlur={() => setActive(null)}
            onKeyDown={onKeyDown}
          />
        </>
      )}
    </div>
  );
}

/** Скруглённый только сверху столбец: у основания угол прямой, конец данных — 4px */
function columnPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

/** Столбцы одной серии: у каждого столбца своя подсказка, самый высокий подписан */
export function ColumnChart({
  labels,
  values,
  label,
  tone,
  title,
  tick,
  ariaLabel,
  height = 200,
}: ChartProps & { values: number[]; label: string; tone: string }) {
  const [ref, width] = useWidth();
  const [active, setActive] = useState<number | null>(null);
  const onKeyDown = useKeyboardIndex(labels.length, active, setActive);
  const count = labels.length;
  const max = Math.max(0, ...values);
  const ticks = niceTicks(max);
  const top = ticks.at(-1) ?? 1;
  const plotW = Math.max(1, width - PAD.left - PAD.right);
  const plotH = height - PAD.top - PAD.bottom;
  const slot = plotW / Math.max(1, count);
  // Между столбцами — зазор цвета фона в 2px, толщина не больше 24px
  const barW = Math.max(1, Math.min(24, slot - 2));
  const x = (i: number) => PAD.left + i * slot + (slot - barW) / 2;
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH;
  const peak = values.indexOf(max);

  const pick = (clientX: number) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box || count === 0) return;
    setActive(Math.min(count - 1, Math.max(0, Math.floor((clientX - box.left - PAD.left) / slot))));
  };

  return (
    <div ref={ref} className="relative" style={{ height }}>
      {width > 0 && (
        <>
          <svg width={width} height={height} aria-hidden="true" className="block">
            <Axes
              width={width}
              height={height}
              ticks={ticks}
              y={y}
              xLabels={pickXLabels(count, (i) => x(i) + barW / 2, tick, width)}
            />
            <g className={tone}>
              {values.map((v, i) =>
                v > 0 ? (
                  <path
                    // biome-ignore lint/suspicious/noArrayIndexKey: столбец — это день или неделя, порядок постоянный
                    key={i}
                    d={columnPath(x(i), y(v), barW, PAD.top + plotH - y(v))}
                    className={cn(s.bar, active === i && s.barActive)}
                  />
                ) : null,
              )}
              {max > 0 && (
                <text x={x(peak) + barW / 2} y={y(max) - 6} textAnchor="middle" className={s.endLabel}>
                  {max.toLocaleString("ru-RU")}
                </text>
              )}
            </g>
          </svg>
          {active !== null && (
            <Tooltip
              x={x(active) + barW / 2}
              width={width}
              title={title(active)}
              rows={[{ label, value: values[active] ?? 0, tone }]}
            />
          )}
          <div
            className={s.hit}
            role="img"
            aria-label={`${ariaLabel}. Стрелки влево и вправо показывают значения по датам.`}
            // biome-ignore lint/a11y/noNoninteractiveTabindex: стрелками с клавиатуры листаются столбцы графика
            tabIndex={0}
            onPointerMove={(event) => pick(event.clientX)}
            onPointerDown={(event) => pick(event.clientX)}
            onPointerLeave={() => setActive(null)}
            onBlur={() => setActive(null)}
            onKeyDown={onKeyDown}
          />
        </>
      )}
    </div>
  );
}

/** Легенда: у линий ключ — линия, у столбцов и полос — прямоугольник, как сами метки */
export function Legend({ items }: { items: { label: string; tone: string; shape: "line" | "rect" }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <span className={cn(item.shape === "line" ? s.key : s.swatch, item.tone)} aria-hidden="true" />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/** Карточка графика: заголовок, легенда, переключатель на таблицу с теми же числами */
export function ChartCard({
  title,
  hint,
  legend,
  table,
  children,
}: {
  title: string;
  hint?: string;
  legend?: ReactNode;
  table: ReactNode;
  children: ReactNode;
}) {
  const [asTable, setAsTable] = useState(false);
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h3 id={titleId} className="font-display text-base font-semibold">
            {title}
          </h3>
          {hint && <p className="text-xs text-muted">{hint}</p>}
        </div>
        <button
          type="button"
          aria-pressed={asTable}
          onClick={() => setAsTable((v) => !v)}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-2.5 text-sm text-muted transition-colors duration-150 ease-snappy hover:text-text aria-pressed:bg-card aria-pressed:text-text"
        >
          <Table2 className="size-4" aria-hidden="true" />
          Таблица
        </button>
      </div>
      {legend}
      {asTable ? (
        // Прокрутку таблицы листают и с клавиатуры: область получает фокус
        // biome-ignore lint/a11y/noNoninteractiveTabindex: прокручиваемая область должна принимать фокус (WCAG 2.1.1)
        <section aria-label={`${title}: таблица`} tabIndex={0} className="max-h-80 overflow-auto rounded-lg">
          {table}
        </section>
      ) : (
        children
      )}
    </section>
  );
}
