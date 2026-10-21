import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { API } from "typescript/unstable/sync";

/**
 * Type-checking for the learner's practice files.
 *
 * The compile endpoint uses Sucrase, which only *strips* types — it
 * never checks them, so a wrong type passes silently. This module runs
 * the real TypeScript checker over the edited source and reports the
 * diagnostics the learner needs.
 *
 * It uses the **TypeScript 7 native API** (`typescript/unstable/sync`),
 * which drives the `tsgo` binary that ships with the `typescript`
 * package. The API talks to a long-lived compiler process over a pipe,
 * so the program is built **once** and reused for every edit: a
 * re-check of an edited file costs a few milliseconds instead of the
 * ~1.5 s a cold program costs.
 *
 * The edited source is handed to the compiler through a **virtual file
 * system** overlay, so the learner's files on disk are never touched.
 */

/** A type problem found in the learner's source. */
export type TypeDiagnostic = {
  /** The TypeScript diagnostic code, e.g. `2345`. */
  code: number;
  /** The message, ready to display. */
  message: string;
  /** Zero-based start offset in the source. */
  start: number;
  /** Zero-based end offset in the source. */
  end: number;
  /** One-based line number of the start offset. */
  line: number;
  /** One-based column number of the start offset. */
  column: number;
  /** The source line the problem is on, trimmed. */
  lineText: string;
};

/** The result of checking one file. */
export type TypeCheckResult = {
  /** The errors, in source order. */
  diagnostics: TypeDiagnostic[];
  /** How long the check took, in milliseconds. */
  durationMs: number;
};

/** The project root — the folder that holds `tsconfig.json`. */
const projectRoot = process.cwd();

/** The folder that holds the learner's practice files. */
const practiceFolder = join(projectRoot, "practice");

/** The compiler's own diagnostic category for an error. */
const ERROR_CATEGORY = 1;

/**
 * Normalises a path into the key used by the overlay.
 *
 * The compiler asks for files in several shapes: forward slashes, a
 * backslash path, or a path that already contains the project root
 * twice. The overlay has to recognise all of them, so every path is
 * folded into one comparable form.
 */
function normalizePath(filePath: string): string {
  let value = filePath.replace(/\\/g, "/");
  const root = projectRoot.replace(/\\/g, "/");

  if (
    value.toLowerCase().startsWith(`${root.toLowerCase()}/${root.toLowerCase()}/`)
  ) {
    value = value.slice(root.length + 1);
  }

  return value.toLowerCase();
}

/**
 * The overlay of edited sources, keyed by normalised path.
 *
 * It lives for as long as the compiler does, so a new edit simply
 * replaces the entry for that file.
 */
const overlay = new Map<string, string>();

/**
 * The virtual file system handed to the compiler.
 *
 * Only the *edited* file is overlaid; every other file is read from
 * disk, so `react` and its types resolve exactly as they do in the
 * project.
 */
const virtualFileSystem = {
  readFile(file: string): string | undefined {
    const key = normalizePath(file);

    if (overlay.has(key)) return overlay.get(key);

    try {
      return readFileSync(file, "utf8");
    } catch {
      // `undefined` tells the compiler to fall back to the real file
      // system, which is what an unreadable file means.
      return undefined;
    }
  },

  fileExists(file: string): boolean {
    if (overlay.has(normalizePath(file))) return true;

    try {
      statSync(file);
      return true;
    } catch {
      return false;
    }
  },

  directoryExists(file: string): boolean {
    try {
      return statSync(file).isDirectory();
    } catch {
      return false;
    }
  },

  /**
   * Lists a directory.
   *
   * The entries are returned as **names**, not full paths — the
   * compiler joins them with the directory it asked about.
   */
  getAccessibleEntries(
    directory: string,
  ): { files: string[]; directories: string[] } | undefined {
    try {
      const files: string[] = [];
      const directories: string[] = [];

      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        if (entry.isDirectory()) directories.push(entry.name);
        else files.push(entry.name);
      }

      return { files, directories };
    } catch {
      return undefined;
    }
  },
};

/**
 * The running compiler.
 *
 * One `API` instance owns one `tsgo` process. It is created lazily on
 * the first check and then kept alive: starting the process costs well
 * over a second, and the learner edits the same file many times.
 */
let compiler: API | null = null;

/**
 * The file the current program was built for.
 *
 * The compiler keeps one program per file, so switching files has to
 * reopen the new one.
 */
let openFile: string | null = null;

/**
 * Closes the compiler process.
 *
 * Called when the development server shuts down, so the child process
 * does not outlive it.
 */
export function closeTypeChecker(): void {
  compiler?.close();
  compiler = null;
  openFile = null;
}

/**
 * Checks one practice file and returns the diagnostics.
 *
 * A failure inside the checker is **not** fatal: the playground keeps
 * working, and the caller simply receives no diagnostics. Type errors
 * are a hint, not a blocker — the learner can still preview the code.
 */
export async function checkPracticeFile(
  fileName: string,
  source: string,
): Promise<TypeCheckResult> {
  const started = Date.now();
  const filePath = join(practiceFolder, fileName);

  try {
    if (!compiler) {
      compiler = new API({ cwd: projectRoot, fs: virtualFileSystem });
    }

    // Push the edited source into the overlay before the check.
    overlay.set(normalizePath(filePath), source);

    const snapshot =
      openFile === filePath
        ? compiler.updateSnapshot({
            fileChanges: { changed: [filePath.replace(/\\/g, "/")] },
          })
        : compiler.updateSnapshot({
            openProjects: [join(projectRoot, "tsconfig.json")],
            openFiles: [filePath],
          });

    openFile = filePath;

    const project = snapshot.getDefaultProjectForFile(filePath);

    if (!project) return { diagnostics: [], durationMs: Date.now() - started };

    const diagnostics = project.program.getSemanticDiagnostics(filePath);

    return {
      diagnostics: diagnostics
        .filter((diagnostic) => diagnostic.category === ERROR_CATEGORY)
        .map((diagnostic) => toTypeDiagnostic(diagnostic, source)),
      durationMs: Date.now() - started,
    };
  } catch {
    return { diagnostics: [], durationMs: Date.now() - started };
  }
}

/**
 * Converts a compiler diagnostic into the shape the UI needs.
 */
function toTypeDiagnostic(
  diagnostic: { code: number; text: string; pos: number; end: number },
  source: string,
): TypeDiagnostic {
  const { line, column } = offsetToLineColumn(source, diagnostic.pos);
  const lineText = source.split(/\r?\n/)[line - 1]?.trim() ?? "";

  return {
    code: diagnostic.code,
    message: diagnostic.text,
    start: diagnostic.pos,
    end: diagnostic.end,
    line,
    column,
    lineText,
  };
}

/**
 * Converts a character offset into a one-based line and column.
 */
function offsetToLineColumn(
  source: string,
  offset: number,
): { line: number; column: number } {
  let line = 1;
  let lastBreak = -1;

  for (let index = 0; index < offset && index < source.length; index += 1) {
    if (source[index] === "\n") {
      line += 1;
      lastBreak = index;
    }
  }

  return { line, column: offset - lastBreak };
}
