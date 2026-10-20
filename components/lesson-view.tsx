"use client";

import { useEffect, useId, useState } from "react";

import { CodePane } from "@/components/code-pane";
import { LessonDemo } from "@/components/lesson-demos";
import { useProgress } from "@/components/progress-store";
import type { Lesson } from "@/lib/lessons";

/** Small helper so every learning section looks and behaves the same. */
function Section({
  step,
  title,
  children,
}: {
  step: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-raised)] p-5 sm:p-6">
      <h2 className="flex items-center gap-2.5 text-sm font-bold text-[var(--text-strong)]">
        <span
          aria-hidden="true"
          className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[10px] font-black text-[var(--accent)]"
        >
          {step}
        </span>
        {title}
      </h2>
      <div className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
        {children}
      </div>
    </section>
  );
}

/** A paragraph of teaching text. */
function Prose({ text }: { text: string }) {
  return <p>{text}</p>;
}

export function LessonView({ lesson }: { lesson: Lesson }) {
  const { visited, completed, markVisited, markCompleted, unmarkCompleted } =
    useProgress();

  const [hintOpen, setHintOpen] = useState(false);
  const hintId = useId();

  useEffect(() => {
    markVisited(lesson.slug);
  }, [lesson.slug, markVisited]);

  const isVisited = visited.includes(lesson.slug);
  const isCompleted = completed.includes(lesson.slug);

  return (
    <div className="flex flex-col gap-5">
      {/* Lesson header */}
      <section className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-raised)] p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-[var(--highlight)]/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--highlight)]">
            Lesson {lesson.number}
          </span>
          <span className="rounded-md bg-[var(--surface-sunken)] px-2.5 py-1 font-mono text-[11px] text-[var(--text-subtle)]">
            {lesson.sourceKind === "file"
              ? lesson.file
              : `${lesson.file} (illustrative)`}
          </span>
          {isCompleted ? (
            <span className="rounded-md bg-[var(--accent)]/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
              ✓ Completed
            </span>
          ) : isVisited ? (
            <span className="rounded-md bg-[var(--surface-sunken)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-subtle)]">
              Visited
            </span>
          ) : null}
        </div>

        <h1 className="mt-4 text-2xl font-black tracking-tight text-[var(--text-strong)] sm:text-3xl">
          {lesson.title}
        </h1>
        <p className="mt-1 text-sm font-medium text-[var(--highlight)]">
          {lesson.detail}
        </p>
      </section>

      {/* 1 — Learning objective */}
      <Section step="01" title="Learning objective · ဘာမှန်းမလိုက်">
        <Prose text={lesson.objective} />
      </Section>

      {/* 2 — Why it matters */}
      <Section step="02" title="Why it matters · ဘာကြောင့် အရေးကြီးလဲ">
        <Prose text={lesson.whyItMatters} />
      </Section>

      {/* 3 — Concept */}
      <Section step="03" title="Concept · ဘယ်လိုအလုပ်လုပ်လဲ">
        <Prose text={lesson.concept} />
      </Section>

      {/* 4 + 5 — Code example and preview */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-2">
        <section className="flex min-h-[380px] min-w-0 flex-col">
          <h2 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-[var(--accent)]"
            />
            04 · Code example
          </h2>
          <div className="min-h-0 min-w-0 flex-1">
            <CodePane
              code={lesson.code}
              language={lesson.language}
              file={
                lesson.sourceKind === "file"
                  ? lesson.file
                  : `${lesson.file} (illustrative)`
              }
            />
          </div>
        </section>

        <section className="flex min-h-[380px] min-w-0 flex-col">
          <h2 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-[var(--highlight)]"
            />
            05 · Preview
          </h2>
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
                read-only
              </span>
            </div>

            <div className="scrollbar-slim min-h-0 flex-1 overflow-auto p-5 sm:p-6">
              {lesson.demoKey ? (
                <LessonDemo demoKey={lesson.demoKey} />
              ) : (
                <p className="text-sm leading-7 text-[var(--text-muted)]">
                  {lesson.previewNote ??
                    "ဒီ lesson က အခုပဲ code ဖတ်ရန် အကြောင်းရှင်းပါတယ်။"}
                </p>
              )}

              {lesson.previewNote ? (
                <p className="mt-4 border-t border-[var(--surface-border)] pt-3 text-xs leading-6 text-[var(--text-subtle)]">
                  {lesson.previewNote}
                </p>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      {/* 6 — Experiment */}
      <Section step="06" title="Experiment · စမ်းသပ်ကြည့်ပါ">
        <Prose text={lesson.experiment} />
      </Section>

      {/* 7 — Exercise */}
      <Section step="07" title="Exercise · ကိုယ်တိုင်လုပ်ကြည့်ပါ">
        <Prose text={lesson.exercise} />
      </Section>

      {/* 8 — Hint (progressive disclosure) */}
      <section className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-raised)] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 className="flex items-center gap-2.5 text-sm font-bold text-[var(--text-strong)]">
            <span
              aria-hidden="true"
              className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-[var(--highlight)]/15 text-[10px] font-black text-[var(--highlight)]"
            >
              08
            </span>
            Hint · ခြိုက်ပေးစေချင်း
          </h2>

          <button
            type="button"
            onClick={() => setHintOpen((open) => !open)}
            aria-expanded={hintOpen}
            aria-controls={hintId}
            className="shrink-0 rounded-lg border border-[var(--surface-border)] px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] transition-colors hover:border-[var(--surface-border-strong)] hover:text-[var(--text-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            {hintOpen ? "Hide hint" : "Show hint"}
          </button>
        </div>

        {hintOpen ? (
          <div
            id={hintId}
            className="mt-3 rounded-xl border border-[var(--highlight)]/25 bg-[var(--highlight)]/8 p-4 text-sm leading-7 text-[var(--text-muted)]"
          >
            {lesson.hint}
          </div>
        ) : (
          <p id={hintId} className="mt-3 text-sm leading-7 text-[var(--text-subtle)]">
            အဖြေကို အရင်း ကိုယ်တိုင် ဖြေကြည့်ပါ။ မေးချင်းခံနေရင် hint ကို ဖွင့်ပါ။
          </p>
        )}
      </section>

      {/* 9 — Self-check and completion */}
      <section className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--surface-raised)] p-5 sm:p-6">
        <h2 className="flex items-center gap-2.5 text-sm font-bold text-[var(--text-strong)]">
          <span
            aria-hidden="true"
            className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[10px] font-black text-[var(--accent)]"
          >
            09
          </span>
          Self-check · ကိုယ်တိုင် ရှင်းပြပါ
        </h2>

        <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
          {lesson.selfCheck}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[var(--surface-border)] pt-4">
          {isCompleted ? (
            <>
              <span className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)]">
                <span aria-hidden="true">✓</span>
                ဒီ lesson ကို ပြီးဆုံးအဖြစ် မှတ်တင်ထားပါတယ်
              </span>
              <button
                type="button"
                onClick={() => unmarkCompleted(lesson.slug)}
                className="rounded-xl border border-[var(--surface-border)] px-4 py-2 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:border-[var(--surface-border-strong)] hover:text-[var(--text-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                ပြန်ဖယ်ရှားမယ်
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => markCompleted(lesson.slug)}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              <span aria-hidden="true">✓</span>
              ဒီ lesson ပြီးပါပြီ — အတည်ပြချက်ပေးပါမယ်
            </button>
          )}

          <p className="text-xs leading-5 text-[var(--text-subtle)]">
            ဒီ button က ကျွန်ုပ်ကိုယ်တိုင် နားလည်ပြီဆိုတဲ့ အတည်ပြချက်ပါ။ ဖွင့်တဲ့အလိုက် အလိုအလျောက် ပြီးဆိုခြင်း မဟုတ်ပါ။
          </p>
        </div>
      </section>
    </div>
  );
}
