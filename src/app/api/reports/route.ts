import { NextRequest, NextResponse } from "next/server";
import { buildReportResult, skills } from "@/lib/fortune-data";
import { getUserIdFromRequest } from "@/lib/auth-server";
import { appendReport, listReportsByUser } from "@/lib/server-store";
import { getSupabase } from "@/lib/supabase";
import { isEmailAllowed } from "@/lib/allowlist";

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
  "daily-oracle": 0, // free but requires login + daily limit
  "baby-naming": 35,
  "plate-fortune": 15,
  "phone-fortune": 15,
};

// Anti-abuse limits: every AI call costs tokens, so we must throttle.
const FREE_DAILY_LIMIT = 3; // free skill uses per user per day
const MAX_FIELD_LENGTH = 300; // per payload field (prevents input-token abuse)
const MAX_FIELDS = 10;

async function isAllowedUser(userId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { data } = await supabase.auth.admin.getUserById(userId);
    return isEmailAllowed(data?.user?.email);
  } catch {
    return false;
  }
}

function sanitizePayload(payload: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === "string") {
      const trimmed = value.trim().slice(0, MAX_FIELD_LENGTH);
      if (trimmed) out[key.slice(0, 50)] = trimmed;
    }
    if (Object.keys(out).length >= MAX_FIELDS) break;
  }
  return out;
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

async function deductCreditsFromAuth(userId: string, amount: number): Promise<number> {
  if (!userId || userId === "anonymous" || amount <= 0) return -1;
  const supabase = getSupabase();
  if (!supabase) return -1;
  try {
    const { data } = await supabase.auth.admin.getUserById(userId);
    if (!data?.user) return -1;
    const current = (data.user.user_metadata as Record<string, unknown>)?.credits as number || 0;
    if (current < amount) return -1;
    const newCredits = current - amount;
    await supabase.auth.admin.updateUserById(userId, { user_metadata: { credits: newCredits } });
    return newCredits;
  } catch {
    return -1;
  }
}

/** Consume one free daily use. Returns remaining count, or -1 if the limit is reached. */
async function tryConsumeFreeUse(userId: string): Promise<number> {
  const supabase = getSupabase();
  if (!supabase) return -1;
  try {
    const { data } = await supabase.auth.admin.getUserById(userId);
    if (!data?.user) return -1;
    const meta = (data.user.user_metadata || {}) as Record<string, unknown>;
    const today = new Date().toISOString().slice(0, 10);
    const used = meta.freeUseDate === today ? (meta.freeUseCount as number) || 0 : 0;
    if (used >= FREE_DAILY_LIMIT) return -1;
    const next = used + 1;
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { ...meta, freeUseDate: today, freeUseCount: next },
    });
    if (error) return -1;
    return FREE_DAILY_LIMIT - next;
  } catch {
    return -1;
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

  // Truncate every field and cap field count — a huge payload would otherwise
  // inflate the AI prompt and burn tokens per request.
  const payload = sanitizePayload(body.payload || {});

  // Every AI call costs tokens: require login for ALL skills, including free ones.
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  // Site-owner-only mode: only allowlisted users may generate reports.
  if (!(await isAllowedUser(userId))) {
    return NextResponse.json({ error: "该功能仅限站长使用" }, { status: 403 });
  }

  const creditCost = SKILL_CREDIT_COSTS[skill.id] || 0;

  // Free skills: enforce a per-user daily cap.
  if (creditCost === 0) {
    const remaining = await tryConsumeFreeUse(userId);
    if (remaining < 0) {
      return NextResponse.json(
        { error: `今日免费次数已用完（每天 ${FREE_DAILY_LIMIT} 次），明天再来吧` },
        { status: 429 },
      );
    }
  } else {
    // Paid skills: require sufficient balance. Deduct BEFORE generating
    // the report so we never spend AI tokens on an unpaid request.
    const remaining = await deductCreditsFromAuth(userId, creditCost);
    if (remaining < 0) {
      const balance = await getCreditsFromAuth(userId);
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

  const record = await appendReport({ skillId: skill.id, userId, payload, result });
  return NextResponse.json({ reportId: record.id, result });
}
