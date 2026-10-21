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
import { useTheme } from "@/components/theme-provider";
import type { PlaygroundFile } from "@/lib/playground/files";
import { playgroundTargets } from "@/lib/playground/registry";

type PlaygroundProps = {
  /** Every root-level `.tsx` file found in the project. */
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

  // Guards against a slow compile response overwriting a newer one.
  const requestIdRef = useRef(0);
  const consoleIdRef = useRef(0);
  /** Console entries waiting to be flushed into React state. */
  const pendingLogsRef = useRef<ConsoleEntry[]>([]);
  /** The pending flush timer for buffered console entries. */
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeFile = useMemo(
    () => files.find((file) => file.name === activeName) ?? files[0],
    [files, activeName],
  );

  const source = activeFile ? (buffers[activeFile.name] ?? "") : "";
  const target = activeFile ? playgroundTargets[activeFile.name] : undefined;
  const componentName = target?.component ?? "default";
  const props = target?.props ?? {};

  /**
   * Some practice files are entirely commented out, so there is nothing to
   * render. `"none"` marks those files.
   */
  const hasNoComponent = componentName === "none";

  const run = useCallback(
    async (fileName: string, code: string) => {
      const id = ++requestIdRef.current;
      setStatus("compiling");
      setCompileError(null);
      setRuntimeError(null);

      try {
        const response = await fetch("/api/playground/compile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName,
            source: code,
            component: componentName,
          }),
        });

        const result = (await response.json()) as {
          ok: boolean;
          code?: string;
          error?: string;
        };

        if (id !== requestIdRef.current) return;

        if (!result.ok || !result.code) {
          setStatus("error");
          setCompileError(result.error ?? "Compile မအောင်မြင်ပါ။");
          setCompiledCode(null);
          return;
        }

        setCompiledCode(result.code);
        setStatus("ok");
      } catch {
        if (id !== requestIdRef.current) return;
        setStatus("error");
        setCompileError("Compile API ကို မေးနိုင်ခဲ့ပါ။ Server ကို စစ်ပါ။");
        setCompiledCode(null);
      }
    },
    [componentName],
  );

  // Compile whenever the active file, its source, or the wanted component
  // changes. The 400 ms delay keeps typing from firing a request per key.
  useEffect(() => {
    if (!activeFile || hasNoComponent) return;

    const timer = setTimeout(() => {
      void run(activeFile.name, source);
    }, 400);

    return () => clearTimeout(timer);
  }, [activeFile, source, run, hasNoComponent]);

  // Clear the preview when the active file has nothing to render.
  useEffect(() => {
    if (!hasNoComponent) return;
    setCompiledCode(null);
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
    setStatus("ok");
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
  }

  const dirty = activeFile ? source !== activeFile.source : false;

  return (
    <div className="flex flex-col gap-4">
      {/* File tabs */}
      <div
        role="tablist"
        aria-label="Playground files"
        className="scrollbar-slim -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
      >
        {files.map((file) => {
          const isActive = file.name === activeName;
          const info = playgroundTargets[file.name];

          return (
            <button
              key={file.name}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveName(file.name)}
              className={[
                "flex shrink-0 items-center gap-2 rounded-xl border px-3 py-1.5 text-left transition-colors",
                isActive
                  ? "border-[var(--highlight)] bg-[var(--highlight)]/10 text-[var(--highlight)]"
                  : "border-[var(--surface-border)] bg-[var(--surface-raised)] text-[var(--text-muted)] hover:border-[var(--surface-border-strong)] hover:text-[var(--text-strong)]",
              ].join(" ")}
            >
              <span className="font-mono text-xs font-semibold">
                {file.name}
              </span>
              {info?.label ? (
                <span className="rounded-md bg-[var(--surface-sunken)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-subtle)]">
                  {info.label}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Editor + preview */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-2">
        <section className="flex min-h-[420px] min-w-0 flex-col">
          <h3 className="mb-2.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-[var(--accent)]"
            />
            Source · ရေးမယ့် code
          </h3>
          <div className="min-h-0 min-w-0 flex-1">
            <PlaygroundEditor
              value={source}
              onChange={handleChange}
              fileName={activeFile?.name ?? ""}
              busy={status === "compiling"}
              status={hasNoComponent ? "idle" : status}
              onReset={handleReset}
              dirty={dirty}
            />
          </div>
        </section>

        <section className="flex min-h-[420px] min-w-0 flex-col">
          <h3 className="mb-2.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-[var(--highlight)]"
            />
            Preview · ရလဒ်
          </h3>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-raised)]">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--surface-border)] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full bg-emerald-500"
                />
                <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                  Rendered result
                </span>
              </div>
              <span className="rounded-md border border-[var(--surface-border)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                live
              </span>
            </div>

            <div className="relative min-h-0 flex-1">
              {hasNoComponent ? (
                <div className="h-full overflow-auto p-5 sm:p-6">
                  <p className="text-sm leading-7 text-[var(--text-muted)]">
                    ဒီဖိုင်ထဲမှာ component မရှိသေးပါ — code အားလုံး comment အဖြစ်
                    ရှိနေပါတယ်။ အောက်က editor မှာ code ကို ဖြည့်ပြီး စမ်းကြည့်ပါ။
                  </p>
                </div>
              ) : (
                <PlaygroundErrorBoundary>
                  <PlaygroundPreview
                    code={compiledCode}
                    component={componentName}
                    props={props}
                    theme={resolvedTheme}
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
      <section className="flex h-40 min-w-0 flex-col">
        <PlaygroundConsole
          entries={consoleEntries}
          onClear={() => setConsoleEntries([])}
        />
      </section>
    </div>
  );
}
