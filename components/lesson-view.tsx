"use client";

import { useEffect } from "react";

import { CodePane } from "@/components/code-pane";
import { LessonDemo } from "@/components/lesson-demos";
import { useProgress } from "@/components/progress-store";
import type { Lesson } from "@/lib/lessons";

export function LessonView({ lesson }: { lesson: Lesson }) {
  const { markVisited } = useProgress();

  useEffect(() => {
    markVisited(lesson.slug);
  }, [lesson.slug, markVisited]);

  const demoKey = lesson.demoKey;

  return (
    <div className="flex flex-col gap-6">
      {/* Lesson header */}
      <section className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-raised)] p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-[var(--highlight)]/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--highlight)]">
            Lesson {lesson.number}
          </span>
          <span className="rounded-md bg-[var(--surface-sunken)] px-2.5 py-1 font-mono text-[11px] text-[var(--text-subtle)]">
            {lesson.file}
          </span>
        </div>

        <h1 className="mt-4 text-2xl font-black tracking-tight text-[var(--text-strong)] sm:text-3xl">
          {lesson.title}
        </h1>
        <p className="mt-1 text-sm font-medium text-[var(--highlight)]">
          {lesson.detail}
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
          {lesson.concept}
        </p>
      </section>

      {/* Code + Preview */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-2">
        <section className="flex min-h-[420px] min-w-0 flex-col">
          <h2 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-[var(--accent)]"
            />
            Source
          </h2>
          <div className="min-h-0 min-w-0 flex-1">
            <CodePane
              code={lesson.code}
              language={lesson.language}
              file={lesson.file}
            />
          </div>
        </section>

        <section className="flex min-h-[420px] min-w-0 flex-col">
          <h2 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-[var(--highlight)]"
            />
            Live preview
          </h2>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-raised)]">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--surface-border)] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full bg-emerald-500"
                />
                <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                  Render area
                </span>
              </div>
              <span className="rounded-md border border-[var(--surface-border)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                responsive
              </span>
            </div>

            <div className="scrollbar-slim min-h-0 flex-1 overflow-auto p-5 sm:p-6">
              {demoKey ? (
                <LessonDemo demoKey={demoKey} />
              ) : (
                <p className="text-sm leading-7 text-[var(--text-muted)]">
                  ဒီ lesson က အခုပဲ code ဖတ်ရန် အကြောင်းရှင်းပါတယ်။ အောက်က နောက်တစ် lesson မှာ interactive demo ပါဝင်ပါမယ်။
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Reminders */}
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { n: "01", t: "Observe", d: "Code က ဘယ်လို UI ဖြစ်လာသလဲ ကြည့်ပါ။" },
          { n: "02", t: "Experiment", d: "JSX ထဲက text နဲ့ elements တွေကို ပြောင်းကြည့်ပါ။" },
          { n: "03", t: "Understand", d: "UI ပြောင်းသွားရတဲ့ အကြောင်းရင်းကို ပြန်ရှင်းပြပါ။" },
        ].map((item) => (
          <div
            key={item.n}
            className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-raised)] p-4"
          >
            <p className="text-xs font-bold text-[var(--text-strong)]">
              <span className="mr-2 text-[var(--accent)]">{item.n}</span>
              {item.t}
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
              {item.d}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
