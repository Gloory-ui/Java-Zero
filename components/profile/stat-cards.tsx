import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/lib/icons";

export type Stat = { icon: IconName; tone: string; label: string; value: string; note?: string };

/** Четыре карточки статистики: иконка в цветной плашке, крупное число, подпись */
export function StatCards({ items }: { items: Stat[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Статистика">
      {items.map((s) => (
        <li
          key={s.label}
          className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface px-3 py-5 text-center transition-colors duration-200 hover:border-border-strong"
        >
          <span
            className="grid size-10 place-items-center rounded-lg"
            style={{ backgroundColor: `color-mix(in oklab, ${s.tone} 16%, transparent)`, color: s.tone }}
          >
            <Icon name={s.icon} className="size-5" />
          </span>
          <p className="font-display text-2xl font-bold tabular-nums">{s.value}</p>
          <p className="font-mono text-[11px] tracking-widest text-muted uppercase">{s.label}</p>
          {s.note && <p className="text-xs text-muted">{s.note}</p>}
        </li>
      ))}
    </ul>
  );
}
