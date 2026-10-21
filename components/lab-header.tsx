"use client";

import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";

export function LabHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--surface-border)] bg-[var(--surface-raised)]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-base font-black text-[var(--accent-contrast)]"
          >
            R
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold leading-5 text-[var(--text-strong)] sm:text-base">
              React Learning Lab
            </span>
            <span className="block truncate text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--text-subtle)] sm:text-[11px]">
              Build · Experiment · Understand
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle compact />
        </div>
      </div>
    </header>
  );
}
