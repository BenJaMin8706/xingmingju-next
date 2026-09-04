import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * Admin API: List all users with credit balances.
 * Authorized via site-owner session (allowlisted email) or ADMIN_API_KEY header.
 */

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
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
  } catch {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
