"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { LabHeader } from "@/components/lab-header";
import { LabSidebar } from "@/components/lab-sidebar";

export function LabShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // The home page is a full-width landing page with its own lesson grid,
  // so the sidebar is hidden there and only shown on the lesson routes.
  const showSidebar = pathname?.startsWith("/lesson/") ?? false;
  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface-base)]">
      <LabHeader />

      <main
        className={[
          "mx-auto grid w-full max-w-[1440px] flex-1 gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8",
          showSidebar
            ? "grid-cols-[minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)]"
            : "grid-cols-[minmax(0,1fr)]",
        ].join(" ")}
      >
        {showSidebar ? (
          <div className="lg:sticky lg:top-[72px] lg:self-start">
            <LabSidebar />
          </div>
        ) : null}

        <div className="min-w-0">{children}</div>
      </main>
    </div>
  );
}
