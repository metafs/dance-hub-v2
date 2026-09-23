import type { Instrumentation } from "next";

import { validateEnvironment } from "./src/lib/env";
import { requestErrorRecord } from "./src/lib/observability/request-error";

export async function register() {
  validateEnvironment();
}

/**
 * Every uncaught server error in a page render, Route Handler, Server Action or
 * proxy becomes one JSON line on the console, which Cloudflare Workers Logs
 * stores and indexes (ADR-0023). Next.js still renders its error page; this
 * only makes the failure findable.
 */
export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  console.error(JSON.stringify(requestErrorRecord(error, request, context)));
};
