import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { readTextFile } from "../shared/fileSystem.js";
import { parseBatchRunRecordReviewNote } from "../domain/cases/parseBatchRunRecordReviewNote.js";
import { batchRunManualReviewKeyFields } from "../domain/cases/batchRunManualReviewKeyFields.js";

async function loadLatestRunRecordExportStatus(normalizedLabel) {
  const logsDir = join(
    process.cwd(),
    "outputs",
    "obsidian-export-logs",
    "real-case-batch-run-records",
    normalizedLabel,
  );

  try {
    const fileNames = (await readdir(logsDir))
      .filter((item) => item.endsWith(".json"))
      .sort()
      .reverse();

    if (!fileNames.length) {
      return null;
    }

    const latestPath = join(logsDir, fileNames[0]);
    const raw = await readTextFile(latestPath);
    const record = JSON.parse(raw);

    return {
      exportId: record.exportId,
      exportedAt: record.exportedAt,
      batchLabel: record.batchLabel,
      normalizedLabel: record.normalizedLabel || normalizedLabel,
      targetPath: record.targetPath,
      actionLabel: record.overwrite?.actionLabel || "待补充",
      requestedMode: record.overwrite?.requestedMode || "overwrite",
      readbackOk: Boolean(record.readback?.ok),
      matchedExpectedContent: Boolean(record.readback?.matchedExpectedContent),
      logPath: latestPath,
    };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export async function loadLatestRealCaseBatchRunManualReviewStatus(normalizedLabel) {
  if (!normalizedLabel) {
    return null;
  }

  const latestExportStatus = await loadLatestRunRecordExportStatus(normalizedLabel);

  if (!latestExportStatus?.targetPath) {
    return null;
  }

  try {
    const markdown = await readTextFile(latestExportStatus.targetPath);
    const parsed = parseBatchRunRecordReviewNote(markdown);
    const missingKeyFields = batchRunManualReviewKeyFields.filter(
      ({ key }) => !parsed.filledFields.includes(key),
    );
    const filledKeyFields = batchRunManualReviewKeyFields.filter(({ key }) =>
      parsed.filledFields.includes(key),
    );

    return {
      ...latestExportStatus,
      hasManualConclusion: parsed.hasManualConclusion,
      filledFields: parsed.filledFields,
      filledFieldCount: parsed.filledFields.length,
      missingKeyFields,
      filledKeyFields,
      review: parsed.review,
    };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return {
        ...latestExportStatus,
        hasManualConclusion: false,
        filledFields: [],
        filledFieldCount: 0,
        missingKeyFields: batchRunManualReviewKeyFields,
        filledKeyFields: [],
        review: {},
      };
    }

    throw error;
  }
}
