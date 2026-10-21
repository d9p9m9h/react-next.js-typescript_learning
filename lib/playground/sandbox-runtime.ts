/**
 * The code that runs **inside** the isolated preview iframe.
 *
 * This file is compiled with Sucrase on the server and inlined into the
 * sandbox document (see `app/playground/sandbox/route.ts`). It is the only
 * place where the learner's code is executed.
 *
 * Rules for this file:
 *
 * - It must be self-contained. The sandbox has no module loader, so the
 *   only allowed import is `import type` (which is erased at compile time).
 * - It must not contain the literal `</script>` — it is inlined into an
 *   HTML document.
 * - It must never touch the parent application. The iframe is sandboxed
 *   without `allow-same-origin`, so `window.parent` is an opaque origin
 *   that cannot be read; the only channel is `postMessage`.
 *
 * The React runtime is provided by the vendor bundle that is loaded before
 * this script (see `lib/playground/vendor.ts`).
 */

import type {
  SandboxLogLevel,
  SandboxMessage,
  SandboxRequest,
} from "./evaluate";

type VendorBundle = {
  React: any;
  ReactDOM: any;
  ReactDOMClient: any;
  jsxRuntime: any;
};

type SandboxConfig = {
  /** The CSP nonce of this document — used for the scripts it injects. */
  nonce: string;
  /** The shared secret between the app and this frame. */
  token: string;
};

type Scope = {
  parent?: { postMessage(data: unknown, targetOrigin: string): void };
  __pbConfig?: SandboxConfig;
  __pbVendor?: VendorBundle;
  __pbApi?: {
    module: { exports: Record<string, unknown> };
    require(id: string): unknown;
  };
};

const scope = globalThis as unknown as Scope;
const config = scope.__pbConfig;
const vendor = scope.__pbVendor;

if (!config || !vendor) {
  throw new Error(
    "Playground sandbox runtime was initialised without its config or vendor bundle.",
  );
}

const React = vendor.React;
const ReactDOMClient = vendor.ReactDOMClient;

/* -------------------------------------------------------------------------- */
/* Messaging                                                                  */
/* -------------------------------------------------------------------------- */

function post(message: SandboxMessage): void {
  const parent = scope.parent;
  if (!parent) return;
  // The parent origin cannot be known from an opaque origin, so the
  // receiver has to authenticate the message with the shared token.
  parent.postMessage(message, "*");
}

/* -------------------------------------------------------------------------- */
/* Console capture                                                            */
/* -------------------------------------------------------------------------- */

type ConsoleMethod = SandboxLogLevel;

const originalConsole: Record<ConsoleMethod, (...args: unknown[]) => void> = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

function formatArgument(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message;
  if (typeof value === "function") {
    return `[Function ${value.name || "anonymous"}]`;
  }

  try {
    const json = JSON.stringify(value, null, 2);
    return json === undefined ? String(value) : json;
  } catch {
    return String(value);
  }
}

for (const level of ["log", "info", "warn", "error"] as ConsoleMethod[]) {
  (console as any)[level] = (...args: unknown[]): void => {
    originalConsole[level](...args);
    post({
      token: config.token,
      type: "log",
      level,
      text: args.map(formatArgument).join(" "),
    });
  };
}

/* -------------------------------------------------------------------------- */
/* Error reporting                                                            */
/* -------------------------------------------------------------------------- */

function reportRuntimeError(error: unknown, context: string): void {
  // A new error invalidates any "rendered" message that is still pending.
  renderCounter += 1;

  const err = error instanceof Error ? error : new Error(String(error));

  post({
    token: config.token,
    type: "error",
    kind: "runtime",
    message: `${context}\n${err.message}`,
    stack: err.stack,
  });
}

window.addEventListener("error", (event) => {
  reportRuntimeError(event.error ?? event.message, "Preview ထဲမှာ error ဖြစ်ပါတယ်။");
});

window.addEventListener("unhandledrejection", (event) => {
  reportRuntimeError(event.reason, "Preview ထဲမှာ promise တစ်ခု reject ဖြစ်ပါတယ်။");
});

/* -------------------------------------------------------------------------- */
/* Module evaluation                                                          */
/* -------------------------------------------------------------------------- */

const moduleRegistry: Record<string, unknown> = {
  react: vendor.React,
  "react-dom": vendor.ReactDOM,
  "react-dom/client": vendor.ReactDOMClient,
  "react/jsx-runtime": vendor.jsxRuntime,
};

function requireShim(id: string): unknown {
  const found = moduleRegistry[id];

  if (!found) {
    throw new Error(
      `Module "${id}" ကို preview မှာ load လုပ်လို့ မရပါ။ "react" နဲ့ "react-dom" ကိုသာ သုံးလို့ရပါတယ်။`,
    );
  }

  return found;
}

const api: NonNullable<Scope["__pbApi"]> = {
  module: { exports: {} },
  require: requireShim,
};

scope.__pbApi = api;

/**
 * Evaluates a compiled CommonJS module.
 *
 * The module is run through an injected `<script>` element rather than
 * `new Function()`, because the sandbox's Content Security Policy does not
 * allow `unsafe-eval`. The injected script carries the document's nonce, so
 * the policy allows it. Setting `textContent` (instead of `innerHTML`)
 * means the module body is never parsed as HTML, so a `</script>` inside the
 * learner's code cannot break out of the document.
 */
function evaluateModule(code: string): Record<string, unknown> {
  const module = { exports: {} as Record<string, unknown> };
  api.module = module;

  const script = document.createElement("script");
  script.nonce = config.nonce;
  script.textContent =
    "(function (exports, module, require) {\n" +
    code +
    "\n})(__pbApi.module.exports, __pbApi.module, __pbApi.require);";

  try {
    document.head.appendChild(script);
  } finally {
    script.remove();
  }

  return module.exports;
}

/**
 * Picks the component to render out of the evaluated module.
 *
 * The server appends `exports.__target = …` for components that are only
 * declared (never exported), so the lookup order is:
 * the explicit target → the requested name → the default export → the only
 * exported function.
 */
function selectComponent(
  exports: Record<string, unknown>,
  wanted: string,
): unknown {
  const target = exports.__target;
  if (typeof target === "function") return target;

  if (wanted && wanted !== "default" && typeof exports[wanted] === "function") {
    return exports[wanted];
  }

  if (typeof exports.default === "function") return exports.default;

  const candidates = Object.keys(exports).filter(
    (key) =>
      key !== "default" &&
      key !== "__target" &&
      key !== "__esModule" &&
      typeof exports[key] === "function",
  );

  if (candidates.length === 1) return exports[candidates[0]];

  return undefined;
}

/* -------------------------------------------------------------------------- */
/* Props                                                                      */
/* -------------------------------------------------------------------------- */

function toReactProps(props: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const key of Object.keys(props)) {
    result[key] = toReactValue(props[key]);
  }

  return result;
}

function toReactValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(toReactValue);
  }

  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;

    if (typeof record.__element === "string") {
      const elementProps = record.props
        ? toReactProps(record.props as Record<string, unknown>)
        : undefined;

      if ("children" in record) {
        return React.createElement(
          record.__element,
          elementProps,
          toReactValue(record.children),
        );
      }

      return React.createElement(record.__element, elementProps);
    }

    return toReactProps(record);
  }

  return value;
}

/* -------------------------------------------------------------------------- */
/* Rendering                                                                  */
/* -------------------------------------------------------------------------- */

const container = document.getElementById("root");
let root: any = null;
let renderCounter = 0;

function unmount(): void {
  if (!root) return;

  try {
    root.unmount();
  } catch {
    // A component that threw during render can make `unmount` fail. The
    // root is discarded either way.
  }

  root = null;
}

function clearPreview(): void {
  unmount();
  if (container) container.innerHTML = "";
  post({ token: config.token, type: "cleared" });
}

function renderComponent(
  component: unknown,
  props: unknown,
): void {
  if (!container) return;

  unmount();
  container.innerHTML = "";

  if (typeof component !== "function") {
    renderCounter += 1;
    post({
      token: config.token,
      type: "error",
      kind: "no-component",
      message:
        "ဒီဖိုင်ထဲမှာ render လုပ်နိုင်တဲ့ component မရှိပါ — " +
        "code အားလုံး comment အဖြစ် ရှိနေပါတယ်။ " +
        "အောက်က editor မှာ code ကို ဖြည့်ပြီး စမ်းကြည့်ပါ။",
    });
    return;
  }

  const currentRender = ++renderCounter;

  root = ReactDOMClient.createRoot(container, {
    onUncaughtError: (error: unknown) => {
      reportRuntimeError(
        error,
        "Component က render ဖို့ မရနိုင်တော့ဘူး။",
      );
    },
    onRecoverableError: (error: unknown) => {
      reportRuntimeError(error, "React က error တစ်ခု ပြန်လည်ပေးပါတယ်။");
    },
  });

  root.render(
    React.createElement(
      component as any,
      toReactProps((props ?? {}) as Record<string, unknown>),
    ),
  );

  // React renders concurrently, so the result is only known after the
  // current task. If the render throws, the error handler bumps the
  // counter and this message is dropped.
  setTimeout(() => {
    if (currentRender === renderCounter) {
      post({ token: config.token, type: "rendered" });
    }
  }, 0);
}

/* -------------------------------------------------------------------------- */
/* Incoming messages                                                          */
/* -------------------------------------------------------------------------- */

function applyTheme(theme: "light" | "dark"): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

function handleRequest(request: SandboxRequest): void {
  switch (request.type) {
    case "render": {
      let exports: Record<string, unknown>;

      try {
        exports = evaluateModule(request.code);
      } catch (error) {
        reportRuntimeError(
          error,
          "Code ကို တန်းဖြတ်တော့ မရပါ။",
        );
        return;
      }

      const component = selectComponent(exports, request.component);
      renderComponent(component, request.props);
      return;
    }

    case "theme":
      applyTheme(request.theme);
      return;

    case "clear":
      clearPreview();
      return;
  }
}

window.addEventListener("message", (event) => {
  // Only the embedding frame may talk to the sandbox.
  if (!scope.parent || event.source !== scope.parent) return;

  const request = event.data as SandboxRequest | undefined;

  if (!request || typeof request !== "object") return;
  if (request.token !== config.token) return;

  handleRequest(request);
});

/* -------------------------------------------------------------------------- */
/* Ready                                                                      */
/* -------------------------------------------------------------------------- */

post({ token: config.token, type: "ready" });
