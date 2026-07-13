import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * Admin API: List all users with credit balances.
 * Protected by ADMIN_API_KEY env var (same as grant endpoint).
 */

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function GET(request: NextRequest) {
  const adminKey = request.headers.get("x-admin-key") || "";
  const expectedKey = process.env.ADMIN_API_KEY;

  if (!expectedKey) {
    return NextResponse.json({ error: "服务未配置" }, { status: 503 });
  }
  if (!timingSafeEqualStr(adminKey, expectedKey)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase 未配置" }, { status: 500 });
  }

  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
      return NextResponse.json({ error: "查询失败: " + error.message }, { status: 500 });
    }

    const users = (data.users || []).map((u) => ({
      id: u.id,
      email: u.email || "(无邮箱)",
      phone: u.phone || "",
      credits: (u.user_metadata as Record<string, unknown>)?.credits as number || 0,
      reports: ((u.user_metadata as Record<string, unknown>)?.reports as unknown[])?.length || 0,
      createdAt: u.created_at,
      lastSignIn: u.last_sign_in_at || "",
    }));

    // Sort by credits descending
    users.sort((a, b) => b.credits - a.credits);

    return NextResponse.json({
      total: users.length,
      totalCredits: users.reduce((sum, u) => sum + u.credits, 0),
      users,
    });
  } catch (err) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
