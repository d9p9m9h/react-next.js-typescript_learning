"use client";

import type { ReactNode } from "react";

import { LabHeader } from "@/components/lab-header";

/**
 * The application shell.
 *
 * On large screens the shell fills the viewport and the playground fills
 * the shell, so the editor and the preview always have a usable height
 * and the page itself never scrolls. On small screens the content simply
 * stacks and the page scrolls as usual.
 */
export function LabShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-[var(--surface-base)]">
      <LabHeader />

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-3 py-3 sm:px-6 sm:py-4 lg:min-h-0 lg:px-8">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
      </main>
    </div>
  );
}
