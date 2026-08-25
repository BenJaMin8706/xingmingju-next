import type { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getUserIdFromRequest } from "./auth-server";
import { getSupabase } from "./supabase";
import { isEmailAllowed } from "./allowlist";

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Admin authorization. Two supported methods:
 * 1. Static key: `x-admin-key` header matching the ADMIN_API_KEY env var (if set).
 * 2. Site-owner session: a Supabase bearer token belonging to an allowlisted email.
 */
export async function isAdminRequest(request: NextRequest): Promise<boolean> {
  // Legacy static key path (only active when the env var is configured)
  const envKey = process.env.ADMIN_API_KEY;
  const headerKey = request.headers.get("x-admin-key") || "";
  if (envKey && headerKey && timingSafeEqualStr(headerKey, envKey)) {
    return true;
  }

  // Site-owner session path
  const userId = await getUserIdFromRequest(request);
  if (!userId) return false;

  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { data } = await supabase.auth.admin.getUserById(userId);
    return isEmailAllowed(data?.user?.email);
  } catch {
    return false;
  }
}
