import { createClient, SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

/**
 * Resolves the server-side key together with the variable it came from, so a
 * diagnostic can name the variable in use without ever touching the value.
 */
function resolveServerKey(): { key: string | undefined; source: string | null } {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { key: process.env.SUPABASE_SERVICE_ROLE_KEY, source: "SUPABASE_SERVICE_ROLE_KEY" };
  }
  if (process.env.SUPABASE_SECRET_KEY) {
    return { key: process.env.SUPABASE_SECRET_KEY, source: "SUPABASE_SECRET_KEY" };
  }
  if (process.env.SUPABASE_SERVICE_KEY) {
    return { key: process.env.SUPABASE_SERVICE_KEY, source: "SUPABASE_SERVICE_KEY" };
  }
  if (process.env.SUPABASE_ANON_KEY) {
    return { key: process.env.SUPABASE_ANON_KEY, source: "SUPABASE_ANON_KEY" };
  }
  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, source: "NEXT_PUBLIC_SUPABASE_ANON_KEY" };
  }
  return { key: undefined, source: null };
}

/** Name of the env var that supplies the server key, or null when unset. */
export function getServerKeySource(): string | null {
  return resolveServerKey().source;
}

/**
 * Classifies the key by its prefix only. This is what makes it possible to spot a
 * revoked legacy JWT, or a browser publishable key being used for privileged
 * server-side work, without exposing the secret itself.
 */
export function getServerKeyFormat(): string {
  const { key } = resolveServerKey();
  if (!key) return "none";
  if (key.startsWith("sb_secret_")) return "secret";
  if (key.startsWith("sb_publishable_")) return "publishable";
  if (key.startsWith("eyJ")) return "legacy-jwt";
  return "unknown";
}

export function getSupabase(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const { key } = resolveServerKey();

  if (!url || !key) return null;

  cachedClient = createClient(url, key, {
    auth: { persistSession: false },
  });
  return cachedClient;
}

export function isSupabaseEnabled(): boolean {
  return getSupabase() !== null;
}
