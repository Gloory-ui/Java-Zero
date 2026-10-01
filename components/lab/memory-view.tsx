import type { StageMeta } from "@/lib/content/schema";

/**
 * Стек и куча JVM в один момент выполнения. В стеке — переменные методов (простые значения и ссылки),
 * в куче — только объекты: строки, массивы, Scanner.
 */
export function MemoryView({ memory }: { memory: NonNullable<StageMeta["memory"]> }) {
  return (
    <div className="flex flex-col gap-4">
      {memory.note && <p className="text-sm leading-relaxed text-text/90">{memory.note}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <section aria-labelledby="stack-title" className="flex flex-col gap-2">
          <h3 id="stack-title" className="font-mono text-xs tracking-widest text-muted uppercase">
            Стек (Stack)
          </h3>
          {memory.stack.map((frame) => (
            <div key={frame.method} className="rounded-md border border-border bg-card">
              <div className="border-b border-border px-3 py-2 font-mono text-sm text-accent">{frame.method}</div>
              <ul className="flex flex-col gap-1 px-3 py-2 font-mono text-[13px]">
                {frame.vars.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
        <section aria-labelledby="heap-title" className="flex flex-col gap-2">
          <h3 id="heap-title" className="font-mono text-xs tracking-widest text-muted uppercase">
            Куча (Heap)
          </h3>
          {memory.heap.length === 0 ? (
            <p className="rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted">
              Пусто: в программе нет объектов, все значения простые и лежат в стеке.
            </p>
          ) : (
            memory.heap.map((block) => (
              <div key={block.obj} className="rounded-md border border-dashed border-border-strong px-3 py-2">
                <div className="font-mono text-sm text-gold">{block.obj}</div>
                <div className="mt-1 text-sm text-muted">{block.data}</div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
