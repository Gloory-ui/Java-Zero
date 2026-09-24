import ReactMarkdown, { type Components } from "react-markdown";

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
    <pre className="my-4 overflow-x-auto rounded-md border border-border bg-code-bg p-4 font-mono text-[13px] leading-relaxed">
      {children}
    </pre>
  ),
  code: ({ className, children }) =>
    className ? (
      <code className={`${className} font-mono text-code-text`}>{children}</code>
    ) : (
      <code className="rounded-sm bg-card-hover px-1.5 py-0.5 font-mono text-[0.9em] text-code-text">{children}</code>
    ),
  a: ({ href, children }) => (
    <a href={href} className="text-accent underline underline-offset-2" target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
};

export function Markdown({ children }: { children: string }) {
  return <ReactMarkdown components={components}>{children}</ReactMarkdown>;
}
