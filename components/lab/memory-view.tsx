import type { StageMeta } from "@/lib/content/schema";

/** Стек вызовов и куча JVM в момент выполнения — упрощённая картинка для этапа. */
export function MemoryView({ memory }: { memory: NonNullable<StageMeta["memory"]> }) {
  return (
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
        {memory.heap.map((block) => (
          <div key={block.obj} className="rounded-md border border-dashed border-border-strong px-3 py-2">
            <div className="font-mono text-sm text-gold">{block.obj}</div>
            <div className="mt-1 text-sm text-muted">{block.data}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
