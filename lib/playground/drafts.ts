/**
 * Local drafts for the playground editor.
 *
 * The playground never writes to the learner's files on disk, so an
 * edit only lives in React state — a refresh loses it. A *draft* is the
 * unsaved content of one file, kept in `localStorage` so a reload (or a
 * crash) does not throw the work away.
 *
 * The drafts are deliberately **not** the source of truth: the files on
 * disk are. A draft only shadows a file when the two differ, and the
 * **Reset** button drops the draft and restores the on-disk source.
 *
 * Storage can be unavailable (private mode, a locked-down browser), so
 * every function here fails silently. A missing draft store must never
 * break the editor.
 */

/** Where the drafts live in `localStorage`. */
const DRAFT_STORAGE_KEY = "react-lab-playground-drafts";

/**
 * The shape stored under the key.
 *
 * The version is bumped whenever the meaning of the payload changes, so
 * an old payload can be discarded instead of misread.
 */
type StoredDrafts = {
  version: number;
  drafts: Record<string, string>;
};

const DRAFT_VERSION = 1;

/**
 * Reads the stored drafts.
 *
 * A missing, unreadable or malformed payload yields an empty map — the
 * editor then simply starts from the files on disk.
 */
export function readDrafts(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Partial<StoredDrafts>;

    if (parsed?.version !== DRAFT_VERSION) return {};
    if (!parsed.drafts || typeof parsed.drafts !== "object") return {};

    const drafts: Record<string, string> = {};

    for (const [name, source] of Object.entries(parsed.drafts)) {
      if (typeof source === "string") drafts[name] = source;
    }

    return drafts;
  } catch {
    // Storage unavailable or the payload is not valid JSON.
    return {};
  }
}

/**
 * Replaces the stored drafts with the given map.
 */
export function writeDrafts(drafts: Record<string, string>): void {
  try {
    window.localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({ version: DRAFT_VERSION, drafts } satisfies StoredDrafts),
    );
  } catch {
    // Storage unavailable (private mode, quota exceeded) — the drafts
    // simply do not survive a reload.
  }
}

/**
 * Drops one file's draft.
 */
export function removeDraft(name: string): void {
  const drafts = readDrafts();

  if (!(name in drafts)) return;

  delete drafts[name];
  writeDrafts(drafts);
}
