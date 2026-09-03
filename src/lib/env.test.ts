import { describe, expect, it } from "vitest";

import { validateEnvironment } from "./env";

const validEnvironment = {
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
  NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
};

describe("validateEnvironment", () => {
  it("returns the required public Supabase configuration", () => {
    expect(validateEnvironment(validEnvironment)).toEqual({
      supabasePublishableKey: "publishable-key",
      supabaseUrl: "https://project.supabase.co",
    });
  });

  it("rejects missing and blank required values", () => {
    expect(() => validateEnvironment({ ...validEnvironment, NEXT_PUBLIC_SUPABASE_URL: "" }))
      .toThrow("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL.");
    expect(() => validateEnvironment({ ...validEnvironment, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "  " }))
      .toThrow("Missing required environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  });

  it("requires an HTTP(S) Supabase URL", () => {
    expect(() => validateEnvironment({ ...validEnvironment, NEXT_PUBLIC_SUPABASE_URL: "not-a-url" }))
      .toThrow("Environment variable NEXT_PUBLIC_SUPABASE_URL must be an HTTP(S) URL.");
    expect(() => validateEnvironment({ ...validEnvironment, NEXT_PUBLIC_SUPABASE_URL: "ftp://project.supabase.co" }))
      .toThrow("Environment variable NEXT_PUBLIC_SUPABASE_URL must be an HTTP(S) URL.");
  });
});
