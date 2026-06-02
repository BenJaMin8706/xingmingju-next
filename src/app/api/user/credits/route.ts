import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth-server";
import { getSupabase } from "@/lib/supabase";

// Simple in-memory store as fallback
const localCredits: Record<string, number> = {};

export async function GET(request: NextRequest) {
  const userId = (await getUserIdFromRequest(request)) || "anonymous";
  const supabase = getSupabase();

  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("user_credits")
        .select("credits")
        .eq("user_id", userId)
        .maybeSingle();

      if (!error && data) {
        return NextResponse.json({ credits: data.credits });
      }
      // If table doesn't exist, fall through to local
    }
  } catch {
    // fallback
  }

  return NextResponse.json({
    credits: localCredits[userId] || 0,
  });
}

export async function POST(request: NextRequest) {
  const userId = (await getUserIdFromRequest(request)) || "anonymous";
  const { addCredits } = await request.json();
  const amount = Number(addCredits) || 0;

  if (amount <= 0) {
    return NextResponse.json({ error: "无效金额" }, { status: 400 });
  }

  const supabase = getSupabase();

  try {
    if (supabase) {
      const { data: existing } = await supabase
        .from("user_credits")
        .select("id,credits")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("user_credits")
          .update({ credits: existing.credits + amount })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("user_credits")
          .insert({ user_id: userId, credits: amount });
      }

      return NextResponse.json({ credits: (existing?.credits || 0) + amount });
    }
  } catch {
    // fallback to local
  }

  localCredits[userId] = (localCredits[userId] || 0) + amount;
  return NextResponse.json({ credits: localCredits[userId] });
}
