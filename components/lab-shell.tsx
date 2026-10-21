"use client";

import type { ReactNode } from "react";

import { LabHeader } from "@/components/lab-header";

export function LabShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface-base)]">
      <LabHeader />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="min-w-0">{children}</div>
      </main>
    </div>
  );
}
