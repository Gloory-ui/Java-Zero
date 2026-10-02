import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Legend } from "./charts";
import { type FunnelQuest, plural, topStops } from "./model";
import s from "./overview.module.css";

/** Дорожка «открыли» длиной от максимума по курсу и полоса «сдали» поверх неё */
function FunnelBar({ reached, passed, max }: { reached: number; passed: number; max: number }) {
  if (reached === 0) return <div className="h-2.5 border-b border-border" aria-hidden="true" />;
  return (
    <div className={s.track} style={{ width: `${(reached / max) * 100}%` }} aria-hidden="true">
      {passed > 0 && <div className={s.fill} style={{ width: `${(passed / reached) * 100}%` }} />}
    </div>
  );
}

function Stops({ stuck, leftAfter }: { stuck: number; leftAfter: number }) {
  if (stuck + leftAfter === 0) return null;
  return (
    <span className="text-xs text-muted">
      {stuck > 0 && <span className="text-gold">застряли {stuck}</span>}
      {stuck > 0 && leftAfter > 0 && " · "}
      {leftAfter > 0 && <>ушли после сдачи {leftAfter}</>}
    </span>
  );
}

/**
 * Воронка общего курса по квестам, в каждом — этапы по порядку. Числа видны всегда, полосы их только повторяют.
 * «Застряли» и «ушли» — ученики, чей последний тронутый этап здесь и кто не заходил idleDays дней
 */
export function Funnel({ funnel, idleDays }: { funnel: FunnelQuest[]; idleDays: number }) {
  const max = Math.max(1, ...funnel.flatMap((quest) => quest.stages.map((stage) => stage.reached)));
  const stops = topStops(funnel);
  const empty = funnel.every((quest) => quest.started === 0);

  return (
    <section
      aria-labelledby="funnel-title"
      className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5"
    >
      <div className="flex flex-col gap-1">
        <h2 id="funnel-title" className="font-display text-lg font-semibold">
          Воронка курса «Java с нуля»
        </h2>
        <p className="text-xs text-muted">
          Сколько учеников открыли каждый этап и сколько сдали. «Застряли» и «ушли после сдачи» — последний этап,
          который ученик трогал, если он не заходил {idleDays} дней. Контрольные точки — во вкладке «Группа».
        </p>
      </div>
      <Legend
        items={[
          { label: "Открыли", tone: s.funnelReached, shape: "rect" },
          { label: "Сдали", tone: s.funnelPassed, shape: "rect" },
        ]}
      />

      {empty ? (
        <p className="py-6 text-center text-muted">Пока никто из учеников с аккаунтом не открыл ни одного этапа.</p>
      ) : (
        <>
          {stops.length > 0 && (
            <div className="rounded-xl border border-gold/30 bg-gold/5 px-3 py-2 text-sm">
              <p className="font-semibold">Чаще всего останавливаются</p>
              <ol className="mt-1 flex flex-col gap-0.5">
                {stops.map((stop) => (
                  <li key={`${stop.questTitle}/${stop.stageTitle}`}>
                    {stop.questTitle} → <strong className="font-semibold">{stop.stageTitle}</strong>:{" "}
                    <span className="text-muted">
                      {stop.stuck + stop.leftAfter}{" "}
                      {plural(stop.stuck + stop.leftAfter, ["ученик", "ученика", "учеников"])}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <ol className="flex flex-col divide-y divide-border">
            {funnel.map((quest) => (
              <li key={quest.id}>
                <details className="group">
                  <summary className="grid cursor-pointer list-none grid-cols-[1.25rem_minmax(0,1fr)] items-center gap-x-2 gap-y-1.5 rounded-lg py-2.5 sm:grid-cols-[1.25rem_minmax(0,14rem)_minmax(0,1fr)_auto] [&::-webkit-details-marker]:hidden">
                    <ChevronRight
                      className="size-4 text-muted transition-transform duration-150 ease-snappy group-open:rotate-90 motion-reduce:transition-none"
                      aria-hidden="true"
                    />
                    <span className="truncate text-sm font-semibold" title={quest.title}>
                      <span className="text-muted">{quest.num} · </span>
                      {quest.title}
                    </span>
                    <span className="col-start-2 sm:col-start-auto">
                      <FunnelBar reached={quest.started} passed={quest.finished} max={max} />
                    </span>
                    <span className="col-start-2 text-xs text-muted tabular-nums sm:col-start-auto sm:text-right">
                      начали {quest.started} · закончили {quest.finished}
                      {quest.stopped > 0 && <span className="text-gold"> · остановились {quest.stopped}</span>}
                    </span>
                  </summary>
                  <ol className="mb-3 flex flex-col gap-2 pl-7">
                    {quest.stages.map((stage, index) => (
                      <li
                        key={stage.id}
                        className="grid grid-cols-1 items-center gap-x-3 gap-y-1 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_auto]"
                      >
                        <span className="truncate text-sm" title={stage.title}>
                          <span className="text-muted tabular-nums">{index + 1}. </span>
                          {stage.title}
                        </span>
                        <FunnelBar reached={stage.reached} passed={stage.passed} max={max} />
                        <span className={cn("flex flex-wrap gap-x-2 text-xs tabular-nums sm:justify-end")}>
                          <span>
                            открыли {stage.reached} · сдали {stage.passed}
                          </span>
                          <Stops stuck={stage.stuck} leftAfter={stage.leftAfter} />
                        </span>
                      </li>
                    ))}
                  </ol>
                </details>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
