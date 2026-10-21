/**
 * Auto-discovered source of every `.tsx` practice file in `practice/`.
 *
 * `import.meta.glob` is a Turbopack feature (it is not available when
 * building with webpack). The `?raw` query asks Turbopack for the file
 * *contents* instead of a module — see the `*.tsx` rule in
 * `next.config.ts`.
 *
 * The pattern is anchored at the project root and points at the
 * `practice/` folder, so it picks up the learner's practice files and
 * nothing else: `app/`, `components/` and `lib/` live in other
 * sub-directories, and `node_modules` / `.next` are never traversed.
 */
const rawSources = import.meta.glob("/practice/*.tsx", {
  query: "?raw",
  eager: true,
}) as Record<string, { default: string }>;

/** The folder the practice files live in, relative to the project root. */
export const practiceFolder = "practice";

export type PlaygroundFile = {
  /** File name as it appears on disk, e.g. `P2L3.tsx`. */
  name: string;
  /** The full, unmodified source text of the file. */
  source: string;
};

/**
 * Turns a glob key such as `/practice/P2L3.tsx` into `P2L3.tsx`.
 *
 * The key is only used for the file name — the playground never writes
 * to these files, so the folder prefix carries no meaning for it.
 */
function toFileName(path: string): string {
  return path.replace(/^\/+/, "").replace(/^[^/]+\//, "");
}

/**
 * Every `.tsx` file in `practice/`, sorted so that `P2L3` comes before
 * `P2L4` and lowercase names come after uppercase ones.
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
