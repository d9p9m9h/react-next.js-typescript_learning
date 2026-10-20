import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "React JSX Lab | Learning Workspace",
  description:
    "A hands-on workspace for learning React, TypeScript, and Next.js.",
};

const lessons = [
  {
    number: "01",
    title: "JSX & Rendering",
    detail: "Describe your UI",
    active: true,
  },
  {
    number: "02",
    title: "Components",
    detail: "Build reusable UI",
    active: false,
  },
  {
    number: "03",
    title: "Props",
    detail: "Pass data to components",
    active: false,
  },
  {
    number: "04",
    title: "State & Events",
    detail: "Create interactive UI",
    active: false,
  },
  {
    number: "05",
    title: "React → Next.js",
    detail: "Explore the framework",
    active: false,
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="my">
      <body className="min-h-screen bg-[#f7f8fc] text-slate-900 antialiased">
        <div className="relative min-h-screen overflow-hidden">
          {/* Soft background decorations */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[430px] bg-gradient-to-br from-violet-100/80 via-white to-cyan-100/50"
          />

          <div className="relative z-10">
            {/* Header */}
            <header className="border-b border-white/80 bg-white/70 backdrop-blur-xl">
              <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-lg font-black text-white shadow-lg shadow-violet-200">
                    R
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold tracking-tight text-slate-900 sm:text-base">
                      React Learning Lab
                    </p>
                    <p className="text-[11px] font-medium tracking-wide text-slate-500 sm:text-xs">
                      BUILD · EXPERIMENT · UNDERSTAND
                    </p>
                  </div>
                </div>

                <div className="hidden items-center gap-2 md:flex">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600">
                    NEXT.JS APP ROUTER
                  </span>
                  <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[11px] font-semibold text-violet-700">
                    TAILWIND CSS v4
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-700">
                    Practice mode
                  </span>
                </div>
              </div>
            </header>

            {/* Page introduction */}
            <div className="mx-auto max-w-[1440px] px-4 pb-6 pt-8 sm:px-6 sm:pt-10 lg:px-8 lg:pt-12">
              <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-3 py-1.5 shadow-sm">
                    <span className="size-2 rounded-full bg-violet-500" />
                    <span className="text-[11px] font-bold tracking-[0.14em] text-violet-700">
                      REACT FOUNDATIONS
                    </span>
                  </div>
                  <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                    JSX Playground
                    <span className="text-violet-600">.</span>
                  </h1>

                  <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                    Code ကိုစမ်းသပ်ပါ။ Browser preview ကိုကြည့်ပါ။
                    UI ဘာကြောင့် ဒီလိုပေါ်လာသလဲဆိုတာ နားလည်အောင်
                    တစ်ဆင့်ချင်း လေ့လာပါ။
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
                  <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm backdrop-blur">
                    <p className="text-[11px] font-bold tracking-wider text-slate-500">
                      CURRENT TOPIC
                    </p>
                    <p className="mt-2 text-lg font-bold text-slate-900">
                      JSX
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      UI structure
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm backdrop-blur">
                    <p className="text-[11px] font-bold tracking-wider text-slate-500">
                      LEARNING MODE
                    </p>
                    <p className="mt-2 text-lg font-bold text-slate-900">
                      Hands-on
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Learn by testing
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Workspace */}
            <div className="mx-auto grid max-w-[1440px] gap-6 px-4 pb-8 sm:px-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:px-8 lg:pb-12">
              {/* Lesson sidebar */}
              <aside className="self-start rounded-3xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_40px_-30px_rgba(15,23,42,0.25)] sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold tracking-[0.14em] text-slate-500">
                    LEARNING PATH
                  </p>
                  <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                    01 / 05
                  </span>
                </div>

                <ol className="mt-5 space-y-2">
                  {lessons.map((lesson) => (
                    <li
                      key={lesson.number}
                      className={[
                        "flex items-start gap-3 rounded-2xl border p-3 transition-colors",
                        lesson.active
                          ? "border-violet-200 bg-violet-50/80"
                          : "border-transparent bg-white",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold",
                          lesson.active
                            ? "bg-violet-600 text-white"
                            : "bg-slate-100 text-slate-500",
                        ].join(" ")}
                      >
                        {lesson.number}
                      </span>

                      <div className="min-w-0 pt-0.5">
                        <p
                          className={[
                            "text-sm font-bold",
                            lesson.active
                              ? "text-violet-800"
                              : "text-slate-700",
                          ].join(" ")}
                        >
                          {lesson.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {lesson.detail}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-amber-100 text-sm">
                      ✦
                    </span>
                    <p className="text-xs font-bold text-slate-800">
                      Learning tip
                    </p>
                  </div>
                  <p className="mt-3 text-xs leading-6 text-slate-600">
                    တစ်ကြိမ်မှာ code တစ်ခုကိုပဲ ပြောင်းစမ်းပါ။
                    ပြီးရင် အရင်ရလဒ်နဲ့ နှိုင်းယှဉ်ကြည့်ပါ။
                  </p>
                </div>
              </aside>

              {/* Main preview area */}
              <section className="min-w-0">
                <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_24px_70px_-40px_rgba(15,23,42,0.22)]">
                  {/* Preview toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className="size-2.5 rounded-full bg-rose-400" />
                        <span className="size-2.5 rounded-full bg-amber-400" />
                        <span className="size-2.5 rounded-full bg-emerald-400" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800">
                          Browser Preview
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          Your page.tsx output
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold tracking-wide text-emerald-700 sm:text-xs">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      RENDER AREA
                    </span>
                  </div>

                  {/* Your lesson component renders here */}
                  <div className="min-w-0 p-4 sm:p-7 lg:p-8">
                    {children}
                  </div>
                </div>

                {/* Learning reminders */}
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4">
                    <p className="text-xs font-bold text-slate-800">
                      <span className="mr-2 text-violet-600">01</span>
                      Observe
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Code က ဘယ်လို UI ဖြစ်လာသလဲ ကြည့်ပါ။
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4">
                    <p className="text-xs font-bold text-slate-800">
                      <span className="mr-2 text-violet-600">02</span>
                      Experiment
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      JSX ထဲက text နဲ့ elements တွေကို ပြောင်းကြည့်ပါ။
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4">
                    <p className="text-xs font-bold text-slate-800">
                      <span className="mr-2 text-violet-600">03</span>
                      Understand
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      UI ပြောင်းသွားရတဲ့ အကြောင်းရင်းကို ပြန်ရှင်းပြပါ။
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* Footer */}
            <footer className="border-t border-slate-200/80 bg-white/60">
              <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                <p>
                  <span className="font-bold text-slate-700">
                    React Learning Lab
                  </span>
                  {" "}· Learn the concept, not just the syntax.
                </p>
                <p>Built for practice with Next.js & Tailwind CSS v4</p>
              </div>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}