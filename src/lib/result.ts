export type ErrorCode = string;

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | {
    ok: false;
    code: ErrorCode;
    fieldErrors?: Record<string, string[]>;
    message?: string;
  };
