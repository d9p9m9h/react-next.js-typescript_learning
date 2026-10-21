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
  /**
   * The highlighted source, as HTML.
   *
   * The overlay behind the textarea shows it; the textarea's own text
   * stays transparent, so the caret and the selection still work.
   */
  highlighted?: string;
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
  highlighted,
}: PlaygroundEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

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

  /**
   * Scrolls the highlight layer together with the textarea.
   *
   * The two layers are separate boxes, so the textarea's scroll
   * position has to be copied onto the highlighted one — otherwise the
   * colours would drift away from the text as soon as the code is
   * longer than the box.
   *
   * The textarea's own scrollbar makes its content box a few pixels
   * narrower than the layer, so the layer is also nudged by the
   * difference; without it the coloured text would sit a fraction of
   * a pixel to the left of the caret.
   */
  function handleScroll() {
    const textarea = textareaRef.current;
    const pre = preRef.current;
    if (!textarea || !pre) return;

    pre.scrollTop = textarea.scrollTop;
    pre.scrollLeft = textarea.scrollLeft;
  }

  /**
   * Keeps the two layers the same width.
   *
   * The layer fills the panel, while the textarea's scrollbar takes a
   * few pixels away from the textarea's content box. The layer is
   * therefore padded by the difference, so the two content boxes have
   * exactly the same width and the coloured text sits on the same
   * pixel as the caret.
   */
  useEffect(() => {
    const textarea = textareaRef.current;
    const pre = preRef.current;
    if (!textarea || !pre) return;

    function sync() {
      // The layer fills the panel, while the textarea's scrollbar
      // takes a few pixels away from its content box. The difference
      // is added to the layer's right padding, so the two content boxes
      // end up exactly the same width.
      const gutter = preElement.clientWidth - textareaElement.clientWidth;
      preElement.style.paddingRight = `${16 + Math.max(0, gutter)}px`;
    }

    const textareaElement = textarea;
    const preElement = pre;

    sync();

    const observer = new ResizeObserver(sync);
    observer.observe(textareaElement);

    return () => observer.disconnect();
    // The layer is only rendered once the first compile has answered,
    // so the effect has to run again when that happens.
  }, [highlighted]);

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
    /*
     * The panel must fill the space the playground gives it.
     *
     * It cannot use `h-full` (i.e. `height: 100%`) for that: the
     * parent is a **flex item** whose height comes from the flex
     * layout, and a percentage height cannot resolve against an
     * indefinite height — it silently falls back to `auto`, which
     * collapses the editor to the height of its own content.
     *
     * So the panel is a flex *item* (`flex-1`) of a flex *column*
     * parent, and the textarea is a flex item of the panel. No
     * percentage heights are involved, so every box gets the height
     * it is actually given.
     */
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--surface-border)] bg-[var(--surface-sunken)]">
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

      {/*
        The scroll container.

        The `<textarea>` is the thing that scrolls, so it is the flex
        item that grows — the container only provides the focus ring
        and the padding-free frame around it.
      */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-[var(--accent)]">
        {/*
          The highlight layer.

          It is a `<pre>` behind the textarea with the same padding,
          font and line height, so the coloured text lines up exactly
          with the transparent text of the textarea.

          `whitespace-pre` is what keeps the layer from wrapping: the
          textarea uses `wrap="off"`, so a long line stays on one
          line there and has to stay on one line here too.

          The layer is `inset-0`, so it is exactly as wide as the
          panel, while the textarea's scrollbar takes a few pixels
          away from its content box. The two are therefore offset by
          the width of the scrollbar, which is corrected in
          `handleScroll` — the layer is moved by the difference.
        */}
        {highlighted ? (
          <pre
            ref={preRef}
            aria-hidden="true"
            className="scrollbar-slim pointer-events-none absolute inset-0 m-0 overflow-hidden whitespace-pre p-4 font-mono text-[13px] leading-relaxed text-[var(--text-strong)]"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        ) : null}

        <label className="sr-only" htmlFor="playground-source">
          {fileName} ရဲ့ source code
        </label>
        <textarea
          id="playground-source"
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onScroll={handleScroll}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          /*
           * `wrap="off"` turns the soft wrapping off, so a long line
           * stays on one line and the pane scrolls sideways instead.
           * That is what a code editor does, and it is the only way the
           * caret can sit *on* a character instead of in the middle of
           * a wrapped line.
           */
          wrap="off"
          className={[
            "scrollbar-slim min-h-0 w-full flex-1 resize-none overflow-auto bg-transparent p-4 font-mono text-[13px] leading-relaxed outline-none",
            highlighted
              ? "text-transparent caret-[var(--text-strong)] selection:bg-[var(--accent)]/30"
              : "text-[var(--text-strong)]",
          ].join(" ")}
        />
      </div>
    </div>
  );
}
