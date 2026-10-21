/**
 * The evaluation contract between the playground app and the sandboxed
 * preview.
 *
 * The preview runs inside a sandboxed iframe (see `app/playground/sandbox`),
 * so the learner's code is **never** evaluated in the main application
 * window. That distinction matters: `new Function()` in the app window
 * would hand the learner's code the whole page — DOM, `localStorage`,
 * `fetch`, the parent frame. Inside the sandbox the code can only reach
 * the sandbox's own document, and the document's CSP blocks the network
 * and `eval()`.
 *
 * This module owns the small, typed message protocol the two sides use and
 * the serialisable value format used to pass props across the boundary. It
 * never executes user code itself — evaluation lives in
 * `lib/playground/sandbox-runtime.ts`, which is compiled and injected into
 * the sandbox document.
 */

/** A value that can be sent to the preview without losing its shape. */
export type PlaygroundPropValue =
  | string
  | number
  | boolean
  | null
  | PlaygroundElementSpec
  | PlaygroundPropValue[]
  | { [key: string]: PlaygroundPropValue };

/**
 * A description of a React element.
 *
 * React elements are not structured-cloneable (they hold functions and
 * symbols), so they cannot be posted into the iframe. The registry
 * describes them instead, and the sandbox rebuilds them with
 * `React.createElement`.
 */
export type PlaygroundElementSpec = {
  /** The intrinsic element name, e.g. `"p"`. */
  __element: string;
  /** Props for the element. */
  props?: { [key: string]: PlaygroundPropValue };
  /** The element's children. */
  children?: PlaygroundPropValue;
};

/* -------------------------------------------------------------------------- */
/* App → sandbox                                                              */
/* -------------------------------------------------------------------------- */

export type SandboxRenderRequest = {
  token: string;
  type: "render";
  /** The compiled CommonJS module. */
  code: string;
  /** The component to pick out of the module. */
  component: string;
  /** Props for the component, in the serialisable format above. */
  props: unknown;
};

export type SandboxThemeRequest = {
  token: string;
  type: "theme";
  theme: "light" | "dark";
};

export type SandboxClearRequest = {
  token: string;
  type: "clear";
};

export type SandboxRequest =
  | SandboxRenderRequest
  | SandboxThemeRequest
  | SandboxClearRequest;

/* -------------------------------------------------------------------------- */
/* Sandbox → app                                                              */
/* -------------------------------------------------------------------------- */

export type SandboxLogLevel = "log" | "info" | "warn" | "error";

export type SandboxReadyMessage = { token: string; type: "ready" };
export type SandboxRenderedMessage = { token: string; type: "rendered" };
export type SandboxClearedMessage = { token: string; type: "cleared" };

export type SandboxErrorMessage = {
  token: string;
  type: "error";
  /**
   * `"no-component"` — the file compiled but there is nothing to render.
   * `"runtime"` — the code threw while it was evaluated or rendered.
   */
  kind: "no-component" | "runtime";
  message: string;
  stack?: string;
};

export type SandboxLogMessage = {
  token: string;
  type: "log";
  level: SandboxLogLevel;
  text: string;
};

export type SandboxMessage =
  | SandboxReadyMessage
  | SandboxRenderedMessage
  | SandboxClearedMessage
  | SandboxErrorMessage
  | SandboxLogMessage;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * A random token shared by the app and the sandbox.
 *
 * The sandbox runs in an opaque origin (the iframe is sandboxed *without*
 * `allow-same-origin`), so neither side can check the other's origin —
 * `event.origin` is the literal string `"null"` for both. The token
 * replaces the origin check: the sandbox only answers messages carrying
 * it, and the app only accepts messages from its own frame.
 *
 * **What the token is not:** it does not protect the app from the code
 * running inside the sandbox. The learner's code executes *in* the frame
 * that holds the token, so it can read the token and post a message the
 * app will accept. The token stops other documents and other frames from
 * interfering — it is not a privilege boundary against the code it
 * protects.
 */
export function createSandboxToken(): string {
  const cryptoApi = globalThis.crypto as Crypto | undefined;

  if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }

  if (cryptoApi && typeof cryptoApi.getRandomValues === "function") {
    const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
      "",
    );
  }

  // Last resort — only used on insecure origins where `crypto` is missing.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** Narrows an unknown `MessageEvent.data` to a sandbox message. */
export function isSandboxMessage(value: unknown): value is SandboxMessage {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Partial<SandboxMessage>;

  if (typeof candidate.token !== "string") return false;

  switch (candidate.type) {
    case "ready":
    case "rendered":
    case "cleared":
      return true;

    case "error": {
      const error = candidate as SandboxErrorMessage;
      return (
        typeof error.message === "string" &&
        (error.kind === "no-component" || error.kind === "runtime") &&
        (error.stack === undefined || typeof error.stack === "string")
      );
    }

    case "log": {
      const log = candidate as SandboxLogMessage;
      return (
        typeof log.text === "string" &&
        (log.level === "log" ||
          log.level === "info" ||
          log.level === "warn" ||
          log.level === "error")
      );
    }

    default:
      return false;
  }
}
