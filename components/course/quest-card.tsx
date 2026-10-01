"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import type { QuestOutline } from "@/lib/content/outline";
import { isQuestUnlocked, isStagePassed, isStageUnlocked, questProgress } from "@/lib/progress/selectors";
import { type ProgressData, stageKey } from "@/lib/progress/types";

type Props = {
  quest: QuestOutline;
  /** Весь курс: по нему считается, открыт ли квест */
  course: QuestOutline[];
  progress: ProgressData;
  /** После какого квеста открывается этот, если он закрыт */
  lockedHint?: string;
  /** Ключи «квест/этап» новых этапов, которые студент пропустил */
  skipped?: ReadonlySet<string>;
  /** Уровень заголовка: h3, когда карточки сгруппированы под своим h2 */
  heading?: "h2" | "h3";
};

/** Квест на карте: титул, полоса прогресса и этапы с отметками «сдан / открыт / закрыт». */
export function QuestCard({ quest, course, progress, lockedHint, skipped, heading: Heading = "h2" }: Props) {
  const open = isQuestUnlocked(progress, course, quest);
  const { passed, total, percent } = questProgress(progress, quest);
  return (
    <li
      className={cn(
        "rounded-lg border bg-surface p-4 sm:p-5",
        open ? "border-border" : "border-dashed border-border-strong",
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 font-mono text-xs tracking-widest text-muted uppercase">
            <span className="size-2 rounded-full" style={{ backgroundColor: quest.rank.color }} aria-hidden="true" />
            {quest.num} · {open ? `${passed} из ${total}` : "закрыт"}
          </p>
          <Heading className="mt-1 font-display text-lg font-semibold">{quest.title}</Heading>
          <p className="text-sm text-muted">{quest.subtitle}</p>
          {!open && lockedHint && <p className="mt-1 text-sm text-muted">{lockedHint}</p>}
        </div>
        <span className="text-sm text-muted" title="Титул за прохождение квеста">
          <span className="inline-flex items-center gap-1.5">
            <span style={open ? { color: quest.rank.color } : undefined}>
              <Icon name={open ? quest.rank.icon : "lock"} className="size-4" />
            </span>
            {quest.rank.title}
          </span>
        </span>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-card" aria-hidden="true">
        <div
          className="h-full origin-left rounded-full motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-snappy"
          style={{ transform: `scaleX(${percent / 100})`, backgroundColor: quest.rank.color }}
        />
      </div>
      <ol className="mt-4 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {quest.stages.map((stage, index) => {
          const done = isStagePassed(progress, quest.id, stage.id);
          const unlocked = isStageUnlocked(progress, course, quest, index);
          const label = (
            <>
              <span className={cn(done ? "text-success" : unlocked ? "text-accent" : "text-muted")}>
                {done ? (
                  <Icon name="check" className="size-3.5" strokeWidth={2.5} />
                ) : unlocked ? (
                  <Icon name="arrow-right" className="size-3.5" />
                ) : (
                  <Icon name="lock" className="size-3.5 opacity-60" />
                )}
              </span>
              <span className="min-w-0 truncate">{stage.title}</span>
              {skipped?.has(stageKey(quest.id, stage.id)) && (
                <span className="shrink-0 rounded-full border border-gold/50 bg-gold/10 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-text uppercase">
                  новый
                </span>
              )}
              <span className="sr-only">{done ? "(сдан)" : unlocked ? "(открыт)" : "(закрыт)"}</span>
            </>
          );
          return (
            <li key={stage.id}>
              {unlocked ? (
                <Link
                  href={`/learn/${quest.id}/${stage.id}`}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-card"
                >
                  {label}
                </Link>
              ) : (
                <span className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted">{label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </li>
  );
}
