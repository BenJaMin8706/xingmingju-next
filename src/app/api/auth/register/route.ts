import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

export async function POST(request: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      return NextResponse.json({ error: "注册服务未配置" }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const body = await request.json().catch(() => ({})) as {
      email?: string;
      password?: string;
      username?: string;
      birthDate?: string;
      birthTime?: string;
      birthPlace?: string;
      captchaToken?: string;
    };

    const email = body.email?.trim().toLowerCase().slice(0, 254) || "";
    const password = body.password || "";
    const captchaToken = body.captchaToken || "";

    // Bound the profile fields: they are persisted verbatim into auth user
    // metadata, so an oversized value would be stored as-is.
    const username = body.username?.trim().slice(0, 40) || "";
    const birthDate = (body.birthDate || "").trim().slice(0, 10);
    const birthTime = (body.birthTime || "").trim().slice(0, 5);
    const birthPlace = body.birthPlace?.trim().slice(0, 80) || "";

    if (!email || !password) {
      return NextResponse.json({ error: "邮箱和密码不能为空" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少需要6位" }, { status: 400 });
    }

    if (!captchaToken) {
      return NextResponse.json({ error: "请先完成人机验证" }, { status: 400 });
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        captchaToken,
        emailRedirectTo: `${request.nextUrl.origin}/?auth=verified`,
        data: {
          username,
          birthDate,
          birthTime,
          birthPlace,
        },
      },
    });

    if (error) {
      if (error.message === "User already registered") {
        return NextResponse.json({ error: "该邮箱已注册，请直接登录" }, { status: 400 });
      }
      if (/captcha/i.test(error.message)) {
        return NextResponse.json({ error: "人机验证未通过，请重试" }, { status: 400 });
      }
      // Never forward upstream auth errors verbatim: they can expose rate
      // limits, SMTP configuration, or other service internals.
      console.error("[register] signUp failed:", error.message);
      return NextResponse.json({ error: "注册失败，请稍后重试或更换邮箱" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "注册成功！验证邮件已发送，请检查邮箱并完成验证，随后会自动返回首页。",
    });
  } catch (error) {
    console.error("[register] error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}