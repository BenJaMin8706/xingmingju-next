import { NextRequest, NextResponse } from "next/server";
import { buildReportResult, skills } from "@/lib/fortune-data";
import { getUserIdFromRequest } from "@/lib/auth-server";
import { appendReport, listReportsByUser } from "@/lib/server-store";

export const runtime = "nodejs";

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
  const userId = await getUserIdFromRequest(request);
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
