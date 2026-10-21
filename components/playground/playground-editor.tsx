"use client";

import { useEffect, useRef } from "react";

type PlaygroundEditorProps = {
  /** The current source text. */
  value: string;
  /** Called on every keystroke with the new source. */
  onChange: (value: string) => void;
  /** The file name, shown in the header. */
  fileName: string;
  /** Whether a compile is currently running. */
  busy?: boolean;
  /** The live status of the last compile. */
  status: "idle" | "compiling" | "ok" | "error";
  /** Called when the learner asks to restore the file from disk. */
  onReset?: () => void;
  /** True when the buffer differs from the file on disk. */
  dirty?: boolean;
};

/**
 * A small plain-text editor for the learner's practice files.
 *
 * A `<textarea>` is used rather than a full code editor library: the goal
 * is to show and tweak short practice files, and a textarea keeps the
 * bundle small and the keyboard behaviour native.
 */
export function PlaygroundEditor({
  value,
  onChange,
  fileName,
  busy = false,
  status,
  onReset,
  dirty = false,
}: PlaygroundEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keep Tab inside the editor instead of moving focus away from it.
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab" || event.ctrlKey || event.metaKey) return;

      event.preventDefault();
      const el = event.currentTarget as HTMLTextAreaElement;
      const { selectionStart, selectionEnd } = el;

      const next = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`;
      onChange(next);

      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = selectionStart + 2;
      });
    }

    textarea.addEventListener("keydown", handleKeyDown);
    return () => textarea.removeEventListener("keydown", handleKeyDown);
  }, [value, onChange]);

  const statusLabel = {
    idle: "Ready",
    compiling: "Compiling…",
    ok: "Compiled",
    error: "Error",
  }[status];

  const statusColor = {
    idle: "text-[var(--text-subtle)]",
    compiling: "text-[var(--highlight)]",
    ok: "text-[var(--accent)]",
    error: "text-rose-600 dark:text-rose-400",
  }[status];

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-[var(--surface-border)] bg-[var(--surface-sunken)]">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--surface-border)] px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className="flex size-2.5 gap-1"
          >
            <span className="size-2.5 rounded-full bg-rose-400/80" />
            <span className="size-2.5 rounded-full bg-amber-400/80" />
            <span className="size-2.5 rounded-full bg-emerald-400/80" />
          </span>
          <span className="truncate font-mono text-xs text-[var(--text-muted)]">
            {fileName}
          </span>
          {dirty ? (
            <span className="shrink-0 rounded-md bg-[var(--highlight)]/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--highlight)]">
              edited
            </span>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span
            aria-live="polite"
            className={`text-[11px] font-semibold ${statusColor}`}
          >
            {busy ? (
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-1.5 animate-pulse rounded-full bg-current"
                />
                {statusLabel}
              </span>
            ) : (
              statusLabel
            )}
          </span>

          {onReset ? (
            <button
              type="button"
              onClick={onReset}
              disabled={!dirty}
              className="rounded-md border border-[var(--surface-border)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:border-[var(--surface-border-strong)] hover:text-[var(--text-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Reset
            </button>
          ) : null}
        </div>
      </div>

      <div className="scrollbar-slim min-h-0 flex-1 overflow-auto focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-[var(--accent)]">
        <label className="sr-only" htmlFor="playground-source">
          {fileName} ရဲ့ source code
        </label>
        <textarea
          id="playground-source"
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          className="min-h-full w-full resize-none bg-transparent p-4 font-mono text-[13px] leading-relaxed text-[var(--text-strong)] outline-none"
        />
      </div>
    </div>
  );
}
