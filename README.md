# React Code Playground

A **localhost-only** React + TypeScript code playground. Edit a `.tsx` practice file on the left
and see the component render live on the right, with console output and inline errors.

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

## How it works

1. **Discovery** — `lib/playground/files.ts` uses Turbopack's `import.meta.glob("/*.tsx", { query: "?raw" })`
   to read the raw source of every root-level `.tsx` file. The `?raw` rule lives in `next.config.ts`.
2. **Compile** — `POST /api/playground/compile` runs Sucrase on the server and returns a CommonJS module.
3. **Preview** — `components/playground/playground-preview.tsx` posts that module into a sandboxed
   iframe (`/playground/sandbox`) which evaluates and renders it.
4. **Feedback** — `console.*` calls, compile errors and runtime errors travel back over
   `postMessage` and are shown in the app.

The learner's code is **never** evaluated in the main application window.

## Practice files

The eight root-level `.tsx` files are the playground's content. The app never writes to them.

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
