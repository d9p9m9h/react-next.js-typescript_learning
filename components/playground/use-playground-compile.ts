"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { SandboxErrorReport } from "@/components/playground/playground-preview";
import type { PlaygroundFile } from "@/lib/playground/files";
import type { TypeDiagnostic } from "@/lib/playground/typecheck";

type Status = "idle" | "compiling" | "ok" | "error";

type CompileResult = {
  ok: boolean;
  code?: string;
  css?: string;
  html?: string;
  diagnostics?: TypeDiagnostic[];
  error?: string;
};

export type UsePlaygroundCompileArgs = {
  activeFile: PlaygroundFile | undefined;
  source: string;
  componentName: string;
  hasNoComponent: boolean;
};

export type UsePlaygroundCompileResult = {
  status: Status;
  compileError: string | null;
  runtimeError: SandboxErrorReport | null;
  compiledCode: string | null;
  compiledCss: string | null;
  highlightedHtml: string | null;
  typeDiagnostics: TypeDiagnostic[];
  handleSandboxError: (error: SandboxErrorReport) => void;
  handleSandboxRendered: () => void;
};

/**
 * All of the compile-and-preview state and the debounced compile effect
 * that used to live inline in the playground component, extracted as
 * `usePlaygroundCompile`.
 */
export function usePlaygroundCompile({
  activeFile,
  source,
  componentName,
  hasNoComponent,
}: UsePlaygroundCompileArgs): UsePlaygroundCompileResult {
  const [status, setStatus] = useState<Status>("idle");
  const [compileError, setCompileError] = useState<string | null>(null);
  const [runtimeError, setRuntimeError] = useState<SandboxErrorReport | null>(
    null,
  );
  const [compiledCode, setCompiledCode] = useState<string | null>(null);
  const [compiledCss, setCompiledCss] = useState<string | null>(null);
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);
  const [typeDiagnostics, setTypeDiagnostics] = useState<TypeDiagnostic[]>([]);

  const requestIdRef = useRef(0);
  const compileControllerRef = useRef<AbortController | null>(null);

  const run = useCallback(
    async (
      fileName: string,
      code: string,
      requestId: number,
      signal: AbortSignal,
    ) => {
      try {
        const response = await fetch("/api/playground/compile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal,
          body: JSON.stringify({
            fileName,
            source: code,
            component: componentName,
          }),
        });

        const result = (await response.json()) as CompileResult;

        if (requestId !== requestIdRef.current) return;

        if (!result.ok || !result.code || !result.css) {
          setStatus("error");
          setCompileError(result.error ?? "Compile မအောင်မြင်ပါ။");
          setCompiledCode(null);
          setCompiledCss(null);
          setHighlightedHtml(null);
          setTypeDiagnostics([]);
          return;
        }

        setCompiledCode(result.code);
        setCompiledCss(result.css);
        setHighlightedHtml(result.html ?? null);
        setTypeDiagnostics(result.diagnostics ?? []);
        setStatus("ok");
      } catch (error) {
        if (signal.aborted || requestId !== requestIdRef.current) return;
        setStatus("error");
        setCompileError(
          error instanceof Error
            ? `Compile API ကို မေးနိုင်ခဲ့ပါ။ ${error.message}`
            : "Compile API ကို မေးနိုင်ခဲ့ပါ။ Server ကို စစ်ပါ။",
        );
        setCompiledCode(null);
        setCompiledCss(null);
        setHighlightedHtml(null);
        setTypeDiagnostics([]);
      }
    },
    [componentName],
  );

  useEffect(() => {
    if (!activeFile || hasNoComponent) return;

    const requestId = ++requestIdRef.current;
    compileControllerRef.current?.abort();
    setStatus("compiling");
    setCompileError(null);
    setRuntimeError(null);

    const timer = setTimeout(() => {
      const controller = new AbortController();
      compileControllerRef.current = controller;
      void run(activeFile.name, source, requestId, controller.signal);
    }, 180);

    return () => {
      clearTimeout(timer);
      compileControllerRef.current?.abort();
    };
  }, [activeFile, source, run, hasNoComponent]);

  useEffect(() => {
    if (!hasNoComponent) return;
    setCompiledCode(null);
    setCompiledCss(null);
    setStatus("idle");
  }, [hasNoComponent]);

  const handleSandboxError = useCallback((error: SandboxErrorReport) => {
    setRuntimeError(error);
    setStatus("error");
  }, []);

  const handleSandboxRendered = useCallback(() => {
    setRuntimeError(null);
  }, []);

  return {
    status,
    compileError,
    runtimeError,
    compiledCode,
    compiledCss,
    highlightedHtml,
    typeDiagnostics,
    handleSandboxError,
    handleSandboxRendered,
  };
}

export default usePlaygroundCompile;
