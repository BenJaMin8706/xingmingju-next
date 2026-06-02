import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createEmptyQuestionStats, getLocalDateKey } from "./fortune-data";
import { getSupabase } from "./supabase";

type QuestionStatsFile = {
  date: string;
  counts: Record<string, number>;
};

type ReportRecord = {
  id: string;
  createdAt: string;
  skillId: string;
  userId?: string | null;
  payload: Record<string, unknown>;
  result: unknown;
};

/** Lightweight report summary stored in user metadata */
type ReportSummary = {
  id: string;
  createdAt: string;
  skillId: string;
  title: string;
  overview: string;
};

const dataDir = process.env.XINGMINGJU_DATA_DIR || (process.env.VERCEL ? path.join("/tmp", "xingmingju-data") : path.join(process.cwd(), ".data"));
const questionStatsPath = path.join(dataDir, "question-stats.json");
const reportsPath = path.join(dataDir, "reports.json");

async function ensureDataDir() {
  await mkdir(dataDir, { recursive: true });
}

async function readStatsFromFile(): Promise<QuestionStatsFile> {
  await ensureDataDir();
  try {
    const raw = await readFile(questionStatsPath, "utf8");
    const parsed = JSON.parse(raw) as QuestionStatsFile;
    if (parsed.date === getLocalDateKey()) {
      return { date: parsed.date, counts: { ...createEmptyQuestionStats(), ...parsed.counts } };
    }
  } catch {
    // Start a fresh daily file when no persisted stats exist yet.
  }
  const emptyStats = { date: getLocalDateKey(), counts: createEmptyQuestionStats() };
  await writeFile(questionStatsPath, JSON.stringify(emptyStats, null, 2), "utf8");
  return emptyStats;
}

async function writeStatsToFile(stats: QuestionStatsFile) {
  await ensureDataDir();
  await writeFile(questionStatsPath, JSON.stringify(stats, null, 2), "utf8");
}

export async function readQuestionStats(): Promise<QuestionStatsFile> {
  const supabase = getSupabase();
  if (!supabase) return readStatsFromFile();

  const today = getLocalDateKey();
  const { data, error } = await supabase
    .from("question_stats")
    .select("date, counts")
    .eq("date", today)
    .maybeSingle();

  if (error) {
    console.error("[supabase] readQuestionStats", error.message);
    return readStatsFromFile();
  }

  if (!data) {
    const empty = { date: today, counts: createEmptyQuestionStats() };
    await supabase.from("question_stats").insert(empty);
    return empty;
  }

  return {
    date: data.date,
    counts: { ...createEmptyQuestionStats(), ...(data.counts as Record<string, number>) },
  };
}

export async function recordQuestionCategory(categoryId: string) {
  const supabase = getSupabase();
  const today = getLocalDateKey();
  const current = await readQuestionStats();
  const nextStats: QuestionStatsFile = {
    date: today,
    counts: {
      ...createEmptyQuestionStats(),
      ...current.counts,
      [categoryId]: (current.counts[categoryId] || 0) + 1,
    },
  };

  if (!supabase) {
    await writeStatsToFile(nextStats);
    return nextStats;
  }

  const { error } = await supabase
    .from("question_stats")
    .upsert({ date: today, counts: nextStats.counts }, { onConflict: "date" });

  if (error) {
    console.error("[supabase] recordQuestionCategory", error.message);
    await writeStatsToFile(nextStats);
  }
  return nextStats;
}

export async function appendReport(record: Omit<ReportRecord, "id" | "createdAt">) {
  const nextRecord: ReportRecord = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...record,
  };

  const supabase = getSupabase();
  const userId = record.userId;

  if (supabase && userId && userId !== "anonymous") {
    try {
      // Store reports in user's auth metadata (no table needed)
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      if (userData?.user) {
        const meta = (userData.user.user_metadata || {}) as Record<string, unknown>;
        const existingReports = (meta.reports as ReportSummary[]) || [];
        // Keep latest 50 reports, store only summary (omit full AI result to save space)
        const reportSummary: ReportSummary = {
          id: nextRecord.id,
          createdAt: nextRecord.createdAt,
          skillId: nextRecord.skillId,
          title: (nextRecord.result as Record<string, unknown>)?.title as string || nextRecord.skillId,
          overview: (nextRecord.result as Record<string, unknown>)?.overview as string || "",
        };
        const updated = [reportSummary, ...existingReports].slice(0, 50);
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: { ...meta, reports: updated },
        });
        return nextRecord;
      }
    } catch (err) {
      console.error("[auth-meta] appendReport failed:", err);
    }
  }

  // Fallback to file
  await ensureDataDir();
  let existingReports: ReportRecord[] = [];
  try {
    existingReports = JSON.parse(await readFile(reportsPath, "utf8")) as ReportRecord[];
  } catch {
    existingReports = [];
  }
  await writeFile(reportsPath, JSON.stringify([nextRecord, ...existingReports].slice(0, 200), null, 2), "utf8");
  return nextRecord;
}

export async function listReportsByUser(userId: string) {
  const supabase = getSupabase();

  if (supabase && userId && userId !== "anonymous") {
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      if (userData?.user) {
        const meta = (userData.user.user_metadata || {}) as Record<string, unknown>;
        const reports = (meta.reports as ReportSummary[]) || [];
        return reports.map((r) => ({
          id: r.id,
          createdAt: r.createdAt,
          skillId: r.skillId,
          userId,
          payload: {} as Record<string, unknown>,
          result: { title: r.title, overview: r.overview },
        }));
      }
    } catch (err) {
      console.error("[auth-meta] listReportsByUser failed:", err);
    }
  }

  // Fallback to file
  await ensureDataDir();
  try {
    const raw = await readFile(reportsPath, "utf8");
    const records = JSON.parse(raw) as ReportRecord[];
    return records.filter((record) => record.userId === userId).slice(0, 50);
  } catch {
    return [] as ReportRecord[];
  }
}
