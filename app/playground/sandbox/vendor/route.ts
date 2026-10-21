import { buildVendorBundle } from "@/lib/playground/vendor";

/**
 * Serves the React runtime that the sandbox document loads before the
 * learner's own code.
 *
 * The bundle is generated on demand from React's own CommonJS builds (see
 * `lib/playground/vendor.ts`). It is built here rather than checked in as
 * a static file so it can never drift from the installed React version.
 */
export async function GET(): Promise<Response> {
  const source = buildVendorBundle();

  return new Response(source, {
    status: 200,
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
