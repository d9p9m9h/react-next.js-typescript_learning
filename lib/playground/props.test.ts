import { describe, it, expect } from "vitest";
import { serializeValue, UnsupportedPropError } from "@/lib/playground/props";

describe("props.ts", () => {
  describe("serializeValue", () => {
    it("serializes string", () => {
      expect(serializeValue("hello", "test")).toBe("hello");
    });

    it("serializes number", () => {
      expect(serializeValue(42, "test")).toBe(42);
    });

    it("serializes boolean", () => {
      expect(serializeValue(true, "test")).toBe(true);
      expect(serializeValue(false, "test")).toBe(false);
    });

    it("serializes null", () => {
      expect(serializeValue(null, "test")).toBe(null);
    });

    it("serializes undefined as null", () => {
      expect(serializeValue(undefined, "test")).toBe(null);
    });

    it("serializes array", () => {
      expect(serializeValue([1, 2, 3], "test")).toEqual([1, 2, 3]);
      expect(serializeValue(["a", "b"], "test")).toEqual(["a", "b"]);
    });

    it("serializes plain object", () => {
      expect(serializeValue({ a: 1, b: "two" }, "test")).toEqual({ a: 1, b: "two" });
    });

    it("serializes nested object", () => {
      expect(serializeValue({ a: { b: [1, 2] } }, "test")).toEqual({ a: { b: [1, 2] } });
    });

    it("throws UnsupportedPropError for function", () => {
      expect(() => serializeValue(() => { }, "test")).toThrow(UnsupportedPropError);
    });

    it("throws UnsupportedPropError for bigint", () => {
      expect(() => serializeValue(BigInt(1), "test")).toThrow(UnsupportedPropError);
    });

    it("throws UnsupportedPropError for symbol", () => {
      expect(() => serializeValue(Symbol("test"), "test")).toThrow(UnsupportedPropError);
    });

    it("throws UnsupportedPropError for React element", () => {
      const element = { $$typeof: Symbol.for("react.element"), type: "div", props: {} };
      expect(() => serializeValue(element, "test")).toThrow(UnsupportedPropError);
    });
  });
});