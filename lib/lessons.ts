/**
 * Server-safe lesson metadata. No React imports live here so this module can
 * be used from Server Components (routes, metadata, static params).
 */
export type Lesson = {
  slug: string;
  number: string;
  title: string;
  detail: string;
  concept: string;
  /** Source file the snippet was taken from. */
  file: string;
  /** Language identifier used by prism-react-renderer. */
  language: string;
  /** The snippet shown in the code pane. */
  code: string;
  /** Key of the demo registered in components/lesson-demos.tsx. */
  demoKey?: string;
};

export const lessons: Lesson[] = [
  {
    slug: "jsx-rendering",
    number: "01",
    title: "JSX & Rendering",
    detail: "Describe your UI",
    concept:
      "JSX က JavaScript ထဲမှာ HTML ရေးလို့ရတဲ့ syntax ပါ။ JSX ရေးပြီးး React က အဲဒီကို real DOM အဖြစ် ပြောင်းလဲပေးတယ်။",
    file: "app/page.tsx",
    language: "jsx",
    code: `export default function HomePage() {
  return (
    <main>
      <h1>Mingalarpar</h1>
      <p>Duration: 60</p>
    </main>
  )
}`,
  },
  {
    slug: "components",
    number: "02",
    title: "Components",
    detail: "Build reusable UI",
    concept:
      "Component ဆိုတာ UI ကို အစိတ်အပိုင်းအလိုက် ခွဲထားတဲ့ reusable function ပါ။",
    file: "p2l7.tsx",
    language: "tsx",
    code: `function CourseCard(
  { title, durationMinutes, instructor }: CourseCardProps
) {
  return (
    <article>
      <h2>{title}</h2>
      <p>Duration: {durationMinutes}</p>
      {instructor ? <p>{instructor}</p> : null}
    </article>
  )
}`,
    demoKey: "course-card",
  },
  {
    slug: "props",
    number: "03",
    title: "Props",
    detail: "Pass data to components",
    concept:
      "Props က parent component ကနေ့ child component ကို data ပေးပို့တဲ့ နည်းလမ်းပါ။",
    file: "p2l7.tsx",
    language: "tsx",
    code: `interface CourseCardProps {
  title: string
  durationMinutes: number
  instructor?: string
}`,
    demoKey: "course-card",
  },
  {
    slug: "state-events",
    number: "04",
    title: "State & Events",
    detail: "Create interactive UI",
    concept:
      "useState က component အတွင်းရှိ ပြောင်းလဲနိုင်တဲ့ data ပါ။ Event handler နဲ့ ပြောင်းလဲစေတယ်။",
    file: "p2l6.tsx",
    language: "tsx",
    code: `const [name, setName] = useState('')

function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
  setName(event.currentTarget.value)
}`,
    demoKey: "name-input",
  },
  {
    slug: "typescript",
    number: "05",
    title: "Typing Components",
    detail: "Type-safe props",
    concept:
      "TypeScript နဲ့ props ကို type သတ်မှတ်ရင် မှားယွင်းတာကို build အခါက တစ်ခါတလေ ဖမ်းမိတယ်။",
    file: "p2l7.tsx",
    language: "tsx",
    code: `type Theme = 'light' | 'dark' | 'system'

function CurrentTheme({ theme }: ThemeProps) {
  if (theme === 'light') return <h2>Light Theme</h2>
  if (theme === 'dark') return <h2>Dark Theme</h2>
  if (theme === 'system') return <h2>Follow System Theme</h2>
  return <h1>Something went wrong</h1>
}`,
  },
  {
    slug: "react-next",
    number: "06",
    title: "React → Next.js",
    detail: "Explore the framework",
    concept:
      "Next.js က Server Component နဲ့ Client Component ကို ပေးချိန်နဲ့ ခွဲခြားပေးတယ်။ 'use client' ဟာ file ရဲ့ အဆင့်က ဒီတိုင်း ပထမဆုံး line မှာ ရှိရပါတယ်။",
    file: "p2l5.tsx",
    language: "tsx",
    code: `'use client'
import { useState } from "react"

function ProfileEditor() {
  const [username, setUsername] = useState<status | null>(null)

  return <h1>{username ?? 'No User Loaded'}</h1>
}`,
    demoKey: "profile-editor",
  },
  {
    slug: "event-handlers",
    number: "07",
    title: "Event Handlers",
    detail: "Forms & submit",
    concept:
      "Form တင်တဲ့အခါ event ကို preventDefault လုပ်ပြီး ကိုယ်တိုင် handle လုပ်ပါတယ်။",
    file: "P2L3.tsx",
    language: "tsx",
    code: `const [query, setQuery] = useState<string>('')

const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  console.log('Searching for:', query)
}`,
    demoKey: "search-box",
  },
];

export function getLesson(slug: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.slug === slug);
}

export function getLessonSlugs(): string[] {
  return lessons.map((lesson) => lesson.slug);
}
