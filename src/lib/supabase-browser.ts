import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

/**
 * 获取浏览器端 Supabase URL。
 * - 生产环境（Vercel）自动走当前域名的 /api/supabase 代理
 * - 可通过 NEXT_PUBLIC_SUPABASE_URL 显式覆盖
 */
function getBrowserSupabaseUrl(): string {
  if (typeof window === "undefined") return "";
  // 优先使用显式配置，否则自动走同源代理
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    `${window.location.origin}/api/supabase`
  );
}

export function getBrowserSupabase(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  if (browserClient) return browserClient;

  const url = getBrowserSupabaseUrl();
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  browserClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
}
