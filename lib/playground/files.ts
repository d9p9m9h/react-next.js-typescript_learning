/**
 * Auto-discovered source of every root-level `.tsx` file in this project.
 *
 * `import.meta.glob` is a Turbopack feature (it is not available when
 * building with webpack). The `?raw` query asks Turbopack for the file
 * *contents* instead of a module — see the `*.tsx` rule in
 * `next.config.ts`.
 *
 * The pattern is anchored at the project root, so it picks up the lesson
 * files (`P2L3.tsx`, `p2l7.tsx`, …) and nothing else: `app/`, `components/`
 * and `lib/` live in sub-directories, and `node_modules` / `.next` are
 * never traversed.
 */
const rawSources = import.meta.glob("/*.tsx", {
  query: "?raw",
  eager: true,
}) as Record<string, { default: string }>;

export type PlaygroundFile = {
  /** File name as it appears on disk, e.g. `P2L3.tsx`. */
  name: string;
  /** The full, unmodified source text of the file. */
  source: string;
};

function toFileName(path: string): string {
  return path.replace(/^\/+/, "");
}

/**
 * Every root-level `.tsx` file, sorted so that `P2L3` comes before `P2L4`
 * and lowercase names come after uppercase ones.
 */
export const playgroundFiles: PlaygroundFile[] = Object.entries(rawSources)
  .map(([path, module]) => ({
    name: toFileName(path),
    source: module.default,
  }))
  .sort((a, b) =>
    a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
