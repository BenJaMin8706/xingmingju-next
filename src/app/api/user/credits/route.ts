import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth-server";
import { getSupabase } from "@/lib/supabase";

/**
 * Credits system using Supabase Auth user_metadata.
 * No database table needed – credits are stored in the user's auth profile.
 * Requires SUPABASE_SERVICE_ROLE_KEY for admin operations.
 */

async function getCreditsFromAuth(userId: string): Promise<number> {
  const supabase = getSupabase();
  if (!supabase) return 0;

  try {
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error || !data?.user) return 0;
    return (data.user.user_metadata as Record<string, unknown>)?.credits as number || 0;
  } catch {
    return 0;
  }
}

async function setCreditsInAuth(userId: string, credits: number): Promise<number> {
  const supabase = getSupabase();
  if (!supabase) return 0;

  try {
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { credits },
    });
    if (error || !data?.user) return 0;
    return (data.user.user_metadata as Record<string, unknown>)?.credits as number || 0;
  } catch {
    return 0;
  }
}

// Fallback in-memory store for anonymous users
const anonCredits: Record<string, number> = {};

export async function GET(request: NextRequest) {
  const userId = (await getUserIdFromRequest(request)) || "anonymous";

  if (userId === "anonymous") {
    return NextResponse.json({ credits: anonCredits[userId] || 0 });
  }

  const credits = await getCreditsFromAuth(userId);
  return NextResponse.json({ credits });
}

export async function POST(request: NextRequest) {
  const userId = (await getUserIdFromRequest(request)) || "anonymous";
  const { addCredits } = (await request.json().catch(() => ({}))) as { addCredits?: number };
  const amount = Number(addCredits) || 0;

  if (amount <= 0) {
    return NextResponse.json({ error: "无效金额" }, { status: 400 });
  }

  if (userId === "anonymous") {
    anonCredits[userId] = (anonCredits[userId] || 0) + amount;
    return NextResponse.json({ credits: anonCredits[userId] });
  }

  const current = await getCreditsFromAuth(userId);
  const newCredits = current + amount;
  const saved = await setCreditsInAuth(userId, newCredits);
  return NextResponse.json({ credits: saved || newCredits });
}
