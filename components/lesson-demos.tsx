"use client";

import type { ComponentType } from "react";

import CourseCard from "@/p2l7";
import NameInput from "@/p2l6";
import ProfileEditor from "@/p2l5";
import SearchBox from "@/P2L3";

/** CourseCard needs props, so we wrap it with sensible demo values. */
function CourseCardDemo() {
  return (
    <CourseCard
      title="Mingalarpar"
      durationMinutes={60}
      instructor="Deparminhtet"
    />
  );
}

/**
 * The JSX lesson needs a preview that shows the very same element structure
 * as the snippet in `lib/lessons.ts`. The snippet is illustrative (it has no
 * physical source file), so the demo lives here and mirrors it closely.
 */
function JsxGreetingDemo() {
  return (
    <section>
      <h1>Mingalarpar</h1>
      <p>React Learning Lab မှာ ကြိုဆိုပါတယ်။</p>
    </section>
  );
}

/**
 * Demo components live here (client-only) and are looked up by key from the
 * server-safe lesson registry.
 */
const demos: Record<string, ComponentType> = {
  "jsx-greeting": JsxGreetingDemo,
  "course-card": CourseCardDemo,
  "name-input": NameInput,
  "profile-editor": ProfileEditor,
  "search-box": SearchBox,
};

export function LessonDemo({ demoKey }: { demoKey: string }) {
  const Demo = demos[demoKey];
  if (!Demo) return null;
  return <Demo />;
}
