import { redirect } from "next/navigation";

import { lessonIndex } from "@/lib/lesson-index";

export default function HomePage() {
  redirect(`/lesson/${lessonIndex[0].slug}`);
}
