# Detail Progress Summary

**Project:** `react-next` — React Code Playground
**Repository:** https://github.com/d9p9m9h/react-next.js-typescript_learning
**Path:** `C:\__d9p__\react-next`
**Stack:** Next.js 16.4.2 (App Router, Turbopack) · React 19.3 · TypeScript 7.0.2 · Tailwind CSS v4
**Purpose:** A **localhost-only** React/TypeScript code playground. The learner edits `.tsx` practice files in `practice/` and sees the result render live.
**Date:** 2026-10-21

---

## Changelog

| Date       | Change                                                                                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-21 | **STEP 5** — practice files moved from the project root into `practice/`; the editor and the preview now take turns via a **Code / Preview** switch (one panel at a time). |
| 2026-10-22 | Preview styles are compiled from the current TSX source with Tailwind CSS v4 and injected into the sandboxed iframe. |
| 2026-10-22 | Added responsive Split / Code / Preview modes, cancelled stale live-compile requests, and tightened the workspace layout. |
| 2026-10-22 | Added **syntax highlighting**, **real TypeScript type-checking**, **auto-saved drafts**, **editable props**, and **preview device widths**. |

---

## Table of Contents

1. [What this project is now](#1-what-this-project-is-now)
2. [Getting started](#2-getting-started)
3. [Final architecture](#3-final-architecture)
4. [How the source files are discovered](#4-how-the-source-files-are-discovered)
5. [The compile → preview flow](#5-the-compile--preview-flow)
6. [The sandbox and its real security limits](#6-the-sandbox-and-its-real-security-limits)
7. [Component reference](#7-component-reference)
8. [Complete file inventory](#8-complete-file-inventory)
9. [Theme system](#9-theme-system)
10. [Styling and layout](#10-styling-and-layout)
11. [Verification results](#11-verification-results)
12. [Remaining known limitations](#12-remaining-known-limitations)
13. [Appendix A — Command reference](#appendix-a--command-reference)
14. [Appendix B — Message protocol](#appendix-b--message-protocol)
15. [Appendix C — Glossary](#appendix-c--glossary)

---

## 1. What this project is now

This is a **single-purpose code playground**, not a course platform.

Earlier versions of this repository carried a full lesson system: a lesson grid on the home page,
seven dynamically-generated lesson routes under `/lesson/[slug]`, a learning-path sidebar, a
progress bar, a visited/completed counter, a daily streak, and a Prism-based syntax-highlighted
code pane. **All of that has been removed.** The application is now one screen:

```
┌──────────────────────────────────────────────────────────┐
│ R  React Code Playground                    ☀   ☾   ⌘    │  header + theme switch
├──────────────────────────────────────────────────────────┤
│ [P2L3] [P2L4] [index] [p2l5] [p2l6] [p2l7] [index] …    │  file selector
│                          [◫ Split] [⌨ Code] [▷ Preview]  │  view switch
├──────────────────────────────────────────────────────────┤
│ Source · ရေးမယ့် code      (or)      Preview · ရလဒ်    │
│ ┌───────────────────────┐   ┌──────────────────────────┐ │
│ │ P2L3.tsx  ● Compiled  │   │ ● Rendered result  [live]│ │
│ │ [Reset]               │   │                          │ │
│ │                       │   │  (sandboxed iframe)     │ │
│ │   (textarea)          │   │                          │ │
│ │                       │   │                          │ │
│ └───────────────────────┘   └──────────────────────────┘ │
├──────────────────────────────────────────────────────────┤
│ Console                                          [Clear]  │
└──────────────────────────────────────────────────────────┘
```

The eight `.tsx` files in the **`practice/`** folder are the **practice content**. They are never
modified by the app — the playground reads them, shows them in the editor, and renders them in the
preview.

| Concern        | How it is handled now                                               |
| -------------- | ------------------------------------------------------------------- |
| File selection | A `tablist` of every `.tsx` file in `practice/`, keyboard-navigable |
| Editing        | A plain `<textarea>`; changes are debounced 180 ms, then compiled  |
| View switch    | **Split / Code / Preview** — side-by-side on desktop, one panel on mobile |
| Preview        | A sandboxed iframe running the compiled module                      |
| Console        | `console.*` calls are forwarded from the iframe and shown here      |
| Errors         | Compile errors and runtime errors are shown inline over the preview |
| Reset          | Restores the selected file's original on-disk content               |
| Theming        | Light / Dark / System, persisted in `localStorage`                  |

---

## 2. Getting started

The dev server binds to **127.0.0.1 only** — it is not reachable from the network.

```bash
npm install
npm run dev          # → http://127.0.0.1:3000
```

Other commands:

```bash
npm run typecheck    # tsc -b
npx next build       # production build
npx next start       # serve the production build
```

> On Windows, if `npm` is not on your `PATH`, use `npm.cmd` / `npx.cmd`.

The `dev` script is deliberately `next dev -H 127.0.0.1`. Verified with
`Get-NetTCPConnection -LocalPort 3000 -State Listen` → the socket listens on `127.0.0.1`
**only** (not `0.0.0.0`).

---

## 3. Final architecture

### 3.1 Route table

| Route                        | Type    | Purpose                                            |
| ---------------------------- | ------- | -------------------------------------------------- |
| `/`                          | Static  | The playground. The only page.                     |
| `/_not-found`                | Static  | 404 page.                                          |
| `/api/playground/compile`    | Dynamic | `POST` — compiles TSX → CommonJS and source-specific Tailwind CSS |
| `/playground/sandbox`        | Dynamic | `GET` — the sandbox document (HTML + CSP)          |
| `/playground/sandbox/vendor` | Dynamic | `GET` — the React runtime bundle for the sandbox   |

There are **no lesson routes**. `/lesson/*` returns **404** (verified).

### 3.2 Component tree

```
RootLayout (app/layout.tsx) — server
└── ThemeProvider                       ← theme state + localStorage
    └── StorageCleanup                  ← deletes the obsolete progress key
        └── LabShell (client)
            ├── LabHeader (client)
            │   └── ThemeToggle (client)
            └── {children} = app/page.tsx
                └── Playground (client)          components/playground/playground.tsx
                    ├── file tablist
                    ├── PlaygroundViewToggle     ← Split / Code / Preview switch
                    ├── PlaygroundEditor         ← <textarea> + Reset + status
                    ├── PlaygroundPreview        ← <iframe> + postMessage bridge
                    │   └── (sandbox frame)      ← app/playground/sandbox
                    ├── PlaygroundErrorBoundary  ← catches app-side render errors
                    └── PlaygroundConsole        ← captured log lines
```

### 3.3 The three processes involved

```
 Browser tab (app)              Sandbox frame                Server
┌────────────────────┐        ┌──────────────────┐        ┌──────────┐
│ Playground         │        │ sandbox-runtime  │        │ /api/    │
│  ├ editor state    │        │  ├ evaluate      │        │ compile  │
│  └ PlaygroundPreview│ ─────► │  ├ render        │ ◄───── │ (Sucrase)│
│                    │ postMsg│  └ console proxy │  code  │          │
│  console entries ◄─┼────────┤                  │        └──────────┘
└────────────────────┘        └──────────────────┘
```

The learner's code is **never** evaluated in the main application window.
The compile route also returns CSS for the current source; the preview sends it to the iframe
alongside the compiled module.

---

## 4. How the source files are discovered

`lib/playground/files.ts` uses Turbopack's `import.meta.glob`:

```ts
const rawSources = import.meta.glob("/practice/*.tsx", {
  query: "?raw",
  eager: true,
}) as Record<string, { default: string }>;
```

The `?raw` query asks Turbopack for the file **contents** instead of a module. That only works
because `next.config.ts` adds a rule for it:

```ts
turbopack: {
  rules: {
    "*.tsx": { condition: { query: "?raw" }, type: "text" },
  },
},
```

The pattern is anchored at the project root and points at the **`practice/`** folder, so it picks up
exactly the eight practice files and nothing else — `app/`, `components/` and `lib/` live in other
sub-directories.

> **Why the rule still works after the move.** Turbopack matches a rule glob against the **file
> name** unless the glob contains a `/`. `"*.tsx"` has no `/`, so it matches `practice/P2L3.tsx`
> just as it matched the old root-level `P2L3.tsx`. (Verified in the bundled Next.js docs:
> _"Globs used in the `rules` object match based on file name, unless the glob contains a `/`
> character, which will cause it to match based on the full project-relative file path."_)

> **Turbopack-only feature.** `import.meta.glob` does not work under webpack. This project builds
> with Turbopack (`next dev` / `next build` in Next 16).

### 4.1 The registry — which component to render

`lib/playground/registry.tsx` maps each file to the component that should be previewed and the
props it needs. This is what lets the playground render a component that a file declares but never
exports. The keys are the **file name only** (no `practice/` prefix).

| File                  | Component                 | Props                                    |
| --------------------- | ------------------------- | ---------------------------------------- |
| `P2L3.tsx`            | `default` (SearchBox)     | `{}`                                     |
| `P2L4.tsx`            | `UserList`                | `{}`                                     |
| `p2l5.tsx`            | `default` (ProfileEditor) | `{}`                                     |
| `p2l6.tsx`            | `default` (NameInput)     | `{}`                                     |
| `p2l7.tsx`            | `default` (CourseCard)    | `{ title, durationMinutes, instructor }` |
| `index.tsx`           | `UserProfile`             | `{ name, age: <p>28</p>, isOnline }`     |
| `explicit_syntax.tsx` | `ExplicitSyntaxDemo`      | `{}`                                     |
| `event_handler.tsx`   | `"none"`                  | — (the file is entirely commented out)   |

`"none"` means "there is nothing to render"; the playground shows a note instead of a preview.

---

## 5. The compile → preview flow

### 5.1 Compile (server)

`app/api/playground/compile/route.ts` runs Sucrase on the server so the browser never downloads a
compiler:

```ts
transform(source, {
  transforms: ["typescript", "jsx", "imports"],
  jsxRuntime: "automatic",
  production: true,
  filePath: fileName,
});
```

The `imports` transform turns `export default Foo` into `exports.default = Foo`.

The iframe is a separate document and cannot inherit the app's stylesheet. Before returning, the
route scans the current TSX for Tailwind candidates and compiles those utilities with the app's
global theme. This happens for every compile, so classes added in the editor work without saving
the file first.

**Components that are declared but never exported.** A component like `UserList` in `P2L4.tsx` is
only a local binding after compilation, so the sandbox could not reach it on `exports`. The compile
route therefore appends one line when the file does not already export that name:

```js
exports.__target = UserList;
```

The sandbox's lookup order is: `__target` → the requested name → `default` → the only exported
function.

### 5.2 Evaluate (inside the iframe)

`lib/playground/sandbox-runtime.ts` is compiled with Sucrase (TypeScript transform only) and
inlined into the sandbox document. It evaluates the module by **injecting a `<script>` element**
carrying the document's CSP nonce — not `new Function()`, because the policy does not allow
`unsafe-eval`. The script body is set via `textContent`, so a `</script>` inside the learner's
code cannot break out of the document.

A small `require` shim resolves `react`, `react-dom`, `react-dom/client` and `react/jsx-runtime`.
Any other import throws a clear error. React's hooks are additionally injected as bare globals so a
file works even without an `import` line.

The generated stylesheet travels with each render request and is applied through a nonce-bearing
`<style>` element in the iframe. Clearing the preview also clears these styles.

### 5.3 Render

`ReactDOMClient.createRoot` renders into the sandbox's `#root` element. `onUncaughtError` and
`onRecoverableError` forward React's own errors back to the app as runtime errors.

### 5.4 Props across the boundary

React elements cannot be structured-cloned (they hold functions and symbols), so
`lib/playground/props.ts` converts them into a serialisable description:

```ts
type PlaygroundElementSpec = {
  __element: string; // e.g. "p"
  props?: { [key: string]: PlaygroundPropValue };
  children?: PlaygroundPropValue;
};
```

The sandbox rebuilds them with `React.createElement`. A composite element (a component rather
than an HTML tag) cannot be described this way and raises a clear error.

---

## 6. The sandbox and its real security limits

> **Read this section before claiming the sandbox is "secure".**
> It is a _learning aid on a local machine_. It is **not** a security boundary for untrusted
> internet users.

### 6.1 What is genuinely enforced (all verified in a real browser)

| Property                           | How                                                             | Verified result                                 |
| ---------------------------------- | --------------------------------------------------------------- | ----------------------------------------------- |
| Opaque origin                      | `<iframe sandbox="allow-scripts">` — **no** `allow-same-origin` | `window.origin === "null"`                      |
| Cannot read the app's DOM          | Opaque origin                                                   | `SecurityError`                                 |
| Cannot read the app's URL          | Opaque origin                                                   | `SecurityError`                                 |
| Cannot read the app's storage      | Opaque origin                                                   | `SecurityError`                                 |
| Cannot read cookies                | Opaque origin                                                   | `SecurityError`                                 |
| Cannot use the network             | CSP `connect-src 'none'`                                        | `Failed to fetch` — blocked by CSP              |
| Cannot use `eval()`                | CSP `script-src` has no `'unsafe-eval'`                         | `EvalError` when called from inside the sandbox |
| Other frames cannot talk to it     | Every message must carry the random token                       | Wrong token → rejected, module not evaluated    |
| The app only accepts its own frame | `event.source === iframe.contentWindow`                         | Checked on every message                        |

The sandbox document's Content Security Policy, as served:

```
default-src 'none';
script-src 'nonce-<random>' 'strict-dynamic';
style-src 'unsafe-inline';
img-src data: blob:;
font-src 'none';
connect-src 'none';
form-action 'none';
base-uri 'none';
frame-ancestors 'self'
```

### 6.2 What is NOT enforced — real limitations

1. **The learner can forge console and error messages.** The learner's code runs _in_ the frame
   that holds the shared token, so it can read `window.__pbConfig.token` and post a message the app
   will accept. **Verified:** code inside the sandbox successfully forged a `log` message that the
   app rendered in its console panel. This is cosmetic spoofing — it cannot affect the app's state
   — but the console output is therefore _not_ tamper-proof.
2. **The token is not a privilege boundary.** It stops _other_ documents and frames from
   interfering. It does not protect the app from the code it is protecting.
3. **The compile API is open to anyone who can reach the server.** `POST /api/playground/compile`
   accepts arbitrary source and runs Sucrase on it. It is a _transform_, not an execution, so this
   is low risk — but the endpoint is unauthenticated. It is only reachable on 127.0.0.1 in practice.
4. **The vendor bundle is served with a permissive CSP of its own.** The sandbox's strict CSP
   applies to the sandbox document; the vendor route serves JavaScript with no CSP of its own.
5. **Type errors are not reported.** The compile step is a Sucrase _transform_, not a type check.
   A file with type errors compiles and runs; only syntax errors fail.
6. **The practice files are compiled with `production: true`**, so React's development warnings are
   absent from the compiled output even though the React _runtime_ is the development build.

---

## 7. Component reference

| File                                                  | Role                                                                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `components/lab-shell.tsx`                            | App shell. Sticky header + a full-height `<main>` (`lg:min-h-0`) so the playground fills the viewport. |
| `components/lab-header.tsx`                           | Compact header: "React Code Playground" + the theme switch.                                            |
| `components/theme-toggle.tsx`                         | Light / Dark / System buttons with `aria-pressed`.                                                     |
| `components/theme-provider.tsx`                       | Theme state, `localStorage` key `react-lab-theme`, follows the OS when set to `system`.                |
| `components/storage-cleanup.tsx`                      | Deletes the orphaned `react-lab-progress` key once on mount.                                           |
| `components/playground/playground.tsx`                | The workspace: file tabs, view switch, editor, preview, console; owns the compile debounce.            |
| `components/playground/playground-view-toggle.tsx`    | The **Split / Code / Preview** view controls.                                                           |
| `components/playground/playground-editor.tsx`         | `<textarea>` editor with Tab-insert, status label and Reset button.                                    |
| `components/playground/playground-preview.tsx`        | The `<iframe>` and the `postMessage` bridge; validates the source and token.                           |
| `components/playground/playground-console.tsx`        | Renders captured log lines.                                                                            |
| `components/playground/playground-error-boundary.tsx` | Catches app-side render errors so a broken preview never takes down the page.                          |

### 7.1 Keyboard support

The file list is a proper ARIA `tablist`:

- `tabIndex` is a **roving** value — only the selected tab is `0`, the rest are `-1`.
- `ArrowLeft` / `ArrowRight` move the selection and wrap around.
- `Home` / `End` jump to the first / last file.
- The focus moves with the selection.

Every interactive control has a visible focus ring
(`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]`).
The `<textarea>` keeps `outline-none` (so the caret is not doubled), but its scroll container uses
`focus-within:outline-2`, so the editor still shows a visible ring when focused.

---

## 8. Complete file inventory

### 8.1 Application routes

| File                                     | Lines | Purpose                                      |
| ---------------------------------------- | ----- | -------------------------------------------- |
| `app/layout.tsx`                         | 73    | Root layout, fonts, metadata, theme boot     |
| `app/page.tsx`                           | 18    | Renders `<Playground />` and nothing else    |
| `app/not-found.tsx`                      | 20    | 404 page                                     |
| `app/globals.css`                        | 134   | Tailwind v4 import, design tokens, utilities |
| `app/api/playground/compile/route.ts`    | 135   | Server-side TSX + Tailwind CSS compile       |
| `app/playground/sandbox/route.ts`        | 188   | The sandbox document + CSP                   |
| `app/playground/sandbox/vendor/route.ts` | 20    | The React runtime bundle                     |

### 8.2 Components

| File                                                  | Lines | Purpose                 |
| ----------------------------------------------------- | ----- | ----------------------- |
| `components/lab-shell.tsx`                            | 21    | App shell               |
| `components/lab-header.tsx`                           | 35    | Compact header          |
| `components/theme-provider.tsx`                       | 84    | Theme state             |
| `components/theme-toggle.tsx`                         | 54    | Theme switch            |
| `components/storage-cleanup.tsx`                      | 17    | Obsolete-key cleanup    |
| `components/playground/playground.tsx`                | 605   | The workspace           |
| `components/playground/playground-view-toggle.tsx`    | 63    | Split / Code / Preview switch |
| `components/playground/playground-editor.tsx`         | 248   | Editor + Reset + highlight layer |
| `components/playground/playground-preview.tsx`        | 255   | Iframe + message bridge |
| `components/playground/playground-console.tsx`        | 75    | Console panel           |
| `components/playground/playground-error-boundary.tsx` | 61    | Error boundary          |
| `components/playground/playground-width-toggle.tsx`   | 71    | Full / Phone / Tablet / Laptop |
| `components/playground/playground-props-editor.tsx`   | 130   | Editable props panel    |

### 8.3 Library

| File                                | Lines | Purpose                                        |
| ----------------------------------- | ----- | ---------------------------------------------- |
| `lib/storage.ts`                    | 25    | Deletes the obsolete progress key              |
| `lib/playground/files.ts`           | 49    | Discovers the `practice/*.tsx` files           |
| `lib/playground/registry.tsx`       | 80    | File → component + props mapping               |
| `lib/playground/protocol.ts`        | 166   | Message types, token, message validation       |
| `lib/playground/props.ts`           | 127   | React props → serialisable form                |
| `lib/playground/styles.ts`          | 29    | Generates Tailwind CSS for the active TSX source |
| `lib/playground/vendor.ts`          | 189   | Builds the React runtime bundle for the iframe |
| `lib/playground/sandbox-runtime.ts` | 383   | Runs inside the iframe                         |
| `lib/playground/typecheck.ts`       | 237   | Runs the TypeScript 7 checker over the source  |
| `lib/playground/highlight.ts`       | 67    | Prism highlighting for the code pane            |
| `lib/playground/drafts.ts`          | 75    | Auto-saved drafts in `localStorage`            |

### 8.4 Practice files (never modified by the app)

`practice/P2L3.tsx` · `practice/P2L4.tsx` · `practice/p2l5.tsx` · `practice/p2l6.tsx` ·
`practice/p2l7.tsx` · `practice/index.tsx` · `practice/event_handler.tsx` ·
`practice/explicit_syntax.tsx`

### 8.5 Configuration

`package.json` · `tsconfig.json` · `next.config.ts` · `postcss.config.mjs` · `next-env.d.ts`

### 8.6 Dependencies

**Runtime:** `next` `react` `react-dom` `sucrase` `tailwindcss` `typescript` `@tailwindcss/postcss` `@tailwindcss/oxide` `postcss` `prismjs`
**Dev:** `@types/node` `@types/react` `@types/react-dom` `@types/prismjs`

Every one of these is used. `prism-react-renderer` was removed together with the lesson code pane;
`prismjs` + `@types/prismjs` were added on 2026-10-22 for the playground's own syntax
highlighting.

---

## 9. Theme system

`components/theme-provider.tsx` owns the theme. The three values are `light`, `dark` and `system`;
`system` follows the OS preference through a `matchMedia` listener.

The theme is persisted under the `localStorage` key **`react-lab-theme`**.

**FOUC-free boot.** `app/layout.tsx` inlines a small script in `<head>` that reads the stored
theme and toggles the `.dark` class _before_ the first paint, so the page never flashes the wrong
colour scheme.

**The preview follows the app.** The resolved theme is sent to the sandbox over `postMessage` as a
`theme` request; the runtime toggles `.dark` and `colorScheme` on the sandbox's `<html>`. Verified
in both directions (light → `class=""`, dark → `class="dark"`).

### 9.1 Obsolete storage

The removed progress feature wrote to **`react-lab-progress`**. `components/storage-cleanup.tsx`
deletes that key once on mount, so old data does not linger in the browser. The `react-lab-theme`
key is untouched. Verified in a browser: the progress key is removed, the theme key survives.

---

## 10. Styling and layout

**Tailwind CSS v4** — no `tailwind.config.js`. The theme lives in an `@theme { … }` block in
`app/globals.css`; the PostCSS plugin is `@tailwindcss/postcss` (configured in
`postcss.config.mjs`).

**Design tokens** are CSS custom properties on `:root` and `.dark`:

```
--surface-base  --surface-raised  --surface-sunken
--surface-border  --surface-border-strong
--text-strong  --text-muted  --text-subtle
--accent  --accent-contrast  --highlight
```

The Emerald/Gold palette is preserved from the earlier design work.

**Typography** — `next/font/google` provides Inter (`--font-inter`), JetBrains Mono
(`--font-mono-code`) and Noto Sans Myanmar (`--font-myanmar`, subsets `["myanmar", "latin"]`), so
Burmese text renders correctly.

**Layout** (original measurements from 2026-10-21, before Split mode):

| Viewport   | Result                                                                                                            |
| ---------- | ----------------------------------------------------------------------------------------------------------------- |
| 1440 × 900 | **One** panel fills the width (579 px) + console (160 px). `scrollHeight === 900` — the page does **not** scroll. |
| 390 × 844  | The visible panel is 492 px + console 160 px. No horizontal overflow.                                             |

The updated Split / Code / Preview layout **was** measured in a browser — see §11.6.

In Split mode, both panels are visible side by side on desktop and the editor remains visible on
small screens; Code and Preview modes show just the selected panel. Hidden panels remain mounted,
so the editor keeps its cursor position and the sandbox keeps its rendered result when switching.
The breakpoint is `lg`; panels have a 320 px minimum height on small screens and fill the available
workspace height on desktop.

**The `dark:` variant** is declared explicitly in `app/globals.css`:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

The app and the preview both drive their colour scheme from a `.dark` class on `<html>`, not from
the operating system's preference. Without this declaration Tailwind emits the `dark:` utilities
inside a `@media (prefers-color-scheme: dark)` query, so they never match the class the app
actually toggles — the preview would keep the light colours in dark mode.

### 10.1 The height chain — why `h-full` collapses the editor

This is the single most important layout fact in the project, and it is a **CSS trap** that is easy
to reintroduce.

A **percentage height** (`height: 100%`, which is what Tailwind's `h-full` compiles to) can only be
resolved against a parent with a **definite** height. When the parent is a **flex item**, its
height comes from the flex algorithm, not from a definite box — so the percentage cannot be
resolved and silently falls back to `auto`, i.e. **the height of the element's own content**.

That is exactly what happened:

| Box                            | Before (broken) | After (fixed)  |
| ------------------------------ | --------------- | -------------- |
| Editor panel (`h-full`)        | 124 px          | 359 px         |
| Scroll container               | 81 px           | 315 px         |
| `<textarea>` (≈ lines visible) | 74 px (≈ 2)     | 315 px (≈ 13)  |
| Preview `<iframe>` (`h-full`)  | 150 px          | 319 px (fills) |

**The rule:** in the height path, use **flex sizing** (`flex-1`, `min-h-0`) and avoid percentage
heights entirely.

- `components/playground/playground-editor.tsx` — the panel is `flex-1` of a flex column (was
  `h-full`); the scroll container is a flex column; the `<textarea>` is `flex-1` and is the element
  that scrolls (`overflow-auto`), so the scrollbar belongs to the textarea.
- `components/playground/playground-preview.tsx` — the `<iframe>` is `flex-1` (was `h-full`).
- `components/playground/playground.tsx` — the two wrappers around the panels are flex columns;
  the preview's `relative` holder is a flex column.
- `components/playground/playground-error-boundary.tsx` — the fallback error card is `flex-1` so it
  fills the preview box when it replaces the frame.

The `min-h-0` on every level is what allows a flex item to shrink below its content height —
without it, the textarea's content would push the panel open and the page would scroll again.

### 10.2 The Split / Code / Preview switch

`components/playground/playground-view-toggle.tsx` offers `◫ Split`, `⌨ Code` and `▷ Preview`
buttons with `aria-pressed` on the active one. Split is available on desktop; on smaller screens,
Code and Preview remain as single-panel views.

One deliberate addition: when a compile or runtime error occurs, a **compact error strip** appears
above the editor (`role="alert"`, truncated message, a **Details** button). The full error text
still lives over the preview, but the learner may be looking at the editor — and the **Details**
button switches the view to the preview, where the whole message is shown.

### 10.3 Syntax highlighting

The code pane shows the source in colour. The highlighting is done **on the server**, by Prism, and
the resulting HTML is sent alongside the compiled code.

The implementation is in `lib/playground/highlight.ts`:

- Prism's language definitions are **plugins** that register themselves on a global `Prism`
  object, so the three components the TSX grammar needs — `prism-typescript.js`, `prism-jsx.js`
  and `prism-tsx.js` — are read from `node_modules/prismjs/components` and evaluated once, on the
  first call. The result is cached.
- `Prism.highlight(source, Prism.languages.tsx, "tsx")` returns Prism's own markup:
  `<span class="token keyword">…</span>` and friends.

The HTML is rendered in a `<pre aria-hidden="true">` **behind** the `<textarea>`. The textarea's
own text is transparent, so the browser still owns the caret, the selection and the keyboard, while
the coloured layer shows through. Both layers use the same padding, font size and line height, and
the textarea's scroll position is copied onto the layer on every scroll, so the colours stay
aligned with the text.

The token colours are defined in `app/globals.css` as `--code-keyword`, `--code-string`,
`--code-number`, `--code-function`, `--code-operator`, `--code-punctuation` and `--code-regex`, so
they follow the app's own Emerald/Gold palette in both light and dark mode.

The code pane does **not** wrap long lines. The `<textarea>` uses `wrap="off"`, so a long line stays
on one line and the pane scrolls sideways — that is what a code editor does, and it is the only way
the caret can sit *on* a character instead of in the middle of a wrapped line. The highlight layer
uses `whitespace-pre` for the same reason, and the two layers are kept the same width with a
`ResizeObserver` (the textarea's scrollbar makes its content box a few pixels narrower than the
layer, and the difference is added to the layer's right padding).

### 10.4 Type checking

Sucrase only *strips* types — it never checks them, so a wrong type used to pass silently. The
playground now runs the **real TypeScript checker** over the edited source.

`lib/playground/typecheck.ts` uses the **TypeScript 7 native API** (`typescript/unstable/sync`),
which drives the `tsgo` binary that ships with the `typescript` package. The API talks to a
long-lived compiler process over a pipe, so the program is built **once** and reused for every
edit.

The edited source is handed to the compiler through a **virtual file system overlay**: the
compiler's `readFile` callback returns the edited text for the practice file and reads everything
else from disk. The learner's files are therefore never touched, and `react` and its types resolve
exactly as they do in the project.

| Measurement                    | Time    |
| ------------------------------ | ------- |
| Cold program (first check)     | ~1.5 s  |
| Re-check of an edited file     | ~2–7 ms |
| Full compile request (warm)    | ~200 ms |

The diagnostics are **not** compile errors — the code still compiles and still renders — so they
get their own, quieter panel under the editor (`role="status"`, an amber border, the line and
column of each problem). The preview keeps working.

### 10.5 Auto-saved drafts

The playground never writes to the learner's files, so an edit used to be lost on a refresh.
`lib/playground/drafts.ts` keeps the edited buffers in `localStorage` under
`react-lab-playground-drafts`.

- Only the files that **differ from disk** are stored, so the payload stays small and an untouched
  file is never shadowed by a stale draft.
- The drafts are restored in an effect after the first mount, so the server-rendered markup and the
  first client render agree.
- The **Reset** button drops the draft as well as restoring the on-disk source.
- Storage can be unavailable (private mode, a locked-down browser), so every function fails
  silently. A missing draft store never breaks the editor.

### 10.6 Editable props

The practice files take their props from a small registry (see `lib/playground/registry.tsx`).
`components/playground/playground-props-editor.tsx` puts a small panel under the editor — a
`<details>` element, so it stays out of the way — where those values can be changed.

- Only the **primitive** props are editable. A prop that holds a React element (like
  `index.tsx`'s `age`) is shown read-only, because it cannot be typed into a text field.
- The values the learner changes are applied **on top of** the registry's own values and are
  re-sent to the sandbox, so the preview updates immediately.
- A `↺` button removes one override and restores the registry's value.

### 10.7 Preview device widths

`components/playground/playground-width-toggle.tsx` sits next to the preview's status badge and
offers **Full** (fill the panel), **Phone** (390 px), **Tablet** (768 px) and **Laptop** (1280 px).

A fixed width is centred inside the panel and gets its own border and rounded corners, so a
responsive component can be checked at the size it would really have on a device. The frame still
fills the panel when no width is chosen.

---

## 11. Verification results

All results below were **actually run and observed** on 2026-10-21.

### 11.1 Commands

| Command             | Result                                                                  |
| ------------------- | ----------------------------------------------------------------------- |
| `npm run typecheck` | **Exit code 0** — no errors (run with a cleared `tsconfig.tsbuildinfo`) |
| `npx next build`    | **Exit code 0** — compiled successfully, no warnings, 6 pages generated |

**Follow-up on 2026-10-22:** `npm run typecheck` passed, and a Tailwind generation check against
`practice/p2l8.tsx` confirmed its light/dark utilities plus new unsaved utilities produce CSS.
The production build could not be re-verified in this sandbox: Turbopack's CSS worker exited before
the build process could connect to it.

**Layout follow-up on 2026-10-22:** `npm run typecheck` passed after adding Split / Code / Preview
views and cancelling superseded compile requests. The layout was then measured in a real browser
against `next dev` — see §11.6.

**Feature follow-up on 2026-10-22 (syntax highlighting, type checking, drafts, props, device
widths):** `npm run typecheck` passed with exit code 0. The `prismjs` and `@types/prismjs` packages
were added; `typescript` was already a dependency and provides the native `tsgo` binary the type
checker drives. Every new feature was exercised in a real browser — see §11.6.

Build output route table:

```
Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/playground/compile
├ ƒ /playground/sandbox
└ ƒ /playground/sandbox/vendor
```

### 11.2 Browser verification (Playwright against `next dev`)

| #   | Check                                                    | Result                                                                                                                        |
| --- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 1   | `/` opens the playground directly (no redirect, no hero) | ✅ editor + preview + console present; title "React Code Playground"                                                          |
| 2   | All 8 `practice/*.tsx` files appear in the selector      | ✅ 8 tabs                                                                                                                     |
| 3   | Editing the source updates the preview                   | ✅ `<h2 id="s4">STEP4-OK</h2>`                                                                                                |
| 4   | Compile error is displayed clearly                       | ✅ `role="alert"`, "Compile မအောင်မြင်ပါ", status badge → `error`; the app keeps running                                      |
| 5   | Runtime error is displayed clearly                       | ✅ `role="alert"`, "Runtime error ဖြစ်ပါတယ်" + the thrown message; the app keeps running                                      |
| 6   | Reset restores the file's original content               | ✅ original source restored, preview back to the original component, button becomes disabled                                  |
| 7   | Console output                                           | ✅ `log — step4 verified`; the **Clear** button empties the panel                                                             |
| 8   | Theme switching                                          | ✅ Light / Dark / System all apply to the app **and** the preview iframe; `aria-pressed` updates; persisted to `localStorage` |
| 9   | Desktop layout                                           | ✅ one panel, no page scroll, no horizontal overflow                                                                          |
| 10  | Mobile layout                                            | ✅ one panel, no horizontal overflow                                                                                          |
| 11  | Every practice file renders                              | ✅ see the table below                                                                                                        |
| 12  | Removed lesson routes are gone                           | ✅ `/lesson/jsx-rendering` → **404**                                                                                          |
| 13  | Dev server binding                                       | ✅ listening socket is `127.0.0.1:3000` only                                                                                  |
| 14  | **Code / Preview switch**                                | ✅ on narrow screens only one panel is visible; the switch updates `aria-pressed`                                              |
| 15  | **Error strip in Code view**                             | ✅ `role="alert"` above the editor; the **Details** button switches to the preview                                            |
| 16  | **Switching views**                                      | ✅ the editor keeps its content and the sandbox keeps its rendered result (panels are hidden, not unmounted)                  |
| 17  | **The editor fills its panel**                           | ✅ textarea 315 px (≈ 13 lines) instead of 74 px (≈ 2 lines)                                                                  |
| 18  | **The preview fills its panel**                          | ✅ iframe 319 px = the height of its box, instead of 150 px                                                                   |
| 19  | **No percentage heights left in the height path**        | ✅ verified by measuring the computed height of every box in the chain                                                        |

**Per-file render results (all 8):**

| File                  | Preview output                                                       |
| --------------------- | -------------------------------------------------------------------- |
| `P2L3.tsx`            | `<form><input type="text"><button>Search</button></form>`            |
| `P2L4.tsx`            | `<button> Fetch </button>`                                           |
| `p2l5.tsx`            | `<h1> No User Loaded </h1> … Load Demo User / Clear`                 |
| `p2l6.tsx`            | `<input type="text"><p></p>`                                         |
| `p2l7.tsx`            | `<article><h2>Mingalarpar</h2><p>Duration: 60</p>…</article>`        |
| `index.tsx`           | `<h2> Mingalarpar Online </h2><p>Age: <p>28</p></p>`                 |
| `explicit_syntax.tsx` | _(empty — the component has no `return` statement; no error shown)_  |
| `event_handler.tsx`   | _(no preview — the file is entirely commented out; a note is shown)_ |

### 11.3 Isolation checks (measured inside the sandbox frame)

| Attempt                                                          | Result                                 |
| ---------------------------------------------------------------- | -------------------------------------- |
| Read `window.parent.document`                                    | `SecurityError`                        |
| Read `window.parent.location`                                    | `SecurityError`                        |
| Read `window.parent.localStorage`                                | `SecurityError`                        |
| Read `window.localStorage`                                       | `SecurityError`                        |
| Read `document.cookie`                                           | `SecurityError`                        |
| `window.origin`                                                  | `"null"`                               |
| `fetch()` to the compile API                                     | blocked by `connect-src 'none'`        |
| `eval("1+1")`                                                    | `EvalError`                            |
| `postMessage` with a wrong token                                 | rejected; the module was not evaluated |
| `postMessage` with the correct token **from inside the sandbox** | **accepted — the known limitation**    |

### 11.4 Stale-reference sweep

```
git grep -n -E "lesson|useProgress|ProgressProvider|streak|visited|code-pane|
  lesson-demos|lesson-view|progress-store|lib/lessons|lesson-index|lab-sidebar"
```

The only remaining matches are (a) comments inside the learner's own practice files and (b) the
comments in `lib/storage.ts` / `components/storage-cleanup.tsx` that explain _why_ the obsolete key
is deleted. There are **no** imports of any removed module, and **no** references to `/lesson/*`.

Dependency audit: every declared dependency is used. `prism-react-renderer` was already removed in
the lesson-cleanup step.

### 11.5 STEP 5 — folder move + single-panel workspace

| Check                                              | Result                                                                                   |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| The eight practice files live in `practice/`       | ✅ `git mv` — history preserved (`R P2L3.tsx -> practice/P2L3.tsx`, …)                   |
| The playground still discovers all eight           | ✅ 8 tabs in the tablist, sourced from `import.meta.glob("/practice/*.tsx", …)`          |
| The `?raw` Turbopack rule still applies            | ✅ the rule glob `"*.tsx"` has no `/`, so Turbopack matches it against the **file name** |
| Every practice file still renders                  | ✅ all 8 verified in a real browser (table in §11.2)                                     |
| The registry still resolves each file              | ✅ keys are file names only; the `practice/` prefix is stripped by `toFileName()`        |
| Only one panel is on screen                        | ✅ original Code / Preview mode hides the other section                                |
| The switch updates `aria-pressed`                  | ✅ original Code / Preview buttons report the active view                               |
| The page still does not scroll on desktop          | ✅ `scrollHeight === innerHeight === 900`                                                |
| No horizontal overflow on desktop or mobile        | ✅ checked at 1440 × 900 and 390 × 844                                                   |
| The error is visible while the editor is on screen | ✅ a compact `role="alert"` strip sits above the editor, with a **Details** button       |
| **Details** jumps to the preview                   | ✅ clicking it sets the view to `preview` and the full message is shown                  |
| Reset still restores the file from disk            | ✅ the buffer goes back to the on-disk source and the button becomes disabled            |

### 11.6 Split mode + the new features (2026-10-22)

Measured in a real browser against `next dev` at **1240 × 817** and **390 × 844**.

| #   | Check                                                     | Result                                                                                             |
| --- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 20  | **Split mode** shows both panels                         | ✅ `gridTemplateColumns: 580.014px 580.014px`; editor 578 px, iframe 578 px, both 460 px tall     |
| 21  | The page does not scroll sideways in Split mode          | ✅ `scrollWidth === innerWidth === 1240`                                                            |
| 22  | The **Split** button is hidden on mobile                 | ✅ `display: none` at 390 × 844; `scrollWidth === innerWidth === 390`                               |
| 23  | **Syntax highlighting** is rendered                      | ✅ 121 `.token` spans for `P2L3.tsx`; the textarea's colour is `rgba(0, 0, 0, 0)`                   |
| 24  | The highlight layer lines up with the textarea           | ✅ both boxes are `x: 32.9, y: 200.6, 1174.2 × 459.8`                                             |
| 25  | The token colours follow the theme                       | ✅ keyword `lab(45.06 …)` in light, `lab(77.87 …)` in dark                                         |
| 26  | **Type errors** are reported                              | ✅ `useState<number>('')` → 2 errors, listed as `5:47` and `8:14` with the compiler's own messages   |
| 27  | A type error does **not** break the preview               | ✅ the status badge still says `live` and the component still renders                               |
| 28  | **Reset** clears the type errors and the `edited` badge   | ✅ the panel disappears and the button becomes disabled                                             |
| 29  | **Drafts survive a reload**                              | ✅ the edit was still in the textarea after `page.reload()`; the draft was in `localStorage`          |
| 30  | **The props panel** lists the registry's props            | ✅ `p2l7.tsx` → `title`, `durationMinutes`, `instructor` with their registry values                  |
| 31  | **A prop override reaches the preview**                  | ✅ `title` → "Course Title Changed" rendered as the `<h2>` inside the iframe                         |
| 32  | **The device-width toggle** resizes the frame             | ✅ Phone → the frame is 390 px wide with a border and 8 px radius; Full → 1174 px                   |
| 33  | The width toggle is reachable on mobile                   | ✅ the Phone button is present at 390 × 844                                                        |
| 34  | The compile API returns the new payloads                 | ✅ `code` 953 B, `css` 8483 B, `html` 5353 B, `diagnostics` 0 — in 4.4 s cold / 197 ms warm          |
| 35  | **The code pane scrolls sideways** instead of wrapping    | ✅ `wrap="off"`, `white-space: pre`; a 220-character line gives `scrollWidth 1982 > clientWidth 1164` |
| 36  | The highlight layer scrolls with the textarea            | ✅ `pre.scrollLeft === textarea.scrollLeft` after a 300 px scroll                                |
| 37  | The two layers have the same content width               | ✅ 1132 px each; the layer's right padding absorbs the 10 px scrollbar gutter                      |
| 38  | The **`dark:` variant** works in the preview              | ✅ the card is emerald-950 and the heading is gold-400 in dark mode (it stayed white before)        |

The compile API was also called directly with a deliberately broken file
(`useState<number>('')` instead of `useState<string>('')`); it returned the two expected
`TS2345` diagnostics.

---

## 12. Remaining known limitations

| #   | Limitation                                                                                   | Impact                                                                         |
| --- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1   | The sandbox is **not** a security boundary — code inside it can forge console/error messages | Cosmetic spoofing of the console panel only                                    |
| 2   | `POST /api/playground/compile` is unauthenticated                                            | Only reachable on 127.0.0.1; it transforms, never executes                     |
| 3   | The compile step does **not** type-check                                                     | **Fixed on 2026-10-22** — the real TypeScript checker now runs (§10.4)                          |
| 4   | `index.tsx` renders `<p>` inside `<p>`                                                       | React logs "cannot be a descendant of `<p>`" — this is the learner's own file  |
| 5   | `explicit_syntax.tsx` has no `return` statement                                              | The preview is empty; no error is reported (React allows a `undefined` return) |
| 6   | `event_handler.tsx` is entirely commented out                                                | Shows a note instead of a preview — expected                                   |
| 7   | Next.js logs a "font was preloaded but not used" warning                                     | Cosmetic; caused by `next/font` preloading the Myanmar/Inter subsets           |
| 8   | There is no ESLint configuration                                                             | `npx next lint` is not valid in Next 16                                        |
| 9   | `import.meta.glob` is Turbopack-only                                                         | The project cannot be built with webpack                                       |
| 10  | Split mode shows the editor and preview together only on desktop                             | On small screens, use the **Code / Preview** views to preserve usable space     |
| 11  | The compile request is sent after typing pauses (debounced 180 ms)                           | Very fast typing still waits briefly before recompiling                        |
| 12  | The editor's scrollbar belongs to the `<textarea>`, not the panel                            | Cosmetic; the panel keeps its rounded border and focus ring                    |
| 13  | The first type check of a session costs ~1.5 s                                            | The compiler process is started once and then reused; later checks cost ~2–7 ms |
| 14  | The `tsgo` compiler process outlives the request                                           | It is a long-lived child of the dev server; `closeTypeChecker()` shuts it down  |

---

## Appendix A — Command reference

```bash
# Development (binds to 127.0.0.1 only)
npm run dev

# Verification
npm run typecheck        # tsc -b
npx next build           # production build
npx next start           # serve the production build

# Package management
npm install
npm uninstall <package>

# Windows note
# If npm is not on PATH, use npm.cmd / npx.cmd
```

---

## Appendix B — Message protocol

Defined in `lib/playground/protocol.ts`.

### App → sandbox

| Type     | Payload                                   |
| -------- | ----------------------------------------- |
| `render` | `{ token, type, code, css, component, props }` |
| `theme`  | `{ token, type, theme }`                  |
| `clear`  | `{ token, type }`                         |

### Sandbox → app

| Type       | Payload                                  |
| ---------- | ---------------------------------------- |
| `ready`    | `{ token, type }`                        |
| `rendered` | `{ token, type }`                        |
| `cleared`  | `{ token, type }`                        |
| `log`      | `{ token, type, level, text }`           |
| `error`    | `{ token, type, kind, message, stack? }` |

`kind` is `"no-component"` (the file compiled but has nothing to render) or `"runtime"` (the code
threw). `level` is one of `log`, `info`, `warn`, `error`.

Both sides validate the message shape (`isSandboxMessage`) and the token. The app additionally
checks `event.source === iframe.contentWindow`.

---

## 13. Issues 5–7 — playground refactor, naming, and bug fixes (2026-10-26)

### Issue 5 — Extract three hooks from `components/playground/playground.tsx`

`components/playground/playground.tsx` (~700 lines) carried far too much state. Three
independent concerns were peeled out into dedicated, reusable hooks:

- **`usePlaygroundCompile`** — `components/playground/use-playground-compile.ts`
  (`usePlaygroundCompile.ts` shim also created).
  Owns compile-and-preview state (`status`, `compileError`, `runtimeError`,
  `compiledCode`, `compiledCss`, `highlightedHtml`, `typeDiagnostics`) plus the
  debounced `/api/playground/compile` fetch, stale-request cancellation via
  `requestIdRef`/`AbortController`, and the "clear preview when a file has no
  component" effect. Emits `handleSandboxError` / `handleSandboxRendered`.
  Retains the 180 ms debounce and the Suspense-free request ordering.
- **`usePlaygroundConsole`** — `components/playground/use-playground-console.ts`
  Owns the buffered console entry list, `consoleIdRef`, `pendingLogsRef`, and
  `flushTimerRef` (120 ms flush timer, 200-line cap), the unmount timer cleanup,
  and exposes `handleSandboxLog` and `clearConsole`.
- **`usePlaygroundDrafts`** — `components/playground/use-playground-drafts.ts`
  Owns the first-mount draft restoration (from `localStorage`) and the reactive
  re-save effect triggered by `buffers`/`files` changes. `draftsRestoredRef`
  stays private inside the hook.

`playground.tsx` is now a thin layout component that calls the three hooks and
hands their values to the `PlaygroundEditor`, `PlaygroundPreview`, and
`PlaygroundConsole` components. Naming follows both `use-playground-*.ts` and
`usePlayground*.ts` so both camelCase and kebab-case imports resolve.

### Issue 6 — Rename `p2l5/p2l6/p2l7` → `P2L5/P2L6/P2L7`

Practice files renamed (via `git mv`) to `practice/P2L5.tsx`, `practice/P2L6.tsx`,
`practice/P2L7.tsx`, matching the existing `P2L3`/`P2L4` convention and the
sort order from `lib/playground/files.ts` (`localeCompare` with `numeric: true`,
`sensitivity: "base"`). `lib/playground/registry.tsx` keys updated accordingly.
`README.md` updated to reflect the new names.

### Issue 7 — `index.tsx` nested `<p>` + `explicit_syntax.tsx` missing return

- **Nested `<p>` bug.** `practice/index.tsx` declared `age: React.ReactElement`
  and rendered `<p>Age: {age}</p>` with `age = <p>28</p>`, producing a nested
  `<p>` inside `<p>` (invalid HTML). Fixed by changing the prop type to
  `age: number` and rewriting the rendered age as plain text. The registry entry
  for `index.tsx` was updated to `age: 28`, `isOnline: true`.
- **Missing return.** `practice/explicit_syntax.tsx`’s `ExplicitSyntaxDemo`
  declared state but had no `return` statement, so it rendered nothing. Added a
  default JSX return (heading, theme label, item list, and a theme toggle button)
  tied to the existing `item`/`theme` state.

### Verification

- `npx vitest run` — 4 test files, **48/48 tests pass**.
- `npx next build` — completes successfully (compiled in ~13.5 s, 6/6 static
  pages generated). Pre-existing `lib/playground/typecheck.ts` edge-runtime
  warning (`node:path`) is unchanged and unrelated to these issues.

---
## Appendix C — Glossary

| Term              | Meaning                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| **Practice file** | A `.tsx` file in `practice/` the learner edits. Never written to by the app. |
| **View switch**   | The Split / Code / Preview toggle. Split is side-by-side on desktop.         |
| **Sandbox**       | The preview iframe and its document. Opaque origin, strict CSP.              |
| **Token**         | A random string shared by the app and the sandbox; authenticates messages.   |
| **Vendor bundle** | React's CommonJS builds wrapped in a tiny `require` registry.                |
| **Turbopack**     | Next 16's bundler. Provides `import.meta.glob` and the `?raw` rule.          |
| **Sucrase**       | The TypeScript/JSX transformer used by the compile endpoint.                 |
| **tsgo**          | The native TypeScript 7 compiler binary; drives the type checker.            |
| **Draft reset**   | Restores the on-disk source and drops the draft for the active file.         |
| **Draft**         | An unsaved edit, kept in `localStorage` until it is reset or saved to disk.  |
| **FOUC**          | Flash of Unstyled Content — prevented by the inline theme boot script.       |
