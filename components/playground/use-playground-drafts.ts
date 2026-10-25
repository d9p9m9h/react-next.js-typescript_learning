"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { readDrafts, writeDrafts } from "@/lib/playground/drafts";
import type { PlaygroundFile } from "@/lib/playground/files";

export interface UsePlaygroundDraftsArgs {
  files: PlaygroundFile[];
  buffers: Record<string, string>;
  setBuffers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

/**
 * Restores saved drafts on first mount and re-saves the buffers whenever
 * they change. Mirrors the behaviour that used to live inline in the
 * playground component, extracted so the component stays focused on layout.
 */
export function usePlaygroundDrafts({
  files,
  buffers,
  setBuffers,
}: {
  files: PlaygroundFile[];
  buffers: Record<string, string>;
  setBuffers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}): void {
  const draftsRestoredRef = useRef(false);

  useEffect(() => {
    if (draftsRestoredRef.current) return;
    draftsRestoredRef.current = true;

    const drafts = readDrafts();
    if (Object.keys(drafts).length === 0) return;

    setBuffers((prev) => {
      const next = { ...prev };

      for (const file of files) {
        const draft = drafts[file.name];
        if (draft !== undefined) next[file.name] = draft;
      }

      return next;
    });
  }, [files, setBuffers]);

  useEffect(() => {
    if (!draftsRestoredRef.current) return;

    const drafts: Record<string, string> = {};

    for (const file of files) {
      const buffer = buffers[file.name];
      if (buffer !== undefined && buffer !== file.source) {
        drafts[file.name] = buffer;
      }
    }

    writeDrafts(drafts);
  }, [buffers, files]);
}

export default usePlaygroundDrafts;
