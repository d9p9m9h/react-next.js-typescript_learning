"use client";

import type { ReactNode } from "react";

import { LabHeader } from "@/components/lab-header";
import { LabSidebar } from "@/components/lab-sidebar";

export function LabShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface-base)]">
      <LabHeader />

      <main className="mx-auto grid w-full max-w-[1440px] flex-1 grid-cols-[minmax(0,1fr)] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8 lg:py-8">
        <div className="lg:sticky lg:top-[72px] lg:self-start">
          <LabSidebar />
        </div>

        <div className="min-w-0">{children}</div>
      </main>
    </div>
  );
}
