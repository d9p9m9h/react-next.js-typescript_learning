"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  /** The component to pick out of the module. */
  component: string;
  /** Props for the component, in their raw (React) form. */
  props: Record<string, unknown>;
  /** The current colour scheme, so the preview matches the app. */
  theme: "light" | "dark";
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
 * > learner's code away from the app's own state and DOM.
 *
 * Both sides talk over `postMessage`. Because an opaque origin reports
 * `event.origin` as the literal string `"null"`, the origin cannot be
 * used to authenticate a message; the shared random token does that
 * instead. The app also checks `event.source` so only this frame's
 * messages are accepted.
 */
export function PlaygroundPreview({
  code,
  component,
  props,
  theme,
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
   * The latest props are kept in a ref so the message listener can always
   * read the current values without being re-registered on every render.
   */
  const propsRef = useRef(props);
  propsRef.current = props;

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
    if (code === null) {
      post({ token, type: "clear" });
      return;
    }

    let payload: Record<string, unknown>;

    try {
      payload = serializeProps(propsRef.current);
    } catch (error) {
      onError({
        kind: "runtime",
        message:
          error instanceof Error
            ? error.message
            : "Props ကို preview ထဲကို ပို့လို့ မရပါ။",
      });
      return;
    }

    post({
      token,
      type: "render",
      code,
      component,
      props: payload,
    });
  }, [ready, token, code, component, post, onError]);

  // Keep the preview's colour scheme in sync with the app.
  useEffect(() => {
    if (!ready || token === null) return;

    post({ token, type: "theme", theme });
  }, [ready, token, theme, post]);

  return (
    <iframe
      ref={iframeRef}
      // The `src` is set only once the client-side token exists, so the
      // server-rendered markup and the browser agree on it.
      src={
        token === null
          ? undefined
          : `/playground/sandbox?token=${encodeURIComponent(token)}`
      }
      title="Playground preview"
      className="h-full w-full border-0"
      // `allow-scripts` lets the learner's code run. `allow-same-origin`
      // is deliberately **not** granted: with it, the frame would share
      // this page's origin and could reach the app's DOM and storage.
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
    />
  );
}
