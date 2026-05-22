import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createEmptyQuestionStats, getLocalDateKey } from "./fortune-data";

type QuestionStatsFile = {
  date: string;
  counts: Record<string, number>;
};

type ReportRecord = {
  id: string;
  createdAt: string;
  skillId: string;
  payload: Record<string, unknown>;
  result: unknown;
};

const dataDir = process.env.XINGMINGJU_DATA_DIR || (process.env.VERCEL ? path.join("/tmp", "xingmingju-data") : path.join(process.cwd(), ".data"));
const questionStatsPath = path.join(dataDir, "question-stats.json");
const reportsPath = path.join(dataDir, "reports.json");

async function ensureDataDir() {
  await mkdir(dataDir, { recursive: true });
}

export async function readQuestionStats(): Promise<QuestionStatsFile> {
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

export async function recordQuestionCategory(categoryId: string) {
  const stats = await readQuestionStats();
  const nextStats = {
    date: getLocalDateKey(),
    counts: {
      ...createEmptyQuestionStats(),
      ...stats.counts,
      [categoryId]: (stats.counts[categoryId] || 0) + 1,
    },
  };

  await writeFile(questionStatsPath, JSON.stringify(nextStats, null, 2), "utf8");
  return nextStats;
}

export async function appendReport(record: Omit<ReportRecord, "id" | "createdAt">) {
  await ensureDataDir();

  let existingReports: ReportRecord[] = [];
  try {
    existingReports = JSON.parse(await readFile(reportsPath, "utf8")) as ReportRecord[];
  } catch {
    existingReports = [];
  }

  const nextRecord: ReportRecord = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...record,
  };

  await writeFile(reportsPath, JSON.stringify([nextRecord, ...existingReports].slice(0, 200), null, 2), "utf8");
  return nextRecord;
}
