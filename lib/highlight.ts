import { highlightCode, tags as t, tagHighlighter } from "@lezer/highlight";
import { parser } from "@lezer/java";

// Те же категории, что в редакторе (components/lab/code-editor.tsx); цвета — классы tok-* в globals.css
const highlighter = tagHighlighter([
  { tag: [t.keyword, t.controlKeyword, t.modifier, t.definitionKeyword, t.operatorKeyword], class: "tok-keyword" },
  { tag: [t.typeName, t.className, t.namespace], class: "tok-type" },
  { tag: [t.string, t.special(t.string), t.character], class: "tok-string" },
  { tag: [t.number, t.bool, t.null], class: "tok-number" },
  { tag: [t.lineComment, t.blockComment, t.docComment], class: "tok-comment" },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], class: "tok-func" },
]);

export type Token = { text: string; className: string };

/** Разбивает код Java на строки токенов для подсветки на сервере, без JavaScript в браузере. */
export function highlightJava(code: string): Token[][] {
  const lines: Token[][] = [[]];
  highlightCode(
    code,
    parser.parse(code),
    highlighter,
    (text, className) => lines[lines.length - 1].push({ text, className }),
    () => lines.push([]),
  );
  return lines;
}
