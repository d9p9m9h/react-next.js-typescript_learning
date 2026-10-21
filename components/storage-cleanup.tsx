"use client";

import { useEffect } from "react";

import { clearObsoleteStorage } from "@/lib/storage";

/**
 * Removes stored state that belongs to features which no longer exist.
 *
 * The lesson progress store wrote to `react-lab-progress` in
 * `localStorage`. Those lessons have been removed, so the payload is dead
 * weight that the app can no longer read. This component deletes it once
 * on the client, after the first paint.
 */
export function StorageCleanup() {
  useEffect(() => {
    clearObsoleteStorage();
  }, []);

  return null;
}
