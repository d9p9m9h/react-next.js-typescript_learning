import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LessonView } from "@/components/lesson-view";
import { getLesson, getLessonSlugs } from "@/lib/lessons";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getLessonSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getLesson(slug);

  if (!lesson) {
    return { title: "Lesson not found" };
  }

  return {
    title: `${lesson.number} · ${lesson.title}`,
    description: lesson.concept,
  };
}

export default async function LessonPage({ params }: PageProps) {
  const { slug } = await params;
  const lesson = getLesson(slug);

  if (!lesson) {
    notFound();
  }

  return <LessonView lesson={lesson} />;
}

export const dynamicParams = false;

