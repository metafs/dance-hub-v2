import { describe, expectTypeOf, it } from "vitest";

import type { ActionResult, ErrorCode } from "./result";

describe("ActionResult", () => {
  it("supports successful data and structured failures", () => {
    expectTypeOf<{ ok: true; data: { id: string } }>().toMatchTypeOf<ActionResult<{ id: string }>>();
    expectTypeOf<{
      ok: false;
      code: ErrorCode;
      fieldErrors: Record<string, string[]>;
      message: string;
    }>().toMatchTypeOf<ActionResult>();
  });
});
