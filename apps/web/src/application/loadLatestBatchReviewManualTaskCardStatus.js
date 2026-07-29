import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { readTextFile } from "../shared/fileSystem.js";
import { parseBatchReviewManualTaskCardNote } from "../domain/review/parseBatchReviewManualTaskCardNote.js";

async function loadLatestTaskCardExportStatus() {
  const logsDir = join(
    process.cwd(),
    "outputs",
    "obsidian-export-logs",
    "batch-review-manual-task-card",
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
      targetPath: record.targetPath,
      sourceMarkdownPath: record.sourceMarkdownPath,
      sourceJsonPath: record.sourceJsonPath,
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

export async function loadLatestBatchReviewManualTaskCardStatus() {
  const latestExportStatus = await loadLatestTaskCardExportStatus();

  if (!latestExportStatus?.targetPath) {
    return null;
  }

  try {
    const markdown = await readTextFile(latestExportStatus.targetPath);
    const parsed = parseBatchReviewManualTaskCardNote(markdown);

    return {
      ...latestExportStatus,
      targetBatchLabel: parsed.targetBatchLabel,
      hasManualInput: parsed.hasManualInput,
      filledFields: parsed.filledFields,
      filledFieldCount: parsed.filledFieldCount,
      parsed,
    };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return {
        ...latestExportStatus,
        targetBatchLabel: "",
        hasManualInput: false,
        filledFields: [],
        filledFieldCount: 0,
        parsed: {
          parsed: {},
          filledFields: [],
          filledFieldCount: 0,
          hasManualInput: false,
          targetBatchLabel: "",
        },
      };
    }

    throw error;
  }
}
