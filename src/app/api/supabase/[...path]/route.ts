import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = "https://ycefjltmcjkwavlihcsu.supabase.co";

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await context.params;
    const search = new URL(request.url).search;
    const targetUrl = `${SUPABASE_URL}/${path.join("/")}${search}`;

    const headers = new Headers();
    request.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (!lower.startsWith("x-forwarded-") && lower !== "host") {
        headers.set(key, value);
      }
    });

    // 读取 body 为文本确保可靠转发
    const body = request.body
      ? await request.clone().arrayBuffer()
      : undefined;

    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    });

    // 透传所有响应头（不再错误地去掉 content-encoding）
    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.set("access-control-allow-origin", "*");
    responseHeaders.set("access-control-allow-methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    responseHeaders.set("access-control-allow-headers", "*");

    return new NextResponse(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("proxy error", err);
    return NextResponse.json(
      { error: "proxy_error", detail: String(err) },
      { status: 502 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "access-control-allow-headers": "*",
    },
  });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };

