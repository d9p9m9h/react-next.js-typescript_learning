"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ConsoleEntry } from "@/components/playground/playground-console";
import type { SandboxLogEntry } from "@/components/playground/playground-preview";

/**
 * Buffers sandbox log entries so the playground does not re-render on
 * every single `console.*` call. Extracted from the main playground
 * component as `usePlaygroundConsole`.
 */
export function usePlaygroundConsole(): {
  consoleEntries: ConsoleEntry[];
  handleSandboxLog: (entry: SandboxLogEntry) => void;
  clearConsole: () => void;
} {
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);

  const consoleIdRef = useRef(0);
  const pendingLogsRef = useRef<ConsoleEntry[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (flushTimerRef.current !== null) {
        clearTimeout(flushTimerRef.current);
      }
    };
  }, []);

  const handleSandboxLog = useCallback((entry: SandboxLogEntry) => {
    const next: ConsoleEntry = {
      id: ++consoleIdRef.current,
      level: entry.level,
      text: entry.text,
    };

    pendingLogsRef.current.push(next);

    if (flushTimerRef.current !== null) return;

    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null;
      const pending = pendingLogsRef.current;
      if (pending.length === 0) return;
      pendingLogsRef.current = [];
      setConsoleEntries((prev) => [...prev, ...pending].slice(-200));
    }, 120);
  }, []);

  const clearConsole = useCallback(() => {
    setConsoleEntries([]);
  }, []);

  return { consoleEntries, handleSandboxLog, clearConsole };
}

export default usePlaygroundConsole;
