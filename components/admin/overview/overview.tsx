"use client";

import { RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { adminRpc } from "@/lib/admin/client";
import { cn } from "@/lib/cn";
import { ChartCard, ColumnChart, Legend, LineChart } from "./charts";
import { Funnel } from "./funnel";
import { HardStages } from "./hard-stages";
import {
  type ActivityRow,
  type Bucket,
  buildFunnel,
  type CourseIndex,
  delta,
  type FunnelRow,
  type HardStageRow,
  normalizeRows,
  type OverviewStats,
  type Period,
  shortDate,
} from "./model";
import s from "./overview.module.css";

/** Сколько дней без следов — «перестал учиться» */
const IDLE_DAYS = 14;
/** Меньше учеников на этапе — ещё не статистика трудности */
const MIN_STUDENTS = 3;

const PERIODS: Period[] = [7, 30, 90];

type Data = {
  overview: OverviewStats;
  activity: ActivityRow[];
  funnel: FunnelRow[];
  hard: HardStageRow[];
};

/** Без миграции статистики PostgREST не находит функцию: объясняем, что сделать */
function describeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/could not find the function|schema cache/i.test(message)) {
    return "Статистика ещё не подключена: выполните в Supabase → SQL Editor миграцию supabase/migrations/20261001140000_admin_stats.sql.";
  }
  return message || "Не удалось загрузить статистику.";
}

async function load(period: Period, bucket: Bucket, tz: string): Promise<Data> {
  const [overview, activity, funnel, hard] = await Promise.all([
    adminRpc<OverviewStats>("admin_overview", { p_days: period }),
    adminRpc<unknown>("admin_activity", { p_days: period, p_bucket: bucket, p_tz: tz }),
    adminRpc<unknown>("admin_funnel", { p_idle_days: IDLE_DAYS }),
    adminRpc<unknown>("admin_hard_stages", { p_limit: 10, p_min_students: MIN_STUDENTS }),
  ]);
  return {
    overview,
    activity: normalizeRows<ActivityRow>(activity, ["signups", "active", "passed"]),
    funnel: normalizeRows<FunnelRow>(funnel, ["reached", "passed", "here_now", "stuck", "left_after"]),
    hard: normalizeRows<HardStageRow>(hard, [
      "students",
      "passed",
      "fails_total",
      "fails_avg",
      "attempts_avg",
      "hint_used",
      "solution_viewed",
    ]),
  };
}

/** Переключатель из нескольких кнопок: выбранная нажата (aria-pressed) */
function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: { value: T; text: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: (value: T) => boolean;
}) {
  return (
    <fieldset className="inline-flex min-w-0 rounded-xl border border-border bg-surface p-1">
      <legend className="sr-only">{label}</legend>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          disabled={disabled?.(option.value)}
          onClick={() => onChange(option.value)}
          className="h-9 rounded-lg px-3 text-sm font-semibold whitespace-nowrap text-muted transition-colors duration-150 ease-snappy hover:text-text disabled:cursor-not-allowed disabled:opacity-40 aria-pressed:bg-card aria-pressed:text-text aria-pressed:shadow-sm"
        >
          {option.text}
        </button>
      ))}
    </fieldset>
  );
}

/** Плитка: подпись, число, изменение к прошлому периоду. Рост — зелёный со стрелкой, спад — красный */
function StatTile({
  label,
  value,
  current,
  previous,
  note,
}: {
  label: string;
  value: number;
  current?: number;
  previous?: number;
  note: string;
}) {
  const change = current !== undefined && previous !== undefined ? delta(current, previous) : null;
  const up = change?.startsWith("+");
  const down = change?.startsWith("−");
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="text-3xl font-semibold">{value.toLocaleString("ru-RU")}</p>
      <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted">
        {change && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-semibold",
              up && "text-success",
              down && "text-danger",
            )}
          >
            {up && <TrendingUp className="size-3.5" aria-hidden="true" />}
            {down && <TrendingDown className="size-3.5" aria-hidden="true" />}
            {change}
          </span>
        )}
        {note}
      </p>
    </div>
  );
}

function ActivityTable({ rows, label }: { rows: ActivityRow[]; label: (row: ActivityRow) => string }) {
  return (
    <table className="w-full text-left text-sm tabular-nums">
      <thead className="sticky top-0 bg-surface text-xs text-muted">
        <tr className="border-b border-border">
          <th scope="col" className="py-1.5 pr-3 font-medium">
            Дата
          </th>
          <th scope="col" className="py-1.5 pr-3 text-right font-medium">
            Активные
          </th>
          <th scope="col" className="py-1.5 pr-3 text-right font-medium">
            Новые
          </th>
          <th scope="col" className="py-1.5 text-right font-medium">
            Сдано этапов
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.bucket} className="border-b border-border last:border-0">
            <th scope="row" className="py-1.5 pr-3 font-normal">
              {label(row)}
            </th>
            <td className="py-1.5 pr-3 text-right">{row.active}</td>
            <td className="py-1.5 pr-3 text-right">{row.signups}</td>
            <td className="py-1.5 text-right">{row.passed}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Вкладка «Обзор»: плитки, активность по дням или неделям, воронка курса и трудные этапы */
export function Overview({ course }: { course: CourseIndex }) {
  const [period, setPeriod] = useState<Period>(30);
  const [bucket, setBucket] = useState<Bucket>("day");
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  // Дни считаются по часам админа: полночь в Москве, а не в UTC
  const tz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);
  // За неделю делить на недели нечего
  const effectiveBucket: Bucket = period === 7 ? "day" : bucket;

  // biome-ignore lint/correctness/useExhaustiveDependencies: reload — счётчик кнопки «Обновить», он и есть повод перезапроса
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    load(period, effectiveBucket, tz)
      .then((next) => !cancelled && setData(next))
      .catch((e) => !cancelled && setError(describeError(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [period, effectiveBucket, tz, reload]);

  const funnel = useMemo(() => (data ? buildFunnel(course, data.funnel) : []), [course, data]);

  if (!data) {
    if (error) {
      return (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-2xl border border-danger/40 bg-danger/5 p-5"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setReload((n) => n + 1)}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold hover:bg-card"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Повторить
          </button>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <span className="sr-only">Загружаем статистику…</span>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {["students", "active", "passed", "learners"].map((tile) => (
            <div key={tile} className="h-28 animate-pulse rounded-2xl bg-card motion-reduce:animate-none" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-2xl bg-card motion-reduce:animate-none" />
      </div>
    );
  }

  const { overview, activity } = data;
  const per = `за ${period} дней`;
  const week = effectiveBucket === "week";
  const pointTitle = (i: number) => {
    const day = activity[i]?.bucket ?? "";
    return week ? `неделя с ${shortDate(day)}` : shortDate(day);
  };
  const tick = (i: number) => shortDate(activity[i]?.bucket ?? "");
  const updated = new Date(overview.generated_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={cn(s.root, "flex flex-col gap-6")}>
      {/* Фильтры — одной строкой над всем, что они меняют */}
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          label="Период"
          options={PERIODS.map((p) => ({ value: p, text: `${p} дней` }))}
          value={period}
          onChange={setPeriod}
        />
        <Segmented
          label="Шаг графиков"
          options={[
            { value: "day" as Bucket, text: "По дням" },
            { value: "week" as Bucket, text: "По неделям" },
          ]}
          value={effectiveBucket}
          onChange={setBucket}
          disabled={(value) => value === "week" && period === 7}
        />
        <p className="ml-auto flex items-center gap-2 text-xs text-muted">
          <span aria-live="polite">{loading ? "Обновляем…" : `Обновлено в ${updated}`}</span>
          <button
            type="button"
            onClick={() => setReload((n) => n + 1)}
            disabled={loading}
            aria-label="Обновить статистику"
            className="grid size-9 place-items-center rounded-lg border border-border text-muted transition-colors duration-150 ease-snappy hover:text-text disabled:opacity-50"
          >
            <RefreshCw className={cn("size-4", loading && "motion-safe:animate-spin")} aria-hidden="true" />
          </button>
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-danger/40 bg-danger/5 px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <div className={cn("flex flex-col gap-6", loading && s.refreshing)}>
        <section aria-label="Главные числа" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Ученики с аккаунтом"
            value={overview.students}
            current={overview.signups}
            previous={overview.signups_prev}
            note={`новых ${per}: ${overview.signups}`}
          />
          <StatTile
            label={`Активные ${per}`}
            value={overview.active}
            current={overview.active}
            previous={overview.active_prev}
            note={`за сутки: ${overview.active_day}`}
          />
          <StatTile
            label="Сдано этапов"
            value={overview.stages_passed}
            current={overview.stages_passed_period}
            previous={overview.stages_passed_prev}
            note={`${per}: ${overview.stages_passed_period}`}
          />
          <StatTile label="Учатся" value={overview.learners} note={`сдали хотя бы один этап из ${overview.students}`} />
        </section>

        <section aria-labelledby="activity-title" className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 id="activity-title" className="font-display text-lg font-semibold">
              Активность {week ? "по неделям" : "по дням"}
            </h2>
            <p className="text-xs text-muted">
              Активный — открыл или сдал этап, сохранил код, получил достижение или закрыл квест дня. Дни — по вашему
              часовому поясу ({tz}).
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Ученики"
              legend={
                <Legend
                  items={[
                    { label: "Активные", tone: s.seriesActive, shape: "line" },
                    { label: "Новые", tone: s.seriesNew, shape: "line" },
                  ]}
                />
              }
              table={<ActivityTable rows={activity} label={(row) => pointTitle(activity.indexOf(row))} />}
            >
              <LineChart
                labels={activity.map((row) => row.bucket)}
                series={[
                  { key: "active", label: "Активные", tone: s.seriesActive, values: activity.map((r) => r.active) },
                  { key: "signups", label: "Новые", tone: s.seriesNew, values: activity.map((r) => r.signups) },
                ]}
                title={pointTitle}
                tick={tick}
                ariaLabel={`График учеников ${week ? "по неделям" : "по дням"}: активные и новые`}
              />
            </ChartCard>
            <ChartCard
              title="Сдано этапов"
              table={<ActivityTable rows={activity} label={(row) => pointTitle(activity.indexOf(row))} />}
            >
              <ColumnChart
                labels={activity.map((row) => row.bucket)}
                values={activity.map((r) => r.passed)}
                label="этапов сдано"
                tone={s.seriesPassed}
                title={pointTitle}
                tick={tick}
                ariaLabel={`Столбцы сданных этапов ${week ? "по неделям" : "по дням"}`}
              />
            </ChartCard>
          </div>
        </section>

        <Funnel funnel={funnel} idleDays={IDLE_DAYS} />
        <HardStages rows={data.hard} course={course} minStudents={MIN_STUDENTS} />
      </div>
    </div>
  );
}
