"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ProgressState = {
  /** Lesson slugs the learner has opened. */
  completed: string[];
  /** Number of consecutive days with at least one lesson opened. */
  streak: number;
  /** Local date (yyyy-mm-dd) of the most recent visit. */
  lastVisit: string | null;
  markVisited: (slug: string) => void;
  reset: () => void;
};

const STORAGE_KEY = "react-lab-progress";

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

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [completed, setCompleted] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [lastVisit, setLastVisit] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // The ref mirrors the state so markVisited always reads the latest values
  // without needing them in its dependency list.
  const stateRef = useRef({ completed, streak, lastVisit });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          completed?: string[];
          streak?: number;
          lastVisit?: string | null;
        };
        setCompleted(parsed.completed ?? []);
        setStreak(parsed.streak ?? 0);
        setLastVisit(parsed.lastVisit ?? null);
      }
    } catch {
      // Corrupted storage — start fresh.
    }
    setHydrated(true);
  }, []);

  // Persist whenever the state changes (after hydration).
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ completed, streak, lastVisit }),
      );
    } catch {
      // Storage unavailable (private mode) — ignore.
    }
  }, [completed, streak, lastVisit, hydrated]);

  const markVisited = useCallback((slug: string) => {
    const current = stateRef.current;
    const now = today();

    if (!current.completed.includes(slug)) {
      setCompleted([...current.completed, slug]);
    }

    if (current.lastVisit === now) return;

    if (!current.lastVisit) {
      setStreak(1);
    } else {
      const gap = daysBetween(current.lastVisit, now);
      if (gap === 1) {
        setStreak(current.streak + 1);
      } else if (gap > 1) {
        setStreak(1);
      }
    }

    setLastVisit(now);
  }, []);

  // Keep the ref in sync *after* the state has settled, so a second
  // markVisited call in the same tick does not double-count.
  useEffect(() => {
    stateRef.current = { completed, streak, lastVisit };
  }, [completed, streak, lastVisit]);

  const reset = useCallback(() => {
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
    () => ({ completed, streak, lastVisit, markVisited, reset }),
    [completed, streak, lastVisit, markVisited, reset],
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
