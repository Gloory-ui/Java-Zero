import { type CourseIndex, type HardStageRow, stageLabel } from "./model";
import s from "./overview.module.css";

const percent = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 100));

/** Самые трудные этапы: по среднему числу неудачных проверок; полоса повторяет число рядом с ней */
export function HardStages({
  rows,
  course,
  minStudents,
}: {
  rows: HardStageRow[];
  course: CourseIndex;
  minStudents: number;
}) {
  const max = Math.max(1, ...rows.map((row) => row.fails_avg));
  return (
    <section
      aria-labelledby="hard-title"
      className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5"
    >
      <div className="flex flex-col gap-1">
        <h2 id="hard-title" className="font-display text-lg font-semibold">
          Самые трудные этапы
        </h2>
        <p className="text-xs text-muted">
          По среднему числу неудачных проверок на ученика. Этапы, которые открыли меньше {minStudents} учеников, не
          показываются.
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-muted">
          Пока мало данных: нужен этап, который открыли хотя бы {minStudents} ученика.
        </p>
      ) : (
        <section
          aria-label="Таблица трудных этапов"
          // biome-ignore lint/a11y/noNoninteractiveTabindex: на телефоне таблицу прокручивают вбок, в том числе с клавиатуры
          tabIndex={0}
          className="-mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5"
        >
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr className="border-b border-border">
                <th scope="col" className="py-2 pr-3 font-medium">
                  Этап
                </th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">
                  Открыли
                </th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">
                  Сдали
                </th>
                <th scope="col" className="w-48 py-2 pr-3 font-medium">
                  Неудач в среднем
                </th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">
                  Вариантов кода
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  Подсказка · решение
                </th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {rows.map((row) => {
                const label = stageLabel(course, row.quest_id, row.stage_id);
                return (
                  <tr key={`${row.quest_id}/${row.stage_id}`} className="border-b border-border last:border-0">
                    <th scope="row" className="py-2 pr-3 font-normal">
                      <span className="block font-semibold">{label.stage}</span>
                      <span className="block text-xs text-muted">{label.quest}</span>
                    </th>
                    <td className="py-2 pr-3 text-right">{row.students}</td>
                    <td className="py-2 pr-3 text-right">
                      {row.passed} <span className="text-xs text-muted">({percent(row.passed, row.students)}%)</span>
                    </td>
                    <td className="py-2 pr-3">
                      <span className="flex items-center gap-2">
                        <span className="w-8 shrink-0 text-right font-semibold">
                          {row.fails_avg.toLocaleString("ru-RU")}
                        </span>
                        <span className="h-2 flex-1">
                          <span
                            className={`${s.meter} ${s.seriesFails} block`}
                            style={{ width: `${(row.fails_avg / max) * 100}%` }}
                            aria-hidden="true"
                          />
                        </span>
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-right">{row.attempts_avg.toLocaleString("ru-RU")}</td>
                    <td className="py-2 text-right text-muted">
                      {row.hint_used} · {row.solution_viewed}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </section>
  );
}
