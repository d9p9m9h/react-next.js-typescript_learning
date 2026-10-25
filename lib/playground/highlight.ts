import { readFileSync } from "node:fs";
import { join } from "node:path";

import Prism from "prismjs";

/**
 * Syntax highlighting for the practice files.
 *
 * The playground shows the learner's own TSX, so the code pane reads
 * far better with the keywords, types and JSX tags coloured.
 *
 * Prism's language definitions are **plugins** that register
 * themselves on a global `Prism` object, so they are loaded here by
 * evaluating the component files once. The result is cached, because
 * re-parsing the grammar for every keystroke would be wasteful.
 */

/** The Prism components the TSX grammar is built from. */
const COMPONENTS = ["prism-typescript.js", "prism-jsx.js", "prism-tsx.js"];

/** The folder Prism's components live in. */
const componentsFolder = join(
  process.cwd(),
  "node_modules",
  "prismjs",
  "components",
);

let loaded = false;

/**
 * Loads the Prism components the TSX grammar needs.
 *
 * Each component file ends with a call that expects a global
 * `Prism`, so it is evaluated with `Prism` passed in as an argument.
 */
function loadComponents(): void {
  if (loaded) return;

  for (const component of COMPONENTS) {
    const path = join(componentsFolder, component);
    const source = readFileSync(path, "utf8");

    const factory = new Function("Prism", "module", "exports", source);
    factory(Prism, { exports: {} }, {});
  }

  loaded = true;
}

/**
 * Highlights a TSX source into HTML.
 *
 * The result is Prism's own markup: `<span class="token keyword">…</span>`
 * and friends. The playground renders it as **HTML**, so the source
 * must be escaped first — Prism escapes the text it tokenises, but the
 * surrounding markup is generated HTML.
 */
export function highlightTsx(source: string): string {
  loadComponents();

  const grammar = Prism.languages.tsx;

  if (!grammar) return escapeHtml(source);

  return Prism.highlight(source, grammar, "tsx");
}

/**
 * Escapes a string for use as HTML text.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
