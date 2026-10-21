# Detail Progress Summary

**Project:** `react-next` — React Code Playground
**Repository:** https://github.com/d9p9m9h/react-next.js-typescript_learning
**Path:** `C:\__d9p__\react-next`
**Stack:** Next.js 16.4.2 (App Router, Turbopack) · React 19.3 · TypeScript 7.0.2 · Tailwind CSS v4
**Purpose:** A **localhost-only** React/TypeScript code playground. The learner edits `.tsx` practice files and sees the result render live.
**Date:** 2026-10-21

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
├───────────────────────────┬──────────────────────────────┤
│ Source · ရေးမယ့် code      │ Preview · ရလဒ်               │
│ ┌───────────────────────┐ │ ┌──────────────────────────┐ │
│ │ P2L3.tsx  ● Compiled  │ │ │ ● Rendered result  [live]│ │
│ │ [Reset]               │ │ ├──────────────────────────┤ │
│ │                       │ │ │                          │ │
│ │   (textarea)          │ │ │  (sandboxed iframe)     │ │
│ │                       │ │ │                          │ │
│ └───────────────────────┘ │ └──────────────────────────┘ │
├───────────────────────────┴──────────────────────────────┤
│ Console                                          [Clear]  │
└──────────────────────────────────────────────────────────┘
```

The eight root-level `.tsx` files are the **practice content**. They are never modified by the
app — the playground reads them, shows them in the editor, and renders them in the preview.

| Concern        | How it is handled now                                               |
| -------------- | ------------------------------------------------------------------- |
| File selection | A `tablist` of every root-level `.tsx` file, keyboard-navigable     |
| Editing        | A plain `<textarea>`; changes are debounced 400 ms, then compiled   |
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
| `/api/playground/compile`    | Dynamic | `POST` — compiles TSX → CommonJS (Sucrase, server) |
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

---

## 4. How the source files are discovered

`lib/playground/files.ts` uses Turbopack's `import.meta.glob`:

```ts
const rawSources = import.meta.glob("/*.tsx", {
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

The pattern is anchored at the project root, so it picks up exactly the eight practice files and
nothing else — `app/`, `components/` and `lib/` live in sub-directories.

> **Turbopack-only feature.** `import.meta.glob` does not work under webpack. This project builds
> with Turbopack (`next dev` / `next build` in Next 16).

### 4.1 The registry — which component to render

`lib/playground/registry.tsx` maps each file to the component that should be previewed and the
props it needs. This is what lets the playground render a component that a file declares but never
exports.

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
| `components/playground/playground.tsx`                | The workspace: file tabs, editor, preview, console; owns the compile debounce.                         |
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
| `app/api/playground/compile/route.ts`    | 127   | Server-side TSX → CommonJS compile           |
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
| `components/playground/playground.tsx`                | 363   | The workspace           |
| `components/playground/playground-editor.tsx`         | 133   | Editor + Reset          |
| `components/playground/playground-preview.tsx`        | 209   | Iframe + message bridge |
| `components/playground/playground-console.tsx`        | 75    | Console panel           |
| `components/playground/playground-error-boundary.tsx` | 61    | Error boundary          |

### 8.3 Library

| File                                | Lines | Purpose                                        |
| ----------------------------------- | ----- | ---------------------------------------------- |
| `lib/storage.ts`                    | 25    | Deletes the obsolete progress key              |
| `lib/playground/files.ts`           | 41    | Discovers the root-level `.tsx` files          |
| `lib/playground/registry.tsx`       | 79    | File → component + props mapping               |
| `lib/playground/protocol.ts`        | 164   | Message types, token, message validation       |
| `lib/playground/props.ts`           | 127   | React props → serialisable form                |
| `lib/playground/vendor.ts`          | 189   | Builds the React runtime bundle for the iframe |
| `lib/playground/sandbox-runtime.ts` | 378   | Runs inside the iframe                         |

### 8.4 Practice files (never modified by the app)

`P2L3.tsx` · `P2L4.tsx` · `p2l5.tsx` · `p2l6.tsx` · `p2l7.tsx` · `index.tsx` ·
`event_handler.tsx` · `explicit_syntax.tsx`

### 8.5 Configuration

`package.json` · `tsconfig.json` · `next.config.ts` · `postcss.config.mjs` · `next-env.d.ts`

### 8.6 Dependencies

**Runtime:** `next` `react` `react-dom` `sucrase` `tailwindcss` `typescript`
**Dev:** `@tailwindcss/postcss` `postcss` `@types/node` `@types/react` `@types/react-dom`

Every one of these is used. `prism-react-renderer` was removed together with the lesson code pane.

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

**Layout** (measured in a real browser):

| Viewport   | Result                                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------ |
| 1440 × 900 | Two columns. `scrollHeight === 900` — the page does **not** scroll. Editor 511 px, preview 515 px, console 160 px. |
| 390 × 844  | Everything stacks vertically: editor (312 px) → preview (316 px) → console (160 px). No horizontal overflow.       |

The two-column breakpoint is `lg`. Below it, the editor and preview sections carry
`min-h-[380px]` so they stay usable; on large screens `lg:min-h-0` lets them fill the viewport.

---

## 11. Verification results

All results below were **actually run and observed** on 2026-10-21.

### 11.1 Commands

| Command             | Result                                                                  |
| ------------------- | ----------------------------------------------------------------------- |
| `npm run typecheck` | **Exit code 0** — no errors (run with a cleared `tsconfig.tsbuildinfo`) |
| `npx next build`    | **Exit code 0** — compiled successfully, no warnings, 6 pages generated |

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
| 2   | All 8 root-level `.tsx` files appear in the selector     | ✅ 8 tabs                                                                                                                     |
| 3   | Editing the source updates the preview                   | ✅ `<h2 id="s4">STEP4-OK</h2>`                                                                                                |
| 4   | Compile error is displayed clearly                       | ✅ `role="alert"`, "Compile မအောင်မြင်ပါ", status badge → `error`; the app keeps running                                      |
| 5   | Runtime error is displayed clearly                       | ✅ `role="alert"`, "Runtime error ဖြစ်ပါတယ်" + the thrown message; the app keeps running                                      |
| 6   | Reset restores the file's original content               | ✅ original source restored, preview back to the original component, button becomes disabled                                  |
| 7   | Console output                                           | ✅ `log — step4 verified`; the **Clear** button empties the panel                                                             |
| 8   | Theme switching                                          | ✅ Light / Dark / System all apply to the app **and** the preview iframe; `aria-pressed` updates; persisted to `localStorage` |
| 9   | Desktop layout                                           | ✅ two columns, no page scroll, no horizontal overflow                                                                        |
| 10  | Mobile layout                                            | ✅ stacked vertically, no horizontal overflow                                                                                 |
| 11  | Every practice file renders                              | ✅ see the table below                                                                                                        |
| 12  | Removed lesson routes are gone                           | ✅ `/lesson/jsx-rendering` → **404**                                                                                          |
| 13  | Dev server binding                                       | ✅ listening socket is `127.0.0.1:3000` only                                                                                  |

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

---

## 12. Remaining known limitations

| #   | Limitation                                                                                   | Impact                                                                         |
| --- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1   | The sandbox is **not** a security boundary — code inside it can forge console/error messages | Cosmetic spoofing of the console panel only                                    |
| 2   | `POST /api/playground/compile` is unauthenticated                                            | Only reachable on 127.0.0.1; it transforms, never executes                     |
| 3   | The compile step does **not** type-check                                                     | Type errors pass silently; only syntax errors are caught                       |
| 4   | `index.tsx` renders `<p>` inside `<p>`                                                       | React logs "cannot be a descendant of `<p>`" — this is the learner's own file  |
| 5   | `explicit_syntax.tsx` has no `return` statement                                              | The preview is empty; no error is reported (React allows a `undefined` return) |
| 6   | `event_handler.tsx` is entirely commented out                                                | Shows a note instead of a preview — expected                                   |
| 7   | Next.js logs a "font was preloaded but not used" warning                                     | Cosmetic; caused by `next/font` preloading the Myanmar/Inter subsets           |
| 8   | There is no ESLint configuration                                                             | `npx next lint` is not valid in Next 16                                        |
| 9   | `import.meta.glob` is Turbopack-only                                                         | The project cannot be built with webpack                                       |

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
| `render` | `{ token, type, code, component, props }` |
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

## Appendix C — Glossary

| Term              | Meaning                                                                    |
| ----------------- | -------------------------------------------------------------------------- |
| **Practice file** | A root-level `.tsx` file the learner edits. Never written to by the app.   |
| **Sandbox**       | The preview iframe and its document. Opaque origin, strict CSP.            |
| **Token**         | A random string shared by the app and the sandbox; authenticates messages. |
| **Vendor bundle** | React's CommonJS builds wrapped in a tiny `require` registry.              |
| **Turbopack**     | Next 16's bundler. Provides `import.meta.glob` and the `?raw` rule.        |
| **Sucrase**       | The TypeScript/JSX transformer used by the compile endpoint.               |
| **FOUC**          | Flash of Unstyled Content — prevented by the inline theme boot script.     |
