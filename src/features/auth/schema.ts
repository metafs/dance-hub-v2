/**
 * Input rules for the account forms (ADR-0025). Supabase Auth checks them
 * again; these keep an obviously wrong value from reaching it and give the
 * form a specific message.
 */

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A trimmed, lower-cased email address, or null when it cannot be one. */
export function normalizeEmail(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && emailPattern.test(email) ? email : null;
}

export const minimumPasswordLength = 8;
// bcrypt, which Supabase Auth hashes with, reads at most 72 bytes.
const maximumPasswordBytes = 72;

export type PasswordProblem = "too-short" | "too-long" | "mismatch";

export function passwordProblem(password: string, confirmation: string): PasswordProblem | null {
  if (password.length < minimumPasswordLength) return "too-short";
  if (new TextEncoder().encode(password).length > maximumPasswordBytes) return "too-long";
  if (password !== confirmation) return "mismatch";
  return null;
}
