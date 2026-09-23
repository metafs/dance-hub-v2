/**
 * One line of structured JSON per server-side request error (ADR-0023).
 *
 * Cloudflare Workers Logs indexes the fields of a JSON object written to the
 * console, so an error can be found by route, type or digest without a
 * third-party service. The record deliberately leaves out request headers,
 * cookies and the query string: those can carry sessions and personal data,
 * and the route plus the error is enough to find the cause.
 */

export type RequestErrorContext = {
  routerKind: string;
  routePath: string;
  routeType: string;
  renderSource?: string;
  revalidateReason?: string;
};

export type RequestErrorRecord = {
  level: "error";
  event: "request_error";
  name: string;
  message: string;
  digest?: string;
  stack?: string;
  method: string;
  path: string;
  routePath: string;
  routeType: string;
  routerKind: string;
  renderSource?: string;
  revalidateReason?: string;
};

const MESSAGE_LIMIT = 500;
const STACK_LIMIT = 2000;

function truncate(value: string, limit: number) {
  return value.length > limit ? `${value.slice(0, limit)}…` : value;
}

/** The path without its query string or fragment. */
export function pathWithoutQuery(path: string) {
  const end = path.search(/[?#]/);
  return end === -1 ? path : path.slice(0, end);
}

export function requestErrorRecord(
  error: unknown,
  request: Readonly<{ path: string; method: string }>,
  context: Readonly<RequestErrorContext>,
): RequestErrorRecord {
  const isError = error instanceof Error;
  const digest = typeof error === "object" && error !== null && "digest" in error
    && typeof (error as { digest: unknown }).digest === "string"
    ? (error as { digest: string }).digest
    : undefined;

  const record: RequestErrorRecord = {
    level: "error",
    event: "request_error",
    name: isError ? error.name : typeof error,
    message: truncate(isError ? error.message : String(error), MESSAGE_LIMIT),
    method: request.method,
    path: pathWithoutQuery(request.path),
    routePath: context.routePath,
    routeType: context.routeType,
    routerKind: context.routerKind,
  };

  if (digest) record.digest = digest;
  if (isError && error.stack) record.stack = truncate(error.stack, STACK_LIMIT);
  if (context.renderSource) record.renderSource = context.renderSource;
  if (context.revalidateReason) record.revalidateReason = context.revalidateReason;

  return record;
}
