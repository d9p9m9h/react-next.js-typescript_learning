"use client";

import {
  Highlight,
  type Language,
  type PrismTheme,
} from "prism-react-renderer";
import { useMemo } from "react";

import { useTheme } from "@/components/theme-provider";

type CodePaneProps = {
  code: string;
  language: string;
  file: string;
};

/**
 * A hand-rolled Prism theme that follows the app palette:
 *   Emerald  → keywords / control flow
 *   Gold     → functions, classes, types
 *   Violet   → strings
 *   Cyan     → numbers, booleans, constants
 *   Slate    → properties, parameters, punctuation
 *
 * The colours are split into a light and a dark variant so the code stays
 * readable in both colour schemes.
 */
type Palette = {
  plain: string;
  comment: string;
  keyword: string;
  function: string;
  string: string;
  number: string;
  className: string;
  property: string;
  punctuation: string;
  operator: string;
  tag: string;
  attrName: string;
};

const LIGHT: Palette = {
  plain: "#1f2937",
  comment: "#94a3b8",
  keyword: "#047857",
  function: "#b45309",
  string: "#7c3aed",
  number: "#0e7490",
  className: "#b45309",
  property: "#475569",
  punctuation: "#64748b",
  operator: "#047857",
  tag: "#047857",
  attrName: "#b45309",
};

const DARK: Palette = {
  plain: "#e2e8f0",
  comment: "#64748b",
  keyword: "#34d399",
  function: "#fbbf24",
  string: "#c4b5fd",
  number: "#22d3ee",
  className: "#fbbf24",
  property: "#cbd5e1",
  punctuation: "#94a3b8",
  operator: "#34d399",
  tag: "#34d399",
  attrName: "#fbbf24",
};

function buildTheme(p: Palette): PrismTheme {
  return {
    plain: { color: p.plain },
    styles: [
      {
        types: ["comment", "prolog", "cdata"],
        style: { color: p.comment, fontStyle: "italic" },
      },
      { types: ["doctype", "punctuation"], style: { color: p.punctuation } },
      {
        types: ["property", "parameter", "symbol", "constant"],
        style: { color: p.property },
      },
      { types: ["tag"], style: { color: p.tag } },
      { types: ["boolean", "number"], style: { color: p.number } },
      { types: ["operator", "entity", "url"], style: { color: p.operator } },
      {
        types: [
          "selector",
          "attr-name",
          "string",
          "char",
          "builtin",
          "inserted",
        ],
        style: { color: p.string },
      },
      { types: ["variable", "deleted"], style: { color: p.string } },
      { types: ["function", "method", "class-name"], style: { color: p.function } },
      { types: ["keyword"], style: { color: p.keyword } },
      { types: ["important", "attr-value"], style: { color: p.attrName } },
    ],
  };
}

export function CodePane({ code, language, file }: CodePaneProps) {
  const { resolvedTheme } = useTheme();

  const theme = useMemo(
    () => buildTheme(resolvedTheme === "dark" ? DARK : LIGHT),
    [resolvedTheme],
  );

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-sunken)]">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--surface-border)] px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-2.5 gap-1" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-rose-400/80" />
            <span className="size-2.5 rounded-full bg-amber-400/80" />
            <span className="size-2.5 rounded-full bg-emerald-400/80" />
          </span>
          <span className="truncate font-mono text-xs text-[var(--text-muted)]">
            {file}
          </span>
        </div>
        <span className="shrink-0 rounded-md border border-[var(--surface-border)] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
          {language}
        </span>
      </div>

      <div className="scrollbar-slim min-h-0 flex-1 overflow-auto">
        <Highlight theme={theme} code={code.trim()} language={language as Language}>
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre
              className={`${className} min-w-full p-4 font-mono text-[13px] leading-relaxed`}
              style={{ ...style, background: "transparent" }}
            >
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })} className="table-row">
                  <span className="table-cell select-none pr-4 text-right text-[var(--text-subtle)] opacity-60">
                    {i + 1}
                  </span>
                  <span className="table-cell">
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </span>
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  );
}
