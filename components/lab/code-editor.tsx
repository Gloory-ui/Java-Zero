"use client";

import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentLess, insertTab } from "@codemirror/commands";
import { java } from "@codemirror/lang-java";
import { bracketMatching, HighlightStyle, indentOnInput, indentUnit, syntaxHighlighting } from "@codemirror/language";
import { type Diagnostic, lintGutter, setDiagnostics } from "@codemirror/lint";
import { EditorSelection, EditorState } from "@codemirror/state";
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export type EditorDiagnostic = { start: number; end: number; severity: "error" | "warning"; message: string };
export type CodeEditorHandle = { revealOffset: (offset: number) => void; focus: () => void };

type Props = {
  initialValue: string;
  onChange: (code: string) => void;
  onSubmit: () => void;
  diagnostics: EditorDiagnostic[];
  label: string;
};

// Цвета — CSS-переменные из globals.css, поэтому подсветка сама переключается вместе с темой
const highlight = HighlightStyle.define([
  {
    tag: [t.keyword, t.controlKeyword, t.modifier, t.definitionKeyword, t.operatorKeyword],
    color: "var(--code-keyword)",
  },
  { tag: [t.typeName, t.className, t.namespace], color: "var(--code-type)" },
  { tag: [t.string, t.special(t.string), t.character], color: "var(--code-string)" },
  { tag: [t.number, t.bool, t.null], color: "var(--code-number)" },
  { tag: [t.lineComment, t.blockComment, t.docComment], color: "var(--code-comment)", fontStyle: "italic" },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: "var(--code-func)" },
]);

const theme = EditorView.theme({
  "&": { height: "100%", color: "var(--code-text)", backgroundColor: "var(--code-bg)", fontSize: "14px" },
  ".cm-scroller": { fontFamily: "var(--font-mono)", lineHeight: "1.65", fontVariantLigatures: "none" },
  ".cm-content": { caretColor: "var(--accent)", padding: "12px 0" },
  ".cm-gutters": { backgroundColor: "var(--code-bg)", color: "var(--code-lineno)", border: "none" },
  // Нейтральная подсветка и только при фокусе: красноватая строка читалась как ошибка
  ".cm-activeLine": { backgroundColor: "transparent" },
  "&.cm-focused .cm-activeLine": { backgroundColor: "color-mix(in oklab, var(--code-text) 6%, transparent)" },
  ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--code-text)" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
    backgroundColor: "var(--border-strong) !important",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-cursor": { borderLeftColor: "var(--accent)", borderLeftWidth: "2px" },
  ".cm-matchingBracket": { backgroundColor: "var(--border-strong)", outline: "none" },
  ".cm-lintRange-error": { backgroundImage: "none", textDecoration: "wavy underline var(--danger)" },
  ".cm-lintRange-warning": { backgroundImage: "none", textDecoration: "wavy underline var(--gold)" },
  ".cm-tooltip": { backgroundColor: "var(--card)", border: "1px solid var(--border-strong)", borderRadius: "8px" },
});

/** sout / psvm + Tab, как в IntelliJ IDEA; иначе обычный отступ */
function snippetOrTab(view: EditorView): boolean {
  const { state } = view;
  const range = state.selection.main;
  if (!range.empty) return insertTab(view);
  const line = state.doc.lineAt(range.head);
  const before = line.text.slice(0, range.head - line.from);
  const indent = /^\s*/.exec(before)?.[0] ?? "";
  const expand = (word: string, text: string, cursorOffset: number) => {
    const from = range.head - word.length;
    view.dispatch({
      changes: { from, to: range.head, insert: text },
      selection: EditorSelection.cursor(from + cursorOffset),
      scrollIntoView: true,
    });
    return true;
  };
  if (/\bsout$/.test(before)) return expand("sout", "System.out.println();", "System.out.println(".length);
  if (/\bpsvm$/.test(before)) {
    const head = "public static void main(String[] args) {\n";
    return expand("psvm", `${head}${indent}    \n${indent}}`, head.length + indent.length + 4);
  }
  return insertTab(view);
}

export const CodeEditor = forwardRef<CodeEditorHandle, Props>(function CodeEditor(
  { initialValue, onChange, onSubmit, diagnostics, label },
  ref,
) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  // Колбэки меняются между рендерами; редактор создаётся один раз и читает свежие через ref
  const handlers = useRef({ onChange, onSubmit });
  handlers.current = { onChange, onSubmit };

  // biome-ignore lint/correctness/useExhaustiveDependencies: редактор создаётся один раз; новое начальное значение приходит через key
  useEffect(() => {
    if (!host.current) return;
    const state = EditorState.create({
      doc: initialValue,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        drawSelection(),
        history(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        indentUnit.of("    "),
        EditorState.tabSize.of(4),
        java(),
        syntaxHighlighting(highlight),
        lintGutter(),
        theme,
        keymap.of([
          {
            key: "Mod-Enter",
            run: () => {
              handlers.current.onSubmit();
              return true;
            },
          },
          { key: "Tab", run: snippetOrTab, shift: indentLess },
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
        ]),
        EditorView.contentAttributes.of({ "aria-label": label, spellcheck: "false", autocorrect: "off" }),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) handlers.current.onChange(u.state.doc.toString());
        }),
      ],
    });
    view.current = new EditorView({ state, parent: host.current });
    return () => {
      view.current?.destroy();
      view.current = null;
    };
  }, []);

  useEffect(() => {
    const v = view.current;
    if (!v) return;
    const length = v.state.doc.length;
    const mapped: Diagnostic[] = diagnostics.map((d) => {
      const from = Math.min(Math.max(d.start, 0), length);
      return { from, to: Math.min(Math.max(d.end + 1, from), length), severity: d.severity, message: d.message };
    });
    v.dispatch(setDiagnostics(v.state, mapped));
  }, [diagnostics]);

  useImperativeHandle(ref, () => ({
    revealOffset(offset: number) {
      const v = view.current;
      if (!v) return;
      const pos = Math.min(Math.max(offset, 0), v.state.doc.length);
      v.dispatch({ selection: EditorSelection.cursor(pos), scrollIntoView: true });
      v.focus();
    },
    focus() {
      view.current?.focus();
    },
  }));

  return <div ref={host} className="h-full min-h-0 overflow-hidden" />;
});
