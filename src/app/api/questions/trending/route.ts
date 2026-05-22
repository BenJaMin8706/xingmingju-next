import { NextRequest, NextResponse } from "next/server";
import { getVisibleQuestionChips } from "@/lib/fortune-data";
import { readQuestionStats } from "@/lib/server-store";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const question = request.nextUrl.searchParams.get("question") || "";
  const stats = await readQuestionStats();

  return NextResponse.json({
    date: stats.date,
    counts: stats.counts,
    chips: getVisibleQuestionChips(question, stats.counts),
  });
}
