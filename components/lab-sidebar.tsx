"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useProgress } from "@/components/progress-store";
import { lessonIndex } from "@/lib/lesson-index";

export function LabSidebar() {
  const pathname = usePathname();
  const { visited, completed } = useProgress();

  const activeSlug = pathname?.startsWith("/lesson/")
    ? pathname.split("/lesson/")[1]
    : pathname === "/"
      ? lessonIndex[0]?.slug
      : null;

  return (
    <aside className="flex flex-col gap-4">
      <nav
        aria-label="Learning path"
        className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-raised)] p-4"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
            Learning path
          </p>
          <span className="rounded-md bg-[var(--surface-sunken)] px-2 py-1 text-[10px] font-bold tabular-nums text-[var(--text-muted)]">
            {completed.length}/{lessonIndex.length}
          </span>
        </div>

        <ol className="mt-4 space-y-1.5">
          {lessonIndex.map((lesson) => {
            const isActive = lesson.slug === activeSlug;
            const isDone = completed.includes(lesson.slug);
            const isVisited = visited.includes(lesson.slug);

            return (
              <li key={lesson.slug}>
                <Link
                  href={`/lesson/${lesson.slug}`}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "group flex items-start gap-3 rounded-xl border p-2.5 transition-colors",
                    isActive
                      ? "border-[var(--highlight)] bg-[var(--highlight)]/10"
                      : "border-transparent hover:bg-[var(--surface-sunken)]",
                  ].join(" ")}
                >
                  <span
                    aria-hidden="true"
                    className={[
                      "flex size-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold transition-colors",
                      isActive
                        ? "bg-[var(--highlight)] text-[var(--surface-sunken)]"
                        : isDone
                          ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                          : "bg-[var(--surface-sunken)] text-[var(--text-subtle)]",
                    ].join(" ")}
                  >
                    {isDone && !isActive ? "✓" : lesson.number}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className={[
                        "block text-sm font-semibold leading-5",
                        isActive
                          ? "text-[var(--highlight)]"
                          : "text-[var(--text-strong)]",
                      ].join(" ")}
                    >
                      {lesson.title}
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-[var(--text-subtle)]">
                      {lesson.detail}
                    </span>

                    {/* Visited but not completed — shown as a hollow dot. */}
                    {!isDone && isVisited ? (
                      <span className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                        <span
                          aria-hidden="true"
                          className="size-1.5 rounded-full border border-current"
                        />
                        Visited
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-raised)] p-4">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex size-7 items-center justify-center rounded-lg bg-[var(--highlight)]/15 text-xs text-[var(--highlight)]"
          >
            ✦
          </span>
          <p className="text-xs font-bold text-[var(--text-strong)]">
            Learning tip
          </p>
        </div>
        <p className="mt-2.5 text-xs leading-6 text-[var(--text-muted)]">
          တစ်ကြိမ်မှာ code တစ်ခုကိုပဲ ပြောင်းစမ်းပါ။ ပြီးရင် အရင်ရလဒ်နဲ့ နှိုင်းယှဉ်ကြည့်ပါ။
        </p>
      </div>
    </aside>
  );
}
