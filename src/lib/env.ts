export type Environment = {
  supabasePublishableKey: string;
  supabaseUrl: string;
};

export type EnvironmentSource = Readonly<Record<string, string | undefined>>;

const supabaseUrlName = "NEXT_PUBLIC_SUPABASE_URL";
const supabasePublishableKeyName = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";
const siteUrlName = "NEXT_PUBLIC_SITE_URL";
const turnstileSiteKeyName = "NEXT_PUBLIC_TURNSTILE_SITE_KEY";
const turnstileSecretKeyName = "TURNSTILE_SECRET_KEY";

function requiredValue(source: EnvironmentSource, name: string) {
  const value = source[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}.`);
  return value;
}

function validHttpUrl(source: EnvironmentSource, name: string) {
  const value = requiredValue(source, name);

  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return value;
  } catch {
    // The error below names the invalid deployment configuration.
  }

  throw new Error(`Environment variable ${name} must be an HTTP(S) URL.`);
}

export function validateEnvironment(source: EnvironmentSource = process.env): Environment {
  const turnstileSiteKey = source[turnstileSiteKeyName]?.trim();
  const turnstileSecretKey = source[turnstileSecretKeyName]?.trim();
  if (Boolean(turnstileSiteKey) !== Boolean(turnstileSecretKey)) {
    throw new Error(`Environment variables ${turnstileSiteKeyName} and ${turnstileSecretKeyName} must be configured together.`);
  }
  return {
    supabasePublishableKey: requiredValue(source, supabasePublishableKeyName),
    supabaseUrl: validHttpUrl(source, supabaseUrlName),
  };
}

/**
 * The public origin this deployment is served from, used for canonical URLs,
 * Open Graph URLs, and the sitemap. It is optional rather than part of the
 * required contract above so that builds and CI, which have no public origin,
 * keep working; crawler-facing surfaces degrade instead of guessing a host.
 *
 * Returns the origin without a trailing slash, or null when unset or invalid.
 */
export function siteUrl(source: EnvironmentSource = process.env): string | null {
  const value = source[siteUrlName]?.trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}
