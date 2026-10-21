import * as React from "react";
import * as ReactDOM from "react-dom";
import * as ReactJSXRuntime from "react/jsx-runtime";

/**
 * Evaluates a compiled CommonJS module in the browser.
 *
 * The compiled output is plain CommonJS (`exports.default = …`), so it is
 * run inside a function that provides a minimal `require` shim. Only
 * `react`, `react-dom` and `react/jsx-runtime` are available — the
 * learner's practice files never import anything else.
 *
 * Nothing is written to disk and no `eval` of remote code happens: the
 * source the learner sees is the source in this repository, and the
 * compile step is a pure TypeScript → JavaScript transform.
 */
export type ModuleExports = Record<string, unknown> & {
  default?: unknown;
};

export type EvaluationResult = {
  ok: boolean;
  /** The exports of the evaluated module. */
  exports?: ModuleExports;
  /** A human-readable error message. */
  error?: string;
  /** The stack of the error, when there is one. */
  stack?: string;
};

const MODULE_SHIM = {
  "react": React,
  "react-dom": ReactDOM,
  "react/jsx-runtime": ReactJSXRuntime,
} as const;

function requireShim(id: string): unknown {
  const found = MODULE_SHIM[id as keyof typeof MODULE_SHIM];
  if (!found) {
    throw new Error(
      `Module "${id}" ကို playground မှာ load လုပ်လို့ မရပါ။ "react" နဲ့ "react-dom" ကိုသာ သုံးလို့ရပါတယ်။`,
    );
  }
  return found;
}

/**
 * React APIs that are also injected as bare globals.
 *
 * The learner's practice files import what they need, but the playground
 * should not fail just because an import line is missing while the
 * learner is experimenting. React itself and its hooks are therefore also
 * available without an import.
 */
const REACT_GLOBALS: Record<string, unknown> = {
  React,
  Fragment: React.Fragment,
  createElement: React.createElement,
  useState: React.useState,
  useEffect: React.useEffect,
  useLayoutEffect: React.useLayoutEffect,
  useMemo: React.useMemo,
  useCallback: React.useCallback,
  useRef: React.useRef,
  useReducer: React.useReducer,
  useContext: React.useContext,
  useId: React.useId,
  useTransition: React.useTransition,
  useDeferredValue: React.useDeferredValue,
  useSyncExternalStore: React.useSyncExternalStore,
  useOptimistic: React.useOptimistic,
  useActionState: React.useActionState,
};

/**
 * Runs the compiled module and returns its exports.
 *
 * The module body is wrapped in a `new Function` so that `exports`,
 * `module` and `require` are the only things in scope. `require` resolves
 * against the small shim above, and the React globals are passed in as
 * extra arguments.
 */
export function evaluateModule(code: string): EvaluationResult {
  try {
    const module = { exports: {} as ModuleExports };

    // eslint-disable-next-line no-new-func
    const factory = new Function(
      "exports",
      "module",
      "require",
      ...Object.keys(REACT_GLOBALS),
      code,
    ) as (...args: unknown[]) => void;

    factory(
      module.exports,
      module,
      requireShim,
      ...Object.values(REACT_GLOBALS),
    );

    return { ok: true, exports: module.exports };
  } catch (error) {
    const err = error as Error;
    return {
      ok: false,
      error: err.message,
      stack: err.stack,
    };
  }
}

/**
 * Compiles a module and returns the component to render.
 *
 * Sucrase's `imports` transform turns `export default Foo` into
 * `exports.default = Foo`, but a component that is only *declared* (never
 * exported) stays a local binding. To reach those, the module is
 * evaluated twice: once as written, and once with an extra line that
 * assigns the wanted component to `exports.__target`.
 */
export function compileAndSelect(
  code: string,
  componentName: string,
): { exports: ModuleExports; component: unknown } {
  const first = evaluateModule(code);

  if (!first.ok) {
    throw new Error(first.error ?? "Compile လုပ်ပြီး module ကို မတွေ့ပါ။");
  }

  const exports = first.exports ?? {};

  if (componentName === "default") {
    return { exports, component: exports.default };
  }

  if (exports[componentName] !== undefined) {
    return { exports, component: exports[componentName] };
  }

  // The component exists in the file but was never exported. Re-evaluate
  // with an explicit re-export appended.
  const withTarget = `${code}\n;exports.__target = ${componentName};`;
  const second = evaluateModule(withTarget);

  if (second.ok && second.exports?.__target !== undefined) {
    return { exports, component: second.exports.__target };
  }

  return { exports, component: undefined };
}
