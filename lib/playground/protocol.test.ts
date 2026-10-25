import { describe, it, expect } from "vitest";
import { isSandboxMessage, createSandboxToken } from "@/lib/playground/protocol";

describe("protocol.ts", () => {
  describe("createSandboxToken", () => {
    it("generates a non-empty string", () => {
      const token = createSandboxToken();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });

    it("generates unique tokens on each call", () => {
      const token1 = createSandboxToken();
      const token2 = createSandboxToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe("isSandboxMessage", () => {
    it("returns true for valid ready message", () => {
      const msg = { token: "abc", type: "ready" };
      expect(isSandboxMessage(msg)).toBe(true);
    });

    it("returns true for valid rendered message", () => {
      const msg = { token: "abc", type: "rendered" };
      expect(isSandboxMessage(msg)).toBe(true);
    });

    it("returns true for valid cleared message", () => {
      const msg = { token: "abc", type: "cleared" };
      expect(isSandboxMessage(msg)).toBe(true);
    });

    it("returns true for valid log message", () => {
      const msg = { token: "abc", type: "log", level: "log", text: "hello" };
      expect(isSandboxMessage(msg)).toBe(true);
    });

    it("returns true for valid error message (no-component)", () => {
      const msg = { token: "abc", type: "error", kind: "no-component", message: "err" };
      expect(isSandboxMessage(msg)).toBe(true);
    });

    it("returns true for valid error message (runtime)", () => {
      const msg = { token: "abc", type: "error", kind: "runtime", message: "err", stack: "stack" };
      expect(isSandboxMessage(msg)).toBe(true);
    });

    it("returns false for missing token", () => {
      const msg = { type: "ready" };
      expect(isSandboxMessage(msg)).toBe(false);
    });

    it("returns false for non-string token", () => {
      const msg = { token: 123, type: "ready" };
      expect(isSandboxMessage(msg)).toBe(false);
    });

    it("returns false for invalid type", () => {
      const msg = { token: "abc", type: "invalid" };
      expect(isSandboxMessage(msg)).toBe(false);
    });

    it("returns false for null", () => {
      expect(isSandboxMessage(null)).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(isSandboxMessage(undefined)).toBe(false);
    });

    it("returns false for non-object", () => {
      expect(isSandboxMessage("string")).toBe(false);
    });
  });
});