"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ProgressState = {
  /** Lessons the learner has opened at least once. */
  visited: string[];
  /** Lessons the learner explicitly confirmed they finished. */
  completed: string[];
  /** Number of consecutive days with at least one lesson opened. */
  streak: number;
  /** Local date (yyyy-mm-dd) of the most recent visit. */
  lastVisit: string | null;
  /** Records that a lesson was opened. Never marks it completed. */
  markVisited: (slug: string) => void;
  /** Records the learner's own confirmation that a lesson is finished. */
  markCompleted: (slug: string) => void;
  /** Removes a completion confirmation but keeps the visit record. */
  unmarkCompleted: (slug: string) => void;
  /** Clears every stored progress value. */
  reset: () => void;
};

const STORAGE_KEY = "react-lab-progress";

/**
 * Shape of the persisted payload.
 *
 * In earlier versions of this app the single `completed` list actually meant
 * "visited" — a lesson was marked complete just by opening it. When such an
 * old payload is found, the slugs are migrated into `visited` and
 * `completed` is left empty, so opening a lesson is never counted as a
 * genuine completion.
 */
type StoredProgress = {
  visited?: string[];
  completed?: string[];
  streak?: number;
  lastVisit?: string | null;
};

const ProgressContext = createContext<ProgressState | null>(null);

/** Local calendar date — toISOString() would use UTC and roll back a day. */
function today(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function daysBetween(a: string, b: string): number {
  const diff =
    new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime();
  return Math.round(diff / 86_400_000);
}

/** Removes duplicates and non-string entries from an unknown array. */
function sanitizeSlugs(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(value.filter((item): item is string => typeof item === "string")),
  );
}

function sanitizeCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0;
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [visited, setVisited] = useState<string[]>([]);
  const [completed, setCompleted] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [lastVisit, setLastVisit] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredProgress;

        const storedVisited = sanitizeSlugs(parsed.visited);
        const storedCompleted = sanitizeSlugs(parsed.completed);

        // Legacy payload: `visited` is missing but `completed` exists, which
        // means the old app wrote "visited" into the `completed` field.
        // Migrate those slugs to `visited` and do NOT treat them as genuine
        // completions.
        const isLegacy = !Array.isArray(parsed.visited) && storedCompleted.length > 0;

        setVisited(
          isLegacy
            ? Array.from(new Set([...storedCompleted, ...storedVisited]))
            : storedVisited,
        );
        setCompleted(isLegacy ? [] : storedCompleted);
        setStreak(sanitizeCount(parsed.streak));
        setLastVisit(
          typeof parsed.lastVisit === "string" ? parsed.lastVisit : null,
        );
      }
    } catch {
      // Corrupted storage — start fresh rather than crashing.
    }
    setHydrated(true);
  }, []);

  // Persist whenever the state changes (after hydration).
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ visited, completed, streak, lastVisit }),
      );
    } catch {
      // Storage unavailable (private mode) — ignore.
    }
  }, [visited, completed, streak, lastVisit, hydrated]);

  const markVisited = useCallback((slug: string) => {
    const now = today();

    // Functional updates: reading the previous state directly avoids the
    // stale-ref problem that occurs when several lessons are opened in
    // quick succession (client-side navigation reuses the provider).
    setVisited((prev) =>
      prev.includes(slug) ? prev : [...prev, slug],
    );

    // Opening a lesson must never complete it — that is the learner's call.
    setLastVisit((last) => {
      if (last === now) return last;

      setStreak((current) => {
        if (!last) return 1;
        const gap = daysBetween(last, now);
        if (gap === 1) return current + 1;
        if (gap <= 0) return current;
        return 1;
      });

      return now;
    });
  }, []);

  const markCompleted = useCallback((slug: string) => {
    setCompleted((prev) =>
      prev.includes(slug) ? prev : [...prev, slug],
    );

    // Completing a lesson also implies you opened it.
    setVisited((prev) =>
      prev.includes(slug) ? prev : [...prev, slug],
    );
  }, []);

  const unmarkCompleted = useCallback((slug: string) => {
    setCompleted((prev) => prev.filter((item) => item !== slug));
  }, []);

  const reset = useCallback(() => {
    setVisited([]);
    setCompleted([]);
    setStreak(0);
    setLastVisit(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(
    () => ({
      visited,
      completed,
      streak,
      lastVisit,
      markVisited,
      markCompleted,
      unmarkCompleted,
      reset,
    }),
    [
      visited,
      completed,
      streak,
      lastVisit,
      markVisited,
      markCompleted,
      unmarkCompleted,
      reset,
    ],
  );

  return (
    <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error("useProgress must be used inside <ProgressProvider>");
  }
  return context;
}
