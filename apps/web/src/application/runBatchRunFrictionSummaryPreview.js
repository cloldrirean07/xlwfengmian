import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { buildBatchRunFrictionSummaryReport } from "../domain/cases/buildBatchRunFrictionSummaryReport.js";
import { buildBatchRunFrictionSummaryMarkdown } from "../domain/cases/buildBatchRunFrictionSummaryMarkdown.js";
import { parseBatchRunRecordReviewNote } from "../domain/cases/parseBatchRunRecordReviewNote.js";
import { createBatchRunFrictionSummaryObsidianPreview } from "./createBatchRunFrictionSummaryObsidianPreview.js";

async function loadLatestRunRecordExportMap(logsRoot) {
  try {
    const batchDirs = await readdir(logsRoot);
    const result = {};

    for (const dirName of batchDirs) {
      const dirPath = join(logsRoot, dirName);
      const fileNames = (await readdir(dirPath))
        .filter((item) => item.endsWith(".json"))
        .sort()
        .reverse();

      if (!fileNames.length) {
        continue;
      }

      const raw = await readFile(join(dirPath, fileNames[0]), "utf-8");
      const record = JSON.parse(raw);
      result[record.batchLabel || dirName] = record.targetPath;
    }

    return result;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return {};
    }
    throw error;
  }
}

async function loadBatchRunRecords(rootDir) {
  try {
    const batchDirs = await readdir(rootDir);
    const rows = [];

    for (const dirName of batchDirs) {
      const recordPath = join(rootDir, dirName, "run-record.json");
      try {
        const raw = await readFile(recordPath, "utf-8");
        rows.push(JSON.parse(raw));
      } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
          continue;
        }
        throw error;
      }
    }

    return rows;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export async function runBatchRunFrictionSummaryPreview({ obsidianRoot = "" } = {}) {
  const rootDir = join(process.cwd(), "outputs", "batch-run-records");
  const batchRunRecords = await loadBatchRunRecords(rootDir);
  const latestRunRecordExportMap = await loadLatestRunRecordExportMap(
    join(process.cwd(), "outputs", "obsidian-export-logs", "real-case-batch-run-records"),
  );

  for (const record of batchRunRecords) {
    const exportedNotePath = latestRunRecordExportMap[record.batchLabel];
    if (!exportedNotePath) {
      record.manualReview = { review: {}, filledFields: [], hasManualConclusion: false };
      continue;
    }

    try {
      const noteMarkdown = await readFile(exportedNotePath, "utf-8");
      record.manualReview = parseBatchRunRecordReviewNote(noteMarkdown);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
        record.manualReview = { review: {}, filledFields: [], hasManualConclusion: false };
        continue;
      }
      throw error;
    }
  }
  const report = buildBatchRunFrictionSummaryReport({ batchRunRecords });
  const summaryMarkdown = buildBatchRunFrictionSummaryMarkdown(report);
  const obsidianDraft = createBatchRunFrictionSummaryObsidianPreview({
    summaryMarkdown,
    obsidianRoot,
  });

  return {
    report,
    summaryMarkdown,
    obsidianDraft,
  };
}
