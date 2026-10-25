# AGENTS.md — React Code Playground

This file helps AI coding agents understand the codebase and be immediately productive.

## Project Overview

**React Code Playground** — A localhost-only React + TypeScript code playground. Learners edit `.tsx` practice files in `practice/` and see the component render live with console output and inline errors.

**Stack:** Next.js 16.4 (App Router, Turbopack) · React 19.3 · TypeScript 7.0 · Tailwind CSS v4 · Sucrase

**Key constraint:** Dev server binds to `127.0.0.1` only — not reachable from network.

## Essential Commands

| Command             | Purpose                                     |
| ------------------- | ------------------------------------------- |
| `npm run dev`       | Start dev server on `http://127.0.0.1:3000` |
| `npm run typecheck` | Type-check project (`tsc -b`)               |
| `npm run test`      | Run tests (`vitest run`)                    |
| `npx next build`    | Production build                            |
| `npx next start`    | Serve production build                      |

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│ app/layout.tsx — Root layout, fonts, theme script, providers │
│ app/page.tsx — Renders <Playground> with discovered files    │
│ app/api/playground/compile/route.ts — Server-side TSX→JS     │
├─────────────────────────────────────────────────────────────┤
│ components/playground/playground.tsx — Main orchestrator     │
│ components/playground/playground-preview.tsx — Sandbox iframe│
│ components/playground/playground-editor.tsx — Textarea editor│
│ components/playground/playground-console.tsx — Console output│
│ components/playground/use-playground-compile.ts — Compile hook│
│ components/playground/use-playground-console.ts — Console hook│
│ components/playground/use-playground-drafts.ts — Drafts hook │
├─────────────────────────────────────────────────────────────┤
│ lib/playground/files.ts — Auto-discovers practice/*.tsx      │
│ lib/playground/registry.tsx — Maps file → component + props  │
│ lib/playground/typecheck.ts — Real TypeScript type-checking  │
│ lib/playground/highlight.ts — Syntax highlighting (Prism)    │
│ lib/playground/styles.ts — Tailwind CSS compilation          │
│ lib/playground/drafts.ts — localStorage draft persistence    │
└─────────────────────────────────────────────────────────────┤
│ practice/*.tsx — Learner's practice files (never modified)   │
```

## Key Conventions

### 1. File Discovery (`lib/playground/files.ts`)

- Uses Turbopack's `import.meta.glob("/practice/*.tsx", { query: "?raw", eager: true })`
- The `?raw` query is configured in `next.config.ts` to return file contents as text
- Files are sorted with numeric-aware locale comparison (`P2L3` before `P2L4`)

### 2. Compile → Preview Flow

1. Editor debounces changes (180ms) → POST to `/api/playground/compile`
2. Server runs **Sucrase** (`typescript`, `jsx`, `imports` transforms) → CommonJS module
3. If component is declared but not exported, appends `exports.__target = ComponentName`
4. Returns `{ code, css, html, diagnostics }` to client
5. `playground-preview.tsx` evaluates module in sandboxed iframe (`sandbox="allow-scripts"`)
6. Console logs, errors, and render confirmation travel back via `postMessage`

### 3. Registry Pattern (`lib/playground/registry.tsx`)

- Explicit mapping: filename → `{ component, props, label }`
- `"component": "default"` means default export; `"none"` = no component to render
- Learner's files are **never modified** — registry supplies component selection + props

### 4. Theme System (`components/theme-provider.tsx`)

- Three modes: `light` | `dark` | `system` (persisted in `localStorage`)
- Inline script in `app/layout.tsx` applies theme **before paint** to prevent flash
- Uses CSS custom properties via Tailwind v4's `@theme` directive

### 5. Layout System (Critical)

- Uses **flex sizing** (`flex-1` + `min-h-0`) — **not percentage heights**
- Percentage heights (`h-full`) collapse against flex parents — see `Detail Progress Summary.md` §10.1
- Editor and preview **take turns** (one visible via `display: none`, not unmounted) to preserve cursor position and sandbox state

### 6. Security Model

- Preview iframe: `sandbox="allow-scripts"` **without** `allow-same-origin` → opaque origin
- CSP blocks network access and `eval()`
- **Not a security boundary for untrusted code** — sandbox can forge console output via shared message token
- Full details: `Detail Progress Summary.md` §6

## Testing

- **Framework:** Vitest (`vitest.config.ts`)
- **Environment:** Node (not jsdom)
- **Test files:** `**/*.test.ts`, `**/*.test.tsx`
- **Example:** `app/api/playground/compile/route.test.ts` tests compile utilities

## TypeScript Configuration

- **Target:** ES2025, strict mode, `noEmit`, `isolatedModules`
- **Module resolution:** Bundler, paths: `@/*` → `./*`
- **JSX:** `react-jsx` (automatic runtime)

## Important Files to Reference

| File                                              | Purpose                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------- |
| `README.md`                                       | Quick start, commands, architecture overview                      |
| `Detail Progress Summary.md`                      | Full architecture, component reference, verification, limitations |
| `next.config.ts`                                  | Turbopack `?raw` rule for practice files                          |
| `lib/playground/registry.tsx`                     | Component-to-file mapping                                         |
| `components/playground/use-playground-compile.ts` | Compile hook with request cancellation                            |

## Common Pitfalls

1. **Don't use `h-full` for editor/preview height** — use `flex-1 min-h-0` (see §10.1 in Detail Progress Summary)
2. **Don't modify `practice/*.tsx` files** — they are read-only source content
3. **Turbopack-only features** — `import.meta.glob` with `?raw` doesn't work with webpack
4. **Sucrase transforms** — only `typescript`, `jsx`, `imports`; no type-checking (done separately via `typecheck.ts`)
5. **Theme flash prevention** — inline script in `layout.tsx` must stay synchronous

## Related Documentation

- [README.md](README.md) — Getting started, commands, high-level architecture
- [Detail Progress Summary.md](Detail%20Progress%20Summary.md) — Complete architecture, component reference, verification results, known limitations
- [next.config.ts](next.config.ts) — Turbopack configuration
- [tsconfig.json](tsconfig.json) — TypeScript configuration
