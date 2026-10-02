"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import type { QuestOutline } from "@/lib/content/outline";
import type { GroupMemberRow, GroupProgressRow } from "@/lib/group/types";
import { plural } from "@/lib/plural";

const short = new Intl.DateTimeFormat("ru", { day: "2-digit", month: "2-digit" });
const full = new Intl.DateTimeFormat("ru", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

type Props = {
  /** Квесты КТ с настоящими названиями заданий */
  quests: QuestOutline[];
  members: GroupMemberRow[] | null;
  progress: GroupProgressRow[] | null;
};

function attemptsText(row: GroupProgressRow): string {
  const parts = [`${plural(row.attempts, ["вариант", "варианта", "вариантов"])} кода`];
  if (row.fails > 0)
    parts.push(`${plural(row.fails, ["проваленная проверка", "проваленные проверки", "проваленных проверок"])}`);
  if (row.hint_used) parts.push("брал подсказку");
  if (row.solution_viewed) parts.push("смотрел решение");
  return parts.join(", ");
}

/** Кто какие задания КТ сдал, сколько было попыток и когда. Одна таблица на КТ, переключатель сверху */
export function ProgressTable({ quests, members, progress }: Props) {
  const [questId, setQuestId] = useState(quests[0]?.id ?? "");
  const quest = quests.find((q) => q.id === questId) ?? quests[0];

  const byStudent = useMemo(() => {
    const map = new Map<string, Map<string, GroupProgressRow>>();
    for (const row of progress ?? []) {
      if (row.quest_id !== quest?.id) continue;
      const stages = map.get(row.user_id) ?? new Map<string, GroupProgressRow>();
      stages.set(row.stage_id, row);
      map.set(row.user_id, stages);
    }
    return map;
  }, [progress, quest?.id]);

  if (!quest) return null;
  const loading = members === null || progress === null;
  const passedCount = (userId: string) =>
    quest.stages.filter((s) => byStudent.get(userId)?.get(s.id)?.passed_at).length;
  const sorted = [...(members ?? [])].sort((a, b) => passedCount(b.user_id) - passedCount(a.user_id));

  return (
    <section
      aria-labelledby="group-progress"
      className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5"
    >
      <div>
        <h2 id="group-progress" className="font-display text-xl font-semibold">
          Прогресс по КТ
        </h2>
        <p className="text-sm text-muted">
          Сданные задания с датой. В подсказке у ячейки — сколько было вариантов кода и проваленных проверок.
        </p>
      </div>

      <div role="tablist" aria-label="Контрольная точка" className="flex flex-wrap gap-1">
        {quests.map((q) => (
          <button
            key={q.id}
            type="button"
            role="tab"
            aria-selected={q.id === quest.id}
            onClick={() => setQuestId(q.id)}
            className={cn(
              "h-11 rounded-lg px-3 text-sm font-semibold sm:h-10",
              "transition-colors duration-150 ease-snappy",
              q.id === quest.id ? "bg-card text-text shadow-sm" : "text-muted hover:text-text",
            )}
          >
            {q.title}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-md bg-card motion-reduce:animate-none" aria-busy="true" />
      ) : sorted.length === 0 ? (
        <p className="text-sm text-muted">В группе пока никого: таблица появится, когда одногруппники войдут.</p>
      ) : (
        // biome-ignore lint/a11y/noNoninteractiveTabindex: широкая таблица прокручивается с клавиатуры (WCAG 2.1.1)
        <section tabIndex={0} className="relative -mx-5 overflow-x-auto px-5" aria-label={`Прогресс: ${quest.title}`}>
          <table className="w-full min-w-[560px] border-separate border-spacing-0 text-sm">
            <caption className="sr-only">{quest.title}: задания по столбцам, студенты по строкам</caption>
            <thead>
              <tr>
                <th scope="col" className="sticky left-0 bg-surface py-2 pr-3 text-left font-semibold">
                  Студент
                </th>
                {quest.stages.map((s, i) => (
                  <th
                    key={s.id}
                    scope="col"
                    title={s.title}
                    className="px-1 py-2 text-center font-mono text-xs font-semibold text-muted"
                  >
                    <span aria-hidden="true">{i + 1}</span>
                    <span className="sr-only">{s.title}</span>
                  </th>
                ))}
                <th scope="col" className="py-2 pl-3 text-right font-semibold">
                  Сдано
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((m) => {
                const stages = byStudent.get(m.user_id);
                const done = passedCount(m.user_id);
                return (
                  <tr key={m.user_id} className="border-t border-border">
                    <th
                      scope="row"
                      className="sticky left-0 max-w-[12rem] truncate border-t border-border bg-surface py-2 pr-3 text-left font-normal"
                    >
                      {m.handle ? `@${m.handle}` : (m.display_name ?? "Без ника")}
                    </th>
                    {quest.stages.map((s) => {
                      const row = stages?.get(s.id);
                      const label = row?.passed_at
                        ? `${s.title}: сдано ${full.format(new Date(row.passed_at))}; ${attemptsText(row)}`
                        : row
                          ? `${s.title}: начато, не сдано; ${attemptsText(row)}`
                          : `${s.title}: не начато`;
                      return (
                        <td key={s.id} title={label} className="border-t border-border px-1 py-2 text-center">
                          <span className="sr-only">{label}</span>
                          {row?.passed_at ? (
                            <span aria-hidden="true" className="inline-flex flex-col items-center leading-tight">
                              <Icon name="check" className="size-4 text-success" />
                              <span className="font-mono text-[10px] text-muted">
                                {short.format(new Date(row.passed_at))}
                              </span>
                            </span>
                          ) : row ? (
                            <span aria-hidden="true" className="font-mono text-xs text-gold">
                              {row.attempts || "…"}
                            </span>
                          ) : (
                            <span aria-hidden="true" className="text-muted">
                              —
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="border-t border-border py-2 pl-3 text-right font-mono tabular-nums">
                      {done}/{quest.stages.length}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
      <p className="text-xs text-muted">
        <Icon name="check" className="inline size-3.5 text-success" /> — сдано, жёлтое число — начато и сколько было
        вариантов кода, «—» — не начато.
      </p>
    </section>
  );
}
