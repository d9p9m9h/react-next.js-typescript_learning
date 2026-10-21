import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Builds the browser bundle that the sandbox iframe loads before the
 * learner's own code.
 *
 * The sandbox has no module loader and no bundler, so the React runtime is
 * shipped as a hand-rolled CommonJS registry: every module is wrapped in
 * a factory function and a tiny `require` resolves them by id. The
 * modules come from React's own CommonJS builds, which are plain
 * JavaScript and only need `process.env.NODE_ENV` plus an optional
 * `process` object for their error-reporting path.
 *
 * The development builds are used on purpose: they carry React's helpful
 * warnings and error messages, which is exactly what a learner wants to
 * see while experimenting.
 */

/** The CommonJS builds that make up the sandbox's module registry. */
type VendorModule = {
  /** The id the learner's compiled code uses in `require("…")`. */
  id: string;
  /** The package that owns the file. */
  pkg: string;
  /** The file inside the package, relative to its root. */
  file: string;
};

const VENDOR_MODULES: VendorModule[] = [
  { id: "react", pkg: "react", file: "cjs/react.development.js" },
  {
    id: "react/jsx-runtime",
    pkg: "react",
    file: "cjs/react-jsx-runtime.development.js",
  },
  {
    id: "react-dom",
    pkg: "react-dom",
    file: "cjs/react-dom.development.js",
  },
  {
    id: "react-dom/client",
    pkg: "react-dom",
    file: "cjs/react-dom-client.development.js",
  },
  { id: "scheduler", pkg: "scheduler", file: "cjs/scheduler.development.js" },
];

/**
 * The React APIs that are also injected as bare globals.
 *
 * The learner's practice files import what they need, but the playground
 * should not fail just because an import line is missing while the
 * learner is experimenting. React itself and its hooks are therefore also
 * available without an import.
 */
const REACT_GLOBAL_NAMES = [
  "React",
  "Fragment",
  "createElement",
  "useState",
  "useEffect",
  "useLayoutEffect",
  "useMemo",
  "useCallback",
  "useRef",
  "useReducer",
  "useContext",
  "useId",
  "useTransition",
  "useDeferredValue",
  "useSyncExternalStore",
  "useOptimistic",
  "useActionState",
] as const;

/**
 * Finds the installed root of a package.
 *
 * The `node_modules` folder next to the project is checked first, then
 * the ones above it, which covers a hoisted or nested workspace layout.
 */
function resolvePackageRoot(pkg: string): string {
  const candidates = [
    join(process.cwd(), "node_modules", pkg),
    join(process.cwd(), "..", "node_modules", pkg),
    join(process.cwd(), "..", "..", "node_modules", pkg),
  ];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "package.json"))) return candidate;
  }

  throw new Error(
    `Package "${pkg}" ကို node_modules ထဲမှာ မတွေ့ပါ — npm install ပြန်လုပ်ပါ။`,
  );
}

/**
 * Reads one CommonJS build and neutralises the Node-only globals it
 * expects.
 *
 * `process.env.NODE_ENV` is replaced with a literal so the browser does
 * not need a `process` shim. React's development build refuses to run
 * when that value says "production", so the literal is always
 * "development".
 */
function readVendorSource(module: VendorModule): string {
  // The `turbopackIgnore` comments keep the bundler from tracing the
  // whole project: these paths point into `node_modules`, which is not
  // part of the app's own source tree.
  const path = join(
    /*turbopackIgnore: true*/ resolvePackageRoot(module.pkg),
    module.file,
  );
  const source = readFileSync(/*turbopackIgnore: true*/ path, "utf8");

  return source.replace(/process\.env\.NODE_ENV/g, JSON.stringify("development"));
}

/**
 * Escapes a string so it can be embedded in a `<script>` element.
 *
 * The HTML parser ends a script element at the first `</script`, and it
 * also treats `<!--` and `-->` specially. Escaping them keeps the
 * JavaScript semantics (`\/` and `\!` are identity escapes inside string
 * literals) while making the text inert for the HTML parser.
 */
export function escapeForScript(value: string): string {
  return value
    .replace(/<\/(script)/gi, "<\\/$1")
    .replace(/<!--/g, "<\\!--")
    .replace(/-->/g, "--\\>");
}

/**
 * The registry preamble.
 *
 * It defines `__pbDefine` / `__pbRequire` and, at the end, publishes the
 * React runtime on `window.__pbVendor` — the exact shape the sandbox
 * runtime expects (see `lib/playground/sandbox-runtime.ts`).
 */
function buildRegistry(modules: VendorModule[]): string {
  const definitions = modules
    .map((module) => {
      const source = escapeForScript(readVendorSource(module));
      return `__pbDefine(${JSON.stringify(module.id)}, function (exports, module, require) {\n${source}\n});`;
    })
    .join("\n\n");

  const globals = REACT_GLOBAL_NAMES.map((name) => {
    if (name === "React") return "React: __pbReact";
    if (name === "Fragment") return "Fragment: __pbReact.Fragment";
    return `${name}: __pbReact.${name}`;
  }).join(",\n    ");

  return `/* Generated by lib/playground/vendor.ts — do not edit by hand. */
(function () {
  "use strict";

  var __pbModules = {};
  var __pbCache = {};

  function __pbDefine(id, factory) {
    __pbModules[id] = factory;
  }

  function __pbRequire(id) {
    if (Object.prototype.hasOwnProperty.call(__pbCache, id)) {
      return __pbCache[id].exports;
    }

    var factory = __pbModules[id];
    if (!factory) {
      throw new Error('Module "' + id + '" ကို preview မှာ load လုပ်လို့ မရပါ။ "react" နဲ့ "react-dom" ကိုသာ သုံးလို့ရပါတယ်။');
    }

    var mod = { exports: {} };
    __pbCache[id] = mod;
    factory(mod.exports, mod, __pbRequire);
    return mod.exports;
  }

${definitions}

  var __pbReact = __pbRequire("react");

  window.__pbVendor = {
    React: __pbReact,
    ReactDOM: __pbRequire("react-dom"),
    ReactDOMClient: __pbRequire("react-dom/client"),
    jsxRuntime: __pbRequire("react/jsx-runtime"),
    /* The React globals the sandbox runtime injects for the learner. */
    globals: {
    ${globals}
    },
  };
})();
`;
}

/**
 * Builds the vendor bundle source.
 *
 * Exported separately from the route that serves it so the bundle can be
 * verified without touching the file system.
 */
export function buildVendorBundle(): string {
  return buildRegistry(VENDOR_MODULES);
}
