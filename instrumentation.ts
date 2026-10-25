/**
 * Next.js instrumentation hook.
 *
 * This runs once when the Next.js server starts. We use it to register
 * a shutdown hook that closes the TypeScript compiler process (`tsgo`)
 * so it doesn't outlive the dev server.
 */
import { closeTypeChecker } from "@/lib/playground/typecheck";

export function register() {
  // Register a cleanup handler for when the process exits
  process.on("exit", () => {
    closeTypeChecker();
  });

  process.on("SIGINT", () => {
    closeTypeChecker();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    closeTypeChecker();
    process.exit(0);
  });
}