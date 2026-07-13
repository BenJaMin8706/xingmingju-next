import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth-server";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * Credits system using Supabase Auth user_metadata.
 * No database table needed – credits are stored in the user's auth profile.
 * Requires SUPABASE_SERVICE_ROLE_KEY for admin operations.
 *
 * SECURITY: Clients can NEVER specify an arbitrary credit amount.
 * - Real top-ups happen only server-side via the verified Stripe webhook.
 * - The only client-triggerable action is claiming the one-time welcome bonus,
 *   whose amount is fixed server-side and guarded by an idempotency flag.
 */

const WELCOME_BONUS = 10;

async function getUserMeta(userId: string): Promise<Record<string, unknown> | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error || !data?.user) return null;
    return (data.user.user_metadata as Record<string, unknown>) || {};
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ credits: 0 });
  }

  const meta = await getUserMeta(userId);
  const credits = (meta?.credits as number) || 0;
  const welcomeGranted = Boolean(meta?.welcomeBonusGranted);
  return NextResponse.json({ credits, welcomeGranted });
}

/**
 * Claim the one-time welcome bonus. No request body is trusted.
 * Idempotent: subsequent calls return the current balance without adding more.
 */
export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "服务未配置" }, { status: 503 });
  }

  const meta = await getUserMeta(userId);
  if (!meta) {
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }

  const current = (meta.credits as number) || 0;

  // Already claimed – return current balance, do not add again.
  if (meta.welcomeBonusGranted) {
    return NextResponse.json({ credits: current, welcomeGranted: true, added: 0 });
  }

  const newCredits = current + WELCOME_BONUS;
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { ...meta, credits: newCredits, welcomeBonusGranted: true },
  });

  if (error) {
    return NextResponse.json({ error: "充值失败" }, { status: 500 });
  }

  return NextResponse.json({ credits: newCredits, welcomeGranted: true, added: WELCOME_BONUS });
}
