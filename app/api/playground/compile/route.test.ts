import { describe, it, expect } from "vitest";
import { declaresComponent, exportsComponent, appendTargetExport } from "@/app/api/playground/compile/route";

describe("compile/route.ts", () => {
  describe("declaresComponent", () => {
    it("detects function declaration", () => {
      const source = "function UserList() {}";
      expect(declaresComponent(source, "UserList")).toBe(true);
    });

    it("detects const declaration", () => {
      const source = "const UserList = () => {}";
      expect(declaresComponent(source, "UserList")).toBe(true);
    });

    it("detects class declaration", () => {
      const source = "class UserList {}";
      expect(declaresComponent(source, "UserList")).toBe(true);
    });

    it("detects exported function declaration", () => {
      const source = "export function UserList() {}";
      expect(declaresComponent(source, "UserList")).toBe(true);
    });

    it("detects exported const declaration", () => {
      const source = "export const UserList = () => {}";
      expect(declaresComponent(source, "UserList")).toBe(true);
    });

    it("returns false for non-declared component", () => {
      const source = "function Other() {}";
      expect(declaresComponent(source, "UserList")).toBe(false);
    });

    it("handles special regex characters in name", () => {
      const source = "function User.List() {}";
      expect(declaresComponent(source, "User.List")).toBe(true);
    });
  });

  describe("exportsComponent", () => {
    it("detects export function", () => {
      const source = "export function UserList() {}";
      expect(exportsComponent(source, "UserList")).toBe(true);
    });

    it("detects export const", () => {
      const source = "export const UserList = () => {}";
      expect(exportsComponent(source, "UserList")).toBe(true);
    });

    it("detects export default function", () => {
      const source = "export default function UserList() {}";
      expect(exportsComponent(source, "UserList")).toBe(true);
    });

    it("detects export { UserList }", () => {
      const source = "function UserList() {}\nexport { UserList }";
      expect(exportsComponent(source, "UserList")).toBe(true);
    });

    it("returns false for non-exported component", () => {
      const source = "function UserList() {}";
      expect(exportsComponent(source, "UserList")).toBe(false);
    });
  });

  describe("appendTargetExport", () => {
    it("appends export for component", () => {
      const code = "const UserList = () => {}";
      const result = appendTargetExport(code, "UserList");
      expect(result).toBe("const UserList = () => {}\n;exports.__target = UserList;");
    });
  });
});