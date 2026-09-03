export type Environment = {
  supabasePublishableKey: string;
  supabaseUrl: string;
};

export type EnvironmentSource = Readonly<Record<string, string | undefined>>;

const supabaseUrlName = "NEXT_PUBLIC_SUPABASE_URL";
const supabasePublishableKeyName = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";

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
  return {
    supabasePublishableKey: requiredValue(source, supabasePublishableKeyName),
    supabaseUrl: validHttpUrl(source, supabaseUrlName),
  };
}
