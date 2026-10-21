"use client";

import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";

/**
 * The compact application header.
 *
 * The app is a single-purpose workspace, so the header only carries the
 * product name and the theme switch. Everything else lives in the
 * playground itself.
 */
export function LabHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--surface-border)] bg-[var(--surface-raised)]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-3 py-2.5 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-sm font-black text-[var(--accent-contrast)]"
          >
            R
          </span>
          <span className="min-w-0 truncate text-sm font-bold text-[var(--text-strong)] sm:text-base">
            React Code Playground
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
