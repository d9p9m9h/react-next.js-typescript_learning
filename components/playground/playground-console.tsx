"use client";

export type ConsoleEntry = {
  id: number;
  level: "log" | "info" | "warn" | "error";
  /** The already-formatted text shown in the console. */
  text: string;
};

type PlaygroundConsoleProps = {
  entries: ConsoleEntry[];
  onClear: () => void;
};

const LEVEL_COLOR: Record<ConsoleEntry["level"], string> = {
  log: "text-[var(--text-muted)]",
  info: "text-[var(--highlight)]",
  warn: "text-amber-600 dark:text-amber-400",
  error: "text-rose-600 dark:text-rose-400",
};

const LEVEL_LABEL: Record<ConsoleEntry["level"], string> = {
  log: "log",
  info: "info",
  warn: "warn",
  error: "error",
};

/**
 * A small console strip that mirrors `console.log` output from the
 * learner's component.
 */
export function PlaygroundConsole({ entries, onClear }: PlaygroundConsoleProps) {
  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--surface-border)] bg-[var(--surface-sunken)]">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--surface-border)] px-4 py-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
          Console
        </span>
        <button
          type="button"
          onClick={onClear}
          disabled={entries.length === 0}
          className="rounded-md border border-[var(--surface-border)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:border-[var(--surface-border-strong)] hover:text-[var(--text-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear
        </button>
      </div>

      <div
        aria-live="polite"
        aria-label="Console output"
        className="scrollbar-slim min-h-0 flex-1 overflow-auto p-3"
      >
        {entries.length === 0 ? (
          <p className="px-1 py-2 text-xs leading-5 text-[var(--text-subtle)]">
            Console ထဲမှာ စာတစ်ချောင်းလည်း မရှိသေးပါ။ `console.log(...)` ထည့်ကြည့်ပါ။
          </p>
        ) : (
          <ul className="space-y-1">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex gap-2 rounded-md px-1 py-0.5 font-mono text-[11px] leading-5"
              >
                <span
                  className={`shrink-0 select-none ${LEVEL_COLOR[entry.level]}`}
                >
                  {LEVEL_LABEL[entry.level]}
                </span>
                <span className="min-w-0 flex-1 break-words whitespace-pre-wrap text-[var(--text-muted)]">
                  {entry.text}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
