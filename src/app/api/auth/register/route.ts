import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || "";

type TurnstileResponse = {
  success?: boolean;
  "error-codes"?: string[];
};

function getRemoteIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  return forwardedFor.split(",")[0]?.trim() || undefined;
}

async function verifyTurnstileToken(token: string, remoteIp?: string) {
  if (!TURNSTILE_SECRET_KEY) {
    return { ok: false, reason: "人机验证服务未配置" };
  }

  const body = new URLSearchParams({
    secret: TURNSTILE_SECRET_KEY,
    response: token,
  });
  if (remoteIp) body.set("remoteip", remoteIp);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    return { ok: false, reason: "人机验证服务暂时不可用" };
  }

  const data = (await response.json()) as TurnstileResponse;
  if (!data.success) {
    return { ok: false, reason: "人机验证未通过" };
  }

  return { ok: true as const };
}

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

    const body = await request.json() as {
      email?: string;
      password?: string;
      username?: string;
      birthDate?: string;
      birthTime?: string;
      birthPlace?: string;
      captchaToken?: string;
    };

    const email = body.email?.trim() || "";
    const password = body.password || "";
    const captchaToken = body.captchaToken || "";

    if (!email || !password) {
      return NextResponse.json({ error: "邮箱和密码不能为空" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少需要6位" }, { status: 400 });
    }

    if (!captchaToken) {
      return NextResponse.json({ error: "请先完成人机验证" }, { status: 400 });
    }

    const turnstile = await verifyTurnstileToken(captchaToken, getRemoteIp(request));
    if (!turnstile.ok) {
      return NextResponse.json({ error: turnstile.reason }, { status: 403 });
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${request.nextUrl.origin}/?auth=verified`,
        data: {
          username: body.username?.trim() || "",
          birthDate: body.birthDate || "",
          birthTime: body.birthTime || "",
          birthPlace: body.birthPlace?.trim() || "",
        },
      },
    });

    if (error) {
      return NextResponse.json({
        error: error.message === "User already registered" ? "该邮箱已注册，请直接登录" : error.message,
      }, { status: 400 });
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