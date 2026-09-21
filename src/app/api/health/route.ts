import { NextResponse } from "next/server";
import {
  getServerKeyFormat,
  getServerKeyRole,
  getServerKeySource,
  getSupabase,
} from "@/lib/supabase";

export const dynamic = "force-dynamic";

const PROBE_TIMEOUT_MS = 5000;

/**
 * Maps a backend failure onto a coarse, non-sensitive category so the endpoint can
 * say *what kind* of problem it is without publishing schema details or messages.
 */
function categorizeFailure(message: string, code?: string): string {
  const text = `${code ?? ""} ${message}`;
  if (/PGRST301|JWT|invalid api key|invalid token/i.test(text)) return "bad_key";
  if (/42501|permission denied/i.test(text)) return "denied";
  if (/42P01|does not exist|undefined table/i.test(text)) return "missing_table";
  return "other";
}

/**
 * Lightweight health probe for the backend.
 *
 * Returns 200 when the database answers, 503 when it does not, so an outage is
 * detectable in one request instead of being inferred from a page that looks
 * fine while every query silently falls back to empty data.
 *
 * Diagnostics are deliberately limited to things that are safe to publish: the
 * health-endpoint revision, the *name* of the env var supplying the server key,
 * the key's *format*, and the short PostgREST error code. The key value, the
 * project URL and the raw error message stay server-side.
 */
export async function GET() {
  const supabase = getSupabase();

  const diagnostics = {
    v: 3,
    keySource: getServerKeySource(),
    keyFormat: getServerKeyFormat(),
    keyRole: getServerKeyRole(),
  };

  if (!supabase) {
    // No backend configured: local/dev fallback mode still counts as healthy.
    return NextResponse.json({ ok: true, database: "not_configured", ...diagnostics });
  }

  const startedAt = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    // A plain GET rather than `head: true`: on rejection PostgREST returns a JSON
    // error body, and a HEAD request discards it, which left message and code empty.
    const probe = supabase.from("question_stats").select("date").limit(1);

    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("probe timeout")), PROBE_TIMEOUT_MS);
    });

    const { error } = await Promise.race([probe, timeout]);

    if (error) {
      console.error("[health] database probe failed:", error.message, error.code ?? "");
      const code = error.code ? String(error.code) : undefined;
      return NextResponse.json(
        {
          ok: false,
          database: "error",
          code: code ? code.slice(0, 24) : undefined,
          category: categorizeFailure(error.message ?? "", code),
          latencyMs: Date.now() - startedAt,
          ...diagnostics,
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      ok: true,
      database: "ok",
      latencyMs: Date.now() - startedAt,
      ...diagnostics,
    });
  } catch (error) {
    console.error(
      "[health] database unreachable:",
      error instanceof Error ? error.message : "unknown error",
    );
    return NextResponse.json(
      {
        ok: false,
        database: "unreachable",
        latencyMs: Date.now() - startedAt,
        ...diagnostics,
      },
      { status: 503 },
    );
  } finally {
    if (timer) clearTimeout(timer);
  }
}
