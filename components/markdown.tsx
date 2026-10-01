import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { JavaCode } from "./code-block";

// Разметка теории и граблей: только безопасный Markdown (react-markdown не исполняет HTML из текста)
const components: Components = {
  h2: ({ children }) => <h2 className="mt-6 mb-3 font-display text-lg font-semibold first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-5 mb-2 font-semibold">{children}</h3>,
  p: ({ children }) => <p className="my-3 leading-relaxed text-text/90">{children}</p>,
  ul: ({ children }) => <ul className="my-3 flex list-disc flex-col gap-1.5 pl-5 marker:text-muted">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 flex list-decimal flex-col gap-1.5 pl-5 marker:text-muted">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-text">{children}</strong>,
  pre: ({ children }) => (
    <pre
      // biome-ignore lint/a11y/noNoninteractiveTabindex: прокручиваемая область должна получать фокус (WCAG 2.1.1)
      tabIndex={0}
      className="my-4 overflow-x-auto rounded-md border border-border bg-code-bg p-4 font-mono text-[13px] leading-relaxed"
    >
      {children}
    </pre>
  ),
  code: ({ className, children }) =>
    className?.includes("language-java") ? (
      <JavaCode code={String(children)} />
    ) : className ? (
      <code className={`${className} font-mono text-code-text`}>{children}</code>
    ) : (
      <code className="rounded-sm bg-card-hover px-1.5 py-0.5 font-mono text-[0.9em] [overflow-wrap:anywhere] text-code-text">
        {children}
      </code>
    ),
  // Таблицы (GFM): на узком экране прокручиваются внутри блока, а не всей страницей
  table: ({ children }) => (
    <div
      // biome-ignore lint/a11y/noNoninteractiveTabindex: прокручиваемая таблица должна получать фокус (WCAG 2.1.1)
      tabIndex={0}
      className="my-4 overflow-x-auto rounded-md border border-border"
    >
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-card text-muted">{children}</thead>,
  th: ({ children }) => <th className="px-3 py-2 font-medium">{children}</th>,
  td: ({ children }) => <td className="border-t border-border px-3 py-2 align-top">{children}</td>,
  a: ({ href, children }) => (
    <a href={href} className="text-accent underline underline-offset-2" target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
};

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
      {children}
    </ReactMarkdown>
  );
}
