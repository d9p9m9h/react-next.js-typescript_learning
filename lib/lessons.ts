/**
 * Server-safe lesson metadata. No React imports live here so this module can
 * be used from Server Components (routes, metadata, static params).
 *
 * Each lesson follows the same teaching flow:
 *   objective → why it matters → concept → code → preview →
 *   experiment → exercise → hint → self-check
 */
export type Lesson = {
  slug: string;
  number: string;
  title: string;
  detail: string;

  /** What the learner should understand after this lesson. */
  objective: string;
  /** The problem this concept solves. */
  whyItMatters: string;
  /** How the concept actually works. */
  concept: string;

  /**
   * Where the displayed snippet comes from.
   * `file` — a real path in this repository.
   * `example` — an illustrative snippet that has no physical source file.
   */
  sourceKind: "file" | "example";
  /** The file path (when sourceKind is "file") or a label (when "example"). */
  file: string;
  /** Language identifier used by prism-react-renderer. */
  language: string;
  /** The snippet shown in the code pane. */
  code: string;

  /** Key of the demo registered in components/lesson-demos.tsx. */
  demoKey?: string;
  /** Shown instead of a live demo when the concept is better shown statically. */
  previewNote?: string;

  /** A small change the learner can make to investigate the concept. */
  experiment: string;
  /** A small independent task, similar to but not identical to the example. */
  exercise: string;
  /** A useful clue that does not immediately reveal the full solution. */
  hint: string;
  /** A short question asking the learner to explain the concept. */
  selfCheck: string;
};

export const lessons: Lesson[] = [
  {
    slug: "jsx-rendering",
    number: "01",
    title: "JSX & Rendering",
    detail: "Describe your UI",

    objective:
      "JSX က JavaScript ကို ဆက်ချက်တဲ့ syntax ဖြစ်ပါတယ်။ ဒီ lesson ပြီးတိုင်း ဘယ်လို code က JSX ဖြစ်လဲ၊ build tool က ဘယ်လို JavaScript အဖြစ် ပြောင်းလဲလဲလိုက်၊ React က ဘယ်လို အဲဒီကနေ UI ကို DOM မှာ ရေးဆင်းလဲလဲ။",
    whyItMatters:
      "မသိဘူးဆိုရင် JSX က HTML နဲ့ တူနေလို့ လို့လည်း ရေးပါမယ်၊ ဒါပေမယ့် JSX က HTML မဟုတ်ဘူး။ ဘာလိုတဲ့ element တွေက HTML မဟုတ်ဘူးလို့ မသိရင်၊ React က အဲဒါတွေကို ဘယ်လို စီမံခဲ့လဲ ဆိုတာ မရှင်းပါ။",
    concept:
      "JSX က JavaScript ထဲမှာ HTML ရိုက်ထိုးပုံစံနဲ့ UI ကို ရေးနိုင်တဲ့ syntax extension ပါ။ ဒါပေမယ့် browser က JSX ကို တိုက်ရိုက် မသိပါ။ build tool (Next.js မှာ Turbopack/SWC) က JSX ကို ရိုးရှင်းသော JavaScript function call တွေနဲ့ ပြောင်းလဲပေးပါတယ်။ အဲဒီကနေရလဒ်ထွက်တဲ့ element အဓိပ္ပာယ်ဖြစ်တဲ့ description တွေကို React က DOM အဖြစ် rendering လုပ်ပြီး၊ state ပြောင်းလဲတိုင်း လိုအပ်တဲ့ နေရာတွေကိုပဲ update လုပ်ပါတယ်။",

    sourceKind: "example",
    file: "JSX example",
    language: "jsx",
    code: `function Greeting() {
  return (
    <section>
      <h1>Mingalarpar</h1>
      <p>React Learning Lab မှာ ကြိုဆိုပါတယ်။</p>
    </section>
  )
}`,
    demoKey: "jsx-greeting",

    experiment:
      "Preview panel ထဲက စာသားတွေကို ပြောင်းလဲကြည့်ပါ။ ဘယ်လိုပြောင်းလဲမှာမှာ UI က အဲဒီအတိုင်း ပြောင်းလဲတာကို သတိပြုပါ။ ဒါက JSX ကို compile လုပ်ပြီး element description ပြောင်းလဲမှာကြောင့် React က ပြန်ကောက် render လုပ်တာပါ။",
    exercise:
      "ကိုယ်တိုင် `Greeting` component တစ်ခု ရေးပါ — `<article>` tag နဲ့ `<h2>` tag ပါတဲ့ card တစ်ခု ဖန်တီးပြီး အဲဒီထဲမှာ စာသားနှစ်ကြောင်း ထည့်ပါ။ ပြီးရင် `lib/lessons.ts` ထဲက `jsx-rendering` lesson ကို code နဲ့ demoKey အသစ်နဲ့ ရေးပါ။",
    hint:
      "Component တစ်ခုက `return` လုပ်တဲ့အခါ JSX ပြန်ပေးရပါတယ်။ ဒါကြောင့် `<article>` နဲ့ `<h2>` ကို အပေါ်က component function အတွင်း ထည့်ရပါမယ်။ နှစ်ခုလုံးကို sibling အဖြစ် ထည့်ရင် `<>...</>` (Fragment) ကို သုံးရပါမယ်။",
    selfCheck:
      "JSX ကို browser က တိုက်ရိုက် run လုပ်နိုင်တဲ့ syntax လား? မဟုတ်ရင် ဘယ်သူက ဘယ်လို ပြောင်းလဲပေးလဲ ရှင်းပြပါ။",

    previewNote:
      "ဒီ preview က အောက်က JSX example နဲ့ conceptually တူညီပါတယ်။ Code ကို ဒီနေရာက တိုက်ရိုက် ရေးဆင်းလို့ မရပါ။",
  },
  {
    slug: "components",
    number: "02",
    title: "Components",
    detail: "Build reusable UI",

    objective:
      "Component ဆိုတာ ဘာကြောင့် UI ကို အစိတ်အပိုင်းခွဲခြင်းက အလုပ်ဖြစ်လဲ၊ component တစ်ခုက function တစ်ခုနဲ့ element တွေကို ပြန်ပေးတာနဲ့ ဘယ်လိုဆက်ပြီး React က ဘယ်လို component tree ဆောက်လဲ။",
    whyItMatters:
      "Component မရှိရင် UI အပြည့်အစုံက တစ်ခုတည်းရှိမယ်။ တစ်ခုချင်း ပြင်ရင် အခက်အခဲ ရှိပါတယ်။ Component ခွဲထားရင် တစ်ခုချင်း ပြောင်းလဲရလွယ်ပြီး၊ နောက်ပိုင်းမှာ ပြန်သုံးလို့ရပါတယ်။",
    concept:
      "Component ဆိုတာ ရိုးရှင်းလေး လုပ်ဆောင်နိုင်တဲ့ function တစ်ခုပါ။ အဲဒါက JSX ပြန်ပေးပါတယ်။ အဲဒီ function ကို parent component က ခေါ်ရင် React က အဲဒီကို element တစ်ခုအဖြစ် စီမံပြီး အတွင်းက component တွေကိုလည်း ဆက်ခေါ်သွားပါတယ်။ ဒါကြောင့် UI အပြည့်အစုံက tree တစ်ခုလို့ ဖြစ်ပါတယ်။",

    sourceKind: "file",
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

    experiment:
      "`CourseCard` ကို `lib/lessons.ts` ထဲက demoKey မှာ ချိတ်ထားတဲ့ props value တွေကို ပြောင်းလဲကြည့်ပါ။ `title` ကို ပြောင်းလဲတဲ့အခါ `<h2>` က ပြောင်းတာကို ကြည့်ပါ။ `instructor` ကို ဖယ်ရှားလိုက်ရင် `<p>` က ပျောက်သွားတာကိုလည်း ကြည့်ပါ။",
    exercise:
      "`CourseCard` အတူတဲ့ ပုံစံနဲ့ `EventCard` component တစ်ခု ရေးပါ — props အဖြစ် `title`, `date`, `location` ပါစေပါ။ `location` မရှိရင် မပြဘူးဆိုတဲ့ conditional rendering ကိုလည်း သုံးပါ။",
    hint:
      "`CourseCard` က `<article>` ကို အသုံးပြုထားတာကို ကြည့်ပါ။ `instructor ? <p>...</p> : null` ဆိုတာ ternary operator နဲ့ condition စစ်တာဖြစ်ပါတယ်။ `location` ကို optional လုပ်ရင် interface မှာ `?` ထည့်ပါ။",
    selfCheck:
      "Component တစ်ခုက element တစ်ခုနဲ့ ဘာကွာခြားပါလဲ? အဲဒါက ဘာကြောင့် အလုပ်ဖြစ်တာလဲ?",
  },
  {
    slug: "props",
    number: "03",
    title: "Props",
    detail: "Pass data to components",

    objective:
      "Props က parent component ကနေ့ child component ကို data ပေးပို့တဲ့ နည်းလမ်းဆိုရင် ဘယ်လိုဆိုတာ၊ child က props ကို ဘယ်လို ဖတ်တာလဲ၊ props က read-only ဖြစ်တာကြောင့် child က ဘာလုပ်လို့မရတာလဲ။",
    whyItMatters:
      "Component တွေ ခွဲထားပြီးနောက် ဘယ် component က ဘာကို ပြသမလဲ ဆိုတာ သိရမယ်။ Props မရှိရင် component အားလုံး တူညီနေပြီး ပြန်လည်သုံးလို့မရပါ။",
    concept:
      "Props က component တစ်ခုကို ခေါ်တဲ့အခါ ထည့်ပေးတဲ့ arguments တွေပါ။ React က ဒီ props တွေကို child component ထဲက props object အဖြစ် ရောက်ပေးပါတယ်။ Child က ဒါကို read လုပ်နိုင်ပါတယ်၊ ဒါပေမယ့် ပြောင်းလဲခြင်း မရပါ — props က parent က ပိုင်တဲ့ data ဖြစ်လို့ပါ။",

    sourceKind: "file",
    file: "p2l7.tsx",
    language: "tsx",
    code: `interface CourseCardProps {
  title: string
  durationMinutes: number
  instructor?: string
}

// Parent component က သုံးတဲ့ပုံစံ
<CourseCard
  title="Mingalarpar"
  durationMinutes={60}
  instructor="Deparminhtet"
/>`,
    demoKey: "course-card",

    experiment:
      "`components/lesson-demos.tsx` ထဲမှာ `CourseCardDemo` က props တွေကို ပြောင်းလဲကြည့်ပါ။ `instructor` prop ကို ဖယ်ရှားလိုက်ရင် `<p>` တစ်ခု ပျောက်သွားမယ်။ `durationMinutes` ကို နံပါတ်မဟုတ်တဲ့ string ပေးလိုက်ရင် TypeScript က error ပေးမယ်။",
    exercise:
      "`PriceTag` component တစ်ခု ရေးပါ — props အဖြစ် `label: string` နဲ့ `amount: number` ပါစေပါ။ `amount` က 0 ဖြစ်ရင် 'Free' ဆို့ ပြထားပါ။ Interface ကိုလည်း အတူတူ ရေးပါ။",
    hint:
      "TypeScript မှာ `number` type နဲ့ string ကို ရေးတဲ့အခါ `amount={60}` (curly braces နဲ့) ဆိုတာ string မဟုတ်ဘူး၊ number expression ပါ။ `label='...'` ဆိုတာ string ပါ။ Conditional အတွက် `amount === 0` ဆို့ comparison သုံးပါ။",
    selfCheck:
      "Child component က props ကို ပြောင်းလဲနိုင်ပါသလား? ဘယ်လိုပြောင်းလဲမလဲ ဆိုရင် ဘယ်လို ပြောင်းလဲမလဲ?",
  },
  {
    slug: "state-events",
    number: "04",
    title: "State & Events",
    detail: "Create interactive UI",

    objective:
      "State ဆိုတာ ဘာလဲ၊ `useState` က hook ကို ဘယ်လိုသုံးလဲ၊ event handler က state ကို ဘယ်လို ပြောင်းလဲတာလဲ၊ React က ဘယ်လို အဲဒီပြောင်းလဲမှုကို သိရှိပြီး UI မှာ ပြန်ရေးဆင်းတာလဲ။",
    whyItMatters:
      "Static UI တွေက ပြသချင်ရင် အလုပ်ပဲ။ ဒါပေမယ့် user နဲ့ တုံ့ပြန်တုံ့ခိုင်တဲ့ app တွေက form တွေ၊ counter တွေ၊ toggle တွေ အားလုံးက state ပါ။ State မရှိရင် ဒီအားလုံး လုပ်လို့မရပါ။",
    concept:
      "State က component အတွင်းရှိ ပြောင်းလဲနိုင်တဲ့ data ပါ။ `useState` က initial value နဲ့ state ကို ပြန်ပေးတဲ့ setter function ကို ပေးတယ်။ Event handler (ဥပမာ `onChange`) ကထဲမှာ setter ကို ခေါ်တဲ့အခါ state ပြောင်းလဲပြီး React က အဲဒီ component ကို ပြန်ကောက် render လုပ်ပါတယ်။ ဒါကြောင့် state ပြောင်းလဲတဲ့အခါ screen ပြောင်းလဲတာက အလိုအလျောက်ဖြစ်ပါတယ်။",

    sourceKind: "file",
    file: "p2l6.tsx",
    language: "tsx",
    code: `const [name, setName] = useState('')

function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
  setName(event.currentTarget.value)
}

return (
  <>
    <input type="text" value={name} onChange={handleNameChange} />
    <p>{name}</p>
  </>
)`,
    demoKey: "name-input",

    experiment:
      "Preview ထဲက input ကို ရိုက်ထည့်ကြည့်ပါ။ စာလုံးရိုက်တဲ့အခါ အောက်က `<p>` က ချက်ချင်း ပြောင်းလဲတာကို ကြည့်ပါ။ ဒါက state ပြောင်းလဲလို့ React က re-render လုပ်တာပါ။ ပြီးရင် `value={name}` ကို ဖယ်ရှားလိုက်ကြည့်ပါ — ဘာဖြစ်လဲ ဆိုတာ သတိပြုပါ။",
    exercise:
      "`useState` နဲ့ counter တစ်ခု ရေးပါ — number တစ်ခု ရှိမယ်၊ '+' နဲ့ '−' button နှစ်ခုက နှိပ်ရင် ရေမတွက်တာကို ပြပါ။ ပြီးရင် button တွေကို `<button type='button'>` အဖြစ် ရေးပါ။",
    hint:
      "`useState(0)` ဆိုရင် number state ပါ။ State ကို ပြောင်းလဲရာမှာ `setCount(count + 1)` လို့ ရေးပါ — `count = count + 1` ဆို့ မရေးပါနှင့်။ Form အတွင်း button တွေ default အနေနဲ့ submit လုပ်လို့မရအောင် `type=\"button\"` ထည့်ပါ။",
    selfCheck:
      "`useState` က state ပြောင်းလဲပြီးမှ ဘာကြောင့် UI က အလိုအလျောက် ပြန်ရေးဆင်းတာလဲ? Setter function ကို ခေါ်တဲ့အခါ ဘယ်အစဉ် ဘာဖြစ်ပါတယ်?",
  },
  {
    slug: "typescript",
    number: "05",
    title: "Typing Components",
    detail: "Type-safe props",

    objective:
      "TypeScript နဲ့ props ကို type သတ်မှတ်ရင် ဘယ်လို ကာကွယ်တာလဲ၊ `type` နဲ့ `interface` ကွာခြားကြောင်းဘာလဲ၊ union type က ဘယ်လို အသုံးပြုတာလဲ။",
    whyItMatters:
      "JavaScript နဲ့ props မှားခဲ့ရင် အဲဒါက အလုပ်မလုပ်ဘဲ browser မှာ ရောက်မယ် — error ကို အချိန်ကုန်ပြီးမှ ဒီအတွက် TypeScript က build အခါက တစ်ခါတလေ ဖမ်းမိပေးပါတယ်။",
    concept:
      "TypeScript က JavaScript ထဲမှာ type အချက်အလက် ထည့်ပေးတဲ့ superset ပါ။ `interface` က object ရဲ့ shape ကို သတ်မှတ်ပြီး `type` က ဘယ်လို type မျိုးကိုလည်း ရေးနိုင်ပါတယ် (union, primitive, tuple)။ Union type ဆိုတာ `'light' | 'dark'` ဆိုတဲ့ ပုံစံမျိုးစုံထဲက တစ်ခုတည်းကိုပဲ လက်ခံနိုင်တဲ့ type ပါ — အဲဒါက မှားခဲ့တဲ့ value တွေကို compiler က တစ်ခါတလေ ဖမ်းမိပေးပါတယ်။",

    sourceKind: "file",
    file: "p2l7.tsx",
    language: "tsx",
    code: `type Theme = 'light' | 'dark' | 'system'

type ThemeProps = {
  theme: Theme
}

function CurrentTheme({ theme }: ThemeProps) {
  if (theme === 'light') {
    return <h2>Light Theme</h2>
  }
  if (theme === 'dark') {
    return <h2>Dark Theme</h2>
  }
  if (theme === 'system') {
    return <h2>Follow System Theme</h2>
  }
  return <h1>Something went wrong</h1>
}`,
    previewNote:
      "ဒီ lesson က compile-time အကြောင်းဖြစ်လို့ runtime preview ထက် ကုဒ္ဒဖြစ်တဲ့ ပုံစံပါ။ `npm run typecheck` ကို run လုပ်ပြီး `theme = 'purple'` ဆိုတဲ့ value မှားတစ်ခု ထည့်ကြည့်ပါ — compiler က ဖမ်းမိပါမယ်။",

    experiment:
      "`p2l7.tsx` ထဲက `CurrentTheme` function ကို `theme = 'blue'` နဲ့ ခေါ်ကြည့်ပါ။ TypeScript က error ပေးမယ်။ ဒါက union type က ခွင့်ပြုထားတဲ့ value တွေကိုပဲ လက်ခံကြောင်း သက်သေပြပါ။ `npm run typecheck` ကို run လုပ်ပြီး error message ကို ဖတ်ပါ။",
    exercise:
      "`type Status = 'idle' | 'loading' | 'success' | 'error'` လို့ union type တစ်ခု ရေးပါ။ ပြီးရင် အဲဒီ `Status` ကို prop အဖြစ် သုံးတဲ့ component တစ်ခု ရေးပြီး၊ `'idle'`၊ `'success'` နှစ်မျိုးကို handle လုပ်ပါ။",
    hint:
      "Union type က string literal တွေကို `| ` နဲ့ ဆက်တင်ရပါတယ်။ အဲဒီ value ကို prop အဖြစ် သုံးတဲ့အခါ `{ status }: { status: Status } ` လို့ type ပေးရပါတယ်။ `if (status === 'idle')` ဆို့ comparison က TypeScript က ချက်ချင်း အလိုအလျောက် narrow လုပ်ပေးပါတယ်။",
    selfCheck:
      "`type` နဲ့ `interface` ကွာခြားကြောင်း ဘာလဲ? Union type က compile-time မှာ ဘာကို ကာကွယ်ပေးတာလဲ?",
  },
  {
    slug: "react-next",
    number: "06",
    title: "React → Next.js",
    detail: "Explore the framework",

    objective:
      "Next.js က framework အနေနဲ့ React ကနေ ဘယ်လိုပြောင်းလဲသလဲ၊ Server Component နဲ့ Client Component ကို ဘယ်လိုခွဲခြားတာလဲ၊ `'use client'` က ဘယ်အချို့မှာ လိုအပ်တာလဲ။",
    whyItMatters:
      "ဒီ project မှာပင် server/client boundary ရှိပါတယ်။ Client component ကို server ကနေ import လုပ်မိရင် error ပေးပါတယ်။ ဒါကြောင့် ဘယ်ကို client လုပ်မလဲ ဆိုတာ မှန်ကန်စီမံဖို့ သိရပါမယ်။",
    concept:
      "Next.js က App Router နဲ့ file တွေကနေ route တွေ ဖန်တီးတာနဲ့ file-based routing ပေးတယ်။ Default အဖြစ် file တွေက Server Component ဖြစ်ပါတယ်။ Server Component က browser မှာ code မပို့ဘဲ server မှာပဲ run ပြီး HTML ပဲ ပို့ပါတယ်။ `'use client'` ရှိတဲ့ file ကမူ client bundle ထဲသွားပြီး state/hook/event handler တွေ သုံးနိုင်ပါတယ်။ ဒါကြောင့် data-only file တွေကို server မှာ ထားပြီး၊ interactive အစိတ်အပိုင်းတွေကိုမှ client ဖြစ်အောင် ခွဲထားတာက အကောင်းပါ။",

    sourceKind: "file",
    file: "p2l5.tsx",
    language: "tsx",
    code: `'use client'
import { useState } from "react"

function ProfileEditor() {
  const [username, setUsername] = useState<status | null>(null)

  return <h1>{ username ?? 'No User Loaded'
} </h1>
}`,
    demoKey: "profile-editor",

    experiment:
      "`p2l5.tsx` ထဲက `'use client'` ကို ဖယ်ရှားလိုက်ကြည့်ပါ။ Preview က error ပေးမယ် — `useState` က server မှာ run လုပ်ခွင့်မရလို့ပါ။ ပြန်ထည့်ရင် အလုပ်ပြန်လုပ်တာကို သတိပြုပါ။",
    exercise:
      "`'use client'` မပါတဲ့ Server Component တစ်ခု ရေးပါ — props ကနေ့ စာသားတွေ ယူပြီး `<article>` အတွင်းမှာ ပြသတာပါ။ ပြီးရင် အဲဒီကို parent client component ကနေ import လုပ်ကြည့်ပါ — error လာ/မလာ ကြည့်ပါ။",
    hint:
      "`'use client'` က file ရဲ့ အဆင့်က ဒီတိုင်း ပထမဆုံး **statement** အဖြစ် ရှိရပါတယ် — comment တွေက ရှိနေလည်း ရပါတယ်။ ဒါပေမယ့် import တွေမှာ **ရှေ့** မရှိရပါ။ ဒီ project မှာ `lib / lessons.ts` က data-only ဖြစ်ပြီး server ကနေ import လုပ်တာက ဒါကြောင့် boundary ကို သိရလို့ပါတယ်။",
    selfCheck:
      "Server Component နဲ့ Client Component ကြား ကွာခြားချက် ဘာလဲ? `'use client'` ကို ဘယ်လိုနေရာမှာ ထည့်သင့်လဲ?",
  },
  {
    slug: "event-handlers",
    number: "07",
    title: "Event Handlers",
    detail: "Forms & submit",

    objective:
      "Event handler ဆိုတာ ဘာလဲ၊ form တင်တဲ့အခါ browser ရဲ့ default behavior ကို `preventDefault` နဲ့ ဘယ်လို တားလဲလဲ၊ `onSubmit` နဲ့ `onChange` ကွာခြားချက်ကြောင်း ဘာလဲ။",
    whyItMatters:
      "Form တစ်ခုက data စားသောက်မှုလိုမျိုးစလုံးက browser က ကိုယ်တိုင် handle လုပ်တယ် — page ပြန်သွားပြီး data ပျောက်သွားပါတယ်။ React app မှာ ဒါကို ကိုင်တွယ်မှာ လိုတာက `preventDefault` ပါ။",
    concept:
      "Event ဆိုတာ user က လုပ်လုပ်တဲ့ action တစ်ခုပါ (နှိပ်ခြင်း၊ ရိုက်ခြင်း၊ submit လုပ်ခြင်း)။ React က ဒီ event တွေကို `onChange`၊ `onSubmit` စတဲ့ prop တွေနဲ့ ဖမ်းယူပါတယ်။ `e.preventDefault()` ကို ခေါ်ရင် browser ရဲ့ default behavior (ဥပမာ page reload) ကို တားပေးပါတယ်။ `onChange` က input တွေမှာ နှစ်ခုလုံးက အလုပ်ပါတယ် — value ပြောင်းတိုင်းနဲ့၊ အဲဒီအခါ focus ပျောက်တိုင်းနဲ့။",

    sourceKind: "file",
    file: "P2L3.tsx",
    language: "tsx",
    code: `const [query, setQuery] = useState<string>('')

const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  console.log('Searching for:', query)
}

return (
  <form onSubmit= { handleSearchSubmit } >
  <input
      type="text"
value = { query }
onChange = {(e) => setQuery(e.target.value)}
    />
  < button type = "submit" > Search </button>
    </form>
)`,
    demoKey: "search-box",

    experiment:
      "Preview ထဲမှာ စာလုံးရိုက်ပြီး Search button နှိပ်ကြည့်ပါ။ `e.preventDefault()` မရှိဘဲ search လုပ်တဲ့အခါ page ပြန်သွားပြီး URL ပြောင်းမယ်။ Console ထဲမှာ `Searching for: ` ကို ရွေးကြည့်ပါ။ `onChange` ကို ဖယ်ရှားလိုက်ရင် ဘာဖြစ်လဲ ကြည့်ပါ။",
    exercise:
      "Form တစ်ခု ရေးပါ — email နဲ့ password field နှစ်ခုပါစေပါ။ Submit လုပ်တဲ့အခါ `preventDefault` လုပ်ပြီး၊ `console.log` နဲ့ email ကို print လုပ်ပါ။ password ကို log မလုပ်တာ သတိထားပါ။",
    hint:
      "`onSubmit` handler ထဲမှာ ပထမဆုံး `e.preventDefault()` ကို ခေါ်ပါ။ Field တွေကို state မှာ သိမ်းဖို့ `useState` နှစ်ခု လိုပါတယ်။ ခေါ်ခြင်းအားလုံးက `onChange` မှာ ဖြစ်ပါတယ်။",
    selfCheck:
      "`preventDefault()` က ဘာကို တားလဲလဲ? မလုပ်ရင် ဘာဖြစ်မလဲ? `onChange` နဲ့ `onSubmit` က ဘယ်အခါ အသုံးပြုတာလဲ?",
  },
];

export function getLesson(slug: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.slug === slug);
}

export function getLessonSlugs(): string[] {
  return lessons.map((lesson) => lesson.slug);
}
