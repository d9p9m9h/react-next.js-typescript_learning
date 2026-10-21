# React Code Playground

A **localhost-only** React + TypeScript code playground. Edit a `.tsx` practice file, switch to the
preview, and see the component render live — with console output and inline errors.

This is a personal learning tool. It is not deployed publicly, and the dev server is bound to
`127.0.0.1` so it is not reachable from the network.

## Getting started

```bash
npm install
npm run dev
```

Then open <http://127.0.0.1:3000>.

> On Windows, if `npm` is not on your `PATH`, use `npm.cmd` / `npx.cmd`.

## Commands

| Command             | What it does                                     |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Starts the dev server on `http://127.0.0.1:3000` |
| `npm run typecheck` | Type-checks the project (`tsc -b`)               |
| `npx next build`    | Production build                                 |
| `npx next start`    | Serves the production build                      |

## The workspace

The page has three parts: a **file tablist**, a **panel** and a **console**.

The editor and the preview take turns — only one of them is on screen at a time. Use the
**Code / Preview** switch above the panel to move between them. The console is always visible at
the bottom, so `console.log(...)` output stays in view while you edit.

When a compile or runtime error happens, a compact error strip appears above the editor with a
**Details** button that jumps straight to the preview, where the full message is shown.

> **Layout note.** The height chain uses flex sizing (`flex-1` + `min-h-0`) rather than percentage
> heights. A percentage height (`h-full`) cannot resolve against a flex-item parent, so it silently
> collapses the editor to the height of its own content. See §10.1 of
> [Detail Progress Summary.md](Detail%20Progress%20Summary.md) before changing any `h-full` in
> these components.

## How it works

1. **Discovery** — `lib/playground/files.ts` uses Turbopack's `import.meta.glob("/practice/*.tsx", { query: "?raw" })`
   to read the raw source of every practice file. The `?raw` rule lives in `next.config.ts`.
2. **Compile** — `POST /api/playground/compile` runs Sucrase on the server and returns a CommonJS module.
3. **Preview** — `components/playground/playground-preview.tsx` posts that module into a sandboxed
   iframe (`/playground/sandbox`) which evaluates and renders it.
4. **Feedback** — `console.*` calls, compile errors and runtime errors travel back over
   `postMessage` and are shown in the app.

The learner's code is **never** evaluated in the main application window.

## Practice files

The eight `.tsx` files in `practice/` are the playground's content. The app never writes to them.

`P2L3.tsx` · `P2L4.tsx` · `p2l5.tsx` · `p2l6.tsx` · `p2l7.tsx` · `index.tsx` ·
`event_handler.tsx` · `explicit_syntax.tsx`

`lib/playground/registry.tsx` decides which component each file previews and which props it gets.

## Security note

The preview runs in an iframe with `sandbox="allow-scripts"` and **no** `allow-same-origin`, so the
frame has an opaque origin: it cannot read this app's DOM, cookies or storage, and the sandbox
document's CSP blocks network access and `eval()`.

This is a **learning aid on a local machine, not a security boundary for untrusted code**. Code
running inside the sandbox can read the shared message token and therefore forge console output.
See [Detail Progress Summary.md](Detail%20Progress%20Summary.md) §6 for the full, honestly-scoped
list of what is and is not enforced.

## Stack

Next.js 16.4 (App Router, Turbopack) · React 19.3 · TypeScript 7.0 · Tailwind CSS v4 · Sucrase

## More detail

See [Detail Progress Summary.md](Detail%20Progress%20Summary.md) for the full architecture,
component reference, verification results and known limitations.
