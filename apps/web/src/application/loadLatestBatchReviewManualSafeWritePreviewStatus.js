import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { parseBatchReviewManualSafeWritePreviewNote } from "../domain/review/parseBatchReviewManualSafeWritePreviewNote.js";
import { readTextFile } from "../shared/fileSystem.js";

async function loadLatestSafeWriteExportStatus() {
  const logsDir = join(
    process.cwd(),
    "outputs",
    "obsidian-export-logs",
    "batch-review-manual-safe-write-preview",
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

export async function loadLatestBatchReviewManualSafeWritePreviewStatus() {
  const latestExportStatus = await loadLatestSafeWriteExportStatus();

  if (!latestExportStatus?.targetPath) {
    return null;
  }

  try {
    const markdown = await readTextFile(latestExportStatus.targetPath);
    const parsed = parseBatchReviewManualSafeWritePreviewNote(markdown);

    return {
      ...latestExportStatus,
      targetBatchLabel: parsed.targetBatchLabel,
      manualReviewConclusion: parsed.manualReviewConclusion,
      manualReviewConclusionValidation: parsed.manualReviewConclusionValidation,
      hasManualConfirmation: parsed.hasManualConfirmation,
      canProceedToFormalWrite: parsed.canProceedToFormalWrite,
      parsed,
    };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return {
        ...latestExportStatus,
        targetBatchLabel: "",
        hasManualConfirmation: false,
        canProceedToFormalWrite: false,
        parsed: {
          parsed: {},
          targetBatchLabel: "",
          targetPath: "",
          patchSourceLabel: "",
          manualReviewConclusion: "",
          manualReviewConclusionValidation: {
            ok: false,
            message: "请输入人工复盘结论",
          },
          hasManualConfirmation: false,
          canProceedToFormalWrite: false,
        },
      };
    }

    throw error;
  }
}
