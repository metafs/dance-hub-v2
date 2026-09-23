import { describe, expect, it } from "vitest";

import { siteUrl, validateEnvironment } from "./env";

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

  it("ignores the optional site URL", () => {
    expect(validateEnvironment({ ...validEnvironment, NEXT_PUBLIC_SITE_URL: "https://p8ce.example" }))
      .toEqual({
        supabasePublishableKey: "publishable-key",
        supabaseUrl: "https://project.supabase.co",
      });
  });

  it("requires Turnstile public and secret keys as a pair", () => {
    expect(() => validateEnvironment({
      ...validEnvironment,
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "site-key",
    })).toThrow("NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY must be configured together.");
    expect(() => validateEnvironment({
      ...validEnvironment,
      TURNSTILE_SECRET_KEY: "secret-key",
    })).toThrow("NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY must be configured together.");
    expect(validateEnvironment({
      ...validEnvironment,
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "site-key",
      TURNSTILE_SECRET_KEY: "secret-key",
    })).toEqual({
      supabasePublishableKey: "publishable-key",
      supabaseUrl: "https://project.supabase.co",
    });
  });
});

describe("siteUrl", () => {
  it("returns the origin without a trailing slash or path", () => {
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: "https://p8ce.example/" }))
      .toBe("https://p8ce.example");
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: "https://p8ce.example/events" }))
      .toBe("https://p8ce.example");
  });

  it("returns null rather than throwing when it is unset or unusable", () => {
    expect(siteUrl({})).toBeNull();
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: "  " })).toBeNull();
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: "p8ce.example" })).toBeNull();
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: "ftp://p8ce.example" })).toBeNull();
  });
});
