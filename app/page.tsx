import { redirect } from "next/navigation";

import { lessons } from "@/lib/lessons";

export default function HomePage() {
  redirect(`/lesson/${lessons[0].slug}`);
}
