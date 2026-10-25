import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readDrafts, writeDrafts, DRAFT_STORAGE_KEY, DRAFT_VERSION, getStorage } from "@/lib/playground/drafts";

describe("drafts.ts", () => {
  let mockStorage: any;

  beforeEach(() => {
    mockStorage = {
      getItem: vi.fn() as any,
      setItem: vi.fn() as any,
      removeItem: vi.fn() as any,
      clear: vi.fn() as any,
      key: vi.fn() as any,
      length: 0,
    } as any;
    vi.stubGlobal("window", { localStorage: mockStorage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("readDrafts", () => {
    it("returns empty object when no drafts stored", () => {
      mockStorage.getItem.mockReturnValue(null);
      expect(readDrafts()).toEqual({});
    });

    it("returns empty object when storage is unavailable", () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error("Storage unavailable");
      });
      expect(readDrafts()).toEqual({});
    });

    it("returns empty object for invalid JSON", () => {
      mockStorage.getItem.mockReturnValue("not json");
      expect(readDrafts()).toEqual({});
    });

    it("returns empty object for wrong version", () => {
      mockStorage.getItem.mockReturnValue(
        JSON.stringify({ version: DRAFT_VERSION + 1, drafts: { "test.tsx": "content" } })
      );
      expect(readDrafts()).toEqual({});
    });

    it("returns empty object for missing drafts property", () => {
      mockStorage.getItem.mockReturnValue(
        JSON.stringify({ version: DRAFT_VERSION })
      );
      expect(readDrafts()).toEqual({});
    });

    it("returns drafts for valid storage", () => {
      const drafts = { "test.tsx": "content" };
      mockStorage.getItem.mockReturnValue(
        JSON.stringify({ version: DRAFT_VERSION, drafts })
      );
      expect(readDrafts()).toEqual(drafts);
    });

    it("ignores non-string draft values", () => {
      mockStorage.getItem.mockReturnValue(
        JSON.stringify({ version: DRAFT_VERSION, drafts: { "test.tsx": 123 } })
      );
      expect(readDrafts()).toEqual({});
    });
  });

  describe("writeDrafts", () => {
    it("writes drafts to storage", () => {
      const drafts = { "test.tsx": "content" };
      writeDrafts(drafts);
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        DRAFT_STORAGE_KEY,
        JSON.stringify({ version: DRAFT_VERSION, drafts })
      );
    });

    it("handles storage unavailable gracefully", () => {
      mockStorage.setItem.mockImplementation(() => {
        throw new Error("Storage unavailable");
      });
      expect(() => writeDrafts({ "test.tsx": "content" })).not.toThrow();
    });
  });
});
