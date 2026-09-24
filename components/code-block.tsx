import { cn } from "@/lib/cn";
import { highlightJava } from "@/lib/highlight";

/** Подсвеченный фрагмент Java. Рендерится на сервере теми же цветами, что и редактор. */
export function JavaCode({ code, className }: { code: string; className?: string }) {
  const lines = highlightJava(code.replace(/\n$/, ""));
  return (
    <code className={cn("font-mono text-code-text", className)}>
      {lines.map((tokens, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: строки кода статичны
        <span key={i} className="block">
          {tokens.length === 0
            ? "\n"
            : tokens.map((token, j) =>
                token.className ? (
                  // biome-ignore lint/suspicious/noArrayIndexKey: токены строки статичны
                  <span key={j} className={token.className}>
                    {token.text}
                  </span>
                ) : (
                  token.text
                ),
              )}
        </span>
      ))}
    </code>
  );
}

export function CodeBlock({ code, className }: { code: string; className?: string }) {
  return (
    <pre
      className={cn(
        "overflow-x-auto rounded-md border border-border bg-code-bg p-4 text-[13px] leading-relaxed",
        className,
      )}
    >
      <JavaCode code={code} />
    </pre>
  );
}
