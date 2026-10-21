"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Called when the boundary catches an error. */
  onError?: (error: Error, info: ErrorInfo) => void;
};

type State = {
  error: Error | null;
};

/**
 * Catches render-time errors from the learner's component so a broken
 * preview never takes down the whole page.
 *
 * The error is shown inline in the preview panel (the "inline" error
 * strategy), and announced to screen readers through `role="alert"`.
 *
 * The boundary is remounted (via a changing `key`) whenever a new
 * version of the code is compiled, which clears the previous error.
 */
export class PlaygroundErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        role="alert"
        className="flex flex-col gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4"
      >
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="text-base">
            ⚠
          </span>
          <p className="text-sm font-bold text-rose-700 dark:text-rose-300">
            Component က render ဖို့ မရနိုင်တော့ဘူး
          </p>
        </div>

        <pre className="scrollbar-slim max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-[var(--surface-sunken)] p-3 font-mono text-xs leading-6 text-[var(--text-strong)]">
          {error.message}
        </pre>

        {error.stack ? (
          <details className="group">
            <summary className="cursor-pointer text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-strong)]">
              Stack trace ပြမယ်
            </summary>
            <pre className="scrollbar-slim mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-[var(--surface-sunken)] p-3 font-mono text-[11px] leading-5 text-[var(--text-subtle)]">
              {error.stack}
            </pre>
          </details>
        ) : null}
      </div>
    );
  }
}
