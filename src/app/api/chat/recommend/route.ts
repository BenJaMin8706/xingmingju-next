import { NextRequest, NextResponse } from "next/server";
import { findQuestionCategory, getVisibleQuestionChips, recommendSkill } from "@/lib/fortune-data";
import { recordQuestionCategory } from "@/lib/server-store";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { question?: string; record?: boolean };
  const question = body.question?.trim().slice(0, 500) || "我想先做一次免费体验";
  const matchedCategory = findQuestionCategory(question);
  const stats = body.record === false ? null : await recordQuestionCategory(matchedCategory.id);

  return NextResponse.json({
    question,
    category: matchedCategory,
    skill: recommendSkill(question),
    stats: stats?.counts,
    chips: getVisibleQuestionChips(question, stats?.counts || {}),
  });
}
