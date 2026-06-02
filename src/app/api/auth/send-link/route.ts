import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ycefjltmcjkwavlihcsu.supabase.co";

const SR_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljZWZqbHRtY2prd2F2bGloY3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ1MDM4NiwiZXhwIjoyMDk1MDI2Mzg2fQ.ChSmfvM5jvNpceOkYWiTnMnqmRJfQpdImKv2qg2vPqE";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

    // 1. Send OTP (magic link email)
    const otpRes = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SR_KEY },
      body: JSON.stringify({ email, create_user: true }),
    });
    if (!otpRes.ok) {
      const err = await otpRes.json().catch(() => ({}));
      return NextResponse.json({ error: err.msg || "Failed to send email" }, { status: 500 });
    }

    // 2. Generate link to get the token (server-side, won't send another email)
    const linkRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SR_KEY}`,
        apikey: SR_KEY,
      },
      body: JSON.stringify({
        type: "magiclink",
        email,
        options: { redirect_to: `${request.nextUrl.origin}/` },
      }),
    });
    const linkData = await linkRes.json();
    const supabaseLink: string = linkData.action_link || "";
    const token = supabaseLink.match(/token=([^&]+)/)?.[1] || "";

    // 3. Construct direct login URL through our proxy
    const verifyUrl = `${request.nextUrl.origin}/api/supabase/auth/v1/verify?token=${token}&type=magiclink&redirect_to=${encodeURIComponent(request.nextUrl.origin + "/")}`;

    return NextResponse.json({
      success: true,
      message: "登录链接已发送，也可以直接点击下方链接登录",
      verifyUrl,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
