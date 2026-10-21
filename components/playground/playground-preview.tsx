"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  createSandboxToken,
  isSandboxMessage,
  type SandboxLogLevel,
  type SandboxRequest,
} from "@/lib/playground/protocol";
import { serializeProps } from "@/lib/playground/props";

/** A log line captured from inside the sandbox. */
export type SandboxLogEntry = {
  id: number;
  level: SandboxLogLevel;
  text: string;
};

/** A runtime problem reported by the sandbox. */
export type SandboxErrorReport = {
  kind: "no-component" | "runtime";
  message: string;
  stack?: string;
};

type PlaygroundPreviewProps = {
  /**
   * The compiled CommonJS module to evaluate inside the sandbox.
   *
   * `null` means "nothing has been compiled yet"; the preview is then
   * left empty instead of showing a spurious "no component" error.
   */
  code: string | null;
  /** Tailwind stylesheet generated for the compiled source. */
  css: string | null;
  /** The component to pick out of the module. */
  component: string;
  /** Props for the component, in their raw (React) form. */
  props: Record<string, unknown>;
  /** The current colour scheme, so the preview matches the app. */
  theme: "light" | "dark";
  /**
   * The width the preview is shown at, in CSS pixels.
   *
   * `null` means "fill the panel". A fixed width is used to see how
   * the component behaves on a phone or a tablet.
   */
  width?: number | null;
  /** Called for every console line the learner's code produces. */
  onLog: (entry: SandboxLogEntry) => void;
  /** Called when the sandbox reports a runtime problem. */
  onError: (error: SandboxErrorReport) => void;
  /** Called when the sandbox has finished rendering the component. */
  onRendered: () => void;
};

/**
 * Hosts the isolated preview.
 *
 * The iframe is loaded from `/playground/sandbox` and is sandboxed
 * **without** `allow-same-origin`, which gives the document an opaque
 * origin: it cannot read this page's DOM, cookies or storage, and this
 * page cannot reach into it. `allow-scripts` is the only capability
 * granted, because the learner's code has to run.
 *
 * > The sandbox is a learning aid on a local machine, not a security
 * > boundary for untrusted internet users. Its job is to keep the
 * > learner's code away from the app's own state and DOM. Note that the
 * > code runs in the frame that holds the shared token, so it can forge
 * > console and error messages — see `lib/playground/protocol.ts`.
 *
 * Both sides talk over `postMessage`. Because an opaque origin reports
 * `event.origin` as the literal string `"null"`, the origin cannot be
 * used to authenticate a message; the shared random token does that
 * instead. The app also checks `event.source` so only this frame's
 * messages are accepted.
 */
export function PlaygroundPreview({
  code,
  css,
  component,
  props,
  theme,
  width = null,
  onLog,
  onError,
  onRendered,
}: PlaygroundPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const logIdRef = useRef(0);
  const [ready, setReady] = useState(false);

  /**
   * The token that the app and the sandbox share.
   *
   * It has to be the *same* value on both sides, so it is not generated
   * during render: React renders this component on the server as well,
   * and a value that differs between the server and the browser would
   * leave the client talking with a token the sandbox never received.
   *
   * Instead the token is created once on the client, after mount, and the
   * iframe is only given a `src` from that point on.
   */
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(createSandboxToken());
  }, []);

  /**
   * The props, serialised for the sandbox.
   *
   * The result is memoised on the props themselves, so the render
   * effect below re-runs when a value changes — and not on every
   * unrelated render of the page.
   */
  const serialized = useMemo(() => {
    try {
      return { ok: true as const, props: serializeProps(props) };
    } catch (error) {
      return {
        ok: false as const,
        error:
          error instanceof Error
            ? error.message
            : "Props ကို preview ထဲကို ပို့လို့ မရပါ။",
      };
    }
  }, [props]);

  /**
   * Handles the messages the sandbox sends back.
   *
   * Every message must come from the iframe's own window *and* carry the
   * shared token. Anything else is ignored.
   */
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      // Only this frame may talk to us. `event.source` is compared
      // against the iframe's content window, which is the check that
      // works even though the origin is opaque.
      if (event.source !== iframe.contentWindow) return;

      if (!isSandboxMessage(event.data)) return;
      if (event.data.token !== token) return;

      switch (event.data.type) {
        case "ready":
          setReady(true);
          return;

        case "rendered":
          onRendered();
          return;

        case "cleared":
          return;

        case "log":
          onLog({
            id: ++logIdRef.current,
            level: event.data.level,
            text: event.data.text,
          });
          return;

        case "error":
          onError({
            kind: event.data.kind,
            message: event.data.message,
            stack: event.data.stack,
          });
          return;
      }
    },
    [onError, onLog, onRendered, token],
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  /** Posts a request to the sandbox, if it is ready to receive one. */
  const post = useCallback(
    (request: SandboxRequest) => {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) return;

      // The sandbox has an opaque origin, so the target origin cannot be
      // known. The token is what authenticates the message.
      iframe.contentWindow.postMessage(request, "*");
    },
    [],
  );

  // Send the compiled code whenever it changes.
  useEffect(() => {
    if (!ready || token === null) return;

    // Nothing has been compiled yet — the preview stays empty rather than
    // reporting a confusing "no component" error.
    if (code === null || css === null) {
      post({ token, type: "clear" });
      return;
    }

    if (!serialized.ok) {
      onError({ kind: "runtime", message: serialized.error });
      return;
    }

    post({
      token,
      type: "render",
      code,
      css,
      component,
      props: serialized.props,
    });
  }, [ready, token, code, css, component, serialized, post, onError]);

  // Keep the preview's colour scheme in sync with the app.
  useEffect(() => {
    if (!ready || token === null) return;

    post({ token, type: "theme", theme });
  }, [ready, token, theme, post]);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-auto">
      {/*
        The frame.

        A fixed width is centred inside the panel, so a phone-sized
        preview can be seen next to the space it would really have on
        a device. The frame still fills the panel when no width is
        chosen.
      */}
      <div
        className={[
          "mx-auto flex min-h-0 w-full flex-1 flex-col",
          width ? "shrink-0 rounded-lg border border-[var(--surface-border)]" : "",
        ].join(" ")}
        style={width ? { width: `${width}px`, maxWidth: "100%" } : undefined}
      >
        <iframe
          ref={iframeRef}
          // The `src` is set only once the client-side token exists, so
          // the server-rendered markup and the browser agree on it.
          src={
            token === null
              ? undefined
              : `/playground/sandbox?token=${encodeURIComponent(token)}`
          }
          title="Playground preview"
          /*
           * The frame fills the box it is given.
           *
           * `h-full` (i.e. `height: 100%`) cannot be used here: the
           * parent is a **flex item**, so its height comes from the flex
           * layout rather than from a definite box, and a percentage
           * height against an indefinite height falls back to `auto` —
           * which would collapse the frame to a couple of lines.
           *
           * As a flex item of a flex column, the frame simply grows to
           * fill the remaining space.
           */
          className="min-h-0 w-full flex-1 border-0"
          // `allow-scripts` lets the learner's code run. `allow-same-origin`
          // is deliberately **not** granted: with it, the frame would share
          // this page's origin and could reach the app's DOM and storage.
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
}
