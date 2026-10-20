"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useProgress } from "@/components/progress-store";
import { ThemeToggle } from "@/components/theme-toggle";
import { lessonCount, lessonIndex } from "@/lib/lesson-index";

export function LabHeader() {
  const pathname = usePathname();
  const { visited, completed, streak } = useProgress();

  const activeSlug = pathname?.startsWith("/lesson/")
    ? pathname.split("/lesson/")[1]
    : null;
  const activeLesson = lessonIndex.find((l) => l.slug === activeSlug);

  // Only confirmed completions count toward the progress bar.
  const percent = Math.round((completed.length / lessonCount) * 100);

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
              {activeLesson
                ? `${activeLesson.number} · ${activeLesson.title}`
                : "Build · Experiment · Understand"}
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Progress — counts confirmed completions only */}
          <div className="hidden items-center gap-3 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-sunken)] px-3 py-1.5 md:flex">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)]">
                Progress
              </span>
              <span className="text-xs font-semibold tabular-nums text-[var(--text-strong)]">
                {completed.length}/{lessonCount} completed
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Course progress"
              className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--surface-border)]"
            >
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          {/* Visited count — shown separately so opening is not completion */}
          <div
            title={`${visited.length} of ${lessonCount} lessons visited`}
            className="hidden items-center gap-2 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-sunken)] px-3 py-2 sm:flex"
          >
            <span
              aria-hidden="true"
              className="size-2 rounded-full border-2 border-[var(--text-subtle)]"
            />
            <span className="text-xs font-bold tabular-nums text-[var(--text-muted)]">
              {visited.length}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
              visited
            </span>
          </div>

          {/* Streak */}
          <div
            title={`${streak} day streak`}
            className="flex items-center gap-2 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-sunken)] px-3 py-2"
          >
            <span
              aria-hidden="true"
              className="text-sm leading-none text-[var(--highlight)]"
            >
              ✦
            </span>
            <span className="text-xs font-bold tabular-nums text-[var(--text-strong)]">
              {streak}
            </span>
            <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)] sm:inline">
              streak
            </span>
          </div>

          <ThemeToggle compact />
        </div>
      </div>
    </header>
  );
}
