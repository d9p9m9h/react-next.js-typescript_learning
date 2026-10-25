import { transform } from "sucrase";

import { highlightTsx } from "@/lib/playground/highlight";
import { compilePreviewStyles } from "@/lib/playground/styles";
import { checkPracticeFile, type TypeDiagnostic } from "@/lib/playground/typecheck";

/**
 * Compiles a learner's TSX source into browser-runnable JavaScript.
 *
 * The compile step runs on the server so the browser never has to download
 * a compiler. The response is a plain CommonJS module, which the sandbox
 * runtime evaluates inside the preview iframe (never in the app window).
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
  /** Tailwind CSS generated from the current source. */
  css?: string;
  /** The highlighted source, as HTML. */
  html?: string;
  /** TypeScript errors found in the current source. */
  diagnostics?: TypeDiagnostic[];
  /** A human-readable error message. */
  error?: string;
  /** The stack of the error, when there is one. */
  stack?: string;
};

/**
 * Matches a top-level declaration, e.g. `function UserList` or
 * `const UserList = …`.
 */
export function declaresComponent(source: string, name: string): boolean {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `(?:^|\\n)\\s*(?:export\\s+)?(?:default\\s+)?(?:async\\s+)?(?:function|class|const|let|var)\\s+${escaped}\\b`,
  ).test(source);
}

/**
 * Matches an explicit export of the component, e.g.
 * `export function UserList` or `export { UserList }`.
 */
export function exportsComponent(source: string, name: string): boolean {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const patterns = [
    new RegExp(
      `(?:^|\\n)\\s*export\\s+(?:default\\s+)?(?:async\\s+)?(?:function|class|const|let|var)\\s+${escaped}\\b`,
    ),
    new RegExp(
      `(?:^|\\n)\\s*export\\s*\\{[^}]*\\b${escaped}\\b[^}]*\\}`,
    ),
  ];

  return patterns.some((pattern) => pattern.test(source));
}

/**
 * Appends an explicit re-export of the wanted component.
 *
 * Sucrase's `imports` transform turns `export default Foo` into
 * `exports.default = Foo`, but a component that is only *declared* (never
 * exported) stays a local binding. The sandbox looks the component up on
 * the module's exports, so the compiled module is given an extra line
 * that assigns the local binding to `exports.__target`.
 */
export function appendTargetExport(code: string, name: string): string {
  return `${code}\n;exports.__target = ${name};`;
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
  const source = payload.source;
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

    // The component is only re-exported when the file does not export it
    // itself. Sucrase's `imports` transform has already turned any real
    // `export` statement into an assignment on `exports`, so a file that
    // exports the component does not need the extra line.
    const finalCode =
      wanted !== "default" && !exportsComponent(source, wanted)
        ? appendTargetExport(code, wanted)
        : code;
    const css = await compilePreviewStyles(source);
    const html = highlightTsx(source);
    const typeCheck = await checkPracticeFile(fileName, source);

    return Response.json({
      ok: true,
      code: finalCode,
      css,
      html,
      diagnostics: typeCheck.diagnostics,
    } satisfies CompileResponse);
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