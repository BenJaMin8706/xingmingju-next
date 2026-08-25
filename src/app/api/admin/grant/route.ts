import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * Admin API: Grant credits to any user by email.
 * Authorized via site-owner session (allowlisted email) or ADMIN_API_KEY header.
 *
 * Usage:
 * POST /api/admin/grant
 * Headers: Authorization: Bearer <supabase access token>  (or x-admin-key: <ADMIN_API_KEY>)
 * Body: { "email": "friend@example.com", "credits": 50 }
 */

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email, credits } = (await request.json().catch(() => ({}))) as {
    email?: string;
    credits?: number;
  };

  if (!email || !credits || credits <= 0) {
    return NextResponse.json({ error: "需要提供有效 email 和 credits" }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase 未配置" }, { status: 500 });
  }

  try {
    // Look up user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      return NextResponse.json({ error: "查询用户失败: " + listError.message }, { status: 500 });
    }

    const targetUser = users.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!targetUser) {
      return NextResponse.json({ error: "未找到该邮箱的用户，请确认对方已注册" }, { status: 404 });
    }

    // Get current credits
    const currentCredits = (targetUser.user_metadata as Record<string, unknown>)?.credits as number || 0;
    const newCredits = currentCredits + credits;

    // Update
    const { error: updateError } = await supabase.auth.admin.updateUserById(targetUser.id, {
      user_metadata: { ...targetUser.user_metadata, credits: newCredits },
    });

    if (updateError) {
      return NextResponse.json({ error: "充值失败: " + updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      email: targetUser.email,
      before: currentCredits,
      added: credits,
      after: newCredits,
    });
  } catch (err) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
