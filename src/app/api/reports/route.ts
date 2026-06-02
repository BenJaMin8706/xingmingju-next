import { NextRequest, NextResponse } from "next/server";
import { buildReportResult, skills } from "@/lib/fortune-data";
import { getUserIdFromRequest } from "@/lib/auth-server";
import { appendReport, listReportsByUser } from "@/lib/server-store";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

// Skill credit costs (1 credit ≈ ¥0.10)
const SKILL_CREDIT_COSTS: Record<string, number> = {
  "reunion-tarot": 20,
  "bazi-wealth": 23,
  "ziwei-love-map": 30,
  "career-choice": 19,
  "western-chart": 17,
  "marriage-match": 25,
  "monthly-fortune": 13,
  "daily-oracle": 0, // free
};

async function getCredits(userId: string): Promise<number> {
  if (!userId || userId === "anonymous") return 0;
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data } = await supabase
        .from("user_credits")
        .select("credits")
        .eq("user_id", userId)
        .maybeSingle();
      if (data) return data.credits;
    } catch { /* fallback */ }
  }
  return 0;
}

async function deductCredits(userId: string, amount: number): Promise<number> {
  if (!userId || userId === "anonymous" || amount <= 0) return 0;
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data: existing } = await supabase
        .from("user_credits")
        .select("id,credits")
        .eq("user_id", userId)
        .maybeSingle();
      if (existing && existing.credits >= amount) {
        const newCredits = existing.credits - amount;
        await supabase
          .from("user_credits")
          .update({ credits: newCredits })
          .eq("id", existing.id);
        return newCredits;
      }
    } catch { /* fallback */ }
  }
  return -1;
}

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reports = await listReportsByUser(userId);
  return NextResponse.json({ reports });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    skillId?: string;
    payload?: Record<string, unknown>;
  };
  const skill = skills.find((item) => item.id === body.skillId);

  if (!skill) {
    return NextResponse.json({ error: "Unknown skill" }, { status: 400 });
  }

  const payload = body.payload || {};
  const userId = (await getUserIdFromRequest(request)) || "anonymous";
  const creditCost = SKILL_CREDIT_COSTS[skill.id] || 0;

  // Check credits for paid skills
  if (creditCost > 0) {
    const balance = await getCredits(userId);
    if (balance < creditCost) {
      return NextResponse.json({
        error: "星币不足",
        needed: creditCost,
        balance,
        message: `需要 ${creditCost} 星币，当前余额 ${balance} 星币`,
      }, { status: 402 });
    }
  }

  const result = await buildReportResult(
    {
      ...payload,
      nickname: typeof payload.nickname === "string" ? payload.nickname : undefined,
      birthTime: typeof payload.birthTime === "string" ? payload.birthTime : null,
    },
    skill,
  );

  // Deduct credits
  if (creditCost > 0) {
    await deductCredits(userId, creditCost);
  }

  const record = await appendReport({ skillId: skill.id, userId, payload, result });
  return NextResponse.json({ reportId: record.id, result });
}
