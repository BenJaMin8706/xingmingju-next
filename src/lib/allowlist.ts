/**
 * Site-owner-only allowlist.
 * Only emails in this list may use gated features (e.g. generating AI reports).
 * Set ALLOWED_USER_EMAILS (comma-separated) in Vercel env to override the default.
 */
export const ALLOWED_EMAILS = (process.env.ALLOWED_USER_EMAILS || "benjamin.pan@foxmail.com")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function isEmailAllowed(email?: string | null): boolean {
  if (!email) return false;
  return ALLOWED_EMAILS.includes(email.toLowerCase());
}
