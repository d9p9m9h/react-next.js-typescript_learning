"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PlaygroundConsole, type ConsoleEntry } from "@/components/playground/playground-console";
import { PlaygroundEditor } from "@/components/playground/playground-editor";
import { PlaygroundErrorBoundary } from "@/components/playground/playground-error-boundary";
import {
  PlaygroundPreview,
  type SandboxErrorReport,
  type SandboxLogEntry,
} from "@/components/playground/playground-preview";
import {
  PlaygroundPropsEditor,
  type EditablePropValue,
} from "@/components/playground/playground-props-editor";
import {
  PlaygroundViewToggle,
  type PlaygroundView,
} from "@/components/playground/playground-view-toggle";
import { PlaygroundWidthToggle } from "@/components/playground/playground-width-toggle";
import { useTheme } from "@/components/theme-provider";
import { readDrafts, removeDraft, writeDrafts } from "@/lib/playground/drafts";
import type { PlaygroundFile } from "@/lib/playground/files";
import { playgroundTargets } from "@/lib/playground/registry";
import type { TypeDiagnostic } from "@/lib/playground/typecheck";

type PlaygroundProps = {
  /** Every `.tsx` file found in the `practice/` folder. */
  files: PlaygroundFile[];
  /** The file that should be open when the playground first renders. */
  initialFile: string;
};

type Status = "idle" | "compiling" | "ok" | "error";

/**
 * The live playground.
 *
 * Selecting a file loads its source into the editor. Editing the source
 * sends it to `/api/playground/compile`, which runs Sucrase on the server
 * and returns plain CommonJS. That module is handed to the isolated
 * preview (`components/playground/playground-preview.tsx`), which runs it
 * inside a sandboxed iframe and reports console output and runtime
 * errors back to this page.
 */
export function Playground({ files, initialFile }: PlaygroundProps) {
  const { resolvedTheme } = useTheme();
  const [activeName, setActiveName] = useState(initialFile);
  const [buffers, setBuffers] = useState<Record<string, string>>(() =>
    Object.fromEntries(files.map((file) => [file.name, file.source])),
  );
  const [status, setStatus] = useState<Status>("idle");
  const [compileError, setCompileError] = useState<string | null>(null);
  const [runtimeError, setRuntimeError] = useState<SandboxErrorReport | null>(
    null,
  );
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [compiledCode, setCompiledCode] = useState<string | null>(null);
  const [compiledCss, setCompiledCss] = useState<string | null>(null);
  /** The highlighted source, as HTML, for the code pane. */
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);
  /** The type errors found in the current source. */
  const [typeDiagnostics, setTypeDiagnostics] = useState<TypeDiagnostic[]>([]);
  /**
   * Which panel is on screen.
   *
   * The editor and the preview take turns: the other one is hidden with
   * `display: none` (not unmounted), so the editor keeps its cursor
   * position and the sandbox keeps its rendered result when the learner
   * switches back and forth.
   */
  const [view, setView] = useState<PlaygroundView>("code");
  /**
   * The width the preview is shown at.
   *
   * `null` means the preview fills its panel. A fixed width lets the
   * learner see how a responsive component behaves on a phone or a
   * tablet.
   */
  const [previewWidth, setPreviewWidth] = useState<number | null>(null);
  /**
   * The prop values the learner has changed in the props panel.
   *
   * They are applied on top of the registry's own values, so a
   * component can be tried with different input without editing the
   * file.
   */
  const [propOverrides, setPropOverrides] = useState<
    Record<string, EditablePropValue>
  >({});

  // Prevents a stale compile response from replacing newer editor contents.
  const requestIdRef = useRef(0);
  const compileControllerRef = useRef<AbortController | null>(null);
  const consoleIdRef = useRef(0);
  /** Console entries waiting to be flushed into React state. */
  const pendingLogsRef = useRef<ConsoleEntry[]>([]);
  /** The pending flush timer for buffered console entries. */
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** The tab buttons, so keyboard navigation can move the focus. */
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const activeFile = useMemo(
    () => files.find((file) => file.name === activeName) ?? files[0],
    [files, activeName],
  );

  /**
   * Restores the saved drafts on the first mount.
   *
   * The drafts live in `localStorage`, so they are only available on
   * the client. They are applied in an effect (not in the state
   * initialiser) so the server-rendered markup and the first client
   * render agree.
   */
  const draftsRestoredRef = useRef(false);

  useEffect(() => {
    if (draftsRestoredRef.current) return;
    draftsRestoredRef.current = true;

    const drafts = readDrafts();
    if (Object.keys(drafts).length === 0) return;

    setBuffers((prev) => {
      const next = { ...prev };

      for (const file of files) {
        const draft = drafts[file.name];
        if (draft !== undefined) next[file.name] = draft;
      }

      return next;
    });
  }, [files]);

  /**
   * Saves the edited buffers as drafts.
   *
   * Only the files that actually differ from disk are stored, so the
   * payload stays small and a file the learner did not touch is never
   * shadowed by a stale draft.
   */
  useEffect(() => {
    if (!draftsRestoredRef.current) return;

    const drafts: Record<string, string> = {};

    for (const file of files) {
      const buffer = buffers[file.name];
      if (buffer !== undefined && buffer !== file.source) {
        drafts[file.name] = buffer;
      }
    }

    writeDrafts(drafts);
  }, [buffers, files]);

  const source = activeFile ? (buffers[activeFile.name] ?? "") : "";
  const target = activeFile ? playgroundTargets[activeFile.name] : undefined;
  const componentName = target?.component ?? "default";
  const registryProps = target?.props ?? {};

  /**
   * The props actually handed to the component.
   *
   * The learner's overrides win over the registry's values.
   */
  const props = useMemo(
    () => ({ ...registryProps, ...propOverrides }),
    [registryProps, propOverrides],
  );

  /**
   * Some practice files are entirely commented out, so there is nothing to
   * render. `"none"` marks those files.
   */
  const hasNoComponent = componentName === "none";

  const run = useCallback(
    async (
      fileName: string,
      code: string,
      requestId: number,
      signal: AbortSignal,
    ) => {
      try {
        const response = await fetch("/api/playground/compile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal,
          body: JSON.stringify({
            fileName,
            source: code,
            component: componentName,
          }),
        });

        const result = (await response.json()) as {
          ok: boolean;
          code?: string;
          css?: string;
          html?: string;
          diagnostics?: TypeDiagnostic[];
          error?: string;
        };

        if (requestId !== requestIdRef.current) return;

        if (!result.ok || !result.code || !result.css) {
          setStatus("error");
          setCompileError(result.error ?? "Compile မအောင်မြင်ပါ။");
          setCompiledCode(null);
          setCompiledCss(null);
          setHighlightedHtml(null);
          setTypeDiagnostics([]);
          return;
        }

        setCompiledCode(result.code);
        setCompiledCss(result.css);
        setHighlightedHtml(result.html ?? null);
        setTypeDiagnostics(result.diagnostics ?? []);
        setStatus("ok");
      } catch (error) {
        if (signal.aborted || requestId !== requestIdRef.current) return;
        setStatus("error");
        setCompileError(
          error instanceof Error
            ? `Compile API ကို မေးနိုင်ခဲ့ပါ။ ${error.message}`
            : "Compile API ကို မေးနိုင်ခဲ့ပါ။ Server ကို စစ်ပါ။",
        );
        setCompiledCode(null);
        setCompiledCss(null);
        setHighlightedHtml(null);
        setTypeDiagnostics([]);
      }
    },
    [componentName],
  );

  // Compile edits promptly and cancel any request for an older source.
  useEffect(() => {
    if (!activeFile || hasNoComponent) return;

    const requestId = ++requestIdRef.current;
    compileControllerRef.current?.abort();
    setStatus("compiling");
    setCompileError(null);
    setRuntimeError(null);

    const timer = setTimeout(() => {
      const controller = new AbortController();
      compileControllerRef.current = controller;
      void run(activeFile.name, source, requestId, controller.signal);
    }, 180);

    return () => {
      clearTimeout(timer);
      compileControllerRef.current?.abort();
    };
  }, [activeFile, source, run, hasNoComponent]);

  // Clear the preview when the active file has nothing to render.
  useEffect(() => {
    if (!hasNoComponent) return;
    setCompiledCode(null);
    setCompiledCss(null);
    setStatus("idle");
  }, [hasNoComponent]);

  // Flush any buffered console entries when the playground unmounts.
  useEffect(() => {
    return () => {
      if (flushTimerRef.current !== null) {
        clearTimeout(flushTimerRef.current);
      }
    };
  }, []);

  /**
   * A log line from inside the sandbox.
   *
   * The entry is buffered in a ref and flushed on a timer. Writing to
   * React state directly would re-render the playground on every log
   * call, and React's own development logging would loop.
   */
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

  const handleSandboxError = useCallback((error: SandboxErrorReport) => {
    setRuntimeError(error);
    setStatus("error");
  }, []);

  const handleSandboxRendered = useCallback(() => {
    setRuntimeError(null);
  }, []);

  function handleChange(next: string) {
    if (!activeFile) return;
    setBuffers((prev) => ({ ...prev, [activeFile.name]: next }));
  }

  function handleReset() {
    if (!activeFile) return;
    setBuffers((prev) => ({
      ...prev,
      [activeFile.name]: activeFile.source,
    }));
    removeDraft(activeFile.name);
  }

  /**
   * Moves the selection with the arrow keys.
   *
   * The file list is a `tablist`, so the ARIA tabs pattern expects the
   * arrow keys to move between tabs, `Home` / `End` to jump to the ends.
   */
  function handleTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const index = files.findIndex((file) => file.name === activeName);
    if (index === -1) return;

    let nextIndex: number | null = null;

    switch (event.key) {
      case "ArrowRight":
        nextIndex = (index + 1) % files.length;
        break;
      case "ArrowLeft":
        nextIndex = (index - 1 + files.length) % files.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = files.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();

    const next = files[nextIndex];
    setActiveName(next.name);
    tabRefs.current[next.name]?.focus();
  }

  const dirty = activeFile ? source !== activeFile.source : false;

  /** Whether the last compile or render produced a visible problem. */
  const hasError = Boolean(compileError) || Boolean(runtimeError);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* File selector + the editor / preview layout controls */}
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div
          role="tablist"
          aria-label="Playground files"
          className="scrollbar-slim -mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1 pb-1"
        >
          {files.map((file) => {
            const isActive = file.name === activeName;
            const info = playgroundTargets[file.name];

            return (
              <button
                key={file.name}
                ref={(node) => {
                  tabRefs.current[file.name] = node;
                }}
                type="button"
                role="tab"
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveName(file.name)}
                onKeyDown={handleTabKeyDown}
                className={[
                  "flex shrink-0 items-center gap-2 rounded-lg border px-2.5 py-1 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
                  isActive
                    ? "border-[var(--highlight)] bg-[var(--highlight)]/10 text-[var(--highlight)]"
                    : "border-[var(--surface-border)] bg-[var(--surface-raised)] text-[var(--text-muted)] hover:border-[var(--surface-border-strong)] hover:text-[var(--text-strong)]",
                ].join(" ")}
              >
                <span className="font-mono text-xs font-semibold">
                  {file.name}
                </span>
                {info?.label ? (
                  <span className="hidden rounded-md bg-[var(--surface-sunken)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-subtle)] sm:inline">
                    {info.label}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <PlaygroundViewToggle value={view} onChange={setView} />
      </div>

      {/* Keep both panels mounted so switching views preserves editor and preview state. */}
      <div
        className={[
          "grid min-h-[320px] min-w-0 flex-1 grid-cols-1 gap-3 lg:min-h-0 lg:gap-4",
          view === "split" ? "lg:grid-cols-2" : "lg:grid-cols-1",
        ].join(" ")}
      >
        <section
          className={[
            "min-h-[320px] min-w-0 flex-col lg:min-h-0",
            view === "code" || view === "split" ? "flex" : "hidden",
          ].join(" ")}
        >
          <h2 className="mb-2 flex shrink-0 items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-[var(--accent)]"
            />
            Source · ရေးမယ့် code
          </h2>

          {/*
            A compact error strip.

            The full error text lives over the preview, but the learner
            may be looking at the editor, so the problem is announced
            here too — with a button that jumps straight to the preview.
          */}
          {compileError || runtimeError ? (
            <div
              role="alert"
              className="mb-2 flex shrink-0 items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2"
            >
              <span aria-hidden="true" className="text-xs">
                ⚠
              </span>
              <p className="min-w-0 flex-1 truncate text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                {compileError ?? runtimeError?.message}
              </p>
              <button
                type="button"
                onClick={() => setView("preview")}
                className="shrink-0 rounded-md border border-rose-500/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-700 transition-colors hover:bg-rose-500/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] dark:text-rose-300"
              >
                Details
              </button>
            </div>
          ) : null}

          {/*
            The type errors.

            They are *not* compile errors — the code still runs — so
            they get their own, quieter panel under the editor.
          */}
          {typeDiagnostics.length > 0 ? (
            <div
              role="status"
              className="mb-2 flex shrink-0 flex-col gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Type error · {typeDiagnostics.length} ခု
              </p>
              <ul className="flex flex-col gap-1">
                {typeDiagnostics.slice(0, 4).map((diagnostic) => (
                  <li
                    key={`${diagnostic.code}-${diagnostic.start}`}
                    className="text-[11px] leading-5 text-amber-800 dark:text-amber-200"
                  >
                    <span className="font-mono font-semibold">
                      {diagnostic.line}:{diagnostic.column}
                    </span>{" "}
                    <span className="text-amber-700/80 dark:text-amber-300/90">
                      {diagnostic.message}
                    </span>
                  </li>
                ))}
                {typeDiagnostics.length > 4 ? (
                  <li className="text-[10px] font-semibold text-amber-700/70 dark:text-amber-300/70">
                    နောက်ထပ် {typeDiagnostics.length - 4} ခု ရှိပါတယ်
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <PlaygroundEditor
              value={source}
              onChange={handleChange}
              fileName={activeFile?.name ?? ""}
              busy={status === "compiling"}
              status={hasNoComponent ? "idle" : status}
              onReset={handleReset}
              dirty={dirty}
              highlighted={highlightedHtml ?? undefined}
            />

            {/*
              The props panel.

              It sits under the editor, so the preview below it keeps
              the space it needs while the values stay reachable.
            */}
            {Object.keys(registryProps).length > 0 ? (
              <details className="group mt-2 shrink-0 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-sunken)]">
                <summary className="cursor-pointer list-none px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)] transition-colors hover:text-[var(--text-strong)]">
                  Props · တန်းဖြည့်လို့ရမယ့် တန်ဖ
                </summary>
                <div className="border-t border-[var(--surface-border)] px-4 py-3">
                  <PlaygroundPropsEditor
                    props={registryProps}
                    overrides={propOverrides}
                    onChange={(name, value) =>
                      setPropOverrides((prev) => ({ ...prev, [name]: value }))
                    }
                    onReset={(name) =>
                      setPropOverrides((prev) => {
                        const next = { ...prev };
                        delete next[name];
                        return next;
                      })
                    }
                  />
                </div>
              </details>
            ) : null}
          </div>
        </section>

        <section
          className={[
            "min-h-[320px] min-w-0 flex-col lg:min-h-0",
            view === "preview"
              ? "flex"
              : view === "split"
                ? "hidden lg:flex"
                : "hidden",
          ].join(" ")}
        >
          <h2 className="mb-2 flex shrink-0 items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-[var(--highlight)]"
            />
            Preview · ရလဒ်
          </h2>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--surface-border)] bg-[var(--surface-raised)]">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--surface-border)] px-3 py-2">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={[
                    "size-2 rounded-full",
                    hasError
                      ? "bg-rose-500"
                      : status === "compiling"
                        ? "bg-amber-500"
                        : "bg-emerald-500",
                  ].join(" ")}
                />
                <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                  Rendered result
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  aria-live="polite"
                  className={[
                    "rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    hasError
                      ? "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      : status === "compiling"
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "border-[var(--surface-border)] text-[var(--text-subtle)]",
                  ].join(" ")}
                >
                  {hasError ? "error" : status === "compiling" ? "compiling" : "live"}
                </span>
                <PlaygroundWidthToggle
                  value={previewWidth}
                  onChange={setPreviewWidth}
                />
              </div>
            </div>

            <div className="relative flex min-h-0 flex-1 flex-col">
              {hasNoComponent ? (
                <div className="min-h-0 flex-1 overflow-auto p-5 sm:p-6">
                  <p className="text-sm leading-7 text-[var(--text-muted)]">
                    ဒီဖိုင်ထဲမှာ component မရှိသေးပါ — code အားလုံး comment အဖြစ်
                    ရှိနေပါတယ်။ Code ဘက်မှာ code ကို ဖြည့်ပြီး စမ်းကြည့်ပါ။
                  </p>
                </div>
              ) : (
                <PlaygroundErrorBoundary>
                  <PlaygroundPreview
                    code={compiledCode}
                    css={compiledCss}
                    component={componentName}
                    props={props}
                    theme={resolvedTheme}
                    width={previewWidth}
                    onLog={handleSandboxLog}
                    onError={handleSandboxError}
                    onRendered={handleSandboxRendered}
                  />

                  {/* Compile and runtime problems are shown over the preview. */}
                  {compileError || runtimeError ? (
                    <div className="pointer-events-none absolute inset-0 overflow-auto p-5 sm:p-6">
                      <div
                        role="alert"
                        className="flex flex-col gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4"
                      >
                        <div className="flex items-center gap-2">
                          <span aria-hidden="true">⚠</span>
                          <p className="text-sm font-bold text-rose-700 dark:text-rose-300">
                            {compileError
                              ? "Compile မအောင်မြင်ပါ"
                              : "Runtime error ဖြစ်ပါတယ်"}
                          </p>
                        </div>
                        <pre className="scrollbar-slim max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-[var(--surface-sunken)] p-3 font-mono text-xs leading-6 text-[var(--text-strong)]">
                          {compileError ?? runtimeError?.message}
                        </pre>
                      </div>
                    </div>
                  ) : null}
                </PlaygroundErrorBoundary>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Console */}
      <section className="flex h-28 min-w-0 shrink-0 flex-col sm:h-32">
        <PlaygroundConsole
          entries={consoleEntries}
          onClear={() => setConsoleEntries([])}
        />
      </section>
    </div>
  );
}
