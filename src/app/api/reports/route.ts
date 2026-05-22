import { NextRequest, NextResponse } from "next/server";
import { buildReportResult, skills } from "@/lib/fortune-data";
import { appendReport } from "@/lib/server-store";

export const runtime = "nodejs";

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
  const result = buildReportResult(
    {
      nickname: typeof payload.nickname === "string" ? payload.nickname : undefined,
      birthTime: typeof payload.birthTime === "string" ? payload.birthTime : null,
    },
    skill,
  );
  const record = await appendReport({ skillId: skill.id, payload, result });

  return NextResponse.json({ reportId: record.id, result });
}
