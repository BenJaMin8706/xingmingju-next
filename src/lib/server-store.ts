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
  if (supabase) {
    const { data, error } = await supabase.rpc("increment_question_stat", {
      p_date: today,
      p_category: categoryId,
    });

    if (!error && data) {
      return {
        date: today,
        counts: { ...createEmptyQuestionStats(), ...(data as Record<string, number>) },
      };
    }
    console.error("[supabase] recordQuestionCategory", error?.message || "No data returned");
  }

  const current = await readStatsFromFile();
  const nextStats: QuestionStatsFile = {
    date: today,
    counts: {
      ...createEmptyQuestionStats(),
      ...current.counts,
      [categoryId]: (current.counts[categoryId] || 0) + 1,
    },
  };
  await writeStatsToFile(nextStats);
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
    const { error } = await supabase.from("reports").insert({
      id: nextRecord.id,
      created_at: nextRecord.createdAt,
      skill_id: nextRecord.skillId,
      user_id: userId,
      payload: nextRecord.payload,
      result: nextRecord.result,
    });
    if (error) throw new Error(`Report persistence failed: ${error.message}`);
    return nextRecord;
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
    const { data, error } = await supabase
      .from("reports")
      .select("id, created_at, skill_id, payload, result")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(`Report lookup failed: ${error.message}`);
    return (data || []).map((report) => ({
      id: report.id,
      createdAt: report.created_at,
      skillId: report.skill_id,
      userId,
      payload: report.payload as Record<string, unknown>,
      result: report.result,
    }));
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
