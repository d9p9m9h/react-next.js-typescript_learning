/**
 * A tiny, client-safe index of the lesson list.
 *
 * `lib/lessons.ts` holds the full teaching content but it is imported by
 * Server Components. Client Components (sidebar, header) only need the
 * slugs, numbers, titles and subtitles — pulling the whole registry into the
 * client bundle would ship the entire lesson text to the browser.
 *
 * The two lists must stay in the same order. `app/lesson/[slug]/page.tsx`
 * derives its static params from `lib/lessons.ts`, and the sidebar renders
 * this list, so a mismatch would show a different order in the nav than the
 * one the routes were generated from.
 */
export type LessonIndexEntry = {
  slug: string;
  number: string;
  title: string;
  detail: string;
};

/**
 * NOTE: must stay in the same order as `lessons` in `lib/lessons.ts`.
 * The order defines the learning path shown in the sidebar.
 */
export const lessonIndex: LessonIndexEntry[] = [
  { slug: "jsx-rendering", number: "01", title: "JSX & Rendering", detail: "Describe your UI" },
  { slug: "components", number: "02", title: "Components", detail: "Build reusable UI" },
  { slug: "props", number: "03", title: "Props", detail: "Pass data to components" },
  { slug: "state-events", number: "04", title: "State & Events", detail: "Create interactive UI" },
  { slug: "typescript", number: "05", title: "Typing Components", detail: "Type-safe props" },
  { slug: "react-next", number: "06", title: "React → Next.js", detail: "Explore the framework" },
  { slug: "event-handlers", number: "07", title: "Event Handlers", detail: "Forms & submit" },
];

export const lessonCount = lessonIndex.length;
