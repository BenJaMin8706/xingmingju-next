import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = "https://ycefjltmcjkwavlihcsu.supabase.co";

async function proxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const targetUrl = `${SUPABASE_URL}/${path.join("/")}${new URL(request.url).search}`;

  // 构建干净的请求头（移除 Next.js 内部头）
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (!lower.startsWith("x-forwarded-") && lower !== "host" && lower !== "content-length") {
      headers.set(key, value);
    }
  });

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: request.body,
  });

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
