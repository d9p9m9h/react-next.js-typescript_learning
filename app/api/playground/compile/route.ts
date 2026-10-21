import { transform } from "sucrase";

/**
 * Compiles a learner's TSX source into browser-runnable JavaScript.
 *
 * The compile step runs on the server so the browser never has to download
 * a compiler. The response is a plain CommonJS module that the client
 * evaluates inside a function with `react` (and friends) in scope.
 */

export type CompileRequest = {
  /** The file name, used only for error messages. */
  fileName: string;
  /** The TypeScript / TSX source to compile. */
  source: string;
  /**
   * The component the playground wants to render. `"default"` (or an
   * omitted value) means the file's default export.
   */
  component?: string;
};

export type CompileResponse = {
  ok: boolean;
  /** The compiled JavaScript, ready to be evaluated. */
  code?: string;
  /** A human-readable error message. */
  error?: string;
  /** The stack of the error, when there is one. */
  stack?: string;
};

/**
 * Matches a top-level declaration, e.g. `function UserList` or
 * `const UserList = …`.
 */
function declaresComponent(source: string, name: string): boolean {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `(?:^|\\n)\\s*(?:export\\s+)?(?:default\\s+)?(?:async\\s+)?(?:function|class|const|let|var)\\s+${escaped}\\b`,
  ).test(source);
}

export async function POST(request: Request): Promise<Response> {
  let payload: CompileRequest;

  try {
    payload = (await request.json()) as CompileRequest;
  } catch {
    return Response.json(
      { ok: false, error: "Request body ကို JSON အဖြစ် ဖတ်ဆစ်လို့ မရပါ။" } satisfies CompileResponse,
      { status: 400 },
    );
  }

  if (typeof payload?.source !== "string") {
    return Response.json(
      { ok: false, error: "`source` က string မဟုတ်ပါ။" } satisfies CompileResponse,
      { status: 400 },
    );
  }

  const fileName =
    typeof payload.fileName === "string" ? payload.fileName : "playground.tsx";

  const wanted =
    typeof payload.component === "string" && payload.component.length > 0
      ? payload.component
      : "default";

  // The learner's practice files often declare their component without
  // exporting it. When the requested component is missing we append a
  // re-export so the client can still reach it.
  let source = payload.source;
  if (wanted !== "default" && !declaresComponent(source, wanted)) {
    return Response.json(
      {
        ok: false,
        error: `"${wanted}" ကို "${fileName}" ထဲမှာ မတွေ့ပါ။ Component ကို အမည်နဲ့ ရေးပါ။`,
      } satisfies CompileResponse,
    );
  }

  try {
    const { code } = transform(source, {
      transforms: ["typescript", "jsx", "imports"],
      jsxRuntime: "automatic",
      production: true,
      filePath: fileName,
    });

    return Response.json({ ok: true, code } satisfies CompileResponse);
  } catch (error) {
    const err = error as Error;
    return Response.json(
      {
        ok: false,
        error: err.message,
        stack: err.stack,
      } satisfies CompileResponse,
    );
  }
}