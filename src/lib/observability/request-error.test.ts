import { describe, expect, it } from "vitest";

import { pathWithoutQuery, requestErrorRecord } from "./request-error";

const context = { routerKind: "App Router", routePath: "/events/[eventId]", routeType: "render" };

describe("pathWithoutQuery", () => {
  it("drops the query string and fragment", () => {
    expect(pathWithoutQuery("/listing-requests?event=abc&kind=withdrawal")).toBe("/listing-requests");
    expect(pathWithoutQuery("/events/1#schedule")).toBe("/events/1");
    expect(pathWithoutQuery("/events")).toBe("/events");
  });
});

describe("requestErrorRecord", () => {
  it("records the error, the route and the digest a user can quote", () => {
    const error = Object.assign(new Error("relation does not exist"), { digest: "2345678901" });
    const record = requestErrorRecord(error, { path: "/events/1?ref=x", method: "GET" }, context);

    expect(record).toMatchObject({
      level: "error",
      event: "request_error",
      name: "Error",
      message: "relation does not exist",
      digest: "2345678901",
      method: "GET",
      path: "/events/1",
      routePath: "/events/[eventId]",
      routeType: "render",
      routerKind: "App Router",
    });
    expect(record.stack).toContain("relation does not exist");
  });

  it("never carries request headers, cookies or the query string", () => {
    const request = {
      path: "/listing-requests?contact=someone%40example.com",
      method: "POST",
      headers: { cookie: "sb-access-token=secret", authorization: "Bearer secret" },
    };
    const serialized = JSON.stringify(requestErrorRecord(new Error("failed"), request, context));

    expect(serialized).not.toContain("secret");
    expect(serialized).not.toContain("example.com");
    expect(serialized).not.toContain("headers");
  });

  it("describes a thrown non-Error value", () => {
    expect(requestErrorRecord("boom", { path: "/", method: "GET" }, context))
      .toMatchObject({ name: "string", message: "boom" });
  });

  it("bounds the size of the message and stack", () => {
    const error = new Error("x".repeat(5000));
    const record = requestErrorRecord(error, { path: "/", method: "GET" }, context);

    expect(record.message.length).toBeLessThanOrEqual(501);
    expect(record.stack?.length ?? 0).toBeLessThanOrEqual(2001);
  });

  it("keeps the optional render context only when Next.js supplies it", () => {
    const record = requestErrorRecord(new Error("x"), { path: "/", method: "GET" }, {
      ...context,
      renderSource: "server-rendering",
      revalidateReason: undefined,
    });

    expect(record.renderSource).toBe("server-rendering");
    expect(record).not.toHaveProperty("revalidateReason");
  });
});
