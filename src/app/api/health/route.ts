import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const PROBE_TIMEOUT_MS = 5000;

/**
 * Lightweight health probe for the backend.
 *
 * Returns 200 when the database answers, 503 when it does not, so an outage is
 * detectable in one request instead of being inferred from a page that looks
 * fine while every query silently falls back to empty data.
 *
 * Error details are logged server-side only — the response stays generic so it
 * cannot leak connection strings or key prefixes.
 */
export async function GET() {
  const supabase = getSupabase();

  if (!supabase) {
    // No backend configured: local/dev fallback mode still counts as healthy.
    return NextResponse.json({ ok: true, database: "not_configured" });
  }

  const startedAt = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    const probe = supabase
      .from("question_stats")
      .select("date", { head: true, count: "exact" })
      .limit(1);

    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("probe timeout")), PROBE_TIMEOUT_MS);
    });

    const { error } = await Promise.race([probe, timeout]);

    if (error) {
      console.error("[health] database probe failed:", error.message, error.code ?? "");
      // The code is short and non-sensitive (PGRST301 = invalid JWT, 42501 =
      // permission denied, 42P01 = missing table) and is what makes this endpoint
      // useful for telling a broken key apart from a broken schema.
      return NextResponse.json(
        {
          ok: false,
          database: "error",
          code: typeof error.code === "string" ? error.code.slice(0, 20) : undefined,
          latencyMs: Date.now() - startedAt,
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      ok: true,
      database: "ok",
      latencyMs: Date.now() - startedAt,
    });
  } catch (error) {
    console.error(
      "[health] database unreachable:",
      error instanceof Error ? error.message : "unknown error",
    );
    return NextResponse.json(
      { ok: false, database: "unreachable", latencyMs: Date.now() - startedAt },
      { status: 503 },
    );
  } finally {
    if (timer) clearTimeout(timer);
  }
}
