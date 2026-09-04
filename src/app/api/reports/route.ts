import { NextRequest, NextResponse } from "next/server";
import { buildReportResult, skills } from "@/lib/fortune-data";
import { getUserIdFromRequest } from "@/lib/auth-server";
import { adjustUserCredits } from "@/lib/credits";
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
  "baby-naming": 35,
  "plate-fortune": 15,
  "phone-fortune": 15,
};

function sanitizePayload(payload: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(payload)
      .slice(0, 30)
      .filter(([, value]) => ["string", "number", "boolean"].includes(typeof value))
      .map(([key, value]) => [
        key.slice(0, 80),
        typeof value === "string" ? value.trim().slice(0, 1000) : value,
      ]),
  );
}

async function getCreditsFromAuth(userId: string): Promise<number> {
  if (!userId || userId === "anonymous") return 0;
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

  const payload = sanitizePayload(body.payload || {});
  const userId = (await getUserIdFromRequest(request)) || "anonymous";
  const creditCost = SKILL_CREDIT_COSTS[skill.id] || 0;
  const requestId = crypto.randomUUID();

  // Paid skills require login and sufficient balance. Deduct BEFORE generating
  // the report so we never spend AI tokens on an unpaid request, and to keep the
  // check-and-deduct window as small as possible.
  if (creditCost > 0) {
    if (userId === "anonymous") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    const adjustment = await adjustUserCredits(userId, -creditCost, "report_generation", `report:${requestId}`);
    if (!adjustment?.success) {
      const balance = await getCreditsFromAuth(userId);
      return NextResponse.json({
        error: "星币不足",
        needed: creditCost,
        balance,
        message: `需要 ${creditCost} 星币，当前余额 ${balance} 星币`,
      }, { status: 402 });
    }
  }

  try {
    const result = await buildReportResult(
      {
        ...payload,
        nickname: typeof payload.nickname === "string" ? payload.nickname : undefined,
        birthTime: typeof payload.birthTime === "string" ? payload.birthTime : null,
      },
      skill,
    );

    const record = await appendReport({ skillId: skill.id, userId, payload, result });
    return NextResponse.json({ reportId: record.id, result });
  } catch (error) {
    if (creditCost > 0 && userId !== "anonymous") {
      await adjustUserCredits(userId, creditCost, "report_refund", `refund:${requestId}`);
    }
    console.error("[reports] generation failed:", error);
    return NextResponse.json({ error: "报告生成失败，请稍后重试" }, { status: 500 });
  }
}
