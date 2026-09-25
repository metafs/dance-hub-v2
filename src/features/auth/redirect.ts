/**
 * Where a signed-out user returns after signing in.
 *
 * `src/proxy.ts` records the path being rendered in {@link requestPathHeader},
 * because a server component cannot read its own URL; `requireUser` sends it to
 * /login as `next`, and the login action redirects there.
 */

/** Request header carrying the rendered path and query, set by src/proxy.ts. */
export const requestPathHeader = "x-p8ce-request-path";

export const defaultAfterLoginPath = "/workspace";

const origin = "http://p8ce.invalid";

/**
 * A same-origin path to redirect to, or the default.
 *
 * `next` arrives in a URL anyone can craft, so it is resolved the way a browser
 * resolves a Location header: tabs and newlines are dropped and a backslash
 * reads as a slash, which turns `/\t/example.com` or `/\\example.com` into
 * `//example.com`, another site. Only a value that still resolves on this
 * origin is kept, re-serialized from the parsed URL.
 */
export function safeRedirectPath(value: unknown, fallback = defaultAfterLoginPath): string {
  if (typeof value !== "string" || !value.startsWith("/")) return fallback;

  let url: URL;
  try {
    url = new URL(value, origin);
  } catch {
    return fallback;
  }

  if (url.origin !== origin || url.pathname === "/login") return fallback;
  return `${url.pathname}${url.search}${url.hash}`;
}
