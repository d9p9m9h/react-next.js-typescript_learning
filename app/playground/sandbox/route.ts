import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { transform } from "sucrase";

import { escapeForScript } from "@/lib/playground/vendor";

/**
 * Serves the document that hosts the isolated preview.
 *
 * The learner's code is **never** evaluated in the main application
 * window. It is compiled on the server, handed to this document, and run
 * here — inside an iframe that the app embeds with the `sandbox`
 * attribute *without* `allow-same-origin`.
 *
 * That combination gives the frame an opaque origin:
 *
 * - it cannot read the app's DOM, cookies or `localStorage`;
 * - the app cannot reach into the frame's document;
 * - `event.origin` is the literal string `"null"` on both sides, so the
 *   shared token (see `lib/playground/protocol.ts`) is what actually
 *   authenticates a message.
 *
 * The document's own Content Security Policy blocks the network
 * (`connect-src 'none'`) and dynamic code evaluation (`script-src` has no
 * `'unsafe-eval'`), so the learner's code cannot call the compile API or
 * run `eval()`.
 *
 * **What this is not:** a security boundary for untrusted internet users.
 * The learner's code runs *in* the frame that holds the shared token, so
 * it can read that token and post messages the app will accept — it can
 * forge console output and error reports. It is a learning aid on a local
 * machine that keeps the learner's code away from the app's own state and
 * DOM; it is not a claim that arbitrary code is safely contained.
 */

/**
 * The token the app and the sandbox share.
 *
 * It travels in the URL query string. The query is read once, on the
 * server, and the value is handed to the document as part of its inline
 * configuration. Because the iframe has an opaque origin, the token
 * cannot be read by any other document either.
 */
function readToken(request: Request): string {
  const url = new URL(request.url);
  return url.searchParams.get("token") ?? "";
}

/** A fresh nonce for the document's inline scripts. */
function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/**
 * Compiles the sandbox runtime into a classic script.
 *
 * Only the TypeScript transform is applied: the runtime must not gain
 * imports or exports, because it is injected into a plain `<script>`
 * element with no module loader.
 */
function buildRuntimeScript(): string {
  const source = readRuntimeSource();

  const { code } = transform(source, {
    transforms: ["typescript"],
    filePath: "sandbox-runtime.ts",
  });

  return code;
}

/**
 * Reads the runtime source.
 *
 * The runtime lives in `lib/playground/sandbox-runtime.ts`. It is read
 * from disk here so the file stays a normal, type-checked module in the
 * repository rather than a string of JavaScript.
 */
function readRuntimeSource(): string {
  const path = join(
    process.cwd(),
    "lib",
    "playground",
    "sandbox-runtime.ts",
  );

  if (!existsSync(path)) {
    throw new Error(
      "lib/playground/sandbox-runtime.ts ကို မတွေ့ပါ — sandbox runtime source ကို ရှိမှာပါပဲ။",
    );
  }

  return readFileSync(path, "utf8");
}

/**
 * Serves the sandbox document.
 *
 * The response is intentionally **not** cached: the token changes per
 * session, and a cached document would carry a stale token.
 */
export async function GET(request: Request): Promise<Response> {
  const token = readToken(request);
  const nonce = createNonce();

  const config = JSON.stringify({ nonce, token });
  const runtime = escapeForScript(buildRuntimeScript());

  const html = `<!doctype html>
<html lang="my">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Playground preview</title>
    <style>
      :root {
        color-scheme: light dark;
        --preview-bg: #ffffff;
        --preview-fg: #1f2937;
        --preview-muted: #6b7280;
      }
      html.dark {
        --preview-bg: #16201e;
        --preview-fg: #f1f5f9;
        --preview-muted: #94a3b8;
      }
      * {
        box-sizing: border-box;
      }
      html,
      body {
        margin: 0;
        padding: 0;
        min-height: 100%;
        background: var(--preview-bg);
        color: var(--preview-fg);
        font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI",
          "Noto Sans Myanmar", sans-serif;
      }
      body {
        padding: 20px 24px;
      }
      #root:not(:empty) {
        font-size: 15px;
        line-height: 1.6;
      }
      #root:empty::after {
        content: "Preview ထဲမှာ ဘာမှ မရှိနေသေးပါ။";
        color: var(--preview-muted);
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>

    <script nonce="${nonce}">
      window.__pbConfig = ${config};
    </script>
    <script nonce="${nonce}" src="/playground/sandbox/vendor"></script>
    <script nonce="${nonce}">
${runtime}
    </script>
  </body>
</html>
`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      /**
       * The policy is deliberately strict:
       *
       * - `script-src 'nonce-…'` allows only the nonce-carrying scripts.
       *   The runtime injects the learner's compiled module as another
       *   `<script>` with the same nonce, so it runs without
       *   `unsafe-eval`.
       * - `connect-src 'none'` keeps the preview from talking to the
       *   network.
       * - `frame-ancestors 'self'` allows the app to embed the preview.
       */
      "Content-Security-Policy": [
        "default-src 'none'",
        `script-src 'nonce-${nonce}' 'strict-dynamic'`,
        "style-src 'unsafe-inline'",
        "img-src data: blob:",
        "font-src 'none'",
        "connect-src 'none'",
        "form-action 'none'",
        "base-uri 'none'",
        "frame-ancestors 'self'",
      ].join("; "),
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
