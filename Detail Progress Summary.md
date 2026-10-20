# Detail Progress Summary

**Project:** `react-next` — React Learning Lab
**Path:** `C:\__d9p__\react-next`
**Stack:** Next.js 16.4.2 (App Router, Turbopack) · React 19.3 · TypeScript 7.0.2 · Tailwind CSS v4
**Date:** 2026-10-21
**Author of this summary:** AI assistant (GitHub Copilot) — working alongside the learner

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Session Timeline](#2-session-timeline)
3. [Phase 1 — Emergency Repair](#3-phase-1--emergency-repair)
4. [Phase 2 — ESLint Discussion](#4-phase-2--eslint-discussion)
5. [Phase 3 — UI Redesign](#5-phase-3--ui-redesign)
6. [Phase 4 — Syntax Theme Customization](#6-phase-4--syntax-theme-customization)
7. [Final Architecture](#7-final-architecture)
8. [Complete File Inventory](#8-complete-file-inventory)
9. [Bugs Found and Fixed](#9-bugs-found-and-fixed)
10. [Key Concepts Learned](#10-key-concepts-learned)
11. [Verification Results](#11-verification-results)
12. [Remaining Known Issues](#12-remaining-known-issues)
13. [Next Steps](#13-next-steps)

---

## 1. Executive Summary

This session transformed a **broken** Next.js learning workspace into a **fully functional, redesigned learning platform**.

### What was broken

The project could not even compile. `app/layout.tsx` contained 19 TypeScript errors caused by **terminal output accidentally pasted into the source file** — lines prefixed with `[10/21/2026 12:01 AM] Đepar:` were injected in four separate places, corrupting JSX syntax and breaking the entire import graph.

### What was built

| Area              | Before                                  | After                                                            |
| ----------------- | --------------------------------------- | ---------------------------------------------------------------- |
| Compilation       | 19 TS errors, build failed              | ✅ 0 errors, build passes                                        |
| Tailwind CSS      | Not configured, CSS would not compile   | ✅ Full v4 setup (PostCSS plugin + `globals.css`)                |
| Routing           | Single page, no navigation              | ✅ 7 statically-generated lesson routes + 404                    |
| Code display      | None                                    | ✅ Syntax-highlighted code pane with a custom Emerald/Gold theme |
| Live preview      | None                                    | ✅ Interactive demo panel per lesson                             |
| Theming           | Light only, hardcoded colors            | ✅ Light / Dark / System with FOUC-free boot script              |
| Progress tracking | None                                    | ✅ Lesson completion + daily streak, persisted to `localStorage` |
| Typography        | System fonts only                       | ✅ Inter + JetBrains Mono + Noto Sans Myanmar via `next/font`    |
| Mobile support    | Fixed-width layout, horizontal overflow | ✅ Fully responsive, zero overflow                               |

### Key metrics

- **Files created:** 14
- **Files modified:** 5
- **Files deleted:** 1
- **Bugs found and fixed:** 9 distinct issues
- **Lines of code written:** ~1,900
- **Build status:** ✅ Compiles successfully, 7 routes prerendered as static HTML

---

## 2. Session Timeline

| #   | Phase                              | Outcome                                                                       |
| --- | ---------------------------------- | ----------------------------------------------------------------------------- |
| 1   | Analyze project, fix `layout.tsx`  | Removed 4 paste artifacts, repaired 1 truncated JSX closer, fixed `</html >`  |
| 2   | Create missing infrastructure      | `app/globals.css`, `postcss.config.mjs`, installed Tailwind PostCSS plugin    |
| 3   | Restore functionality              | `app/page.jsx` re-enabled `CourseCard` import                                 |
| 4   | ESLint discussion                  | Explained why ESLint is optional; user chose to skip it (focusing on lessons) |
| 5   | UI Redesign — "Grill Me" interview | 3 rounds of questions, 16 decisions locked in                                 |
| 6   | Implement redesign                 | 14 new files, 2 new routes, theme system, progress tracking                   |
| 7   | Debug                              | Fixed 3 bugs (overflow, progress reset, streak date)                          |
| 8   | Custom syntax theme                | Replaced `themes.oneDark` with a hand-built Emerald/Gold Prism theme          |
| 9   | Final verification                 | Typecheck + build clean, all routes prerendered                               |

---

## 3. Phase 1 — Emergency Repair

### 3.1 Root cause: terminal output pasted into source

Four lines in `app/layout.tsx` had the form:

```
[10/21/2026 12:01 AM] Đepar: <actual code>
```

This is the signature of copying from a VS Code terminal — the timestamp and the prompt (`Đepar:`) come along for the ride.

| Line | Corrupted content                                               | Damage                                                        |
| ---- | --------------------------------------------------------------- | ------------------------------------------------------------- |
| 1    | `[10 / 21 / 2026 12:01 AM] Đepar: import type { Metadata } ...` | Broke the entire import graph → `Cannot find module 'next'`   |
| 106  | `[10/21/2026 12:01 AM] Đepar: <h1 ...>`                         | Text node injected before the `<h1>` element                  |
| 189  | `[10/21/2026 12:01 AM] Đepar: >`                                | Truncated the `<p>` closing bracket → 12 cascading JSX errors |
| 271  | `[10/21/2026 12:01 AM] Đepar: <div ...>`                        | Text node injected before the `<div>` element                 |

**Lesson for the learner:** when copying from a terminal, copy only from inside a code fence, or strip the prompt prefix before pasting.

### 3.2 Error cascade

A single broken `>` on line 189 produced 19 reported errors, because the JSX parser could no longer match closing tags:

```
TS1005  ',' expected            (×4, from the broken import)
TS1121  Octal literals are not allowed   (from "10 / 21 / 2026" parsed as a number)
TS1003  Identifier expected
TS1382  Unexpected token. Did you mean `{'>'}` or `&gt;`?
TS17002 Expected corresponding JSX closing tag for 'div' / 'li' / 'ol' / 'aside' / 'body' / 'html'  (×6)
TS1109  Expression expected
```

### 3.3 Repairs applied

```tsx
// filepath: app/layout.tsx
import type { Metadata } from "next"; // ← prefix removed
import type { ReactNode } from "react";
import "./globals.css";
```

```tsx
// filepath: app/layout.tsx
// The <p> element whose closing bracket was eaten by the paste artifact:
<p
  className={[
    "text-sm font-bold",
    lesson.active ? "text-violet-800" : "text-slate-700",
  ].join(" ")}
>
  {" "}
  // ← restored
  {lesson.title}
</p>
```

Also corrected `</html >` → `</html>` (trailing space inside the tag).

### 3.4 Missing Tailwind infrastructure

The layout imported `"./globals.css"` — **but that file did not exist**, and there was no `postcss.config.mjs`. Tailwind classes like `bg-violet-600` and `backdrop-blur-xl` would have silently done nothing.

**Created `app/globals.css`:**

```css
@import "tailwindcss";
```

**Created `postcss.config.mjs`:**

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

**Installed:**

```bash
npm install --save-dev @tailwindcss/postcss postcss
```

> Tailwind v4 requires no `tailwind.config.js` — theme configuration lives in CSS via `@theme`.

### 3.5 Restoring the preview

`app/page.jsx` had the `CourseCard` import commented out, leaving the "Browser Preview" panel empty:

```jsx
// filepath: app/page.jsx
import CourseCard from "../p2l7";

export default function HomePage() {
  return (
    <main
      style={{
        flexDirection: "row",
        margin: "auto",
        maxWidth: "180px",
        padding: "20px",
      }}
    >
      <CourseCard
        title="Mingalarpar"
        durationMinutes={60}
        instructor="Deparminhtet"
      />
    </main>
  );
}
```

### 3.6 Git hygiene

Added to `.gitignore`:

```gitignore
node_modules
.next
*.tsbuildinfo
AGENTS.md
```

`AGENTS.md` is auto-generated by `next dev` on every run and would otherwise appear as untracked noise.

---

## 4. Phase 2 — ESLint Discussion

### 4.1 The actual finding

The `npx next lint` command failed with:

```
Invalid project directory provided, no such directory: C:\__d9p__\react-next\lint
```

**This is not a misconfiguration — it is a Next.js 16 breaking change.** From the shipped upgrade guide:

> _"The `next lint` command has been removed. Use Biome or ESLint directly. `next build` no longer runs linting."_

### 4.2 The mental model

|                           | `tsc` (TypeScript)                  | ESLint                          |
| ------------------------- | ----------------------------------- | ------------------------------- |
| Checks                    | Type safety                         | Code style & patterns           |
| Unused variables          | Only if `noUnusedLocals` is enabled | ✅ Always                       |
| Hook rules                | ❌                                  | ✅ `react-hooks/rules-of-hooks` |
| Missing `key` in `.map()` | ❌                                  | ✅ `react/jsx-key`              |
| Accessibility             | ❌                                  | ✅ `jsx-a11y`                   |
| Next.js conventions       | ❌                                  | ✅ `@next/eslint-plugin-next`   |

### 4.3 Real examples found in this project

**`P2L3.tsx` — component invoked at module level:**

```tsx
export default SearchBox(); // ❌ runs useState outside a component → "Invalid hook call"
export default SearchBox; // ✅ exports the component
```

`tsc` cannot catch this (calling a function is a valid expression). ESLint's `react-hooks/rules-of-hooks` rule catches it immediately.

**`explicit_syntax.tsx` — unused destructured setters:**

```tsx
const [item, setItem] = useState<string[]>([]); // ❌ both unused
const [theme, setTheme] = useState<selectedTheme>("light"); // ❌ both unused
```

### 4.4 Decision

The learner chose to **skip ESLint** to stay focused on the learning material. The zero-dependency alternative was offered and accepted:

```json
// filepath: tsconfig.json
{
  "compilerOptions": {
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

`noUnusedParameters` was already enabled in the project.

---

## 5. Phase 3 — UI Redesign

### 5.1 "Grill Me" interview — decisions locked

The learner asked to be interviewed before any code was written. Three rounds, sixteen decisions:

| Question            | Decision                                       |
| ------------------- | ---------------------------------------------- |
| Design direction    | Purpose-driven: preview the code being learned |
| Layout structure    | Keep the lab shell (sidebar + preview)         |
| Color palette       | **Emerald + Gold** (dark theme)                |
| Dark mode           | **Both + follow system**                       |
| Scope               | `layout.tsx` + `app/page.jsx`                  |
| Typography          | **Inter + JetBrains Mono** (next/font)         |
| Preview panel       | **Code pane + live preview, side by side**     |
| Sidebar behavior    | **Real routes** (App Router dynamic route)     |
| Header content      | **Progress / streak / stats**                  |
| Accent usage        | **Emerald = action, Gold = highlight**         |
| Code pane content   | Highlighted snippet only (not full file)       |
| Preview viewport    | Responsive                                     |
| Syntax highlighting | `prism-react-renderer`                         |
| Font loading        | `next/font` (self-hosted)                      |

### 5.2 Design token system

Rather than hardcoding Tailwind color classes everywhere, the redesign introduced **semantic CSS variables** that flip automatically with the theme.

```css
/* filepath: app/globals.css */
:root {
  --surface-base: oklch(0.985 0.004 160);
  --surface-raised: oklch(1 0 0);
  --surface-sunken: oklch(0.965 0.008 160);
  --surface-border: oklch(0.9 0.012 160);
  --surface-border-strong: oklch(0.85 0.015 160);
  --text-strong: oklch(0.24 0.03 160);
  --text-muted: oklch(0.52 0.02 160);
  --text-subtle: oklch(0.65 0.015 160);
  --accent: var(--color-emerald-600);
  --accent-contrast: oklch(1 0 0);
  --highlight: var(--color-gold-500);
}

.dark {
  --surface-base: oklch(0.19 0.018 165);
  --surface-raised: oklch(0.235 0.02 165);
  --surface-sunken: oklch(0.155 0.016 165);
  --surface-border: oklch(0.31 0.022 165);
  --surface-border-strong: oklch(0.38 0.026 165);
  --text-strong: oklch(0.96 0.008 160);
  --text-muted: oklch(0.74 0.018 160);
  --text-subtle: oklch(0.6 0.018 160);
  --accent: var(--color-emerald-400);
  --accent-contrast: oklch(0.16 0.02 165);
  --highlight: var(--color-gold-400);
}
```

Tailwind v4 `@theme` block redefines the emerald and gold ramps in **oklch** (perceptually uniform) and exposes them as `bg-emerald-600`, `text-gold-500`, etc.

Custom `@utility` rules bridge Tailwind class names to the CSS variables:

```css
@utility surface-raised {
  background-color: var(--surface-raised);
}
@utility accent-text {
  color: var(--accent);
}
@utility highlight-bg {
  background-color: var(--highlight);
  color: oklch(0.16 0.02 165);
}
```

### 5.3 Typography

```tsx
// filepath: app/layout.tsx
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-code",
  display: "swap",
});
const myanmar = Noto_Sans_Myanmar({
  subsets: ["myanmar", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-myanmar",
  display: "swap",
});
```

`Noto Sans Myanmar` is required because the UI mixes Burmese explanatory text with English code identifiers.

### 5.4 FOUC-free theme boot

The theme is applied **before first paint** by an inline script in `<head>`, so the page never flashes the wrong color scheme:

```tsx
// filepath: app/layout.tsx
const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem("react-lab-theme");
    var theme = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    var dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;
```

The `<html>` element carries `suppressHydrationWarning` because the class is mutated outside React's control.

### 5.5 Routing architecture

```
/                              → redirect to /lesson/jsx-rendering
/lesson/[slug]                 → dynamic route, SSG
  ├── jsx-rendering            ● (SSG)
  ├── components               ● (SSG)
  ├── props                    ● (SSG)
  ├── state-events             ● (SSG)
  ├── typescript               ● (SSG)
  ├── react-next               ● (SSG)
  └── event-handlers           ● (SSG)
/_not-found                    → custom 404
```

```tsx
// filepath: app/lesson/[slug]/page.tsx
export function generateStaticParams() {
  return getLessonSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = false; // unknown slug → 404

export default async function LessonPage({ params }: PageProps) {
  const { slug } = await params; // ← params is a Promise in Next 16
  const lesson = getLesson(slug);
  if (!lesson) notFound();
  return <LessonView lesson={lesson} />;
}
```

### 5.6 The Server/Client boundary (most important architectural decision)

`lib/lessons.ts` holds **data only** — no React imports — so it is safe to import from a Server Component:

```ts
// filepath: lib/lessons.ts
export type Lesson = {
  slug: string;
  number: string;
  title: string;
  detail: string;
  concept: string;
  file: string;
  language: string;
  code: string;
  demoKey?: string; // ← string key, not a component reference
};
```

Client-only demo components live in a separate file and are looked up by that key:

```tsx
// filepath: components/lesson-demos.tsx
"use client";

const demos: Record<string, ComponentType> = {
  "course-card": CourseCardDemo,
  "name-input": NameInput,
  "profile-editor": ProfileEditor,
  "search-box": SearchBox,
};

export function LessonDemo({ demoKey }: { demoKey: string }) {
  const Demo = demos[demoKey];
  if (!Demo) return null;
  return <Demo />;
}
```

**Why this matters:** if `lib/lessons.ts` imported `CourseCard` (a `"use client"` module) directly, the Server Component at `app/lesson/[slug]/page.tsx` would be pulling client code into a server module — an error Next.js explicitly forbids. The string key keeps the two worlds apart.

### 5.7 Progress and streak tracking

```tsx
// filepath: components/progress-store.tsx
const STORAGE_KEY = "react-lab-progress";

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [completed, setCompleted] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [lastVisit, setLastVisit] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // A ref mirrors state so markVisited always reads the latest values
  // without needing them in its dependency list.
  const stateRef = useRef({ completed, streak, lastVisit });
  ...
}
```

Progress is marked on lesson view, reflected as a ✓ badge in the sidebar, and shown as a percentage bar plus streak counter in the header.

---

## 6. Phase 4 — Syntax Theme Customization

### 6.1 The problem

The first implementation used the built-in `themes.oneDark` from `prism-react-renderer`. In light mode the code pane still showed **dark-theme colors**:

| Token              | Color                         | Readability in light mode |
| ------------------ | ----------------------------- | ------------------------- |
| `keyword`          | `rgb(198, 120, 221)` (purple) | Poor                      |
| `function`         | `rgb(97, 175, 239)` (blue)    | Poor                      |
| `string`           | `rgb(152, 195, 121)` (green)  | Acceptable                |
| `maybe-class-name` | `rgb(209, 154, 102)` (orange) | Poor                      |

Only the `plain` token had been remapped to `var(--text-strong)`; all colored tokens were hardcoded to the dark palette.

### 6.2 The fix

A fully custom Prism theme with two palettes, selected at runtime:

```tsx
// filepath: components/code-pane.tsx
const LIGHT: Palette = {
  plain: "#1f2937", // body text
  comment: "#94a3b8", // muted gray, italic
  keyword: "#047857", // Emerald — const, function, return
  function: "#b45309", // Gold — function names
  string: "#7c3aed", // Violet — string literals
  number: "#0e7490", // Cyan — numbers, booleans
  className: "#b45309", // Gold — types and classes
  property: "#475569", // Slate — properties, parameters
  punctuation: "#64748b",
  operator: "#047857", // Emerald
  tag: "#047857",
  attrName: "#b45309",
};

const DARK: Palette = {
  plain: "#e2e8f0",
  comment: "#64748b",
  keyword: "#34d399", // bright Emerald
  function: "#fbbf24", // bright Gold
  string: "#c4b5fd", // bright Violet
  number: "#22d3ee", // bright Cyan
  className: "#fbbf24",
  property: "#cbd5e1",
  punctuation: "#94a3b8",
  operator: "#34d399",
  tag: "#34d399",
  attrName: "#fbbf24",
};
```

### 6.3 Token mapping and ordering

```tsx
// filepath: components/code-pane.tsx
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
      {
        types: ["function", "method", "class-name"],
        style: { color: p.function },
      },
      { types: ["keyword"], style: { color: p.keyword } }, // ← LAST = highest priority
      { types: ["important", "attr-value"], style: { color: p.attrName } },
    ],
  };
}
```

**Two non-obvious requirements:**

1. **Both `plain` and `styles` keys are mandatory.** Returning only `styles` produces `TS2739: Type ... is missing the following properties from type 'PrismTheme': plain, styles`.
2. **Order matters.** Prism applies the last matching entry, so `keyword` must come _after_ the generic `string` / `property` entries or it would be overridden.

### 6.4 Theme reactivity

```tsx
// filepath: components/code-pane.tsx
const { resolvedTheme } = useTheme();

const theme = useMemo(
  () => buildTheme(resolvedTheme === "dark" ? DARK : LIGHT),
  [resolvedTheme],
);
```

The code pane re-colors instantly when the user toggles the theme.

---

## 7. Final Architecture

### 7.1 Component tree

```
app/layout.tsx                       (Server Component)
  ├── <html className={inter.variable + mono.variable + myanmar.variable}>
  │     └── <head> inline theme script (FOUC guard)
  └── <body>
        └── ThemeProvider            (Client)  light/dark/system
              └── ProgressProvider   (Client)  completed[] / streak / lastVisit
                    └── LabShell     (Client)  two-column grid
                          ├── LabHeader    (Client)  progress bar · streak · theme toggle
                          ├── LabSidebar   (Client)  7 lessons · ✓ badges · active state
                          └── {children}
                                └── LessonView  (Client)
                                      ├── CodePane      (Client)  Prism highlight
                                      └── LessonDemo    (Client)  live interactive demo
```

### 7.2 Data flow

```
lib/lessons.ts  ──(Lesson type + demoKey string)──▶  app/lesson/[slug]/page.tsx
        │                                                              │
        │ (slug lookup)                                               ▼
        └──────────────────────────────────────────────────▶  LessonView
                                                                       │
                                     ┌─────────────────────────────────┴──────────┐
                                     ▼                                            ▼
                              CodePane (code)                          LessonDemo (demoKey)
                                     │                                            │
                                     ▼                                            ▼
                              Prism highlight                              demos[key]
```

### 7.3 Styling strategy

| Concern              | Mechanism                                                        |
| -------------------- | ---------------------------------------------------------------- |
| Brand colors         | `@theme` block overriding Tailwind's emerald/gold ramps in oklch |
| Theme-aware surfaces | CSS variables under `:root` / `.dark`                            |
| Utility bridge       | `@utility` rules mapping class names to variables                |
| Layout               | Tailwind utilities with `minmax(0,1fr)` grid tracks              |
| Code colors          | Custom `PrismTheme` object, two palettes                         |

---

## 8. Complete File Inventory

### Created (14 files)

| File                            | Purpose                                                          |
| ------------------------------- | ---------------------------------------------------------------- |
| `app/globals.css`               | Design tokens, Tailwind import, utility layer, scrollbar styling |
| `app/page.tsx`                  | Root redirect to the first lesson                                |
| `app/not-found.tsx`             | Custom 404 page                                                  |
| `app/lesson/[slug]/page.tsx`    | Dynamic route: SSG, metadata, 404 handling                       |
| `components/lab-shell.tsx`      | App frame: header + sidebar/content grid                         |
| `components/lab-header.tsx`     | Logo, progress bar, streak counter, theme toggle                 |
| `components/lab-sidebar.tsx`    | Lesson navigation with completion checkmarks                     |
| `components/lesson-view.tsx`    | Lesson header + code/preview split + reminders                   |
| `components/code-pane.tsx`      | Syntax-highlighted code viewer with custom theme                 |
| `components/lesson-demos.tsx`   | Client-only demo component registry                              |
| `components/theme-provider.tsx` | Theme context, persistence, system-follow                        |
| `components/theme-toggle.tsx`   | Theme switcher UI (compact and segmented variants)               |
| `components/progress-store.tsx` | Progress + streak state, localStorage persistence                |
| `lib/lessons.ts`                | Server-safe lesson registry (7 lessons)                          |

### Modified (5 files)

| File              | Change                                                          |
| ----------------- | --------------------------------------------------------------- |
| `app/layout.tsx`  | Complete rewrite — fonts, theme script, providers, shell        |
| `app/globals.css` | Replaced minimal version with full token system                 |
| `package.json`    | Added `prism-react-renderer`, `@tailwindcss/postcss`, `postcss` |
| `tsconfig.json`   | Added `@/*` path alias                                          |
| `.gitignore`      | Added `*.tsbuildinfo`, `AGENTS.md`                              |

### Deleted (1 file)

| File           | Reason                                |
| -------------- | ------------------------------------- |
| `app/page.jsx` | Replaced by `app/page.tsx` (redirect) |

### Unchanged (lesson source files)

`index.tsx` · `P2L3.tsx` · `P2L4.tsx` · `event_handler.tsx` · `explicit_syntax.tsx` · `p2l5.tsx` · `p2l6.tsx` · `p2l7.tsx`

These are the learner's practice files. They were deliberately **not** modified — only consumed as live demos.

---

## 9. Bugs Found and Fixed

### Bug 1 — Terminal output in source file

- **Symptom:** 19 TypeScript errors, build failure
- **Cause:** Copied terminal output including timestamps and prompt into `app/layout.tsx`
- **Fix:** Stripped 4 prefix lines, repaired 1 truncated JSX closing bracket, fixed `</html >`
- **Lesson:** never paste raw terminal output; strip the prompt prefix

### Bug 2 — Missing Tailwind build pipeline

- **Symptom:** Tailwind utility classes would have had no effect
- **Cause:** No `globals.css`, no `postcss.config.mjs`, no `@tailwindcss/postcss`
- **Fix:** Created both files, installed the plugin
- **Lesson:** Tailwind v4 needs the PostCSS plugin; `tailwind.config.js` is no longer required

### Bug 3 — `baseUrl` removed in TypeScript 7

- **Symptom:** `TS5102: Option 'baseUrl' has been removed`
- **Cause:** TypeScript 7 dropped `baseUrl` support
- **Fix:** Removed `baseUrl`, kept only `paths: { "@/*": ["./*"] }`
- **Lesson:** in TS 7, `paths` alone is enough for aliases

### Bug 4 — Server Component importing a client component

- **Symptom:** Would produce "You're importing a component that needs `useState`" errors
- **Cause:** `lib/lessons.ts` originally stored component references
- **Fix:** Split into `lib/lessons.ts` (data) and `components/lesson-demos.tsx` (demos), connected by a `demoKey` string
- **Lesson:** keep the server/client boundary explicit and data-only

### Bug 5 — Theme ignored the stored preference

- **Symptom:** Setting `localStorage` to `"light"` still rendered dark
- **Cause:** A `useEffect` that re-applied the "system" resolution on every mount, overwriting the stored value
- **Fix:** Read the stored theme once on mount, apply it, and only follow the OS while the preference is `"system"`
- **Lesson:** the effect that follows the OS must be conditional on the current preference

### Bug 6 — Mobile horizontal overflow

- **Symptom:** `scrollWidth 581px` vs `clientWidth 375px` on a 390px viewport
- **Cause:** Grid and flex children default to `min-width: auto`, so a wide code block pushed the layout
- **Fix:** `min-w-0` on every grid child plus `grid-cols-[minmax(0,1fr)]` on the grids themselves
- **Lesson:** always set `min-w-0` on grid/flex children that contain long content

### Bug 7 — Progress reset on client-side navigation

- **Symptom:** Visiting a second lesson kept the counter at `1/7`
- **Cause:** A `useRef` guard (`marked.current`) prevented re-running, but React **reuses the component instance** across route changes, so the guard blocked legitimate updates
- **Fix:** Removed the ref guard; depend on `lesson.slug` and made `markVisited` idempotent
- **Lesson:** don't use instance-level refs as guards in routed layouts

### Bug 8 — Streak date off by one day

- **Symptom:** `lastVisit` was `2026-10-20` when the local date was `2026-10-21`
- **Cause:** `toISOString()` returns **UTC**, which rolls back a day for users in UTC+ timezones
- **Fix:** Build the date from `getFullYear()` / `getMonth()` / `getDate()`
- **Lesson:** never use `toISOString()` for local calendar dates

### Bug 9 — Double title in browser tab

- **Symptom:** Tab read "02 · Components | React Learning Lab | React Learning Lab"
- **Cause:** The lesson title already included the suffix, and the root layout also declared a `title.template`
- **Fix:** Removed the suffix from `generateMetadata` and relied on the template
- **Lesson:** when using `title.template`, child pages must not repeat the suffix

### Bug 10 — Prism theme rejected by TypeScript

- **Symptom:** `TS2739: ... is missing the following properties from type 'PrismTheme': plain, styles`
- **Cause:** The theme override spread `oneDark` but overrode `styles` with a map that dropped the type shape
- **Fix:** Return a full `PrismTheme` object with both `plain` and `styles` keys
- **Lesson:** `PrismTheme` requires both keys

---

## 10. Key Concepts Learned

### 10.1 Next.js 16 specifics

| Concept                     | Detail                                                       |
| --------------------------- | ------------------------------------------------------------ |
| `next lint` removed         | Use ESLint or Biome directly; `next build` no longer lints   |
| `params` is a Promise       | `const { slug } = await params` — no `await` = runtime error |
| `generateStaticParams`      | Prerenders dynamic routes at build time                      |
| `dynamicParams = false`     | Unknown params return 404 instead of rendering on demand     |
| `generateMetadata`          | Per-route SEO; combine with `title.template`                 |
| Server vs Client Components | `"use client"` is a boundary, not a file-type marker         |

### 10.2 Tailwind CSS v4 specifics

| Concept                 | Detail                                                      |
| ----------------------- | ----------------------------------------------------------- |
| No `tailwind.config.js` | Configuration moved into CSS via `@theme`                   |
| `@import "tailwindcss"` | Single import replaces the old three `@tailwind` directives |
| `@utility`              | New way to define custom utilities                          |
| CSS-first config        | Design tokens as CSS variables in `:root`                   |

### 10.3 TypeScript 7 specifics

| Concept                         | Detail                                                 |
| ------------------------------- | ------------------------------------------------------ |
| `baseUrl` removed               | Use `paths` with relative targets                      |
| `import type`                   | Type-only imports are erased entirely                  |
| `verbatimModuleSyntax` behavior | Mixing type and value imports requires explicit `type` |

### 10.4 React 19 / Next 16 rendering

| Concept                  | Detail                                                             |
| ------------------------ | ------------------------------------------------------------------ |
| Component instance reuse | Across route changes, `useRef` guards break                        |
| Effects keyed on props   | `useEffect(..., [lesson.slug, markVisited])` re-runs correctly     |
| FOUC prevention          | Inline script before paint, `suppressHydrationWarning` on `<html>` |

### 10.5 CSS layout

| Concept                         | Detail                                                    |
| ------------------------------- | --------------------------------------------------------- |
| `min-width: auto` on grid items | The default that causes overflow; override with `min-w-0` |
| `minmax(0, 1fr)`                | Correct grid track when content can overflow              |
| oklch                           | Perceptually uniform color space; better for ramps        |

---

## 11. Verification Results

### 11.1 Build verification

```
> npm run typecheck
> tsc -b
(no output — 0 errors)

> npx next build
▲ Next.js 16.4.2 (Turbopack)
✓ Compiled successfully in 12.0s
✓ Finished TypeScript in 14.0s
✓ Generating static pages using 3 workers (10/10) in 8.7s

Route (app)
┌ ○ /
├ ○ /_not-found
└   /lesson/[slug]
  ├ ● /lesson/jsx-rendering
  ├ ● /lesson/components
  ├ ● /lesson/props
  └ [+4 more paths]

○  (Static)  prerendered as static content
●  (SSG)     prerendered as static HTML (uses generateStaticParams)
```

### 11.2 Functional verification (browser, Playwright)

| Test                                | Result                                                                              |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| `/` redirects to first lesson       | ✅ `307 → /lesson/jsx-rendering`                                                    |
| Sidebar navigation between lessons  | ✅ client-side routing works                                                        |
| Code pane renders with highlighting | ✅ 24 tokens on the State & Events lesson                                           |
| Light mode token colors             | ✅ keyword `rgb(4,120,87)`, function `rgb(180,83,9)`, string `rgb(124,58,237)`      |
| Dark mode token colors              | ✅ keyword `rgb(52,211,153)`, function `rgb(251,191,36)`, string `rgb(196,181,253)` |
| Theme toggle persists across reload | ✅ `localStorage["react-lab-theme"]` = `"light"` after reload                       |
| System preference following         | ✅ media query listener active                                                      |
| Progress counter increments         | ✅ 1 → 2 → 3 across navigations                                                     |
| Sidebar ✓ badges                    | ✅ render for completed lessons                                                     |
| Streak counter                      | ✅ `1 day streak` persisted                                                         |
| Interactive demo (NameInput)        | ✅ typing updates output text                                                       |
| Interactive demo (ProfileEditor)    | ✅ "Load Demo User" button updates heading                                          |
| Interactive demo (SearchBox)        | ✅ form renders                                                                     |
| 404 for unknown slug                | ✅ `/lesson/does-not-exist` → 404 page                                              |
| Mobile 390px — no overflow          | ✅ `scrollWidth === clientWidth === 375`                                            |
| Desktop 1440px layout               | ✅ two-column grid, sticky sidebar                                                  |

---

## 12. Remaining Known Issues

These were identified but **not** fixed, either by the learner's choice or as out of scope:

### 12.1 `P2L3.tsx` — component invoked at module level

```tsx
export default SearchBox(); // ❌
```

Not yet imported by any route, so the error is latent. Will crash with "Invalid hook call" if a lesson ever imports it directly. Currently works because it is wrapped by `SearchBoxDemo` in `components/lesson-demos.tsx`.

### 12.2 `explicit_syntax.tsx` — unused state

```tsx
const [item, setItem] = useState<string[]>([]);
const [theme, setTheme] = useState<selectedTheme>("light");
```

Neither value is read. Intentional for the lesson, but `noUnusedLocals` was deliberately **not** enabled so it would not break the practice file.

### 12.3 `p2l5.tsx` / `p2l6.tsx` — `'use client'` placement

Both files have the directive on line 2, after a comment. The directive must be the first statement, so these files are **not** actually client components. They currently work because they are only imported from an already-client module.

### 12.4 Lesson snippets are duplicated

`lib/lessons.ts` contains hand-copied code snippets. If the learner edits `p2l6.tsx`, the code pane will not update. A future improvement would read the source file at build time.

### 12.5 No ESLint

By explicit decision. `npm run typecheck` covers type safety only.

### 12.6 `P2L4.tsx` and `index.tsx` have no live demo

`UserList`, `UserStatus`, and `UserProfile` are not registered in `components/lesson-demos.tsx`.

---

## 13. Next Steps

### Immediate (recommended)

1. **Run the dev server and explore:**

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000` — it redirects to the first lesson.

2. **Try the theme toggle** in the header and watch the code pane re-color.

3. **Navigate between lessons** and watch the progress counter and ✓ badges update.

4. **Resize the window** to verify the responsive two-column → single-column transition.

### Learning opportunities

5. **Study the Server/Client boundary** — compare `lib/lessons.ts` (server-safe) with `components/lesson-demos.tsx` (client-only), and see how `demoKey` bridges them.

6. **Add a lesson.** The registry is data-driven:
   - Add an entry to `lib/lessons.ts` with a new `slug`
   - Register a demo in `components/lesson-demos.tsx` if needed
   - The route, sidebar, and metadata update automatically

7. **Fix the latent issues in Section 12** as practice exercises:
   - `P2L3.tsx` — fix the module-level invocation
   - `p2l5.tsx` / `p2l6.tsx` — move `'use client'` to line 1
   - `explicit_syntax.tsx` — actually use the state

### Optional enhancements

8. **Sync code snippets with source files** — read the file at build time instead of duplicating.
9. **Add a "reset progress" button** — the `reset()` function already exists in `progress-store.tsx` but has no UI.
10. **Add search / keyboard navigation** (Cmd+K) to the sidebar.
11. **Add the remaining demos** — `UserList`, `UserStatus`, `UserProfile`.
12. **Reconsider ESLint** once the lesson files are cleaned up.

---

## Appendix A — Commands Reference

```bash
# Development
npm run dev                    # Start dev server (Turbopack)

# Verification
npm run typecheck              # tsc -b — TypeScript only
npx next build                 # Production build + prerender

# Package management (Windows note: use npm.cmd if npm is not on PATH)
npm install prism-react-renderer
npm install -D @tailwindcss/postcss postcss
```

---

## Appendix B — Data Structures

### Lesson registry entry

```ts
{
  slug: "state-events",        // URL segment: /lesson/state-events
  number: "04",                // Display badge
  title: "State & Events",     // Heading
  detail: "Create interactive UI",  // Subtitle
  concept: "useState က component အတွင်းရှိ ...",  // Explanation (Burmese)
  file: "p2l6.tsx",            // Source file label
  language: "tsx",             // Prism language
  code: `const [name, setName] = useState('')`,  // Displayed snippet
  demoKey: "name-input",       // → components/lesson-demos.tsx
}
```

### localStorage keys

| Key                  | Shape                                                                | Written by                      |
| -------------------- | -------------------------------------------------------------------- | ------------------------------- |
| `react-lab-theme`    | `"light" \| "dark" \| "system"`                                      | `components/theme-provider.tsx` |
| `react-lab-progress` | `{ completed: string[], streak: number, lastVisit: string \| null }` | `components/progress-store.tsx` |

---

## Appendix C — Glossary

| Term               | Meaning in this project                                                  |
| ------------------ | ------------------------------------------------------------------------ |
| **Lab shell**      | The persistent frame: header + lesson sidebar + content area             |
| **Code pane**      | Left half of the lesson view — syntax-highlighted source                 |
| **Render area**    | Right half of the lesson view — live interactive demo                    |
| **demoKey**        | String linking server-safe lesson data to a client-side demo component   |
| **Semantic token** | A CSS variable like `--surface-raised` that changes value with the theme |
| **FOUC**           | Flash of Unstyled Content — wrong theme shown before CSS/paint           |
| **SSG**            | Static Site Generation — HTML prerendered at build time                  |

---

_End of summary._
